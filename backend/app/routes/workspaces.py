from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required
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

workspaces_bp = Blueprint("workspaces", __name__, url_prefix="/api/v1/workspaces")


def _resolve_scope_key() -> str:
    jwt_email = get_jwt_identity()
    return (
        request.args.get("scopeKey")
        or (jwt_email.lower() if jwt_email else None)
        or "default"
    )


def _load_or_init_workspace(db, arch_id: str, scope_key: str = "default") -> dict:
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
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    db.workspaces.insert_one(new_doc)
    return serialize_doc(new_doc)


@workspaces_bp.route("", methods=["GET"])
@workspaces_bp.route("/", methods=["GET"])
@jwt_required(optional=True)
def list_workspaces():
    """Return all 6 architecture workspaces."""
    db = get_db()
    scope_key = _resolve_scope_key()
    result = {}
    for arch_id in ARCHITECTURE_IDS:
        ws = _load_or_init_workspace(db, arch_id, scope_key)
        ws.pop("_id", None)
        ws.pop("scopeKey", None)
        result[arch_id] = ws
    return success_response(data=result)


@workspaces_bp.route("/<string:arch_id>", methods=["GET"])
@jwt_required(optional=True)
def get_workspace(arch_id: str):
    """Return a single architecture workspace by ID."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'. Valid IDs: {ARCHITECTURE_IDS}",
            status_code=404,
        )
    db = get_db()
    scope_key = _resolve_scope_key()
    ws = _load_or_init_workspace(db, arch_id, scope_key)
    ws.pop("_id", None)
    ws.pop("scopeKey", None)
    return success_response(data=ws)


@workspaces_bp.route("/<string:arch_id>", methods=["PATCH"])
@jwt_required(optional=True)
@validate_json(WorkspacePatchSchema)
def update_workspace(arch_id: str, validated_data: WorkspacePatchSchema):
    """Update workspace KPIs, headlines, or active trade presets."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(
            error=f"Unknown architecture '{arch_id}'.", status_code=404
        )
    db = get_db()
    scope_key = _resolve_scope_key()
    now_iso = datetime.now(timezone.utc).isoformat()

    _load_or_init_workspace(db, arch_id, scope_key)
    updates = validated_data.model_dump(exclude_none=True)
    updates["updated_at"] = now_iso

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": updates},
    )
    updated_ws = _load_or_init_workspace(db, arch_id, scope_key)
    updated_ws.pop("_id", None)
    updated_ws.pop("scopeKey", None)
    return success_response(data=updated_ws, message="Workspace updated successfully.")


@workspaces_bp.route("/<string:arch_id>/preset", methods=["POST"])
@jwt_required(optional=True)
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
    scope_key = _resolve_scope_key()
    now_iso = datetime.now(timezone.utc).isoformat()

    ws = _load_or_init_workspace(db, arch_id, scope_key)
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
    )
    updated_ws = _load_or_init_workspace(db, arch_id, scope_key)
    updated_ws.pop("_id", None)
    updated_ws.pop("scopeKey", None)
    return success_response(
        data=updated_ws,
        message=f"Preset '{validated_data.presetId}' applied to '{arch_id}'.",
    )


@workspaces_bp.route(
    "/<string:arch_id>/records/<string:module_name>", methods=["GET"]
)
@jwt_required(optional=True)
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
    scope_key = _resolve_scope_key()
    ws = _load_or_init_workspace(db, arch_id, scope_key)
    records = ws.get("records", {}).get(module_name, [])
    return success_response(data=records)


@workspaces_bp.route(
    "/<string:arch_id>/records/<string:module_name>", methods=["POST"]
)
@jwt_required(optional=True)
@validate_json(ModuleRecordCreateSchema)
def create_module_record(
    arch_id: str, module_name: str, validated_data: ModuleRecordCreateSchema
):
    """
    Append a record to any of the 27 module record buckets and compute automatic
    KPI metric deltas and financial ledger transactions (matching addDemoRecord in ExbosContext.jsx).
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
    scope_key = _resolve_scope_key()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_ms = int(now.timestamp() * 1000)

    ws = _load_or_init_workspace(db, arch_id, scope_key)
    raw_dump = validated_data.model_dump(exclude_none=True)

    rec_id = str(raw_dump.get("id") or f"REC-{now_ms}")
    title = (
        raw_dump.get("title")
        or raw_dump.get("name")
        or f"{module_name} Entry"
    )
    amount = float(raw_dump.get("amountRWF") or 0)
    status = str(raw_dump.get("status") or "Completed")

    record_doc = {
        **raw_dump,
        "id": rec_id,
        "title": title,
        "amountRWF": amount,
        "status": status,
        "date": raw_dump.get("date") or now.strftime("%Y-%m-%d %H:%M"),
        "createdAt": now_iso,
    }

    records_map = ws.get("records", create_empty_record_buckets())
    bucket_list = records_map.get(module_name, [])
    bucket_list.insert(0, record_doc)
    records_map[module_name] = bucket_list

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
    inflow_buckets = {"Sales", "Jobs", "KitchenOrders", "GuestFolios", "MixedSales"}
    outflow_buckets = {"Purchases", "Expenses", "Feeds", "HealthRecords"}
    stock_buckets = {"Inventory", "RawMaterials", "Consumables", "Ingredients", "HybridItems"}

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
            "id": f"TX-{now_ms}",
            "architectureId": arch_id,
            "type": "INFLOW",
            "category": module_name,
            "title": title,
            "amountRWF": amount,
            "paymentMethod": record_doc.get("paymentMethod", "MTN MoMo"),
            "status": status,
            "timestamp": now_iso,
            "editHistory": [],
        }
        db.transactions.insert_one({**created_tx})

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
            "id": f"TX-{now_ms}",
            "architectureId": arch_id,
            "type": "OUTFLOW",
            "category": module_name,
            "title": title,
            "amountRWF": amount,
            "paymentMethod": record_doc.get("paymentMethod", "Cash / MoMo"),
            "status": status,
            "timestamp": now_iso,
            "editHistory": [],
        }
        db.transactions.insert_one({**created_tx})

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
@jwt_required(optional=True)
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
    scope_key = _resolve_scope_key()
    now_iso = datetime.now(timezone.utc).isoformat()

    ws = _load_or_init_workspace(db, arch_id, scope_key)
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
        return error_response(
            f"Record '{record_id}' not found in '{module_name}'.", status_code=404
        )

    records_map[module_name] = bucket_list
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records_map, "updated_at": now_iso}},
    )
    return success_response(data=updated_item, message="Record updated successfully.")


@workspaces_bp.route(
    "/<string:arch_id>/records/<string:module_name>/<string:record_id>",
    methods=["DELETE"],
)
@jwt_required(optional=True)
def delete_module_record(arch_id: str, module_name: str, record_id: str):
    """Delete a record from a module bucket."""
    if arch_id not in ARCHITECTURE_IDS:
        return error_response(f"Unknown architecture '{arch_id}'.", status_code=404)
    if module_name not in MODULE_RECORD_BUCKETS:
        return error_response(f"Invalid module bucket '{module_name}'.", status_code=400)

    db = get_db()
    scope_key = _resolve_scope_key()
    now_iso = datetime.now(timezone.utc).isoformat()

    ws = _load_or_init_workspace(db, arch_id, scope_key)
    records_map = ws.get("records", create_empty_record_buckets())
    bucket_list = records_map.get(module_name, [])

    new_list = [item for item in bucket_list if str(item.get("id")) != str(record_id)]
    if len(new_list) == len(bucket_list):
        return error_response(
            f"Record '{record_id}' not found in '{module_name}'.", status_code=404
        )

    records_map[module_name] = new_list
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records_map, "updated_at": now_iso}},
    )
    return success_response(message=f"Record '{record_id}' deleted from '{module_name}'.")

