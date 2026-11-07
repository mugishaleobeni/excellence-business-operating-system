from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from app.database import get_db, serialize_doc
from app.schemas.workspace_schemas import StorageSnapshotSchema
from app.seed_defaults import (
    DEFAULT_BUSINESSES,
    DEFAULT_INTEGRATIONS,
    DEFAULT_PLATINUM_PROGRAM,
    DEFAULT_PRICING_PLANS,
    DEFAULT_USER,
    get_default_workspaces,
)
from app.utils.responses import validate_json

storage_bp = Blueprint("storage", __name__, url_prefix="/api/storage")


def _get_config_val(db, key: str, default):
    doc = db.platform_config.find_one({"key": key})
    if doc and "value" in doc:
        return serialize_doc(doc["value"])
    return default


def _set_config_val(db, key: str, value, now_iso: str) -> None:
    db.platform_config.update_one(
        {"key": key},
        {"$set": {"key": key, "value": value, "updated_at": now_iso}},
        upsert=True,
    )


@storage_bp.route("", methods=["GET"])
@storage_bp.route("/", methods=["GET"])
def get_storage_snapshot():
    """
    Hydrate full application state for ExbosContext.jsx on initial load.
    Reads directly from MongoDB collections (workspaces, transactions, businesses, platform_config).
    """
    db = get_db()
    scope_key = request.args.get("scopeKey", "default")

    # 1. Assemble all 6 architecture workspaces
    workspaces_map = get_default_workspaces()
    cursor = db.workspaces.find({"scopeKey": scope_key})
    for ws_doc in cursor:
        clean_ws = serialize_doc(ws_doc)
        arch_id = clean_ws.get("architectureId")
        clean_ws.pop("_id", None)
        clean_ws.pop("scopeKey", None)
        if arch_id:
            workspaces_map[arch_id] = {**workspaces_map.get(arch_id, {}), **clean_ws}

    # 2. Load recent financial ledger transactions
    tx_cursor = db.transactions.find({}).sort("timestamp", -1).limit(500)
    transactions = []
    for tx in tx_cursor:
        clean_tx = serialize_doc(tx)
        clean_tx.pop("_id", None)
        transactions.append(clean_tx)

    # 3. Load tenant businesses
    biz_cursor = db.businesses.find({}).sort("created_at", -1)
    businesses = []
    for biz in biz_cursor:
        clean_biz = serialize_doc(biz)
        clean_biz.pop("_id", None)
        businesses.append(clean_biz)
    if not businesses:
        businesses = DEFAULT_BUSINESSES

    # 4. Load active user snapshot and platform configurations
    active_user = _get_config_val(db, "active_user_snapshot", DEFAULT_USER)
    pricing_plans = _get_config_val(db, "pricing_plans", DEFAULT_PRICING_PLANS)
    platinum_program = _get_config_val(db, "platinum_program", DEFAULT_PLATINUM_PROGRAM)
    super_admin_broadcast = _get_config_val(db, "super_admin_broadcast", None)
    saved_analyses = _get_config_val(db, "saved_analyses", [])
    integrations = _get_config_val(db, "integrations", DEFAULT_INTEGRATIONS)
    export_history = _get_config_val(db, "export_history", [])

    snapshot = {
        "workspaces": workspaces_map,
        "transactions": transactions,
        "user": active_user,
        "businesses": businesses,
        "pricingPlans": pricing_plans,
        "platinumProgram": platinum_program,
        "superAdminBroadcast": super_admin_broadcast,
        "savedAnalyses": saved_analyses,
        "integrations": integrations,
        "exportHistory": export_history,
        "savedAt": int(datetime.now(timezone.utc).timestamp() * 1000),
    }
    return jsonify(snapshot), 200


@storage_bp.route("", methods=["POST"])
@storage_bp.route("/", methods=["POST"])
@validate_json(StorageSnapshotSchema)
def save_storage_snapshot(validated_data: StorageSnapshotSchema):
    """
    Persist the debounced state snapshot from ExbosContext.jsx into MongoDB collections.
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    scope_key = request.args.get("scopeKey", "default")

    # 1. Persist workspaces
    if validated_data.workspaces and isinstance(validated_data.workspaces, dict):
        for arch_id, ws_data in validated_data.workspaces.items():
            if not isinstance(ws_data, dict):
                continue
            payload = {
                **ws_data,
                "architectureId": arch_id,
                "scopeKey": scope_key,
                "updated_at": now_iso,
            }
            payload.pop("_id", None)
            db.workspaces.update_one(
                {"scopeKey": scope_key, "architectureId": arch_id},
                {"$set": payload},
                upsert=True,
            )

    # 2. Persist transactions
    if validated_data.transactions is not None:
        for tx in validated_data.transactions:
            if not isinstance(tx, dict):
                continue
            tx_id = str(tx.get("id") or f"TX-{now_ms}")
            tx_payload = {**tx, "id": tx_id, "updated_at": now_iso}
            tx_payload.pop("_id", None)
            db.transactions.update_one(
                {"id": tx_id},
                {"$set": tx_payload},
                upsert=True,
            )

    # 3. Persist businesses
    if validated_data.businesses is not None:
        for biz in validated_data.businesses:
            if not isinstance(biz, dict):
                continue
            biz_id = str(biz.get("id") or f"BIZ-{now_ms}")
            biz_payload = {**biz, "id": biz_id, "updated_at": now_iso}
            biz_payload.pop("_id", None)
            db.businesses.update_one(
                {"id": biz_id},
                {"$set": biz_payload},
                upsert=True,
            )

    # 4. Persist user snapshot & platform configs
    if validated_data.user is not None:
        _set_config_val(db, "active_user_snapshot", validated_data.user, now_iso)
    if validated_data.pricingPlans is not None:
        _set_config_val(db, "pricing_plans", validated_data.pricingPlans, now_iso)
    if validated_data.platinumProgram is not None:
        _set_config_val(db, "platinum_program", validated_data.platinumProgram, now_iso)
    if validated_data.superAdminBroadcast is not None:
        _set_config_val(
            db, "super_admin_broadcast", validated_data.superAdminBroadcast, now_iso
        )
    if validated_data.savedAnalyses is not None:
        _set_config_val(db, "saved_analyses", validated_data.savedAnalyses, now_iso)
    if validated_data.integrations is not None:
        _set_config_val(db, "integrations", validated_data.integrations, now_iso)
    if validated_data.exportHistory is not None:
        _set_config_val(db, "export_history", validated_data.exportHistory, now_iso)

    return jsonify({"success": True, "timestamp": now_ms}), 200


@storage_bp.route("/reset", methods=["POST"])
def reset_storage_snapshot():
    """
    Reset all 6 architecture workspaces and ledger transactions to a clean zero-base state.
    Matches ExbosContext.jsx resetDemoData().
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    scope_key = request.args.get("scopeKey", "default")

    default_workspaces = get_default_workspaces()
    for arch_id, ws_payload in default_workspaces.items():
        doc = {
            **ws_payload,
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "updated_at": now_iso,
        }
        db.workspaces.update_one(
            {"scopeKey": scope_key, "architectureId": arch_id},
            {"$set": doc},
            upsert=True,
        )

    db.transactions.delete_many({})
    _set_config_val(db, "saved_analyses", [], now_iso)
    _set_config_val(db, "export_history", [], now_iso)

    return jsonify({"success": True, "reset": True}), 200

