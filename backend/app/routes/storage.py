import logging
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.database import get_db, serialize_doc
from app.routes.workspaces import _sync_bucket_to_module_records
from app.schemas.workspace_schemas import StorageSnapshotSchema
from app.seed_defaults import (
    DEFAULT_INTEGRATIONS,
    DEFAULT_PLATINUM_PROGRAM,
    DEFAULT_PRICING_PLANS,
    MODULE_RECORD_BUCKETS,
    create_empty_record_buckets,
    get_default_workspaces,
)
from app.utils.responses import validate_json

logger = logging.getLogger("app.persistence")
storage_bp = Blueprint("storage", __name__, url_prefix="/api/storage")


def _resolve_scope_key(db, fallback_user: dict | None = None) -> str:
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

    if isinstance(fallback_user, dict):
        u_email = (fallback_user.get("email") or "").strip().lower()
        if u_email:
            return u_email

    snap = db.platform_config.find_one({"key": "active_user_snapshot"})
    if snap and isinstance(snap.get("value"), dict):
        snap_email = (snap["value"].get("email") or "").strip().lower()
        if snap_email:
            return snap_email

    latest_user = db.users.find_one({}, sort=[("created_at", -1)])
    if latest_user and latest_user.get("email"):
        return str(latest_user["email"]).strip().lower()

    return "default"


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
    scope_key = _resolve_scope_key(db)

    # 1. Assemble all 6 architecture workspaces
    workspaces_map = get_default_workspaces()
    cursor = db.workspaces.find({"scopeKey": scope_key})
    for ws_doc in cursor:
        clean_ws = serialize_doc(ws_doc)
        arch_id = clean_ws.get("architectureId")
        clean_ws.pop("_id", None)
        clean_ws.pop("scopeKey", None)
        if arch_id:
            records_obj = clean_ws.get("records")
            if not isinstance(records_obj, dict):
                records_obj = create_empty_record_buckets()
            else:
                for b in MODULE_RECORD_BUCKETS:
                    records_obj.setdefault(b, [])
            clean_ws["records"] = records_obj
            workspaces_map[arch_id] = {**workspaces_map.get(arch_id, {}), **clean_ws}

    # 2. Load recent financial ledger transactions
    tx_query = {"scopeKey": scope_key} if scope_key != "default" else {}
    tx_cursor = db.transactions.find(tx_query).sort("timestamp", -1).limit(500)
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

    # 4. Load active user snapshot and platform configurations
    active_user = _get_config_val(db, "active_user_snapshot", None)
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
    Note: Tenant businesses (`db.businesses`) are managed exclusively by `/api/v1/auth/register`
    and `/api/v1/admin/businesses` so browser snapshots can never re-insert deleted or demo businesses.
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    scope_key = _resolve_scope_key(db, fallback_user=validated_data.user)

    if scope_key == "default":
        return jsonify({"success": True, "skipped": "no_authenticated_scope", "timestamp": now_ms}), 200

    user_arch = None
    if isinstance(validated_data.user, dict):
        user_arch = validated_data.user.get("architectureId")
    if not user_arch:
        u_doc = db.users.find_one({"email": scope_key})
        if u_doc:
            user_arch = u_doc.get("architectureId")

    # 1. Persist workspaces (only for the user's active architecture or workspaces with records)
    if validated_data.workspaces and isinstance(validated_data.workspaces, dict):
        for arch_id, ws_data in validated_data.workspaces.items():
            if not isinstance(ws_data, dict):
                continue
            existing_ws = db.workspaces.find_one(
                {"scopeKey": scope_key, "architectureId": arch_id}
            )
            incoming_records = ws_data.get("records")
            has_any_records = isinstance(incoming_records, dict) and any(
                isinstance(v, list) and len(v) > 0 for v in incoming_records.values()
            )
            if arch_id != user_arch and not existing_ws and not has_any_records:
                continue

            if isinstance(incoming_records, dict) and existing_ws:
                existing_records = existing_ws.get("records") or {}
                merged_records = dict(existing_records)
                for bucket_name, bucket_items in incoming_records.items():
                    if not isinstance(bucket_items, list):
                        continue
                    if len(bucket_items) > 0 or len(existing_records.get(bucket_name) or []) == 0:
                        merged_records[bucket_name] = bucket_items
                        if len(bucket_items) > 0:
                            _sync_bucket_to_module_records(
                                db, scope_key, arch_id, bucket_name, bucket_items, now_iso
                            )
                ws_data = {**ws_data, "records": merged_records}
            elif isinstance(incoming_records, dict):
                for bucket_name, bucket_items in incoming_records.items():
                    if isinstance(bucket_items, list) and len(bucket_items) > 0:
                        _sync_bucket_to_module_records(
                            db, scope_key, arch_id, bucket_name, bucket_items, now_iso
                        )

            # Ensure enabledActivities matches the user's architecture unless hybrid
            if arch_id != "hybrid" and ws_data.get("enabledActivities") == ["buy-and-sell", "services"]:
                ws_data["enabledActivities"] = [arch_id]

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

    # 2. Persist non-demo transactions
    if validated_data.transactions is not None:
        for tx in validated_data.transactions:
            if not isinstance(tx, dict):
                continue
            created_by = str(tx.get("createdBy") or "")
            tx_id = str(tx.get("id") or f"TX-{now_ms}")
            if "demo" in created_by.lower() or tx_id in {
                "TX-2148",
                "TX-3823",
                "TX-9004",
                "TX-9003",
                "TX-9002",
                "TX-9001",
            }:
                continue
            tx_payload = {
                **tx,
                "id": tx_id,
                "scopeKey": scope_key,
                "updated_at": now_iso,
            }
            tx_payload.pop("_id", None)
            db.transactions.update_one(
                {"id": tx_id},
                {"$set": tx_payload},
                upsert=True,
            )

    # 3. Persist user snapshot & platform configs (NEVER upsert db.businesses from client localStorage)
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
    Reset the user's architecture workspace and ledger transactions to a clean zero-base state.
    Matches ExbosContext.jsx resetWorkspaceData().
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    scope_key = _resolve_scope_key(db)

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

    tx_filter = {"scopeKey": scope_key} if scope_key != "default" else {}
    db.transactions.delete_many(tx_filter)
    db.module_records.delete_many({"scopeKey": scope_key})
    db.businesses.delete_many({"id": {"$in": ["BIZ-1001", "BIZ-1002", "BIZ-1003"]}})
    _set_config_val(db, "saved_analyses", [], now_iso)
    _set_config_val(db, "export_history", [], now_iso)
    _set_config_val(db, "super_admin_broadcast", None, now_iso)

    return jsonify({"success": True, "reset": True}), 200

