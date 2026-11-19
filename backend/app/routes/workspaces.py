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

    # Automatic server-side stock deduction on Sales and restock on Purchases
    target_prod_id = str(raw_dump.get("productId") or "").strip()
    target_prod_title = str(raw_dump.get("productTitle") or "").strip().lower()
    delta_qty = float(raw_dump.get("quantity") or 0)

    if module_name == "Sales" and delta_qty > 0 and (target_prod_id or target_prod_title):
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

    elif module_name == "Purchases" and delta_qty > 0 and (target_prod_id or target_prod_title):
        for stock_bucket in ("Inventory", "Products", "RawMaterials"):
            s_list = records_map.get(stock_bucket, [])
            for idx, prod in enumerate(s_list):
                p_id = str(prod.get("id") or "").strip()
                p_title = str(prod.get("title") or prod.get("name") or "").strip().lower()
                if (target_prod_id and p_id == target_prod_id) or (not target_prod_id and target_prod_title and p_title == target_prod_title):
                    cur_stock = float(prod.get("quantity") if prod.get("quantity") is not None else (prod.get("currentStock") or 0))
                    if raw_dump.get("remainingStockAfterPurchase") is not None:
                        new_stock = max(0.0, float(raw_dump["remainingStockAfterPurchase"]))
                    else:
                        new_stock = cur_stock + delta_qty
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
        {"$set": {f"records.{module_name}": bucket_list, "updated_at": now_iso}},
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

    deleted_item = next(
        (item for item in bucket_list if str(item.get("id")) == str(record_id)),
        None,
    )
    if isinstance(deleted_item, dict):
        item_branch_id = str(deleted_item.get("branchId") or "main").strip()
        _, is_manager, effective_branch_id, branch_doc = _resolve_actor_and_branch(db, scope_key, item_branch_id)
        if is_manager and item_branch_id != effective_branch_id:
            return error_response(
                "Access Denied: You cannot delete records belonging to Main HQ or another branch.",
                status_code=403,
            )
        if branch_doc and item_branch_id != "main":
            if str(branch_doc.get("status") or "Active") == "Frozen":
                return error_response(
                    f"Branch '{branch_doc.get('name', item_branch_id)}' is Frozen (Read-Only) by Main HQ.",
                    status_code=403,
                )
            b_perms = branch_doc.get("permissions") if isinstance(branch_doc.get("permissions"), dict) else {}
            if b_perms.get("canDeleteRecords", False) is False:
                return error_response(
                    "Record deletion is disabled for this branch by Main HQ.",
                    status_code=403,
                )

    new_list = [item for item in bucket_list if str(item.get("id")) != str(record_id)]
    records_map[module_name] = new_list

    ws_updates: dict = {f"records.{module_name}": new_list, "updated_at": now_iso}

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
    if module_name in PRODUCT_BUCKETS:
        db.products.delete_one(
            {"scopeKey": scope_key, "architectureId": arch_id, "id": str(record_id)}
        )
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



