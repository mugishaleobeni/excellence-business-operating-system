import logging
from datetime import datetime, timezone
from io import BytesIO
from flask import Blueprint, request, Response
import qrcode
import qrcode.image.svg
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.database import get_db, serialize_doc
from app.schemas.workspace_schemas import (
    ApplyPresetSchema,
    ModuleRecordCreateSchema,
    ModuleRecordUpdateSchema,
    WorkspacePatchSchema,
)
from app.seed_defaults import (
    ARCHITECTURE_IDS,
    MODULE_RECORD_BUCKETS,
    create_empty_record_buckets,
    get_default_workspaces,
)
from app.utils.responses import error_response, success_response, validate_json

logger = logging.getLogger("app.persistence")
workspaces_bp = Blueprint("workspaces", __name__, url_prefix="/api/v1/workspaces")


def _resolve_scope_key(db=None) -> str:
    arg_scope = (request.args.get("scopeKey") or "").strip().lower()
    if arg_scope and arg_scope != "default":
        return arg_scope

    try:
        verify_jwt_in_request(optional=True)
        jwt_email = get_jwt_identity()
        if isinstance(jwt_email, str) and jwt_email.strip():
            return jwt_email.strip().lower()
    except Exception:
        pass

    if db is not None:
        snap = db.platform_config.find_one({"key": "active_user_snapshot"})
        if snap and isinstance(snap.get("value"), dict):
            snap_email = (snap["value"].get("email") or "").strip().lower()
            if snap_email:
                return snap_email
        latest_user = db.users.find_one({}, sort=[("created_at", -1)])
        if latest_user and latest_user.get("email"):
            return str(latest_user["email"]).strip().lower()

    return arg_scope or "default"


def _extract_record_title(raw_dump: dict, module_name: str) -> str:
    for key in (
        "title",
        "name",
        "productName",
        "item",
        "serviceName",
        "customerName",
        "supplierName",
        "guestName",
        "diagnosis",
        "roomNumber",
        "ticketNumber",
        "invoiceNumber",
        "feedName",
        "damName",
        "category",
    ):
        val = raw_dump.get(key)
        if val and str(val).strip():
            return str(val).strip()[:350]
    return f"{module_name} Entry"


def _extract_record_amount(raw_dump: dict) -> float:
    for key in (
        "amountRWF",
        "totalAmountRWF",
        "totalFolioRWF",
        "sellingPriceRWF",
        "purchasePriceRWF",
        "priceRWF",
        "costRWF",
        "estimatedCostRWF",
        "ratePerNightRWF",
        "totalValueRWF",
        "amount",
    ):
        val = raw_dump.get(key)
        if val is not None and val != "":
            try:
                num = float(val)
                if num > 0:
                    return num
            except (TypeError, ValueError):
                continue
    return 0.0


PRODUCT_BUCKETS = {"Inventory", "Products"}


def _mirror_product(db, scope_key: str, arch_id: str, item: dict, now_iso: str) -> None:
    """Mirror a product/inventory item into the dedicated top-level `db.products` collection."""
    if not isinstance(item, dict) or not item.get("id"):
        return
    doc = {**item, "scopeKey": scope_key, "architectureId": arch_id, "updated_at": now_iso}
    doc.pop("_id", None)
    doc.pop("bucket", None)
    db.products.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id, "id": str(item["id"])},
        {"$set": doc, "$setOnInsert": {"created_at": now_iso}},
        upsert=True,
    )


def _sync_bucket_to_module_records(
    db, scope_key: str, arch_id: str, bucket_name: str, records_list: list, now_iso: str
) -> None:
    """
    Mirror every record in a workspace bucket into the top-level `db.module_records`
    collection so every record across all 6 architectures can be inspected and queried
    directly by `scopeKey`, `architectureId`, and `bucket`.
    """
    if not isinstance(records_list, list):
        return
    keep_ids: list[str] = []
    for idx, item in enumerate(records_list):
        if not isinstance(item, dict):
            continue
        rec_id = str(item.get("id") or f"REC-{arch_id}-{bucket_name}-{idx}")
        keep_ids.append(rec_id)
        doc = {
            **item,
            "id": rec_id,
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "bucket": bucket_name,
            "updated_at": now_iso,
        }
        doc.pop("_id", None)
        db.module_records.update_one(
            {
                "scopeKey": scope_key,
                "architectureId": arch_id,
                "bucket": bucket_name,
                "id": rec_id,
            },
            {"$set": doc},
            upsert=True,
        )
        if bucket_name in PRODUCT_BUCKETS:
            _mirror_product(db, scope_key, arch_id, {**item, "id": rec_id}, now_iso)
    # Remove any records from db.module_records that were deleted from the bucket
    if keep_ids:
        db.module_records.delete_many(
            {
                "scopeKey": scope_key,
                "architectureId": arch_id,
                "bucket": bucket_name,
                "id": {"$nin": keep_ids},
            }
        )
    else:
        db.module_records.delete_many(
            {
                "scopeKey": scope_key,
                "architectureId": arch_id,
                "bucket": bucket_name,
            }
        )


def _load_or_init_workspace(
    db, arch_id: str, scope_key: str = "default", persist_if_missing: bool = False
) -> dict:
    doc = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id})
    if doc:
        clean = serialize_doc(doc)
        if "records" not in clean or not isinstance(clean["records"], dict):
            clean["records"] = create_empty_record_buckets()
        else:
            for bucket in MODULE_RECORD_BUCKETS:
                clean["records"].setdefault(bucket, [])
        return clean

    default_ws = get_default_workspaces().get(arch_id, {})
    now_iso = datetime.now(timezone.utc).isoformat()
    new_doc = {
        **default_ws,
        "scopeKey": scope_key,
        "architectureId": arch_id,
        "enabledActivities": [arch_id],
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    if persist_if_missing and scope_key != "default":
        db.workspaces.insert_one(new_doc)
    return serialize_doc(new_doc)


@workspaces_bp.route("", methods=["GET"])
@workspaces_bp.route("/", methods=["GET"])
def list_workspaces():
    """Return all 6 architecture workspaces without inserting empty unused workspaces."""
    db = get_db()
    scope_key = _resolve_scope_key(db)
    result = {}
    for arch_id in ARCHITECTURE_IDS:
        ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
        ws.pop("_id", None)
        ws.pop("scopeKey", None)
        result[arch_id] = ws
    return success_response(data=result)


@workspaces_bp.route("/<string:arch_id>", methods=["GET"])
def get_workspace(arch_id: str):
    """Return a single architecture workspace by ID."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'. Valid IDs: {ARCHITECTURE_IDS}",
            status_code=404,
        )
    db = get_db()
    scope_key = _resolve_scope_key(db)
    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
    ws.pop("_id", None)
    ws.pop("scopeKey", None)
    return success_response(data=ws)


@workspaces_bp.route("/<string:arch_id>", methods=["PATCH"])
@validate_json(WorkspacePatchSchema)
def update_workspace(arch_id: str, validated_data: WorkspacePatchSchema):
    """Update workspace KPIs, headlines, or active trade presets."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'.", status_code=404
        )
    db = get_db()
    scope_key = _resolve_scope_key(db)
    now_iso = datetime.now(timezone.utc).isoformat()

    ws_existing = _load_or_init_workspace(
        db, arch_id, scope_key, persist_if_missing=True
    )
    updates = validated_data.model_dump(exclude_none=True)
    updates["updated_at"] = now_iso

    if isinstance(updates.get("records"), dict):
        merged_records = ws_existing.get("records", create_empty_record_buckets())
        for bucket_key, bucket_items in updates["records"].items():
            if isinstance(bucket_items, list):
                merged_records[bucket_key] = bucket_items
                _sync_bucket_to_module_records(
                    db, scope_key, arch_id, bucket_key, bucket_items, now_iso
                )
        updates["records"] = merged_records

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": updates},
        upsert=True,
    )
    logger.info(
        "PATCH workspace [%s] for scopeKey=%s | updated keys=%s",
        arch_id,
        scope_key,
        list(updates.keys()),
    )
    updated_ws = _load_or_init_workspace(
        db, arch_id, scope_key, persist_if_missing=False
    )
    updated_ws.pop("_id", None)
    updated_ws.pop("scopeKey", None)
    return success_response(data=updated_ws, message="Workspace updated successfully.")


@workspaces_bp.route("/<string:arch_id>/preset", methods=["POST"])
@validate_json(ApplyPresetSchema)
def apply_workspace_preset(arch_id: str, validated_data: ApplyPresetSchema):
    """
    Apply an industry/trade preset to a workspace (Make & Sell, Services,
    Agriculture, Food & Hospitality, or Hybrid).
    """
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'.", status_code=404
        )
    db = get_db()
    scope_key = _resolve_scope_key(db)
    now_iso = datetime.now(timezone.utc).isoformat()

    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=True)
    preset_field_map = {
        "make-and-sell": "activeTradePresetId",
        "services": "activeServicePresetId",
        "agriculture": "activeAgriPresetId",
        "food-and-hospitality": "activeFoodPresetId",
        "hybrid": "activeHybridPresetId",
    }
    preset_key = preset_field_map.get(arch_id, "activeTradePresetId")

    updates: dict = {
        preset_key: validated_data.presetId,
        "updated_at": now_iso,
    }
    if validated_data.businessName:
        updates["businessName"] = validated_data.businessName
    if validated_data.primaryItem:
        updates["primaryItem"] = validated_data.primaryItem
    if validated_data.attentionHeadline:
        updates["attentionHeadline"] = validated_data.attentionHeadline
    if validated_data.enabledActivities is not None:
        updates["enabledActivities"] = validated_data.enabledActivities

    if validated_data.seedRecords and isinstance(validated_data.seedRecords, dict):
        records_obj = ws.get("records", create_empty_record_buckets())
        for bucket, items in validated_data.seedRecords.items():
            if bucket in MODULE_RECORD_BUCKETS and isinstance(items, list):
                records_obj[bucket] = items
        updates["records"] = records_obj

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": updates},
        upsert=True,
    )
    updated_ws = _load_or_init_workspace(
        db, arch_id, scope_key, persist_if_missing=False
    )
    updated_ws.pop("_id", None)
    updated_ws.pop("scopeKey", None)
    return success_response(
        data=updated_ws,
        message=f"Preset '{validated_data.presetId}' applied to '{arch_id}'.",
    )


@workspaces_bp.route(
    "/<string:arch_id>/records/<string:module_name>", methods=["GET"]
)
def list_module_records(arch_id: str, module_name: str):
    """Return all records inside a specific module bucket for an architecture."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'.", status_code=404
        )
    if module_name not in MODULE_RECORD_BUCKETS:
        return error_response(
            error=f"Invalid module bucket '{module_name}'. Valid buckets: {MODULE_RECORD_BUCKETS}",
            status_code=400,
        )
    db = get_db()
    scope_key = _resolve_scope_key(db)
    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
    records = ws.get("records", {}).get(module_name, [])
    return success_response(data=records)


@workspaces_bp.route(
    "/<string:arch_id>/records/<string:module_name>", methods=["POST"]
)
@validate_json(ModuleRecordCreateSchema)
def create_module_record(
    arch_id: str, module_name: str, validated_data: ModuleRecordCreateSchema
):
    """
    Append a record to any of the 33 module record buckets and compute automatic
    KPI metric deltas and financial ledger transactions.
    """
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'.", status_code=404
        )
    if module_name not in MODULE_RECORD_BUCKETS:
        return error_response(
            error=f"Invalid module bucket '{module_name}'.", status_code=400
        )

    db = get_db()
    scope_key = _resolve_scope_key(db)
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_ms = int(now.timestamp() * 1000)

    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=True)
    raw_dump = validated_data.model_dump(exclude_none=True)

    rec_id = str(raw_dump.get("id") or f"REC-{now_ms}")
    title = _extract_record_title(raw_dump, module_name)
    amount = _extract_record_amount(raw_dump)
    status = str(raw_dump.get("status") or "Completed")

    record_doc = {
        **raw_dump,
        "id": rec_id,
        "architectureId": arch_id,
        "bucket": module_name,
        "title": title,
        "amountRWF": amount,
        "status": status,
        "date": raw_dump.get("date") or now.strftime("%Y-%m-%d %H:%M"),
        "createdAt": raw_dump.get("createdAt") or now_iso,
    }

    records_map = ws.get("records", create_empty_record_buckets())
    bucket_list = records_map.get(module_name, [])
    # Upsert if record with same ID already exists in bucket_list
    existing_idx = next(
        (i for i, item in enumerate(bucket_list) if str(item.get("id")) == rec_id),
        None,
    )
    if existing_idx is not None:
        bucket_list[existing_idx] = {**bucket_list[existing_idx], **record_doc}
    else:
        bucket_list.insert(0, record_doc)
    records_map[module_name] = bucket_list

    # Mirror into top-level db.module_records collection
    db.module_records.update_one(
        {
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "bucket": module_name,
            "id": rec_id,
        },
        {
            "$set": {
                **record_doc,
                "scopeKey": scope_key,
                "architectureId": arch_id,
                "bucket": module_name,
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )
    if module_name in PRODUCT_BUCKETS:
        _mirror_product(db, scope_key, arch_id, record_doc, now_iso)

    # Compute automatic workspace KPI updates and ledger transaction side-effects
    spendable = float(ws.get("spendableRWF", 0))
    monthly_rev = float(ws.get("monthlyRevenueRWF", 0))
    net_profit = float(ws.get("netProfitRWF", 0))
    stock_val = float(ws.get("stockValueRWF", 0))
    today_profit = float(ws.get("todayProfitRWF", 0))
    today_in = float(ws.get("todayMoneyInRWF", 0))
    today_costs = float(ws.get("todayCostsRWF", 0))
    owed_to_me = float(ws.get("owedToMeRWF", 0))
    i_owe = float(ws.get("iOweSuppliersRWF", 0))

    created_tx = None
    inflow_buckets = {"Sales", "Jobs", "ServiceJobs", "KitchenOrders", "GuestFolios", "MixedSales"}
    outflow_buckets = {"Purchases", "Expenses", "Feeds", "FeedingLogs", "HealthRecords"}
    stock_buckets = {"Inventory", "Products", "RawMaterials", "Consumables", "Ingredients", "HybridItems"}

    if module_name in inflow_buckets and amount > 0:
        is_credit = status.lower() in {"credit", "unpaid", "pending", "owed"}
        if is_credit:
            owed_to_me += amount
        else:
            spendable += amount
            today_in += amount
        monthly_rev += amount
        profit_margin = float(raw_dump.get("profitRWF") or round(amount * 0.32))
        net_profit += profit_margin
        today_profit += profit_margin

        created_tx = {
            "id": f"TX-{rec_id}",
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "type": "INFLOW",
            "category": module_name,
            "title": title,
            "amountRWF": amount,
            "paymentMethod": record_doc.get("paymentMethod", "MTN MoMo"),
            "status": status,
            "timestamp": now_iso,
            "editHistory": [],
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        db.transactions.update_one(
            {"id": created_tx["id"]}, {"$set": created_tx}, upsert=True
        )

    elif module_name in outflow_buckets and amount > 0:
        is_credit = status.lower() in {"credit", "unpaid", "owed"}
        if is_credit:
            i_owe += amount
        else:
            spendable = max(0.0, spendable - amount)
            today_costs += amount
        net_profit -= amount
        today_profit -= amount
        if module_name in {"Purchases", "Feeds"}:
            stock_val += amount

        created_tx = {
            "id": f"TX-{rec_id}",
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "type": "OUTFLOW",
            "category": module_name,
            "title": title,
            "amountRWF": amount,
            "paymentMethod": record_doc.get("paymentMethod", "Cash / MoMo"),
            "status": status,
            "timestamp": now_iso,
            "editHistory": [],
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        db.transactions.update_one(
            {"id": created_tx["id"]}, {"$set": created_tx}, upsert=True
        )

    elif module_name in stock_buckets and amount > 0:
        stock_val += amount

    ws_updates = {
        "records": records_map,
        "spendableRWF": spendable,
        "monthlyRevenueRWF": monthly_rev,
        "netProfitRWF": net_profit,
        "stockValueRWF": stock_val,
        "todayProfitRWF": today_profit,
        "todayMoneyInRWF": today_in,
        "todayCostsRWF": today_costs,
        "owedToMeRWF": owed_to_me,
        "iOweSuppliersRWF": i_owe,
        "updated_at": now_iso,
    }
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": ws_updates},
        upsert=True,
    )

    logger.info(
        "SAVED RECORD -> arch=%s | bucket=%s | id=%s | title='%s' | amountRWF=%s | scopeKey=%s",
        arch_id,
        module_name,
        rec_id,
        title,
        amount,
        scope_key,
    )

    return success_response(
        data={
            "record": record_doc,
            "workspaceMetrics": {k: v for k, v in ws_updates.items() if k != "records"},
            "transaction": serialize_doc(created_tx) if created_tx else None,
        },
        message=f"Record added to {module_name}.",
        status_code=201,
    )


@workspaces_bp.route(
    "/<string:arch_id>/records/<string:module_name>/<string:record_id>",
    methods=["PATCH"],
)
@validate_json(ModuleRecordUpdateSchema)
def update_module_record(
    arch_id: str,
    module_name: str,
    record_id: str,
    validated_data: ModuleRecordUpdateSchema,
):
    """Update a specific record inside a module bucket."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(f"Unknown architecture '{arch_id}'.", status_code=404)
    if module_name not in MODULE_RECORD_BUCKETS:
        return error_response(f"Invalid module bucket '{module_name}'.", status_code=400)

    db = get_db()
    scope_key = _resolve_scope_key(db)
    now_iso = datetime.now(timezone.utc).isoformat()

    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=True)
    records_map = ws.get("records", create_empty_record_buckets())
    bucket_list = records_map.get(module_name, [])

    patch_fields = validated_data.model_dump(exclude_none=True)
    updated_item = None
    for idx, item in enumerate(bucket_list):
        if str(item.get("id")) == str(record_id):
            bucket_list[idx] = {**item, **patch_fields, "updatedAt": now_iso}
            updated_item = bucket_list[idx]
            break

    if updated_item is None:
        # Only upsert if the payload includes a descriptive title/name;
        # ignore partial stock-sync patches directed to a bucket that doesn't hold this item.
        has_identity = any(
            patch_fields.get(k)
            for k in ("title", "name", "productName", "serviceName", "customerName", "supplierName")
        )
        if not has_identity:
            return success_response(
                data={"id": str(record_id), "skipped": True},
                message="Record not in target bucket; skipped partial patch.",
            )
        updated_item = {
            **patch_fields,
            "id": str(record_id),
            "architectureId": arch_id,
            "bucket": module_name,
            "title": _extract_record_title(patch_fields, module_name),
            "amountRWF": _extract_record_amount(patch_fields),
            "updatedAt": now_iso,
        }
        bucket_list.insert(0, updated_item)

    records_map[module_name] = bucket_list
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records_map, "updated_at": now_iso}},
        upsert=True,
    )
    db.module_records.update_one(
        {
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "bucket": module_name,
            "id": str(record_id),
        },
        {
            "$set": {
                **updated_item,
                "scopeKey": scope_key,
                "architectureId": arch_id,
                "bucket": module_name,
                "id": str(record_id),
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )
    if module_name in PRODUCT_BUCKETS:
        _mirror_product(db, scope_key, arch_id, updated_item, now_iso)
    logger.info(
        "UPDATED RECORD -> arch=%s | bucket=%s | id=%s | scopeKey=%s",
        arch_id,
        module_name,
        record_id,
        scope_key,
    )
    return success_response(data=updated_item, message="Record updated successfully.")


@workspaces_bp.route(
    "/<string:arch_id>/records/<string:module_name>/<string:record_id>",
    methods=["DELETE"],
)
def delete_module_record(arch_id: str, module_name: str, record_id: str):
    """Delete a record from a module bucket."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(f"Unknown architecture '{arch_id}'.", status_code=404)
    if module_name not in MODULE_RECORD_BUCKETS:
        return error_response(f"Invalid module bucket '{module_name}'.", status_code=400)

    db = get_db()
    scope_key = _resolve_scope_key(db)
    now_iso = datetime.now(timezone.utc).isoformat()

    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=True)
    records_map = ws.get("records", create_empty_record_buckets())
    bucket_list = records_map.get(module_name, [])

    new_list = [item for item in bucket_list if str(item.get("id")) != str(record_id)]

    records_map[module_name] = new_list
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records_map, "updated_at": now_iso}},
        upsert=True,
    )
    db.module_records.delete_one(
        {
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "bucket": module_name,
            "id": str(record_id),
        }
    )
    if module_name in PRODUCT_BUCKETS:
        db.products.delete_one(
            {"scopeKey": scope_key, "architectureId": arch_id, "id": str(record_id)}
        )
    # Also clean up from transactions if this record was synced to transactions
    db.transactions.delete_many(
        {
            "$or": [
                {"id": str(record_id)},
                {"_id": str(record_id)},
                {"scopeKey": scope_key, "id": str(record_id)},
            ]
        }
    )
    logger.info(
        "DELETED RECORD -> arch=%s | bucket=%s | id=%s | scopeKey=%s",
        arch_id,
        module_name,
        record_id,
        scope_key,
    )
    return success_response(message=f"Record '{record_id}' deleted from '{module_name}'.")


@workspaces_bp.route("/qrcode", methods=["GET"])
def get_qrcode_image():
    """Generate a clean, high-resolution scannable QR Code as SVG or PNG for any product or inventory item."""
    raw_text = request.args.get("text", "").strip()
    if not raw_text:
        raw_text = "ExBOS Product Item - Verified Rwanda"
    
    fmt = request.args.get("format", "svg").lower()
    box_size = int(request.args.get("box_size", 8))
    border = int(request.args.get("border", 2))

    if fmt == "png":
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=box_size,
            border=border,
        )
        qr.add_data(raw_text)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return Response(
            buf.getvalue(),
            mimetype="image/png",
            headers={"Cache-Control": "public, max-age=86400"},
        )
    else:
        # Default: SVG vector path (crisp, zero quality loss, lightweight)
        factory = qrcode.image.svg.SvgPathImage
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=box_size,
            border=border,
            image_factory=factory,
        )
        qr.add_data(raw_text)
        qr.make(fit=True)
        img = qr.make_image()
        svg_xml = img.to_string(encoding="unicode")
        return Response(
            svg_xml,
            mimetype="image/svg+xml; charset=utf-8",
            headers={"Cache-Control": "public, max-age=86400"},
        )


