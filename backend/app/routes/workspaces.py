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
from app.services.financial_intelligence import (
    calculate_financial_intelligence,
    assess_purchase_decision,
    _extract_purchase_financials,
)

logger = logging.getLogger("app.persistence")
workspaces_bp = Blueprint("workspaces", __name__, url_prefix="/api/v1/workspaces")


from app.utils.scope import resolve_scope_key as _resolve_scope_key


def _resolve_actor_and_branch(db, scope_key: str, requested_branch_id: str | None = None):
    """
    Resolve the authenticated user document (Owner vs Branch Manager) and the effective
    branch document + permissions for the requested branch.
    """
    actor_doc = None
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        if isinstance(ident, str) and ident.strip():
            actor_doc = db.users.find_one({"email": ident.strip().lower()}, {"_id": 0})
    except Exception:
        pass

    is_manager = False
    assigned_branch = ""
    if actor_doc:
        role_str = str(actor_doc.get("role") or "").strip().lower()
        assigned_branch = str(actor_doc.get("assignedBranchId") or "").strip()
        if role_str == "branch manager" or (assigned_branch and assigned_branch != "main"):
            is_manager = True

    effective_branch_id = assigned_branch if is_manager and assigned_branch else (requested_branch_id or "main")
    branch_doc = db.branches.find_one({"scopeKey": scope_key, "id": effective_branch_id}, {"_id": 0})
    return actor_doc, is_manager, effective_branch_id, branch_doc


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


def _filter_workspace_for_branch_manager(ws: dict, is_manager: bool, assigned_branch_id: str) -> dict:
    """Strictly isolate workspace records so a Branch Manager never receives Main HQ or other branches' data."""
    if not is_manager or not assigned_branch_id or assigned_branch_id == "main":
        return ws
    records = ws.get("records")
    if not isinstance(records, dict):
        return ws
    filtered_records = {}
    for bucket, items in records.items():
        if isinstance(items, list):
            filtered_records[bucket] = [
                rec for rec in items
                if isinstance(rec, dict) and str(rec.get("branchId") or "main").strip() == assigned_branch_id
            ]
        else:
            filtered_records[bucket] = items
    return {**ws, "records": filtered_records}


@workspaces_bp.route("", methods=["GET"])
@workspaces_bp.route("/", methods=["GET"])
def list_workspaces():
    """Return all 6 architecture workspaces without inserting empty unused workspaces."""
    db = get_db()
    scope_key = _resolve_scope_key(db)
    _, is_manager, effective_branch_id, _ = _resolve_actor_and_branch(db, scope_key)
    result = {}
    for arch_id in ARCHITECTURE_IDS:
        ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
        ws.pop("_id", None)
        ws.pop("scopeKey", None)
        result[arch_id] = _filter_workspace_for_branch_manager(ws, is_manager, effective_branch_id)
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
    _, is_manager, effective_branch_id, _ = _resolve_actor_and_branch(db, scope_key)
    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
    ws.pop("_id", None)
    ws.pop("scopeKey", None)
    ws = _filter_workspace_for_branch_manager(ws, is_manager, effective_branch_id)
    return success_response(data=ws)


@workspaces_bp.route("/<string:arch_id>/financial-intelligence", methods=["GET"])
def get_workspace_financial_intelligence(arch_id: str):
    """
    Return the centralized, reconciled financial intelligence snapshot for an architecture:
    - Total sales revenue, Actual payments received, Outstanding customer debts
    - Operating expenses, Cost of goods sold, Gross profit, Net profit
    - Current Cash, Mobile Money & Bank balances
    - Outstanding supplier debts, Open purchase commitments, Reserved operational funds
    - Available purchasing budget
    """
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'. Valid IDs: {ARCHITECTURE_IDS}",
            status_code=404,
        )
    db = get_db()
    scope_key = _resolve_scope_key(db)
    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
    tx_cursor = db.transactions.find(
        {"scopeKey": scope_key, "architectureId": arch_id}, {"_id": 0}
    )
    tx_list = list(tx_cursor)
    intel = calculate_financial_intelligence(ws, tx_list, arch_id)
    return success_response(data=intel)


@workspaces_bp.route("/<string:arch_id>/purchases/assess", methods=["POST"])
def assess_workspace_purchase(arch_id: str):
    """
    Evaluate a draft or edited purchase payload against current inventory, open POs,
    historical sales velocity, supplier price history, and available purchasing budget.
    """
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'. Valid IDs: {ARCHITECTURE_IDS}",
            status_code=404,
        )
    db = get_db()
    scope_key = _resolve_scope_key(db)
    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
    tx_cursor = db.transactions.find(
        {"scopeKey": scope_key, "architectureId": arch_id}, {"_id": 0}
    )
    tx_list = list(tx_cursor)
    payload = request.get_json(silent=True) or {}
    assessment = assess_purchase_decision(payload, ws, tx_list, arch_id)
    return success_response(data=assessment)


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
    _, is_manager, effective_branch_id, _ = _resolve_actor_and_branch(db, scope_key)
    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=False)
    records = ws.get("records", {}).get(module_name, [])
    if is_manager and effective_branch_id and effective_branch_id != "main":
        records = [
            rec for rec in records
            if isinstance(rec, dict) and str(rec.get("branchId") or "main").strip() == effective_branch_id
        ]
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

    # Enforce subscription quotas for catalog items & monthly sales
    from app.utils.entitlements import check_entitlement
    if module_name in ("Products", "Inventory", "FinishedGoods", "MenuItems", "Services", "HybridItems"):
        allowed, limit_err = check_entitlement(db, scope_key, "maxProducts")
        if not allowed:
            return error_response(error=limit_err["message"], details=limit_err, status_code=402)
    elif module_name in ("Sales", "Jobs", "KitchenOrders", "MixedSales"):
        allowed, limit_err = check_entitlement(db, scope_key, "maxMonthlySales")
        if not allowed:
            return error_response(error=limit_err["message"], details=limit_err, status_code=402)

    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=True)
    raw_dump = validated_data.model_dump(exclude_none=True)

    req_branch_id = str(raw_dump.get("branchId") or "main").strip()
    _, is_manager, effective_branch_id, branch_doc = _resolve_actor_and_branch(db, scope_key, req_branch_id)
    if is_manager and req_branch_id != effective_branch_id:
        raw_dump["branchId"] = effective_branch_id
    else:
        raw_dump["branchId"] = effective_branch_id

    if branch_doc and effective_branch_id != "main":
        if str(branch_doc.get("status") or "Active") == "Frozen":
            return error_response(
                f"Branch '{branch_doc.get('name', effective_branch_id)}' is currently Frozen (Read-Only) by Main HQ.",
                status_code=403,
            )
        b_perms = branch_doc.get("permissions") if isinstance(branch_doc.get("permissions"), dict) else {}
        if is_manager and module_name in PRODUCT_BUCKETS:
            if b_perms.get("canAddInventory", True) is False:
                return error_response(
                    "Adding new products or inventory is disabled for this branch. Stock is issued by Main HQ.",
                    status_code=403,
                )
        if is_manager and module_name == "Sales" and b_perms.get("canEditPrices", False) is False:
            # Verify branch manager is not overriding the HQ-set selling price on a catalog product
            sale_pid = str(raw_dump.get("productId") or "").strip()
            sale_ptitle = str(raw_dump.get("productTitle") or raw_dump.get("title") or "").strip().lower()
            sale_qty = float(raw_dump.get("quantity") or 1) or 1.0
            incoming_unit = float(
                raw_dump.get("unitPriceRWF")
                or (float(raw_dump.get("amountRWF") or 0) / sale_qty if sale_qty > 0 else 0)
            )
            if incoming_unit > 0 and (sale_pid or sale_ptitle):
                cat_match = None
                for cb in ("Inventory", "Products"):
                    for p in (ws.get("records") or {}).get(cb) or []:
                        if not isinstance(p, dict):
                            continue
                        if str(p.get("branchId") or "main").strip() != effective_branch_id:
                            continue
                        if (sale_pid and str(p.get("id") or "").strip() == sale_pid) or (
                            sale_ptitle and str(p.get("title") or p.get("name") or "").strip().lower() == sale_ptitle
                        ):
                            cat_match = p
                            break
                    if cat_match:
                        break
                if cat_match:
                    cat_sell = float(cat_match.get("sellingPriceRWF") or cat_match.get("unitPriceRWF") or 0)
                    cat_whole = float(cat_match.get("wholesalePriceRWF") or 0)
                    whole_min = float(cat_match.get("wholesaleMinQty") or 0)
                    expected_unit = cat_whole if (cat_whole > 0 and whole_min > 0 and sale_qty >= whole_min) else cat_sell
                    if expected_unit > 0 and abs(incoming_unit - expected_unit) > 1.0:
                        return error_response(
                            f"Changing selling prices is disabled for this branch by Main HQ. Set price is {expected_unit:,.0f} RWF.",
                            status_code=403,
                        )
        if module_name == "Expenses":
            if b_perms.get("canRecordExpenses") is False:
                return error_response(
                    "Recording expenses is disabled for this branch by Main HQ.",
                    status_code=403,
                )
            max_exp = float(b_perms.get("maxExpenseLimitRWF") or 0)
            if max_exp > 0 and _extract_record_amount(raw_dump) > max_exp:
                return error_response(
                    f"Expense exceeds this branch's maximum limit ({max_exp:,.0f} RWF) set by Main HQ.",
                    status_code=403,
                )

    rec_id = str(raw_dump.get("id") or f"REC-{now_ms}")
    # Idempotency guard for offline sync retries: if this exact record ID already exists
    # in the tenant workspace bucket, return it immediately without duplicating or re-deducting stock.
    existing_bucket = (ws.get("records") or {}).get(module_name) or []
    existing_rec = next(
        (r for r in existing_bucket if isinstance(r, dict) and str(r.get("id") or "") == rec_id),
        None,
    )
    if existing_rec is not None:
        clean_ws = serialize_doc(ws)
        clean_ws.pop("_id", None)
        clean_ws.pop("scopeKey", None)
        return success_response(
            data={
                "record": existing_rec,
                "workspace": clean_ws,
                "idempotent": True,
            },
            message=f"{module_name} record already synchronized.",
            status_code=200,
        )

    title = _extract_record_title(raw_dump, module_name)
    amount = _extract_record_amount(raw_dump)
    status = str(raw_dump.get("status") or "Completed")
    actor_email = (actor_doc or {}).get("email") if isinstance(locals().get("actor_doc"), dict) else "owner@exbos.rw"
    actor_role = (actor_doc or {}).get("role") if isinstance(locals().get("actor_doc"), dict) else "Owner"

    # Normalize Purchases fields (deliveryStatus, orderedQuantity, receivedQuantity, paidAmountRWF, remainingAmountRWF, auditTrail)
    if module_name == "Purchases":
        pf = _extract_purchase_financials({**raw_dump, "amountRWF": amount, "status": status})
        amount = pf["total"]
        raw_dump["amountRWF"] = pf["total"]
        raw_dump["totalAmountRWF"] = pf["total"]
        raw_dump["paidAmountRWF"] = pf["paid"]
        raw_dump["remainingAmountRWF"] = pf["remaining"]
        raw_dump["deliveryStatus"] = pf["deliveryStatus"]
        raw_dump["orderedQuantity"] = pf["orderedQty"]
        raw_dump["receivedQuantity"] = pf["receivedQty"]
        existing_audit = raw_dump.get("auditTrail") if isinstance(raw_dump.get("auditTrail"), list) else []
        existing_audit.append(
            {
                "timestamp": now_iso,
                "action": "PURCHASE_CREATED",
                "actorEmail": actor_email or "owner@exbos.rw",
                "actorRole": actor_role or "Owner",
                "branchId": effective_branch_id,
                "deliveryStatus": pf["deliveryStatus"],
                "orderedQuantity": pf["orderedQty"],
                "receivedQuantity": pf["receivedQty"],
                "totalAmountRWF": pf["total"],
                "paidAmountRWF": pf["paid"],
                "remainingAmountRWF": pf["remaining"],
                "sideMoneyAddedRWF": float(raw_dump.get("sideMoneyAddedRWF") or 0),
            }
        )
        raw_dump["auditTrail"] = existing_audit

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

    # Automatic server-side stock deduction on Sales and restock on Purchases (ONLY when goods are received!)
    target_prod_id = str(raw_dump.get("productId") or raw_dump.get("materialId") or "").strip()
    target_prod_title = str(raw_dump.get("productTitle") or raw_dump.get("materialName") or "").strip().lower()
    delta_qty = float(raw_dump.get("quantity") or 0)

    if module_name == "Sales" and delta_qty > 0 and (target_prod_id or target_prod_title):
        oos_notified_ids: set[str] = set()
        for stock_bucket in ("Inventory", "Products"):
            s_list = records_map.get(stock_bucket, [])
            for idx, prod in enumerate(s_list):
                p_id = str(prod.get("id") or "").strip()
                p_title = str(prod.get("title") or prod.get("name") or "").strip().lower()
                if (target_prod_id and p_id == target_prod_id) or (not target_prod_id and target_prod_title and p_title == target_prod_title):
                    cur_stock = float(prod.get("quantity") if prod.get("quantity") is not None else (prod.get("currentStock") or 0))
                    if raw_dump.get("remainingStockAfterSale") is not None:
                        new_stock = max(0.0, float(raw_dump["remainingStockAfterSale"]))
                    else:
                        new_stock = max(0.0, cur_stock - delta_qty)
                    new_stock_val = int(new_stock) if new_stock.is_integer() else new_stock
                    low_alert = float(prod.get("lowStockAlert") if prod.get("lowStockAlert") is not None else 5)
                    sell_p = float(prod.get("sellingPriceRWF") or prod.get("unitPriceRWF") or 0)
                    new_status = "Out of Stock" if new_stock <= 0 else ("Low Stock" if new_stock <= low_alert else "Active")
                    updated_prod = {
                        **prod,
                        "quantity": new_stock_val,
                        "currentStock": new_stock_val,
                        "amountRWF": new_stock_val * sell_p if sell_p > 0 else prod.get("amountRWF", 0),
                        "status": new_status,
                        "updatedAt": now_iso,
                    }
                    s_list[idx] = updated_prod
                    records_map[stock_bucket] = s_list
                    db.module_records.update_one(
                        {"scopeKey": scope_key, "architectureId": arch_id, "bucket": stock_bucket, "id": p_id},
                        {"$set": {**updated_prod, "scopeKey": scope_key, "architectureId": arch_id, "bucket": stock_bucket, "updated_at": now_iso}},
                        upsert=True,
                    )
                    _mirror_product(db, scope_key, arch_id, updated_prod, now_iso)
                    # Trigger Out-of-Stock WhatsApp alert to Business Owner & Branch Manager once per product
                    dedupe_key = p_id or p_title
                    if new_stock <= 0 and cur_stock > 0 and dedupe_key not in oos_notified_ids:
                        oos_notified_ids.add(dedupe_key)
                        from app.services.owner_audit_notifier import notify_out_of_stock_whatsapp
                        notify_out_of_stock_whatsapp(
                            db,
                            scope_key=scope_key,
                            branch_id=str(prod.get("branchId") or effective_branch_id or "main"),
                            product_title=str(prod.get("title") or prod.get("name") or title),
                            product_id=p_id,
                            sku=str(prod.get("sku") or ""),
                            unit=str(prod.get("unit") or "piece"),
                            remaining_qty=new_stock,
                        )

    elif module_name == "Purchases" and (target_prod_id or target_prod_title):
        # Increase stock ONLY by the quantity actually received (0 for open Purchase Orders)
        received_delta = float(raw_dump.get("receivedQuantity") if raw_dump.get("receivedQuantity") is not None else delta_qty)
        if received_delta > 0:
            for stock_bucket in ("Inventory", "Products", "RawMaterials", "Ingredients", "Consumables", "Feeds"):
                s_list = records_map.get(stock_bucket, [])
                for idx, prod in enumerate(s_list):
                    p_id = str(prod.get("id") or "").strip()
                    p_title = str(prod.get("title") or prod.get("name") or prod.get("feedName") or "").strip().lower()
                    if (target_prod_id and p_id == target_prod_id) or (not target_prod_id and target_prod_title and p_title == target_prod_title):
                        cur_stock = float(prod.get("quantity") if prod.get("quantity") is not None else (prod.get("currentStock") or prod.get("quantityKg") or 0))
                        if raw_dump.get("remainingStockAfterPurchase") is not None and received_delta == delta_qty:
                            new_stock = max(0.0, float(raw_dump["remainingStockAfterPurchase"]))
                        else:
                            new_stock = cur_stock + received_delta
                        new_stock_val = int(new_stock) if new_stock.is_integer() else new_stock
                        low_alert = float(prod.get("lowStockAlert") if prod.get("lowStockAlert") is not None else 5)
                        buy_cost = float(raw_dump.get("unitPriceRWF") or prod.get("purchasePriceRWF") or prod.get("unitCostRWF") or 0)
                        sell_p = float(prod.get("sellingPriceRWF") or buy_cost)
                        new_status = "Low Stock" if new_stock <= low_alert else "Active"
                        updated_prod = {
                            **prod,
                            "quantity": new_stock_val,
                            "currentStock": new_stock_val,
                            "purchasePriceRWF": buy_cost or prod.get("purchasePriceRWF", 0),
                            "unitCostRWF": buy_cost or prod.get("unitCostRWF", 0),
                            "amountRWF": new_stock_val * sell_p,
                            "status": new_status,
                            "updatedAt": now_iso,
                        }
                        s_list[idx] = updated_prod
                        records_map[stock_bucket] = s_list
                        db.module_records.update_one(
                            {"scopeKey": scope_key, "architectureId": arch_id, "bucket": stock_bucket, "id": p_id},
                            {"$set": {**updated_prod, "scopeKey": scope_key, "architectureId": arch_id, "bucket": stock_bucket, "updated_at": now_iso}},
                            upsert=True,
                        )
                        if stock_bucket in PRODUCT_BUCKETS:
                            _mirror_product(db, scope_key, arch_id, updated_prod, now_iso)

    elif module_name == "MixedSales":
        # Hybrid: deduct HybridItems stock for tracked physical items in line items or direct productId
        line_items = raw_dump.get("items") if isinstance(raw_dump.get("items"), list) else []
        if not line_items and (target_prod_id or target_prod_title) and delta_qty > 0:
            line_items = [{"itemId": target_prod_id, "title": target_prod_title, "quantity": delta_qty}]
        hyb_list = records_map.get("HybridItems", [])
        if isinstance(hyb_list, list) and line_items:
            hyb_changed = False
            for li in line_items:
                li_id = str(li.get("itemId") or li.get("productId") or li.get("id") or "").strip()
                li_title = str(li.get("title") or li.get("name") or "").strip().lower()
                li_qty = float(li.get("quantity") or 0)
                if li_qty <= 0 or (not li_id and not li_title):
                    continue
                for idx, item in enumerate(hyb_list):
                    if not item.get("trackStock"):
                        continue
                    h_id = str(item.get("id") or "").strip()
                    h_title = str(item.get("title") or item.get("name") or "").strip().lower()
                    if (li_id and h_id == li_id) or (not li_id and li_title and h_title == li_title):
                        cur_s = float(item.get("currentStock") if item.get("currentStock") is not None else (item.get("quantity") or 0))
                        new_s = max(0.0, cur_s - li_qty)
                        new_s_val = int(new_s) if new_s.is_integer() else new_s
                        hyb_list[idx] = {**item, "currentStock": new_s_val, "quantity": new_s_val, "updatedAt": now_iso}
                        hyb_changed = True
                        db.module_records.update_one(
                            {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "HybridItems", "id": h_id},
                            {"$set": {**hyb_list[idx], "scopeKey": scope_key, "architectureId": arch_id, "bucket": "HybridItems", "updated_at": now_iso}},
                            upsert=True,
                        )
            if hyb_changed:
                records_map["HybridItems"] = hyb_list

    elif module_name == "FeedingLogs":
        # Agriculture: deduct Feeds stock when FeedingLogs records feed consumption
        feed_id = str(raw_dump.get("feedId") or "").strip()
        feed_name = str(raw_dump.get("feedName") or raw_dump.get("title") or "").strip().lower()
        used_kg = float(raw_dump.get("quantityUsed") or raw_dump.get("quantity") or 0)
        feeds_list = records_map.get("Feeds", [])
        if isinstance(feeds_list, list) and used_kg > 0 and (feed_id or feed_name):
            for idx, fd in enumerate(feeds_list):
                f_id = str(fd.get("id") or "").strip()
                f_name = str(fd.get("name") or fd.get("feedName") or fd.get("title") or "").strip().lower()
                if (feed_id and f_id == feed_id) or (not feed_id and feed_name and f_name == feed_name):
                    cur_kg = float(fd.get("quantityKg") if fd.get("quantityKg") is not None else (fd.get("quantity") or 0))
                    new_kg = max(0.0, cur_kg - used_kg)
                    feeds_list[idx] = {**fd, "quantityKg": new_kg, "quantity": new_kg, "updatedAt": now_iso}
                    records_map["Feeds"] = feeds_list
                    db.module_records.update_one(
                        {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "Feeds", "id": f_id},
                        {"$set": {**feeds_list[idx], "scopeKey": scope_key, "architectureId": arch_id, "bucket": "Feeds", "updated_at": now_iso}},
                        upsert=True,
                    )
                    break

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
            {"scopeKey": scope_key, "id": created_tx["id"]}, {"$set": created_tx}, upsert=True
        )

    elif module_name == "Purchases" and amount > 0:
        pf = _extract_purchase_financials(record_doc)
        paid_now = pf["paid"]
        rem_owed = pf["remaining"]
        side_money_added = float(raw_dump.get("sideMoneyAddedRWF") or 0)

        # If owner added external/side money to afford this purchase, record capital injection inflow
        if side_money_added > 0:
            spendable += side_money_added
            today_in += side_money_added
            side_tx = {
                "id": f"TX-SIDE-{rec_id}",
                "recordId": rec_id,
                "sourceModule": "Purchases",
                "isCapitalInjection": True,
                "scopeKey": scope_key,
                "architectureId": arch_id,
                "type": "INFLOW",
                "category": "Owner Side Money / Capital Top-Up",
                "title": str(raw_dump.get("sideMoneySource") or f"Side Money Top-Up for {title}"),
                "amountRWF": side_money_added,
                "account": record_doc.get("paymentMethod", "Cash / MoMo"),
                "paymentMethod": record_doc.get("paymentMethod", "Cash / MoMo"),
                "status": "Completed",
                "timestamp": now_iso,
                "editHistory": [],
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            db.transactions.update_one(
                {"scopeKey": scope_key, "id": side_tx["id"]}, {"$set": side_tx}, upsert=True
            )

        # Deduct ONLY actual cash paid now from spendable
        if paid_now > 0:
            spendable = max(0.0, spendable - paid_now)
            today_costs += paid_now

        # Add ONLY remaining unpaid balance on received goods to supplier payables
        if rem_owed > 0 and not pf["isOpenPo"]:
            i_owe += rem_owed
            # Sync supplier balance in Suppliers bucket if supplierName is present
            sup_name = str(raw_dump.get("supplierName") or raw_dump.get("supplier") or "").strip()
            if sup_name:
                sup_list = records_map.get("Suppliers", [])
                matched_sup_idx = next(
                    (
                        i
                        for i, s in enumerate(sup_list)
                        if isinstance(s, dict)
                        and str(s.get("name") or s.get("supplierName") or s.get("title") or "").strip().lower()
                        == sup_name.lower()
                    ),
                    None,
                )
                if matched_sup_idx is not None:
                    cur_owed = float(
                        sup_list[matched_sup_idx].get("balanceOwedRWF")
                        if sup_list[matched_sup_idx].get("balanceOwedRWF") is not None
                        else (sup_list[matched_sup_idx].get("amountRWF") or 0)
                    )
                    new_sup_owed = cur_owed + rem_owed
                    sup_list[matched_sup_idx] = {
                        **sup_list[matched_sup_idx],
                        "balanceOwedRWF": new_sup_owed,
                        "amountRWF": new_sup_owed,
                        "status": f"Owed {new_sup_owed:,.0f} RWF",
                        "updatedAt": now_iso,
                    }
                    sup_id = str(sup_list[matched_sup_idx].get("id"))
                    db.module_records.update_one(
                        {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "Suppliers", "id": sup_id},
                        {"$set": {**sup_list[matched_sup_idx], "scopeKey": scope_key, "architectureId": arch_id, "bucket": "Suppliers", "updated_at": now_iso}},
                        upsert=True,
                    )
                else:
                    new_sup = {
                        "id": f"SUP-{now_ms}",
                        "title": sup_name,
                        "name": sup_name,
                        "supplierName": sup_name,
                        "phone": raw_dump.get("supplierPhone") or "",
                        "location": raw_dump.get("supplierLocation") or "",
                        "balanceOwedRWF": rem_owed,
                        "amountRWF": rem_owed,
                        "status": f"Owed {rem_owed:,.0f} RWF",
                        "createdAt": now_iso,
                        "updatedAt": now_iso,
                    }
                    sup_list.insert(0, new_sup)
                    db.module_records.update_one(
                        {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "Suppliers", "id": new_sup["id"]},
                        {"$set": {**new_sup, "scopeKey": scope_key, "architectureId": arch_id, "bucket": "Suppliers", "updated_at": now_iso}},
                        upsert=True,
                    )
                records_map["Suppliers"] = sup_list

        # Increase stock value ONLY when inventory is actually received
        if pf["receivedQty"] > 0 and pf["orderedQty"] > 0:
            received_ratio = min(1.0, pf["receivedQty"] / pf["orderedQty"])
            stock_val += round(pf["total"] * received_ratio)

        # Record cash outflow transaction ONLY for actual paid amount (never deduct unpaid credit from cash)
        if paid_now > 0:
            created_tx = {
                "id": f"TX-{rec_id}",
                "recordId": rec_id,
                "sourceModule": "Purchases",
                "scopeKey": scope_key,
                "architectureId": arch_id,
                "type": "OUTFLOW",
                "category": "Purchases",
                "title": title,
                "amountRWF": paid_now,
                "totalInvoiceAmountRWF": pf["total"],
                "remainingBalanceRWF": rem_owed,
                "account": record_doc.get("paymentMethod", "Cash / MoMo"),
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

    elif module_name in outflow_buckets and amount > 0:
        is_credit = status.lower() in {"credit", "unpaid", "owed"}
        if is_credit:
            i_owe += amount
        else:
            spendable = max(0.0, spendable - amount)
            today_costs += amount
        net_profit -= amount
        today_profit -= amount
        if module_name == "Feeds":
            stock_val += amount

        created_tx = {
            "id": f"TX-{rec_id}",
            "recordId": rec_id,
            "sourceModule": module_name,
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
            {"scopeKey": scope_key, "id": created_tx["id"]}, {"$set": created_tx}, upsert=True
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

    # Enforce Branch Manager edit & price permissions before mutating records
    existing_target = next((it for it in bucket_list if str(it.get("id")) == str(record_id)), None)
    target_branch_id = str(
        (existing_target or {}).get("branchId") or patch_fields.get("branchId") or "main"
    ).strip()
    _, upd_is_manager, upd_eff_branch_id, upd_branch_doc = _resolve_actor_and_branch(db, scope_key, target_branch_id)
    if upd_is_manager and target_branch_id != upd_eff_branch_id:
        return error_response(
            "Access Denied: You cannot edit records belonging to Main HQ or another branch.",
            status_code=403,
        )
    if upd_is_manager and upd_branch_doc and upd_eff_branch_id != "main":
        if str(upd_branch_doc.get("status") or "Active") == "Frozen":
            return error_response(
                f"Branch '{upd_branch_doc.get('name', upd_eff_branch_id)}' is Frozen (Read-Only) by Main HQ.",
                status_code=403,
            )
        b_perms = upd_branch_doc.get("permissions") if isinstance(upd_branch_doc.get("permissions"), dict) else {}
        if module_name in PRODUCT_BUCKETS:
            if b_perms.get("canEditProducts", False) is False:
                return error_response(
                    "Editing products or stock quantities is disabled for this branch by Main HQ.",
                    status_code=403,
                )
            if b_perms.get("canEditPrices", False) is False and isinstance(existing_target, dict):
                for price_key in ("sellingPriceRWF", "unitPriceRWF", "price"):
                    if price_key in patch_fields:
                        old_p = float(existing_target.get(price_key) or 0)
                        new_p = float(patch_fields.get(price_key) or 0)
                        if abs(new_p - old_p) > 0.01:
                            return error_response(
                                "Editing selling prices is disabled for this branch by Main HQ.",
                                status_code=403,
                            )

    updated_item = None
    previous_item = None
    for idx, item in enumerate(bucket_list):
        if str(item.get("id")) == str(record_id):
            previous_item = dict(item)
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

    ws_extra_updates: dict = {}

    # Transaction Integrity for Purchases PATCH (partial/full delivery receipt & partial/full payment settlement)
    if module_name == "Purchases" and previous_item is not None and updated_item is not None:
        prev_pf = _extract_purchase_financials(previous_item)
        new_pf = _extract_purchase_financials(updated_item)

        # 1. Check if additional goods were received on a Purchase Order
        newly_received_qty = max(0.0, new_pf["receivedQty"] - prev_pf["receivedQty"])
        if newly_received_qty > 0:
            t_pid = str(updated_item.get("productId") or updated_item.get("materialId") or "").strip()
            t_title = str(updated_item.get("productTitle") or updated_item.get("materialName") or "").strip().lower()
            for stock_bucket in ("Inventory", "Products", "RawMaterials", "Ingredients", "Consumables", "Feeds"):
                s_list = records_map.get(stock_bucket, [])
                bucket_modified = False
                for s_idx, prod in enumerate(s_list):
                    p_id = str(prod.get("id") or "").strip()
                    p_title = str(prod.get("title") or prod.get("name") or prod.get("feedName") or "").strip().lower()
                    if (t_pid and p_id == t_pid) or (not t_pid and t_title and p_title == t_title):
                        cur_stock = float(
                            prod.get("quantity")
                            if prod.get("quantity") is not None
                            else (prod.get("currentStock") or prod.get("quantityKg") or 0)
                        )
                        new_stock = cur_stock + newly_received_qty
                        new_stock_val = int(new_stock) if new_stock.is_integer() else new_stock
                        low_alert = float(prod.get("lowStockAlert") if prod.get("lowStockAlert") is not None else 5)
                        buy_cost = float(
                            updated_item.get("unitPriceRWF")
                            or prod.get("purchasePriceRWF")
                            or prod.get("unitCostRWF")
                            or 0
                        )
                        sell_p = float(prod.get("sellingPriceRWF") or buy_cost)
                        updated_prod = {
                            **prod,
                            "quantity": new_stock_val,
                            "currentStock": new_stock_val,
                            "purchasePriceRWF": buy_cost or prod.get("purchasePriceRWF", 0),
                            "unitCostRWF": buy_cost or prod.get("unitCostRWF", 0),
                            "amountRWF": new_stock_val * sell_p,
                            "status": "Low Stock" if new_stock <= low_alert else "Active",
                            "updatedAt": now_iso,
                        }
                        s_list[s_idx] = updated_prod
                        bucket_modified = True
                        db.module_records.update_one(
                            {"scopeKey": scope_key, "architectureId": arch_id, "bucket": stock_bucket, "id": p_id},
                            {"$set": {**updated_prod, "scopeKey": scope_key, "architectureId": arch_id, "bucket": stock_bucket, "updated_at": now_iso}},
                            upsert=True,
                        )
                        if stock_bucket in PRODUCT_BUCKETS:
                            _mirror_product(db, scope_key, arch_id, updated_prod, now_iso)
                if bucket_modified:
                    records_map[stock_bucket] = s_list
                    ws_extra_updates[f"records.{stock_bucket}"] = s_list

        # 2. Check if additional supplier payment was made (without double-deducting prior payment)
        newly_paid_rwf = max(0.0, new_pf["paid"] - prev_pf["paid"])
        if newly_paid_rwf > 0:
            ws_extra_updates["spendableRWF"] = max(0.0, float(ws.get("spendableRWF", 0)) - newly_paid_rwf)
            ws_extra_updates["iOweSuppliersRWF"] = max(0.0, float(ws.get("iOweSuppliersRWF", 0)) - newly_paid_rwf)
            # Update primary transaction record TX-<record_id> so total paid matches new_pf["paid"]
            db.transactions.update_one(
                {"scopeKey": scope_key, "id": f"TX-{record_id}"},
                {
                    "$set": {
                        "id": f"TX-{record_id}",
                        "recordId": str(record_id),
                        "sourceModule": "Purchases",
                        "scopeKey": scope_key,
                        "architectureId": arch_id,
                        "type": "OUTFLOW",
                        "category": "Purchases",
                        "title": updated_item.get("title") or "Purchase Settlement",
                        "amountRWF": new_pf["paid"],
                        "totalInvoiceAmountRWF": new_pf["total"],
                        "remainingBalanceRWF": new_pf["remaining"],
                        "paymentMethod": updated_item.get("paymentMethod", "Cash / MoMo"),
                        "status": updated_item.get("status", "Completed"),
                        "updated_at": now_iso,
                    },
                    "$setOnInsert": {"timestamp": now_iso, "created_at": now_iso, "editHistory": []},
                },
                upsert=True,
            )
            # Also decrement supplier debt in Suppliers bucket
            sup_name = str(updated_item.get("supplierName") or updated_item.get("supplier") or "").strip()
            if sup_name:
                sup_list = records_map.get("Suppliers", [])
                for s_idx, s in enumerate(sup_list):
                    if isinstance(s, dict) and str(s.get("name") or s.get("supplierName") or s.get("title") or "").strip().lower() == sup_name.lower():
                        cur_owed = float(s.get("balanceOwedRWF") if s.get("balanceOwedRWF") is not None else (s.get("amountRWF") or 0))
                        rem_sup = max(0.0, cur_owed - newly_paid_rwf)
                        sup_list[s_idx] = {
                            **s,
                            "balanceOwedRWF": rem_sup,
                            "amountRWF": rem_sup,
                            "status": "Paid / Active" if rem_sup <= 0 else f"Owed {rem_sup:,.0f} RWF",
                            "updatedAt": now_iso,
                        }
                        db.module_records.update_one(
                            {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "Suppliers", "id": str(s.get("id"))},
                            {"$set": {**sup_list[s_idx], "scopeKey": scope_key, "architectureId": arch_id, "bucket": "Suppliers", "updated_at": now_iso}},
                            upsert=True,
                        )
                        records_map["Suppliers"] = sup_list
                        ws_extra_updates["records.Suppliers"] = sup_list
                        break

        # 3. Append audit trail entry
        audit_list = list(updated_item.get("auditTrail") or []) if isinstance(updated_item.get("auditTrail"), list) else []
        audit_list.append(
            {
                "timestamp": now_iso,
                "action": "PURCHASE_UPDATED",
                "newlyReceivedQty": newly_received_qty,
                "newlyPaidRWF": newly_paid_rwf,
                "deliveryStatus": new_pf["deliveryStatus"],
                "paidAmountRWF": new_pf["paid"],
                "remainingAmountRWF": new_pf["remaining"],
            }
        )
        updated_item["auditTrail"] = audit_list
        updated_item["paidAmountRWF"] = new_pf["paid"]
        updated_item["remainingAmountRWF"] = new_pf["remaining"]
        updated_item["deliveryStatus"] = new_pf["deliveryStatus"]
        updated_item["orderedQuantity"] = new_pf["orderedQty"]
        updated_item["receivedQuantity"] = new_pf["receivedQty"]
        for idx, item in enumerate(bucket_list):
            if str(item.get("id")) == str(record_id):
                bucket_list[idx] = updated_item
                break

    records_map[module_name] = bucket_list
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {f"records.{module_name}": bucket_list, **ws_extra_updates, "updated_at": now_iso}},
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
        try:
            item_bid = str((updated_item or {}).get("branchId") or (previous_item or {}).get("branchId") or "main").strip()
            actor_doc, is_mgr, eff_bid, b_doc = _resolve_actor_and_branch(db, scope_key, item_bid)
            if is_mgr and previous_item is not None:
                from app.services.owner_audit_notifier import notify_owner_branch_product_action

                diffs = []
                for field_key, label, is_money in (
                    ("title", "Product Name", False),
                    ("sellingPriceRWF", "Selling Price", True),
                    ("purchasePriceRWF", "Cost Price", True),
                    ("unitCostRWF", "Unit Cost", True),
                    ("quantity", "Stock Quantity", False),
                ):
                    old_v = previous_item.get(field_key)
                    new_v = updated_item.get(field_key)
                    if new_v is not None and str(old_v) != str(new_v):
                        if is_money:
                            diffs.append((label, f"{float(old_v or 0):,.0f} RWF -> {float(new_v or 0):,.0f} RWF"))
                        else:
                            diffs.append((label, f"{old_v} -> {new_v}"))
                if diffs:
                    notify_owner_branch_product_action(
                        db,
                        scope_key=scope_key,
                        branch_id=eff_bid or item_bid,
                        branch_name=(b_doc or {}).get("name") or eff_bid or item_bid,
                        manager_doc=actor_doc or {},
                        action_type="Edited Product Details",
                        product_title=str(updated_item.get("title") or updated_item.get("name") or record_id),
                        product_id=str(record_id),
                        changes=diffs,
                        channel="ExBOS Web",
                        business_name=str(ws.get("businessName") or "ExBOS Business"),
                    )
        except Exception as audit_exc:
            logger.debug("Silent web product edit audit skipped: %s", audit_exc)
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

    sibling_product_buckets = ("Inventory", "Products", "FinishedGoods", "Stock")
    deleted_item = next(
        (item for item in bucket_list if str(item.get("id")) == str(record_id)),
        None,
    )
    if deleted_item is None and module_name in sibling_product_buckets:
        for sib_b in sibling_product_buckets:
            sib_found = next(
                (item for item in (records_map.get(sib_b) or []) if isinstance(item, dict) and str(item.get("id")) == str(record_id)),
                None,
            )
            if sib_found is not None:
                deleted_item = sib_found
                break
    del_actor_doc = None
    del_is_manager = False
    del_eff_branch_id = None
    del_branch_doc = None
    if isinstance(deleted_item, dict):
        item_branch_id = str(deleted_item.get("branchId") or "main").strip()
        del_actor_doc, del_is_manager, del_eff_branch_id, del_branch_doc = _resolve_actor_and_branch(db, scope_key, item_branch_id)
        if del_is_manager and item_branch_id != del_eff_branch_id:
            return error_response(
                "Access Denied: You cannot delete records belonging to Main HQ or another branch.",
                status_code=403,
            )
        if del_is_manager and del_branch_doc and item_branch_id != "main":
            if str(del_branch_doc.get("status") or "Active") == "Frozen":
                return error_response(
                    f"Branch '{del_branch_doc.get('name', item_branch_id)}' is Frozen (Read-Only) by Main HQ.",
                    status_code=403,
                )
            b_perms = del_branch_doc.get("permissions") if isinstance(del_branch_doc.get("permissions"), dict) else {}
            if module_name in PRODUCT_BUCKETS:
                if b_perms.get("canDeleteProducts", False) is False:
                    return error_response(
                        "Deleting products is disabled for this branch by Main HQ.",
                        status_code=403,
                    )
            elif b_perms.get("canDeleteRecords", False) is False:
                return error_response(
                    "Record deletion is disabled for this branch by Main HQ.",
                    status_code=403,
                )

    new_list = [item for item in bucket_list if str(item.get("id")) != str(record_id)]
    records_map[module_name] = new_list

    ws_updates: dict = {f"records.{module_name}": new_list, "updated_at": now_iso}

    # If deleting a product/catalog item, also purge any mirrored copy in sibling product buckets
    # (Inventory <-> Products <-> FinishedGoods <-> Stock) so it never resurrects on refresh.
    purged_ids: set[str] = {str(record_id)}
    if module_name in sibling_product_buckets:
        del_title_norm = (
            str((deleted_item or {}).get("title") or (deleted_item or {}).get("name") or "").strip().lower()
            if isinstance(deleted_item, dict)
            else ""
        )
        del_branch_norm = (
            str((deleted_item or {}).get("branchId") or "main").strip()
            if isinstance(deleted_item, dict)
            else ""
        )
        for sib_bucket in sibling_product_buckets:
            if sib_bucket == module_name:
                continue
            sib_list = records_map.get(sib_bucket)
            if not isinstance(sib_list, list) or not sib_list:
                continue
            cleaned_sib = []
            removed_any = False
            for sib_item in sib_list:
                if not isinstance(sib_item, dict):
                    cleaned_sib.append(sib_item)
                    continue
                same_id = str(sib_item.get("id") or "") == str(record_id)
                sib_title = str(sib_item.get("title") or sib_item.get("name") or "").strip().lower()
                sib_branch = str(sib_item.get("branchId") or "main").strip()
                same_mirror = bool(del_title_norm and sib_title == del_title_norm and sib_branch == del_branch_norm)
                if same_id or same_mirror:
                    removed_any = True
                    if sib_item.get("id"):
                        purged_ids.add(str(sib_item.get("id")))
                    continue
                cleaned_sib.append(sib_item)
            if removed_any:
                records_map[sib_bucket] = cleaned_sib
                ws_updates[f"records.{sib_bucket}"] = cleaned_sib

    if isinstance(deleted_item, dict):
        del_qty = float(deleted_item.get("quantity") or 0)
        del_amt = _extract_record_amount(deleted_item)
        del_status = str(deleted_item.get("status") or "").lower()
        target_prod_id = str(deleted_item.get("productId") or "").strip()
        target_prod_title = str(deleted_item.get("productTitle") or "").strip().lower()

        if module_name == "Sales":
            # 1. Restore deducted stock back to Inventory & Products
            if del_qty > 0 and (target_prod_id or target_prod_title):
                for stock_bucket in ("Inventory", "Products"):
                    s_list = records_map.get(stock_bucket, [])
                    bucket_changed = False
                    for idx, prod in enumerate(s_list):
                        p_id = str(prod.get("id") or "").strip()
                        p_title = str(prod.get("title") or prod.get("name") or "").strip().lower()
                        if (target_prod_id and p_id == target_prod_id) or (
                            not target_prod_id and target_prod_title and p_title == target_prod_title
                        ):
                            cur_stock = float(
                                prod.get("quantity")
                                if prod.get("quantity") is not None
                                else (prod.get("currentStock") or 0)
                            )
                            new_stock = cur_stock + del_qty
                            new_stock_val = int(new_stock) if new_stock.is_integer() else new_stock
                            low_alert = float(
                                prod.get("lowStockAlert") if prod.get("lowStockAlert") is not None else 5
                            )
                            sell_p = float(prod.get("sellingPriceRWF") or prod.get("unitPriceRWF") or 0)
                            new_status = (
                                "Out of Stock"
                                if new_stock <= 0
                                else ("Low Stock" if new_stock <= low_alert else "Active")
                            )
                            updated_prod = {
                                **prod,
                                "quantity": new_stock_val,
                                "currentStock": new_stock_val,
                                "amountRWF": new_stock_val * sell_p if sell_p > 0 else prod.get("amountRWF", 0),
                                "status": new_status,
                                "updatedAt": now_iso,
                            }
                            s_list[idx] = updated_prod
                            bucket_changed = True
                            db.module_records.update_one(
                                {
                                    "scopeKey": scope_key,
                                    "architectureId": arch_id,
                                    "bucket": stock_bucket,
                                    "id": p_id,
                                },
                                {
                                    "$set": {
                                        **updated_prod,
                                        "scopeKey": scope_key,
                                        "architectureId": arch_id,
                                        "bucket": stock_bucket,
                                        "updated_at": now_iso,
                                    }
                                },
                                upsert=True,
                            )
                            _mirror_product(db, scope_key, arch_id, updated_prod, now_iso)
                    if bucket_changed:
                        records_map[stock_bucket] = s_list
                        ws_updates[f"records.{stock_bucket}"] = s_list

            # 2. Reverse Sales KPI metrics
            if del_amt > 0:
                is_credit = any(k in del_status for k in ("credit", "unpaid", "pending", "owed"))
                if is_credit:
                    ws_updates["owedToMeRWF"] = max(0.0, float(ws.get("owedToMeRWF", 0)) - del_amt)
                else:
                    ws_updates["spendableRWF"] = max(0.0, float(ws.get("spendableRWF", 0)) - del_amt)
                    ws_updates["todayMoneyInRWF"] = max(0.0, float(ws.get("todayMoneyInRWF", 0)) - del_amt)
                ws_updates["monthlyRevenueRWF"] = max(0.0, float(ws.get("monthlyRevenueRWF", 0)) - del_amt)
                profit_rev = float(deleted_item.get("profitRWF") or round(del_amt * 0.32))
                ws_updates["netProfitRWF"] = float(ws.get("netProfitRWF", 0)) - profit_rev
                ws_updates["todayProfitRWF"] = float(ws.get("todayProfitRWF", 0)) - profit_rev

        elif module_name == "Purchases":
            # 1. Subtract purchased stock from Inventory, Products & RawMaterials
            if del_qty > 0 and (target_prod_id or target_prod_title):
                for stock_bucket in ("Inventory", "Products", "RawMaterials"):
                    s_list = records_map.get(stock_bucket, [])
                    bucket_changed = False
                    for idx, prod in enumerate(s_list):
                        p_id = str(prod.get("id") or "").strip()
                        p_title = str(prod.get("title") or prod.get("name") or "").strip().lower()
                        if (target_prod_id and p_id == target_prod_id) or (
                            not target_prod_id and target_prod_title and p_title == target_prod_title
                        ):
                            cur_stock = float(
                                prod.get("quantity")
                                if prod.get("quantity") is not None
                                else (prod.get("currentStock") or 0)
                            )
                            new_stock = max(0.0, cur_stock - del_qty)
                            new_stock_val = int(new_stock) if new_stock.is_integer() else new_stock
                            low_alert = float(
                                prod.get("lowStockAlert") if prod.get("lowStockAlert") is not None else 5
                            )
                            sell_p = float(
                                prod.get("sellingPriceRWF")
                                or prod.get("purchasePriceRWF")
                                or prod.get("unitCostRWF")
                                or 0
                            )
                            new_status = (
                                "Out of Stock"
                                if new_stock <= 0
                                else ("Low Stock" if new_stock <= low_alert else "Active")
                            )
                            updated_prod = {
                                **prod,
                                "quantity": new_stock_val,
                                "currentStock": new_stock_val,
                                "amountRWF": new_stock_val * sell_p,
                                "status": new_status,
                                "updatedAt": now_iso,
                            }
                            s_list[idx] = updated_prod
                            bucket_changed = True
                            db.module_records.update_one(
                                {
                                    "scopeKey": scope_key,
                                    "architectureId": arch_id,
                                    "bucket": stock_bucket,
                                    "id": p_id,
                                },
                                {
                                    "$set": {
                                        **updated_prod,
                                        "scopeKey": scope_key,
                                        "architectureId": arch_id,
                                        "bucket": stock_bucket,
                                        "updated_at": now_iso,
                                    }
                                },
                                upsert=True,
                            )
                            if stock_bucket in PRODUCT_BUCKETS:
                                _mirror_product(db, scope_key, arch_id, updated_prod, now_iso)
                    if bucket_changed:
                        records_map[stock_bucket] = s_list
                        ws_updates[f"records.{stock_bucket}"] = s_list

            # 2. Reverse Purchases KPI metrics
            if del_amt > 0:
                is_credit = any(k in del_status for k in ("credit", "unpaid", "owed"))
                if is_credit:
                    ws_updates["iOweSuppliersRWF"] = max(0.0, float(ws.get("iOweSuppliersRWF", 0)) - del_amt)
                else:
                    ws_updates["spendableRWF"] = float(ws.get("spendableRWF", 0)) + del_amt
                    ws_updates["todayCostsRWF"] = max(0.0, float(ws.get("todayCostsRWF", 0)) - del_amt)

        elif module_name in ("MixedSales", "KitchenOrders", "GuestFolios", "Jobs", "ServiceJobs"):
            # Hybrid MixedSales: restore HybridItems stock for tracked line items
            if module_name == "MixedSales":
                line_items = deleted_item.get("items") if isinstance(deleted_item.get("items"), list) else []
                if not line_items and del_qty > 0 and (target_prod_id or target_prod_title):
                    line_items = [{"itemId": target_prod_id, "title": target_prod_title, "quantity": del_qty}]
                hyb_list = records_map.get("HybridItems", [])
                if isinstance(hyb_list, list) and line_items:
                    hyb_changed = False
                    for li in line_items:
                        li_id = str(li.get("itemId") or li.get("productId") or li.get("id") or "").strip()
                        li_title = str(li.get("title") or li.get("name") or "").strip().lower()
                        li_qty = float(li.get("quantity") or 0)
                        if li_qty <= 0 or (not li_id and not li_title):
                            continue
                        for idx, item in enumerate(hyb_list):
                            if not item.get("trackStock"):
                                continue
                            h_id = str(item.get("id") or "").strip()
                            h_title = str(item.get("title") or item.get("name") or "").strip().lower()
                            if (li_id and h_id == li_id) or (not li_id and li_title and h_title == li_title):
                                cur_s = float(item.get("currentStock") if item.get("currentStock") is not None else (item.get("quantity") or 0))
                                new_s = cur_s + li_qty
                                new_s_val = int(new_s) if new_s.is_integer() else new_s
                                hyb_list[idx] = {**item, "currentStock": new_s_val, "quantity": new_s_val, "updatedAt": now_iso}
                                hyb_changed = True
                                db.module_records.update_one(
                                    {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "HybridItems", "id": h_id},
                                    {"$set": {**hyb_list[idx], "scopeKey": scope_key, "architectureId": arch_id, "bucket": "HybridItems", "updated_at": now_iso}},
                                    upsert=True,
                                )
                    if hyb_changed:
                        records_map["HybridItems"] = hyb_list
                        ws_updates["records.HybridItems"] = hyb_list

            # Reverse revenue/profit KPI metrics across Hybrid, Food & Hospitality, and Services
            if del_amt > 0:
                is_credit = any(k in del_status for k in ("credit", "unpaid", "pending", "owed"))
                if is_credit:
                    ws_updates["owedToMeRWF"] = max(0.0, float(ws.get("owedToMeRWF", 0)) - del_amt)
                else:
                    ws_updates["spendableRWF"] = max(0.0, float(ws.get("spendableRWF", 0)) - del_amt)
                    ws_updates["todayMoneyInRWF"] = max(0.0, float(ws.get("todayMoneyInRWF", 0)) - del_amt)
                ws_updates["monthlyRevenueRWF"] = max(0.0, float(ws.get("monthlyRevenueRWF", 0)) - del_amt)
                profit_rev = float(deleted_item.get("profitRWF") or round(del_amt * 0.32))
                ws_updates["netProfitRWF"] = float(ws.get("netProfitRWF", 0)) - profit_rev
                ws_updates["todayProfitRWF"] = float(ws.get("todayProfitRWF", 0)) - profit_rev

        elif module_name in ("Expenses", "Feeds", "FeedingLogs", "HealthRecords"):
            # Agriculture FeedingLogs: restore Feeds stock
            if module_name == "FeedingLogs":
                feed_id = str(deleted_item.get("feedId") or "").strip()
                feed_name = str(deleted_item.get("feedName") or deleted_item.get("title") or "").strip().lower()
                used_kg = float(deleted_item.get("quantityUsed") or deleted_item.get("quantity") or 0)
                feeds_list = records_map.get("Feeds", [])
                if isinstance(feeds_list, list) and used_kg > 0 and (feed_id or feed_name):
                    for idx, fd in enumerate(feeds_list):
                        f_id = str(fd.get("id") or "").strip()
                        f_name = str(fd.get("name") or fd.get("feedName") or fd.get("title") or "").strip().lower()
                        if (feed_id and f_id == feed_id) or (not feed_id and feed_name and f_name == feed_name):
                            cur_kg = float(fd.get("quantityKg") if fd.get("quantityKg") is not None else (fd.get("quantity") or 0))
                            new_kg = cur_kg + used_kg
                            feeds_list[idx] = {**fd, "quantityKg": new_kg, "quantity": new_kg, "updatedAt": now_iso}
                            records_map["Feeds"] = feeds_list
                            ws_updates["records.Feeds"] = feeds_list
                            db.module_records.update_one(
                                {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "Feeds", "id": f_id},
                                {"$set": {**feeds_list[idx], "scopeKey": scope_key, "architectureId": arch_id, "bucket": "Feeds", "updated_at": now_iso}},
                                upsert=True,
                            )
                            break

            if del_amt > 0:
                is_credit = any(k in del_status for k in ("credit", "unpaid", "owed"))
                if is_credit:
                    ws_updates["iOweSuppliersRWF"] = max(0.0, float(ws.get("iOweSuppliersRWF", 0)) - del_amt)
                else:
                    ws_updates["spendableRWF"] = float(ws.get("spendableRWF", 0)) + del_amt
                    ws_updates["todayCostsRWF"] = max(0.0, float(ws.get("todayCostsRWF", 0)) - del_amt)
                ws_updates["netProfitRWF"] = float(ws.get("netProfitRWF", 0)) + del_amt
                ws_updates["todayProfitRWF"] = float(ws.get("todayProfitRWF", 0)) + del_amt

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": ws_updates},
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
    # Purge all sibling product bucket entries in db.module_records & db.products and write tombstones
    # so a concurrent POST /api/v1/storage snapshot from any tab/device can NEVER resurrect deleted records.
    for pid in purged_ids:
        if module_name in sibling_product_buckets:
            for sb in sibling_product_buckets:
                db.module_records.delete_one(
                    {"scopeKey": scope_key, "architectureId": arch_id, "bucket": sb, "id": pid}
                )
        db.deleted_records.update_one(
            {"scopeKey": scope_key, "architectureId": arch_id, "id": pid},
            {"$set": {"scopeKey": scope_key, "architectureId": arch_id, "id": pid, "bucket": module_name, "deletedAt": now_iso}},
            upsert=True,
        )
    if module_name in PRODUCT_BUCKETS:
        for pid in purged_ids:
            db.products.delete_one(
                {"scopeKey": scope_key, "architectureId": arch_id, "id": pid}
            )
        if del_is_manager and isinstance(deleted_item, dict):
            try:
                from app.services.owner_audit_notifier import notify_owner_branch_product_action

                notify_owner_branch_product_action(
                    db,
                    scope_key=scope_key,
                    branch_id=del_eff_branch_id or str(deleted_item.get("branchId") or ""),
                    branch_name=(del_branch_doc or {}).get("name") or del_eff_branch_id or "Assigned Branch",
                    manager_doc=del_actor_doc or {},
                    action_type="Deleted Product Permanently",
                    product_title=str(deleted_item.get("title") or deleted_item.get("name") or record_id),
                    product_id=str(record_id),
                    changes=[
                        ("Last Selling Price", f"{float(deleted_item.get('sellingPriceRWF') or deleted_item.get('amountRWF') or 0):,.0f} RWF"),
                        ("Last Cost Price", f"{float(deleted_item.get('purchasePriceRWF') or deleted_item.get('unitCostRWF') or 0):,.0f} RWF"),
                        ("Last Stock", f"{deleted_item.get('quantity') if deleted_item.get('quantity') is not None else (deleted_item.get('currentStock') or 0)} unit(s)"),
                    ],
                    channel="ExBOS Web",
                    business_name=str(ws.get("businessName") or "ExBOS Business"),
                )
            except Exception as audit_exc:
                logger.debug("Silent web product delete audit skipped: %s", audit_exc)
    # Also clean up from transactions if this record was synced to transactions
    db.transactions.delete_many(
        {
            "$or": [
                {"id": str(record_id)},
                {"id": f"TX-{record_id}"},
                {"recordId": str(record_id)},
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


def _encode_qr_matrix_to_png(matrix: list[list[bool]], box_size: int = 8, border: int = 2) -> bytes:
    """Zero-dependency pure-Python PNG encoder for a QR boolean matrix (fallback when PIL is absent)."""
    import struct
    import zlib

    box = max(1, int(box_size))
    pad = max(0, int(border))
    modules = len(matrix)
    total_modules = modules + 2 * pad
    size = total_modules * box

    raw_rows = bytearray()
    white_row = b"\xff" * size
    for r in range(total_modules):
        src_r = r - pad
        if src_r < 0 or src_r >= modules:
            row_bytes = white_row
        else:
            src_row = matrix[src_r]
            row_buf = bytearray(size)
            for c in range(total_modules):
                src_c = c - pad
                is_black = 0 <= src_c < modules and bool(src_row[src_c])
                val = 0 if is_black else 255
                start = c * box
                row_buf[start : start + box] = bytes([val]) * box
            row_bytes = bytes(row_buf)
        for _ in range(box):
            raw_rows.append(0)  # PNG filter type 0 (None)
            raw_rows.extend(row_bytes)

    def _png_chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack("!I", len(data)) + tag + data + struct.pack("!I", crc)

    ihdr = struct.pack("!IIBBBBB", size, size, 8, 0, 0, 0, 0)  # 8-bit grayscale
    idat = zlib.compress(bytes(raw_rows), level=6)
    return (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", idat)
        + _png_chunk(b"IEND", b"")
    )


@workspaces_bp.route("/qrcode", methods=["GET"])
def get_qrcode_image():
    """Generate a clean, high-resolution scannable QR Code as SVG or PNG for any product or inventory item."""
    raw_text = request.args.get("text", "").strip()[:512]
    if not raw_text:
        raw_text = "ExBOS Product Item - Verified Rwanda"

    fmt = request.args.get("format", "svg").lower()
    box_size = max(1, min(32, int(request.args.get("box_size", 8))))
    border = max(0, min(12, int(request.args.get("border", 2))))

    if fmt == "png":
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=box_size,
            border=border,
        )
        qr.add_data(raw_text)
        qr.make(fit=True)
        try:
            img = qr.make_image(fill_color="black", back_color="white")
            buf = BytesIO()
            img.save(buf, format="PNG")
            png_bytes = buf.getvalue()
        except Exception:
            png_bytes = _encode_qr_matrix_to_png(qr.get_matrix(), box_size=box_size, border=border)
        return Response(
            png_bytes,
            mimetype="image/png",
            headers={
                "Cache-Control": "public, max-age=86400",
                "Content-Disposition": 'inline; filename="exbos-qrcode.png"',
            },
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


@workspaces_bp.route("/public-document/<path:doc_id>", methods=["GET"])
def get_public_document(doc_id: str):
    """
    Public, read-only lookup for shared invoices, receipts, quotations, and purchase orders.
    Powers /d/<doc_id> links sent to customers via WhatsApp or Email.
    Never exposes private business credentials or internal ledgers.
    """
    db = get_db()
    clean_id = (doc_id or "").strip()
    if not clean_id:
        return error_response("Document ID is required.", status_code=400)

    found_doc = None
    found_scope = ""

    # 1. Fast lookup in db.module_records (bucket: Documents)
    rec = db.module_records.find_one({"bucket": "Documents", "id": clean_id})
    if rec:
        found_scope = str(rec.get("scopeKey") or "").strip().lower()
        found_doc = serialize_doc(rec)
        found_doc.pop("_id", None)
        found_doc.pop("scopeKey", None)

    # 2. Fallback: scan db.workspaces records.Documents
    if not found_doc:
        ws_doc = db.workspaces.find_one({"records.Documents.id": clean_id})
        if ws_doc:
            found_scope = str(ws_doc.get("scopeKey") or "").strip().lower()
            docs_list = (ws_doc.get("records") or {}).get("Documents") or []
            for item in docs_list:
                if str(item.get("id") or "").strip() == clean_id:
                    found_doc = dict(item)
                    break

    if not found_doc:
        return error_response("Document not found or link has expired.", status_code=404)

    # Attach non-sensitive business branding from the owner's profile
    business_info = {
        "businessName": "ExBOS Verified Business",
        "phone": "",
        "address": "Kigali, Rwanda",
        "email": "",
        "currency": "RWF",
    }
    if found_scope:
        owner = db.users.find_one({"email": found_scope})
        if owner:
            business_info = {
                "businessName": owner.get("businessName") or owner.get("fullName") or business_info["businessName"],
                "phone": owner.get("phone") or "",
                "address": owner.get("address") or owner.get("location") or "Kigali, Rwanda",
                "email": owner.get("email") or "",
                "currency": owner.get("currency") or "RWF",
            }

    return success_response(
        data={
            "document": found_doc,
            "business": business_info,
        },
        message="Public document loaded.",
    )


@workspaces_bp.route("/<string:arch_id>/records/Inventory/bulk", methods=["POST"])
def bulk_import_inventory_records(arch_id: str):
    """
    Bulk import products & opening stock from Excel/CSV (supports wholesale pricing,
    batch/expiry dates, serial/IMEI lists, and SKU deduplication).
    """
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(error=f"Unknown architecture '{arch_id}'.", status_code=404)

    db = get_db()
    scope_key = _resolve_scope_key(db)
    payload = request.get_json(silent=True) or {}
    items = payload.get("items")
    if not isinstance(items, list) or len(items) == 0:
        return error_response("Provide a non-empty 'items' array to import.", status_code=400)
    if len(items) > 500:
        return error_response("Maximum 500 products per CSV import batch.", status_code=400)

    req_branch_id = str(payload.get("branchId") or "main").strip()
    _, is_manager, effective_branch_id, branch_doc = _resolve_actor_and_branch(db, scope_key, req_branch_id)
    if branch_doc and effective_branch_id != "main":
        if str(branch_doc.get("status") or "Active") == "Frozen":
            return error_response(
                f"Branch '{branch_doc.get('name', effective_branch_id)}' is Frozen (Read-Only) by Main HQ.",
                status_code=403,
            )
        b_perms = branch_doc.get("permissions") if isinstance(branch_doc.get("permissions"), dict) else {}
        if is_manager and b_perms.get("canAddInventory", True) is False:
            return error_response(
                "Bulk importing products is disabled for this branch. Stock is issued by Main HQ.",
                status_code=403,
            )

    from app.utils.entitlements import check_entitlement
    allowed, limit_err = check_entitlement(db, scope_key, "maxProducts")
    if not allowed:
        return error_response(error=limit_err["message"], details=limit_err, status_code=402)

    ws = _load_or_init_workspace(db, arch_id, scope_key, persist_if_missing=True)
    records = dict(ws.get("records") or {})
    inv_list = list(records.get("Inventory") or [])
    prod_list = list(records.get("Products") or [])

    sku_index = {}
    for idx, existing in enumerate(inv_list):
        if isinstance(existing, dict):
            ek = str(existing.get("sku") or "").strip().lower()
            eb = str(existing.get("branchId") or "main").strip()
            if ek:
                sku_index[(ek, eb)] = idx

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    base_ms = int(now.timestamp() * 1000)

    created_count = 0
    updated_count = 0
    skipped_count = 0
    imported_records = []

    for i, raw in enumerate(items):
        if not isinstance(raw, dict):
            skipped_count += 1
            continue
        title = str(raw.get("title") or raw.get("name") or "").strip()
        if not title:
            skipped_count += 1
            continue

        sku = str(raw.get("sku") or raw.get("barcode") or "").strip()
        purchase_p = max(0.0, float(raw.get("purchasePriceRWF") or raw.get("costPrice") or 0))
        selling_p = max(0.0, float(raw.get("sellingPriceRWF") or raw.get("price") or 0))
        wholesale_p = max(0.0, float(raw.get("wholesalePriceRWF") or 0))
        wholesale_min = max(1, int(float(raw.get("wholesaleMinQty") or 5)))
        qty = max(0.0, float(raw.get("quantity") or raw.get("stock") or 0))
        low_alert = max(0.0, float(raw.get("lowStockAlert") or 5))
        batch_no = str(raw.get("batchNumber") or "").strip()[:60]
        expiry = str(raw.get("expiryDate") or "").strip()[:10]
        serials = raw.get("serialNumbers")
        if isinstance(serials, str):
            serials = [s.strip() for s in serials.split("|") if s.strip()]
        elif not isinstance(serials, list):
            serials = []

        sku_key = (sku.lower(), effective_branch_id)
        if sku and sku_key in sku_index:
            idx = sku_index[sku_key]
            existing = dict(inv_list[idx])
            existing["title"] = title
            existing["name"] = title
            existing["purchasePriceRWF"] = purchase_p or existing.get("purchasePriceRWF", 0)
            existing["sellingPriceRWF"] = selling_p or existing.get("sellingPriceRWF", 0)
            if wholesale_p > 0:
                existing["wholesalePriceRWF"] = wholesale_p
                existing["wholesaleMinQty"] = wholesale_min
            existing["quantity"] = qty
            if batch_no:
                existing["batchNumber"] = batch_no
            if expiry:
                existing["expiryDate"] = expiry
            if serials:
                existing["trackSerialNumbers"] = True
                existing["serialNumbers"] = serials
            existing["updatedAt"] = now_iso
            inv_list[idx] = existing
            updated_count += 1
            imported_records.append(existing)
            continue

        rec_id = f"PRD-CSV-{base_ms}-{i + 1}"
        new_rec = {
            "id": rec_id,
            "title": title,
            "name": title,
            "sku": sku or f"SKU-{base_ms % 100000}-{i + 1}",
            "category": str(raw.get("category") or "General").strip() or "General",
            "unit": str(raw.get("unit") or "piece").strip() or "piece",
            "purchasePriceRWF": purchase_p,
            "sellingPriceRWF": selling_p,
            "wholesalePriceRWF": wholesale_p,
            "wholesaleMinQty": wholesale_min,
            "amountRWF": selling_p,
            "quantity": qty,
            "lowStockAlert": low_alert,
            "batchNumber": batch_no,
            "expiryDate": expiry,
            "trackSerialNumbers": bool(raw.get("trackSerialNumbers") or len(serials) > 0),
            "serialNumbers": serials,
            "variants": raw.get("variants") if isinstance(raw.get("variants"), list) else [],
            "branchId": effective_branch_id,
            "status": "In Stock" if qty > 0 else "Out of Stock",
            "date": now.strftime("%Y-%m-%d"),
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }
        inv_list.insert(0, new_rec)
        prod_list.insert(0, dict(new_rec))
        if sku:
            sku_index[sku_key] = 0
        created_count += 1
        imported_records.append(new_rec)

    records["Inventory"] = inv_list
    records["Products"] = prod_list
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records, "updatedAt": now_iso}},
        upsert=True,
    )

    # Fast batch mirror into db.module_records & db.products (1 round-trip via bulk_write on MongoDB Atlas)
    if imported_records:
        try:
            from pymongo import UpdateOne

            if hasattr(db.module_records, "bulk_write") and hasattr(db.products, "bulk_write"):
                mod_ops = []
                prod_ops = []
                for item in imported_records:
                    rec_id = str(item.get("id") or "")
                    if not rec_id:
                        continue
                    mod_doc = {
                        **item,
                        "id": rec_id,
                        "scopeKey": scope_key,
                        "architectureId": arch_id,
                        "bucket": "Inventory",
                        "updated_at": now_iso,
                    }
                    mod_doc.pop("_id", None)
                    mod_ops.append(
                        UpdateOne(
                            {"scopeKey": scope_key, "architectureId": arch_id, "bucket": "Inventory", "id": rec_id},
                            {"$set": mod_doc},
                            upsert=True,
                        )
                    )
                    prod_doc = {
                        **item,
                        "id": rec_id,
                        "scopeKey": scope_key,
                        "architectureId": arch_id,
                        "updated_at": now_iso,
                    }
                    prod_doc.pop("_id", None)
                    prod_ops.append(
                        UpdateOne(
                            {"scopeKey": scope_key, "architectureId": arch_id, "id": rec_id},
                            {"$set": prod_doc},
                            upsert=True,
                        )
                    )
                if mod_ops:
                    db.module_records.bulk_write(mod_ops, ordered=False)
                if prod_ops:
                    db.products.bulk_write(prod_ops, ordered=False)
            else:
                _sync_bucket_to_module_records(db, scope_key, arch_id, "Inventory", inv_list, now_iso)
        except Exception:
            # Workspace document is already saved; never fail the bulk import over secondary mirror
            pass

    return success_response(
        data={
            "createdCount": created_count,
            "updatedCount": updated_count,
            "skippedCount": skipped_count,
            "importedRecords": imported_records[:50],
        },
        message=f"Bulk import complete: {created_count} created, {updated_count} updated, {skipped_count} skipped.",
        status_code=201,
    )




