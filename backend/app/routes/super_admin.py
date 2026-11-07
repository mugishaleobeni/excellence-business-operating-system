from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.database import get_db, serialize_doc
from app.schemas.admin_schemas import (
    BroadcastSchema,
    PlatinumProgramSchema,
    PricingPlanUpdateSchema,
    SubscriptionUpdateSchema,
)
from app.seed_defaults import (
    DEFAULT_BUSINESSES,
    DEFAULT_PLATINUM_PROGRAM,
    DEFAULT_PRICING_PLANS,
)
from app.utils.responses import error_response, success_response, validate_json

super_admin_bp = Blueprint(
    "super_admin", __name__, url_prefix="/api/v1/super-admin"
)


@super_admin_bp.route("/businesses", methods=["GET"])
@jwt_required(optional=True)
def list_businesses():
    """
    List all tenant businesses with Section 8.2 MRR separation metadata
    (Paid MRR vs Complimentary access grants).
    """
    db = get_db()
    arch_id = request.args.get("architectureId")
    billing_type = request.args.get("billingType")
    status = request.args.get("status")

    query: dict = {}
    if arch_id:
        query["architectureId"] = arch_id
    if billing_type:
        query["billingType"] = billing_type
    if status:
        query["status"] = status

    cursor = db.businesses.find(query).sort("created_at", -1)
    businesses = []
    for doc in cursor:
        clean = serialize_doc(doc)
        clean.pop("_id", None)
        businesses.append(clean)

    if not businesses and not query:
        businesses = DEFAULT_BUSINESSES

    paid_mrr_rwf = sum(
        float(b.get("mrrRWF", 0))
        for b in businesses
        if b.get("billingType") == "Paid" and b.get("status") == "Active"
    )
    complimentary_count = sum(
        1 for b in businesses if b.get("billingType") == "Complimentary"
    )
    paid_count = sum(1 for b in businesses if b.get("billingType") == "Paid")

    return success_response(
        data=businesses,
        extra={
            "meta": {
                "totalBusinesses": len(businesses),
                "paidCount": paid_count,
                "complimentaryCount": complimentary_count,
                "paidMrrRWF": paid_mrr_rwf,
            }
        },
    )


@super_admin_bp.route(
    "/businesses/<string:biz_id>/subscription", methods=["PATCH"]
)
@jwt_required(optional=True)
@validate_json(SubscriptionUpdateSchema)
def update_business_subscription(
    biz_id: str, validated_data: SubscriptionUpdateSchema
):
    """
    Update a tenant's subscription plan, status, or billingType (Paid vs Complimentary).
    Per Section 8.2, Complimentary accounts always enforce mrrRWF = 0 so platform revenue
    metrics are never artificially inflated.
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    biz_doc = db.businesses.find_one({"id": biz_id})
    if not biz_doc:
        return error_response(
            error=f"Business '{biz_id}' not found.", status_code=404
        )

    updates = validated_data.model_dump(exclude_none=True)
    billing_type = updates.get("billingType", biz_doc.get("billingType", "Paid"))

    if billing_type == "Complimentary":
        updates["mrrRWF"] = 0
        updates["grantedAt"] = now_iso

    updates["updated_at"] = now_iso
    db.businesses.update_one({"_id": biz_doc["_id"]}, {"$set": updates})
    biz_doc.update(updates)

    clean_biz = serialize_doc(biz_doc)
    clean_biz.pop("_id", None)
    return success_response(
        data=clean_biz,
        message=f"Subscription for '{biz_doc.get('name')}' updated successfully.",
    )


@super_admin_bp.route("/pricing-plans", methods=["GET"])
def get_pricing_plans():
    """Return all platform subscription pricing plans."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "pricing_plans"})
    plans = (
        serialize_doc(doc["value"])
        if doc and doc.get("value")
        else DEFAULT_PRICING_PLANS
    )
    return success_response(data=plans)


@super_admin_bp.route("/pricing-plans/<string:plan_id>", methods=["PUT"])
@jwt_required(optional=True)
@validate_json(PricingPlanUpdateSchema)
def update_pricing_plan(plan_id: str, validated_data: PricingPlanUpdateSchema):
    """Update a platform pricing tier by ID."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = db.platform_config.find_one({"key": "pricing_plans"})
    plans = (
        list(doc["value"])
        if doc and isinstance(doc.get("value"), list)
        else list(DEFAULT_PRICING_PLANS)
    )

    patch_fields = validated_data.model_dump(exclude_none=True)
    updated_plan = None
    for idx, plan in enumerate(plans):
        if str(plan.get("id")) == str(plan_id):
            plans[idx] = {**plan, **patch_fields}
            updated_plan = plans[idx]
            break

    if updated_plan is None:
        return error_response(
            error=f"Pricing plan '{plan_id}' not found.", status_code=404
        )

    db.platform_config.update_one(
        {"key": "pricing_plans"},
        {"$set": {"key": "pricing_plans", "value": plans, "updated_at": now_iso}},
        upsert=True,
    )
    return success_response(
        data=updated_plan,
        message=f"Pricing plan '{plan_id}' updated.",
    )


@super_admin_bp.route("/platinum-program", methods=["GET"])
def get_platinum_program():
    """Return the Platinum Partner Program configuration."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "platinum_program"})
    program = (
        serialize_doc(doc["value"])
        if doc and doc.get("value")
        else DEFAULT_PLATINUM_PROGRAM
    )
    return success_response(data=program)


@super_admin_bp.route("/platinum-program", methods=["PUT"])
@jwt_required(optional=True)
@validate_json(PlatinumProgramSchema)
def update_platinum_program(validated_data: PlatinumProgramSchema):
    """Update the Platinum Partner Program configuration."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = db.platform_config.find_one({"key": "platinum_program"})
    current = (
        dict(doc["value"])
        if doc and isinstance(doc.get("value"), dict)
        else dict(DEFAULT_PLATINUM_PROGRAM)
    )

    patch_fields = validated_data.model_dump(exclude_none=True)
    updated = {**current, **patch_fields, "updatedAt": now_iso}

    db.platform_config.update_one(
        {"key": "platinum_program"},
        {"$set": {"key": "platinum_program", "value": updated, "updated_at": now_iso}},
        upsert=True,
    )
    return success_response(
        data=updated,
        message="Platinum Partner Program updated.",
    )


@super_admin_bp.route("/broadcast", methods=["GET"])
def get_broadcast():
    """Return the active Super Admin global broadcast banner."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "super_admin_broadcast"})
    broadcast = serialize_doc(doc["value"]) if doc else None
    return success_response(data=broadcast)


@super_admin_bp.route("/broadcast", methods=["POST"])
@jwt_required(optional=True)
@validate_json(BroadcastSchema)
def publish_broadcast(validated_data: BroadcastSchema):
    """Publish or clear a global/architecture-specific Super Admin broadcast."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    if not validated_data.active:
        db.platform_config.update_one(
            {"key": "super_admin_broadcast"},
            {
                "$set": {
                    "key": "super_admin_broadcast",
                    "value": None,
                    "updated_at": now_iso,
                }
            },
            upsert=True,
        )
        return success_response(data=None, message="Global broadcast cleared.")

    payload = {
        **validated_data.model_dump(),
        "id": f"BC-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "sentAt": now_iso,
    }
    db.platform_config.update_one(
        {"key": "super_admin_broadcast"},
        {
            "$set": {
                "key": "super_admin_broadcast",
                "value": payload,
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )
    return success_response(
        data=payload,
        message="Global broadcast published.",
        status_code=201,
    )

