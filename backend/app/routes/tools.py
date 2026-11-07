from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.database import get_db, serialize_doc
from app.schemas.admin_schemas import (
    ExportRecordSchema,
    FinancialAnalysisSchema,
    IntegrationToggleSchema,
)
from app.seed_defaults import DEFAULT_INTEGRATIONS
from app.utils.responses import error_response, success_response, validate_json

tools_bp = Blueprint("tools", __name__, url_prefix="/api/v1/tools")


@tools_bp.route("/analyses", methods=["GET"])
@jwt_required(optional=True)
def list_financial_analyses():
    """Return saved financial calculator scenario analyses."""
    db = get_db()
    arch_id = request.args.get("architectureId")
    doc = db.platform_config.find_one({"key": "saved_analyses"})
    analyses = (
        list(serialize_doc(doc["value"]))
        if doc and isinstance(doc.get("value"), list)
        else []
    )
    if arch_id:
        analyses = [a for a in analyses if a.get("architectureId") == arch_id]
    return success_response(data=analyses)


@tools_bp.route("/analyses", methods=["POST"])
@jwt_required(optional=True)
@validate_json(FinancialAnalysisSchema)
def save_financial_analysis(validated_data: FinancialAnalysisSchema):
    """Save a new financial calculator scenario analysis."""
    db = get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_ms = int(now.timestamp() * 1000)

    doc = db.platform_config.find_one({"key": "saved_analyses"})
    analyses = (
        list(doc["value"])
        if doc and isinstance(doc.get("value"), list)
        else []
    )

    entry = {
        **validated_data.model_dump(),
        "id": f"FIN-{now_ms}",
        "savedAt": now_iso,
    }
    analyses.insert(0, entry)

    db.platform_config.update_one(
        {"key": "saved_analyses"},
        {"$set": {"key": "saved_analyses", "value": analyses, "updated_at": now_iso}},
        upsert=True,
    )
    return success_response(
        data=entry,
        message="Financial scenario analysis saved.",
        status_code=201,
    )


@tools_bp.route("/integrations", methods=["GET"])
@jwt_required(optional=True)
def get_integrations():
    """Return external integration statuses (Gmail, Google Drive, WhatsApp)."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "integrations"})
    integrations = (
        serialize_doc(doc["value"])
        if doc and isinstance(doc.get("value"), dict)
        else DEFAULT_INTEGRATIONS
    )
    return success_response(data=integrations)


@tools_bp.route("/integrations/<string:provider>", methods=["PATCH"])
@jwt_required(optional=True)
@validate_json(IntegrationToggleSchema)
def update_integration(provider: str, validated_data: IntegrationToggleSchema):
    """Toggle or configure an external integration provider."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = db.platform_config.find_one({"key": "integrations"})
    integrations = (
        dict(doc["value"])
        if doc and isinstance(doc.get("value"), dict)
        else dict(DEFAULT_INTEGRATIONS)
    )

    if provider not in integrations:
        return error_response(
            error=f"Unknown integration provider '{provider}'. Valid providers: {list(DEFAULT_INTEGRATIONS.keys())}",
            status_code=404,
        )

    current_provider = dict(integrations[provider])
    patch_fields = validated_data.model_dump(exclude_none=True)
    if "connected" not in patch_fields:
        patch_fields["connected"] = not current_provider.get("connected", False)
    if patch_fields.get("connected"):
        patch_fields["lastSyncAt"] = now_iso

    updated_provider = {**current_provider, **patch_fields}
    integrations[provider] = updated_provider

    db.platform_config.update_one(
        {"key": "integrations"},
        {
            "$set": {
                "key": "integrations",
                "value": integrations,
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )
    return success_response(
        data=updated_provider,
        message=f"Integration '{provider}' updated.",
    )


@tools_bp.route("/exports", methods=["GET"])
@jwt_required(optional=True)
def list_exports():
    """Return document/report export history."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "export_history"})
    exports = (
        list(serialize_doc(doc["value"]))
        if doc and isinstance(doc.get("value"), list)
        else []
    )
    return success_response(data=exports)


@tools_bp.route("/exports", methods=["POST"])
@jwt_required(optional=True)
@validate_json(ExportRecordSchema)
def create_export_record(validated_data: ExportRecordSchema):
    """Record a new CSV/PDF document export event."""
    db = get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_ms = int(now.timestamp() * 1000)

    doc = db.platform_config.find_one({"key": "export_history"})
    exports = (
        list(doc["value"])
        if doc and isinstance(doc.get("value"), list)
        else []
    )

    entry = {
        **validated_data.model_dump(),
        "id": f"EXP-{now_ms}",
        "exportedAt": now_iso,
    }
    exports.insert(0, entry)

    db.platform_config.update_one(
        {"key": "export_history"},
        {"$set": {"key": "export_history", "value": exports[:100], "updated_at": now_iso}},
        upsert=True,
    )
    return success_response(
        data=entry,
        message="Export record logged.",
        status_code=201,
    )

