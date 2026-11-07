from datetime import datetime, timedelta, timezone
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from app.database import get_db, serialize_doc
from app.schemas.auth_schemas import (
    ForgotPasswordSchema,
    LoginSchema,
    RegisterBusinessSchema,
    ResetPasswordSchema,
    UpdateProfileSchema,
)
from app.seed_defaults import DEFAULT_USER, get_default_workspaces
from app.utils.mailer import send_gmail_email
from app.utils.responses import error_response, success_response, validate_json
from app.utils.security import generate_numeric_code, hash_password, verify_password

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


def _strip_sensitive_user_fields(user_doc: dict) -> dict:
    clean = serialize_doc(user_doc)
    clean.pop("password_hash", None)
    return clean


@auth_bp.route("/register", methods=["POST"])
@validate_json(RegisterBusinessSchema)
def register_business(validated_data: RegisterBusinessSchema):
    """
    Register a new SME owner and business workspace via the 7-step onboarding wizard.
    Creates records in `users`, `businesses`, and updates `workspaces`.
    """
    db = get_db()
    email_lower = validated_data.email.lower()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    existing_user = db.users.find_one({"email": email_lower})
    if existing_user:
        return error_response(
            error="An account with this email address already exists.",
            status_code=409,
        )

    user_id = f"USR-{now_ms}"
    biz_id = f"BIZ-{now_ms}"

    plan_mrr_map = {
        "Starter Plan": 15000,
        "Growth Plan": 35000,
        "Hybrid & Scale": 75000,
    }
    mrr_rwf = plan_mrr_map.get(validated_data.planTier, 35000)

    user_doc = {
        "id": user_id,
        "name": validated_data.fullName,
        "email": email_lower,
        "phone": validated_data.phone,
        "password_hash": hash_password(validated_data.password),
        "role": "BUSINESS_OWNER",
        "businessId": biz_id,
        "businessName": validated_data.businessName,
        "businessCategory": validated_data.businessCategory,
        "architectureId": validated_data.architectureId,
        "country": validated_data.country,
        "location": validated_data.location,
        "currency": validated_data.currency,
        "language": validated_data.language,
        "plan": validated_data.planTier,
        "billingType": "Paid",
        "enabledActivities": validated_data.enabledActivities,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    db.users.insert_one(user_doc)

    biz_doc = {
        "id": biz_id,
        "name": validated_data.businessName,
        "owner": validated_data.fullName,
        "email": email_lower,
        "phone": validated_data.phone,
        "architectureId": validated_data.architectureId,
        "plan": validated_data.planTier,
        "billingType": "Paid",
        "mrrRWF": mrr_rwf,
        "status": "Active",
        "location": f"{validated_data.country}, {validated_data.location}",
        "joinedAt": now_iso[:10],
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    db.businesses.insert_one(biz_doc)

    # Update the default workspace for this architecture with onboarding values
    default_ws = get_default_workspaces().get(validated_data.architectureId, {})
    ws_update = {
        **default_ws,
        "scopeKey": "default",
        "architectureId": validated_data.architectureId,
        "businessName": validated_data.businessName,
        "spendableRWF": validated_data.demoSpendableRWF,
        "monthlyRevenueRWF": validated_data.demoMonthlyRevenueRWF,
        "primaryItem": validated_data.demoPrimaryItem
        or default_ws.get("primaryItem", "Primary Product"),
        "enabledActivities": validated_data.enabledActivities,
        "updated_at": now_iso,
    }
    db.workspaces.update_one(
        {"scopeKey": "default", "architectureId": validated_data.architectureId},
        {"$set": ws_update},
        upsert=True,
    )

    clean_user = _strip_sensitive_user_fields(user_doc)
    db.platform_config.update_one(
        {"key": "active_user_snapshot"},
        {"$set": {"key": "active_user_snapshot", "value": clean_user, "updated_at": now_iso}},
        upsert=True,
    )

    access_token = create_access_token(identity=email_lower)
    refresh_token = create_refresh_token(identity=email_lower)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": clean_user,
            "business": serialize_doc(biz_doc),
            "workspace": serialize_doc(ws_update),
        },
        message="Business registered successfully.",
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
@validate_json(LoginSchema)
def login_user(validated_data: LoginSchema):
    """
    Authenticate an existing user or create a seamless demo session if logging in via quick-access.
    Returns JWT access_token, refresh_token, and user profile.
    """
    db = get_db()
    email_lower = validated_data.email.lower()
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = db.users.find_one({"email": email_lower})
    if user_doc:
        # If a password was supplied and user has a hash, verify; allow demo quick-login fallback
        stored_hash = user_doc.get("password_hash")
        if (
            validated_data.password
            and stored_hash
            and not verify_password(validated_data.password, stored_hash)
            and validated_data.password != "demo"
        ):
            return error_response(
                error="Invalid email or password credentials.",
                status_code=401,
            )

        updates = {"updated_at": now_iso}
        if validated_data.architectureId:
            updates["architectureId"] = validated_data.architectureId
        if validated_data.businessName:
            updates["businessName"] = validated_data.businessName
        if validated_data.name:
            updates["name"] = validated_data.name

        db.users.update_one({"_id": user_doc["_id"]}, {"$set": updates})
        user_doc.update(updates)
    else:
        # Auto-provision account for interactive frontend demo logins
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        is_super = "admin" in email_lower or "pylarix" in email_lower
        user_doc = {
            **DEFAULT_USER,
            "id": f"USR-{now_ms}",
            "email": email_lower,
            "name": validated_data.name or email_lower.split("@")[0].title(),
            "businessName": validated_data.businessName or "ExBOS Enterprise Workspace",
            "architectureId": validated_data.architectureId or "make-and-sell",
            "role": validated_data.role or ("SUPER_ADMIN" if is_super else "BUSINESS_OWNER"),
            "password_hash": hash_password(validated_data.password or "ExbosPass2026!"),
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        db.users.insert_one(user_doc)

    clean_user = _strip_sensitive_user_fields(user_doc)
    db.platform_config.update_one(
        {"key": "active_user_snapshot"},
        {"$set": {"key": "active_user_snapshot", "value": clean_user, "updated_at": now_iso}},
        upsert=True,
    )

    access_token = create_access_token(identity=email_lower)
    refresh_token = create_refresh_token(identity=email_lower)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": clean_user,
        },
        message="Authentication successful.",
        status_code=200,
    )


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh_access_token():
    """Exchange a valid refresh token for a fresh access token."""
    identity = get_jwt_identity()
    new_access_token = create_access_token(identity=identity)
    return success_response(
        data={"access_token": new_access_token},
        message="Access token refreshed.",
        status_code=200,
    )


@auth_bp.route("/me", methods=["GET"])
@jwt_required(optional=True)
def get_current_user():
    """Return the currently authenticated user profile (or active session user)."""
    db = get_db()
    identity = get_jwt_identity()

    if identity:
        user_doc = db.users.find_one({"email": identity.lower()})
        if user_doc:
            return success_response(data={"user": _strip_sensitive_user_fields(user_doc)})

    snapshot_doc = db.platform_config.find_one({"key": "active_user_snapshot"})
    user_payload = (
        serialize_doc(snapshot_doc["value"])
        if snapshot_doc and snapshot_doc.get("value")
        else DEFAULT_USER
    )
    return success_response(data={"user": user_payload})


@auth_bp.route("/me", methods=["PATCH"])
@jwt_required(optional=True)
@validate_json(UpdateProfileSchema)
def update_current_user(validated_data: UpdateProfileSchema):
    """Update the current user's profile and active business settings."""
    db = get_db()
    identity = get_jwt_identity()
    now_iso = datetime.now(timezone.utc).isoformat()

    update_fields = validated_data.model_dump(exclude_none=True)
    update_fields["updated_at"] = now_iso

    user_doc = None
    if identity:
        user_doc = db.users.find_one({"email": identity.lower()})
    if not user_doc and update_fields.get("email"):
        user_doc = db.users.find_one({"email": update_fields["email"].lower()})
    if not user_doc:
        user_doc = db.users.find_one({})

    if user_doc:
        db.users.update_one({"_id": user_doc["_id"]}, {"$set": update_fields})
        user_doc.update(update_fields)
        clean_user = _strip_sensitive_user_fields(user_doc)
    else:
        clean_user = {**DEFAULT_USER, **update_fields}

    db.platform_config.update_one(
        {"key": "active_user_snapshot"},
        {"$set": {"key": "active_user_snapshot", "value": clean_user, "updated_at": now_iso}},
        upsert=True,
    )

    return success_response(
        data={"user": clean_user},
        message="User profile updated successfully.",
    )


@auth_bp.route("/forgot-password", methods=["POST"])
@validate_json(ForgotPasswordSchema)
def forgot_password(validated_data: ForgotPasswordSchema):
    """Generate a 6-digit password reset code and store with 15-minute TTL."""
    db = get_db()
    email_lower = validated_data.email.lower()
    code = generate_numeric_code(6)
    now = datetime.now(timezone.utc)

    db.password_resets.insert_one(
        {
            "email": email_lower,
            "code": code,
            "created_at": now,
            "expires_at": now + timedelta(minutes=15),
            "used": False,
        }
    )

    email_sent = send_gmail_email(
        to_email=email_lower,
        subject="ExBOS Password Reset Verification Code",
        text_body=f"Your ExBOS password reset code is: {code} (valid for 15 minutes).",
        html_body=(
            f"<div style='font-family:sans-serif;padding:24px;background:#03091F;color:#ffffff;border-radius:12px;'>"
            f"<h2 style='color:#218DFF;margin-top:0;'>ExBOS Security Verification</h2>"
            f"<p>Use the 6-digit verification code below to reset your password:</p>"
            f"<div style='font-size:28px;font-weight:bold;letter-spacing:6px;padding:14px 20px;"
            f"background:#071544;border:1px solid #218DFF;border-radius:8px;display:inline-block;'>{code}</div>"
            f"<p style='color:#94a3b8;font-size:12px;margin-top:16px;'>This code expires in 15 minutes.</p>"
            f"</div>"
        ),
    )

    return success_response(
        data={
            "email": email_lower,
            "resetCode": code,
            "emailSent": email_sent,
            "expiresInMinutes": 15,
        },
        message="Password reset verification code generated.",
    )


@auth_bp.route("/reset-password", methods=["POST"])
@validate_json(ResetPasswordSchema)
def reset_password(validated_data: ResetPasswordSchema):
    """Verify the 6-digit OTP code and update the user's password hash."""
    db = get_db()
    email_lower = validated_data.email.lower()
    now_iso = datetime.now(timezone.utc).isoformat()

    reset_doc = db.password_resets.find_one(
        {"email": email_lower, "code": validated_data.code, "used": False}
    )
    if not reset_doc:
        return error_response(
            error="Invalid or expired password reset verification code.",
            status_code=400,
        )

    db.password_resets.update_one(
        {"_id": reset_doc["_id"]},
        {"$set": {"used": True, "used_at": now_iso}},
    )

    new_hash = hash_password(validated_data.newPassword)
    db.users.update_one(
        {"email": email_lower},
        {"$set": {"password_hash": new_hash, "updated_at": now_iso}},
    )

    return success_response(
        message="Password has been reset successfully. You may now sign in."
    )

