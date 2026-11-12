import logging
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)
from app.database import get_db, serialize_doc
from app.schemas.auth_schemas import (
    ForgotPasswordSchema,
    LoginSchema,
    RegisterBusinessSchema,
    ResetPasswordSchema,
    SendVerificationSchema,
    UpdateProfileSchema,
    VerifyEmailCodeSchema,
)
from app.seed_defaults import (
    ARCHITECTURE_IDS,
    create_empty_record_buckets,
    create_zero_metrics,
    get_default_workspaces,
)
from app.utils.mailer import send_gmail_email
from app.utils.responses import error_response, success_response, validate_json
from app.utils.security import generate_numeric_code, hash_password, verify_password

logger = logging.getLogger("app.persistence")
auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


def _safe_jwt_email() -> str | None:
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        return ident.lower() if isinstance(ident, str) and ident else None
    except Exception:
        return None


def _strip_sensitive_user_fields(user_doc: dict) -> dict:
    clean = serialize_doc(user_doc)
    clean.pop("password_hash", None)
    return clean


def _load_user_workspaces(db, scope_key: str) -> dict[str, dict]:
    workspaces_map = get_default_workspaces()
    cursor = db.workspaces.find({"scopeKey": scope_key})
    for ws_doc in cursor:
        clean_ws = serialize_doc(ws_doc)
        arch_id = clean_ws.get("architectureId")
        clean_ws.pop("_id", None)
        clean_ws.pop("scopeKey", None)
        if arch_id in ARCHITECTURE_IDS:
            workspaces_map[arch_id] = {**workspaces_map.get(arch_id, {}), **clean_ws}
    return workspaces_map


@auth_bp.route("/send-verification", methods=["POST"])
@validate_json(SendVerificationSchema)
def send_email_verification(validated_data: SendVerificationSchema):
    """
    Step 1 -> Step 2 of Registration:
    Checks that the email is not already registered, generates a 6-digit OTP code,
    stores it in MongoDB with a 15-minute expiration, and sends it via Gmail SMTP.
    """
    db = get_db()
    email_lower = validated_data.email.lower()
    now = datetime.now(timezone.utc)

    existing_user = db.users.find_one({"email": email_lower})
    if existing_user:
        return error_response(
            error="An account with this email address is already registered. Please sign in instead.",
            status_code=409,
        )

    code = generate_numeric_code(6)
    db.password_resets.insert_one(
        {
            "email": email_lower,
            "code": code,
            "purpose": "email_verification",
            "created_at": now,
            "expires_at": now + timedelta(minutes=15),
            "used": False,
        }
    )

    email_sent = send_gmail_email(
        to_email=email_lower,
        subject="ExBOS Account Verification Code",
        text_body=(
            f"Hello {validated_data.fullName},\n\n"
            f"Your ExBOS 6-digit verification code is: {code}\n\n"
            f"This code expires in 15 minutes."
        ),
        html_body=(
            f"<div style='font-family:sans-serif;padding:24px;background:#03091F;color:#ffffff;border-radius:12px;'>"
            f"<h2 style='color:#218DFF;margin-top:0;'>Welcome to EXCELLENCE BOS</h2>"
            f"<p>Hello <strong>{validated_data.fullName}</strong>, enter the 6-digit code below to verify your email address:</p>"
            f"<div style='font-size:28px;font-weight:bold;letter-spacing:6px;padding:14px 20px;"
            f"background:#071544;border:1px solid #218DFF;border-radius:8px;display:inline-block;'>{code}</div>"
            f"<p style='color:#94a3b8;font-size:12px;margin-top:16px;'>Valid for 15 minutes.</p>"
            f"</div>"
        ),
    )

    return success_response(
        data={
            "email": email_lower,
            "emailSent": email_sent,
            "verificationCode": code,
            "expiresInMinutes": 15,
        },
        message=f"6-digit verification code sent to {email_lower}.",
        status_code=200,
    )


@auth_bp.route("/verify-email", methods=["POST"])
@validate_json(VerifyEmailCodeSchema)
def verify_email_code(validated_data: VerifyEmailCodeSchema):
    """
    Step 2 of Registration:
    Verifies the 6-digit OTP code entered by the user against MongoDB.
    """
    db = get_db()
    email_lower = validated_data.email.lower()
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = db.password_resets.find_one(
        {
            "email": email_lower,
            "code": validated_data.code,
            "purpose": "email_verification",
            "used": False,
        }
    )
    if not doc:
        return error_response(
            error="Invalid or expired 6-digit verification code. Please check your email or request a new code.",
            status_code=400,
        )

    db.password_resets.update_one(
        {"_id": doc["_id"]},
        {"$set": {"used": True, "used_at": now_iso}},
    )

    return success_response(
        data={"email": email_lower, "verified": True},
        message="Email address verified successfully.",
        status_code=200,
    )


@auth_bp.route("/register", methods=["POST"])
@validate_json(RegisterBusinessSchema)
def register_business(validated_data: RegisterBusinessSchema):
    """
    Complete the 7-step business registration flow.
    Creates records in `users`, `businesses`, and initializes isolated `workspaces` in MongoDB Atlas.
    """
    db = get_db()
    email_lower = validated_data.email.lower()
    now_iso = datetime.now(timezone.utc).isoformat()
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    existing_user = db.users.find_one({"email": email_lower})
    if existing_user:
        return error_response(
            error="An account with this email address already exists. Please sign in.",
            status_code=409,
        )

    user_id = f"USR-{now_ms}"
    biz_id = f"BIZ-{now_ms}"

    plan_mrr_map = {
        "Free": 0,
        "Bronze": 10000,
        "Starter Plan": 15000,
        "Silver": 25000,
        "Growth Plan": 35000,
        "Gold": 50000,
        "Hybrid & Scale": 75000,
    }
    mrr_rwf = plan_mrr_map.get(validated_data.planTier, 35000)
    billing_type = "Complimentary" if mrr_rwf == 0 else "Paid"

    start_spendable = float(
        validated_data.startingSpendableRWF
        if validated_data.startingSpendableRWF
        else (validated_data.demoSpendableRWF or 0)
    )
    start_rev = float(
        validated_data.startingMonthlyRevenueRWF
        if validated_data.startingMonthlyRevenueRWF
        else (validated_data.demoMonthlyRevenueRWF or 0)
    )
    start_profit = round(start_rev * 0.35) if start_rev > 0 else 0
    first_item = (
        validated_data.primaryItem
        or validated_data.demoPrimaryItem
        or ""
    ).strip()

    enabled_activities = (
        validated_data.enabledActivities
        if validated_data.enabledActivities
        else [validated_data.architectureId]
    )

    user_doc = {
        "id": user_id,
        "name": validated_data.fullName,
        "email": email_lower,
        "phone": validated_data.phone,
        "password_hash": hash_password(validated_data.password),
        "role": "BUSINESS_OWNER",
        "businessId": biz_id,
        "businessName": validated_data.businessName,
        "businessCategory": validated_data.businessCategory or "Operations",
        "architectureId": validated_data.architectureId,
        "country": validated_data.country,
        "location": validated_data.location,
        "currency": validated_data.currency,
        "language": validated_data.language,
        "plan": validated_data.planTier,
        "planTier": validated_data.planTier,
        "billingType": billing_type,
        "enabledActivities": enabled_activities,
        "verified": True,
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
        "architecture": validated_data.architectureId,
        "architectureId": validated_data.architectureId,
        "plan": validated_data.planTier,
        "billingType": billing_type,
        "mrrRWF": mrr_rwf,
        "monthlySpendRWF": mrr_rwf,
        "status": "Active",
        "branches": 1,
        "location": f"{validated_data.country}, {validated_data.location}".strip(", "),
        "joinedAt": now_iso[:10],
        "expiryDate": "2027-11-07",
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    db.businesses.delete_many({"email": email_lower})
    db.businesses.insert_one(biz_doc)

    # Initialize ONLY the registered architecture workspace for this user's scopeKey
    default_workspaces = get_default_workspaces()
    arch_id = validated_data.architectureId
    base_ws = default_workspaces.get(arch_id, {})
    records = create_empty_record_buckets()
    if first_item:
        records["Inventory"] = [
            {
                "id": f"INV-{now_ms}",
                "title": first_item,
                "subPage": "Opening Inventory",
                "unitCostRWF": 0,
                "sellingPriceRWF": 0,
                "quantity": 1,
                "amountRWF": 0,
                "date": now_iso[:10],
                "status": "In Stock",
            }
        ]

    metrics = create_zero_metrics()
    metrics["spendableRWF"] = start_spendable
    metrics["monthlyRevenueRWF"] = start_rev
    metrics["netProfitRWF"] = start_profit

    ws_doc = {
        **base_ws,
        "scopeKey": email_lower,
        "architectureId": arch_id,
        "ownerName": validated_data.fullName,
        "businessName": validated_data.businessName,
        "email": email_lower,
        "phone": validated_data.phone,
        "location": validated_data.location,
        "category": validated_data.businessCategory or base_ws.get("category", ""),
        "spendableRWF": metrics["spendableRWF"],
        "monthlyRevenueRWF": metrics["monthlyRevenueRWF"],
        "netProfitRWF": metrics["netProfitRWF"],
        "primaryItem": first_item,
        "enabledActivities": enabled_activities,
        "metrics": metrics,
        "records": records,
        "updated_at": now_iso,
    }
    db.workspaces.delete_many(
        {"scopeKey": email_lower, "architectureId": {"$ne": arch_id}}
    )
    db.workspaces.update_one(
        {"scopeKey": email_lower, "architectureId": arch_id},
        {"$set": ws_doc},
        upsert=True,
    )

    clean_user = _strip_sensitive_user_fields(user_doc)
    db.platform_config.update_one(
        {"key": "active_user_snapshot"},
        {"$set": {"key": "active_user_snapshot", "value": clean_user, "updated_at": now_iso}},
        upsert=True,
    )

    logger.info(
        "Registered business '%s' (%s) for user %s | architectureId=%s | enabledActivities=%s",
        validated_data.businessName,
        biz_id,
        email_lower,
        arch_id,
        enabled_activities,
    )

    access_token = create_access_token(identity=email_lower)
    refresh_token = create_refresh_token(identity=email_lower)
    user_workspaces = _load_user_workspaces(db, email_lower)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": clean_user,
            "business": serialize_doc(biz_doc),
            "workspaces": user_workspaces,
        },
        message="Business registered and workspace initialized in MongoDB Atlas.",
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
@validate_json(LoginSchema)
def login_user(validated_data: LoginSchema):
    """
    Authenticate a registered user strictly against `db.users` and verify their bcrypt password hash.
    Returns 401 Unauthorized if the email does not exist or password does not match.
    """
    db = get_db()
    email_lower = validated_data.email.lower()
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = db.users.find_one({"email": email_lower})
    if not user_doc:
        return error_response(
            error="No registered account found for this email address. Please register your business first.",
            status_code=401,
        )

    stored_hash = user_doc.get("password_hash", "")
    if not verify_password(validated_data.password, stored_hash):
        return error_response(
            error="Invalid email or password. Please check your credentials and try again.",
            status_code=401,
        )

    updates = {"updated_at": now_iso}
    user_arch = user_doc.get("architectureId") or "buy-and-sell"
    if user_arch != "hybrid" and user_doc.get("enabledActivities") == ["buy-and-sell", "services"]:
        updates["enabledActivities"] = [user_arch]
        db.workspaces.update_many(
            {"scopeKey": email_lower},
            {"$set": {"enabledActivities": [user_arch]}},
        )
    db.users.update_one({"_id": user_doc["_id"]}, {"$set": updates})
    user_doc.update(updates)

    clean_user = _strip_sensitive_user_fields(user_doc)
    db.platform_config.update_one(
        {"key": "active_user_snapshot"},
        {"$set": {"key": "active_user_snapshot", "value": clean_user, "updated_at": now_iso}},
        upsert=True,
    )

    logger.info(
        "User signed in: %s | architectureId=%s | enabledActivities=%s",
        email_lower,
        user_doc.get("architectureId"),
        user_doc.get("enabledActivities"),
    )

    access_token = create_access_token(identity=email_lower)
    refresh_token = create_refresh_token(identity=email_lower)
    user_workspaces = _load_user_workspaces(db, email_lower)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": clean_user,
            "workspaces": user_workspaces,
        },
        message="Signed in successfully.",
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
def get_current_user():
    """Return the currently authenticated user profile."""
    db = get_db()
    identity = _safe_jwt_email()

    if identity:
        user_doc = db.users.find_one({"email": identity})
        if user_doc:
            return success_response(data={"user": _strip_sensitive_user_fields(user_doc)})

    return success_response(data={"user": None})


@auth_bp.route("/me", methods=["PATCH"])
@validate_json(UpdateProfileSchema)
def update_current_user(validated_data: UpdateProfileSchema):
    """Update the current user's profile and active business settings."""
    db = get_db()
    identity = _safe_jwt_email()
    now_iso = datetime.now(timezone.utc).isoformat()

    update_fields = validated_data.model_dump(exclude_none=True)
    update_fields["updated_at"] = now_iso

    user_doc = None
    if identity:
        user_doc = db.users.find_one({"email": identity})
    if not user_doc and update_fields.get("email"):
        user_doc = db.users.find_one({"email": update_fields["email"].lower()})
    if not user_doc:
        active_snap = db.platform_config.find_one({"key": "active_user_snapshot"})
        if active_snap and isinstance(active_snap.get("value"), dict):
            snap_email = (active_snap["value"].get("email") or "").lower()
            if snap_email:
                user_doc = db.users.find_one({"email": snap_email})

    if not user_doc:
        return error_response("Authenticated user account not found.", status_code=404)

    db.users.update_one({"_id": user_doc["_id"]}, {"$set": update_fields})
    user_doc.update(update_fields)
    clean_user = _strip_sensitive_user_fields(user_doc)

    db.platform_config.update_one(
        {"key": "active_user_snapshot"},
        {"$set": {"key": "active_user_snapshot", "value": clean_user, "updated_at": now_iso}},
        upsert=True,
    )

    logger.info("Updated user profile for %s", user_doc.get("email"))
    return success_response(
        data={"user": clean_user},
        message="User profile updated successfully.",
    )


@auth_bp.route("/forgot-password", methods=["POST"])
@validate_json(ForgotPasswordSchema)
def forgot_password(validated_data: ForgotPasswordSchema):
    """Generate a 6-digit password reset code, verify user exists, and send via Gmail SMTP."""
    db = get_db()
    email_lower = validated_data.email.lower()
    user_doc = db.users.find_one({"email": email_lower})
    if not user_doc:
        return error_response(
            error="No registered account found with that email address.",
            status_code=404,
        )

    code = generate_numeric_code(6)
    now = datetime.now(timezone.utc)

    db.password_resets.insert_one(
        {
            "email": email_lower,
            "code": code,
            "purpose": "password_reset",
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
        message="Password reset verification code sent to your email.",
    )


@auth_bp.route("/reset-password", methods=["POST"])
@validate_json(ResetPasswordSchema)
def reset_password(validated_data: ResetPasswordSchema):
    """Verify the 6-digit OTP code and update the user's password hash in MongoDB."""
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
        message="Password has been updated in MongoDB Atlas. You may now sign in."
    )


@auth_bp.route("/delete-account", methods=["DELETE", "POST"])
def delete_account():
    """Permanently delete user account and all workspace data."""
    db = get_db()
    identity = _safe_jwt_email()

    body = request.get_json(silent=True) or {} if request.is_json else {}
    req_email = body.get("email")
    confirmation = str(body.get("confirmation") or body.get("confirm") or "").strip()

    target_email = (identity or req_email or "").strip().lower()
    if not target_email:
        active_snap = db.platform_config.find_one({"key": "active_user_snapshot"})
        if active_snap and isinstance(active_snap.get("value"), dict):
            # Only use snapshot if explicit confirmation string is passed
            if confirmation.upper() == "DELETE":
                target_email = (active_snap["value"].get("email") or "").strip().lower()

    if not target_email:
        return error_response(
            "No authenticated user account found to delete.",
            status_code=401,
        )

    # If unauthenticated, require exact uppercase confirmation "DELETE"
    if not identity and confirmation.upper() != "DELETE":
        return error_response(
            "Confirmation 'DELETE' is required to delete an account.",
            status_code=400,
        )

    # 1. Delete user doc
    db.users.delete_many({"email": target_email})
    # 2. Delete businesses
    db.businesses.delete_many({"email": target_email})
    # 3. Delete workspaces
    db.workspaces.delete_many({"$or": [{"email": target_email}, {"scopeKey": target_email}]})
    # 4. Delete transactions
    db.transactions.delete_many({"$or": [{"email": target_email}, {"scopeKey": target_email}]})
    # 5. Delete module records
    db.module_records.delete_many({"$or": [{"email": target_email}, {"scopeKey": target_email}]})
    # 6. Delete password resets
    db.password_resets.delete_many({"email": target_email})
    # 7. Clear active user snapshot if it matched this user
    active_snap = db.platform_config.find_one({"key": "active_user_snapshot"})
    if active_snap and isinstance(active_snap.get("value"), dict):
        if (active_snap["value"].get("email") or "").strip().lower() == target_email:
            db.platform_config.delete_many({"key": "active_user_snapshot"})

    logger.info("Successfully deleted user account and scoped data for %s", target_email)
    resp, code = success_response(
        message=f"Account '{target_email}' and all business ledgers have been permanently deleted."
    )
    resp.delete_cookie("token")
    resp.delete_cookie("auth_token")
    resp.delete_cookie("session")
    return resp, code

