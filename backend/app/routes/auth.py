import logging
import os
from datetime import datetime, timedelta, timezone
from urllib.parse import quote, urlparse
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
from app.utils.email_templates import render_exbos_email
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


def _resolve_frontend_origin() -> str:
    """Resolve the active frontend origin for clickable email verification links."""
    for raw in (
        (request.get_json(silent=True) or {}).get("appOrigin") if request.is_json else None,
        request.headers.get("Origin"),
        request.headers.get("Referer"),
    ):
        if not raw:
            continue
        try:
            parsed = urlparse(str(raw).strip())
            if parsed.scheme in ("http", "https") and parsed.netloc:
                host = parsed.netloc.lower()
                if (
                    host.startswith("localhost")
                    or host.startswith("127.0.0.1")
                    or host.endswith("exbos.pages.dev")
                    or host.endswith("pylarix.com")
                ):
                    return f"{parsed.scheme}://{parsed.netloc}"
        except Exception:
            pass
    return os.getenv("FRONTEND_URL", "https://exbos.pages.dev").strip().rstrip("/")


def _is_super_admin_user(user_doc: dict | None) -> bool:
    if not user_doc:
        return False
    if bool(user_doc.get("isSuperAdmin")):
        return True
    email = (user_doc.get("email") or "").strip().lower()
    if not email:
        return False
    from flask import current_app
    configured = current_app.config.get("SUPER_ADMIN_EMAILS") or ["mugishaleobeni0@gmail.com"]
    return email in {str(e).strip().lower() for e in configured}


def _strip_sensitive_user_fields(user_doc: dict) -> dict:
    from app.utils.entitlements import get_effective_plan, get_plan_limits, get_tenant_usage

    clean = serialize_doc(user_doc)
    clean.pop("password_hash", None)
    clean["isSuperAdmin"] = _is_super_admin_user(user_doc)
    clean["accountStatus"] = clean.get("accountStatus") or "Active"
    clean["billingType"] = clean.get("billingType") or "Free"
    clean["subscriptionExpiry"] = clean.get("subscriptionExpiry") or ""

    eff_plan, is_expired = get_effective_plan(user_doc)
    clean["effectivePlan"] = eff_plan.title()
    clean["planLimits"] = get_plan_limits(eff_plan)
    clean["subscriptionExpired"] = is_expired
    try:
        owner_scope = (user_doc.get("ownerScopeKey") or user_doc.get("email") or "").strip().lower()
        clean["planUsage"] = get_tenant_usage(get_db(), owner_scope)
    except Exception:
        clean["planUsage"] = {}
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
            "verified": False,
        }
    )

    frontend_origin = _resolve_frontend_origin()
    verify_link = f"{frontend_origin}/register?verifyEmail={quote(email_lower)}&code={quote(code)}"
    copy_link = f"{frontend_origin}/register?verifyEmail={quote(email_lower)}&code={quote(code)}&copy=1"

    email_sent = send_gmail_email(
        to_email=email_lower,
        subject=f"ExBOS Verification Code: {code}",
        text_body=(
            f"Hello {validated_data.fullName},\n\n"
            f"Your ExBOS 6-digit verification code is: {code}\n\n"
            f"Or click this verified link to verify and auto-fill immediately:\n"
            f"{verify_link}\n\n"
            f"This code expires in 15 minutes."
        ),
        html_body=render_exbos_email(
            category="Account Security",
            title="Verify Your Email Address",
            greeting=f"Hello <strong>{validated_data.fullName}</strong>,",
            intro_html="Thank you for registering with ExBOS. Enter the 6-digit verification code below or use the instant verification button to continue setting up your business workspace.",
            code=code,
            code_label="6-Digit Verification Code",
            primary_cta=("Verify Email Instantly", verify_link),
            secondary_cta=("Copy Code & Auto-Fill", copy_link),
            footer_note="This verification code is valid for 15 minutes. If you did not request this email, you may safely ignore it.",
            fallback_link=verify_link,
        ),
    )

    return success_response(
        data={
            "email": email_lower,
            "emailSent": email_sent,
            "expiresInMinutes": 15,
        },
        message=f"6-digit verification code and verified link sent to {email_lower}.",
        status_code=200,
    )


@auth_bp.route("/verify-email", methods=["POST"])
@validate_json(VerifyEmailCodeSchema)
def verify_email_code(validated_data: VerifyEmailCodeSchema):
    """
    Step 2 of Registration:
    Verifies the 6-digit OTP code entered by the user (or clicked via email link) against MongoDB.
    Idempotent within the 15-minute validity window so clicking the email link and submitting on the page both work.
    """
    db = get_db()
    email_lower = validated_data.email.lower()
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()

    doc = db.password_resets.find_one(
        {
            "email": email_lower,
            "code": validated_data.code,
            "purpose": "email_verification",
        },
        sort=[("created_at", -1)],
    )
    if not doc:
        return error_response(
            error="Invalid or expired 6-digit verification code. Please check your email or request a new code.",
            status_code=400,
        )

    exp = doc.get("expires_at")
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now_dt > exp:
            return error_response(
                error="This verification code has expired. Please request a new code.",
                status_code=400,
            )

    db.password_resets.update_one(
        {"_id": doc["_id"]},
        {"$set": {"used": True, "verified": True, "used_at": now_iso}},
    )

    return success_response(
        data={"email": email_lower, "verified": True},
        message="Email address verified successfully.",
        status_code=200,
    )


@auth_bp.route("/verification-status", methods=["GET"])
def check_email_verification_status():
    """
    Lightweight status check so an open Registration tab can detect when the user
    clicked the 'Verify Email Instantly' link from their email (even on another device).
    Never exposes the OTP code.
    """
    db = get_db()
    email_lower = (request.args.get("email") or "").strip().lower()
    if not email_lower or "@" not in email_lower:
        return error_response("Valid email query parameter is required.", status_code=400)

    now_dt = datetime.now(timezone.utc)
    doc = db.password_resets.find_one(
        {"email": email_lower, "purpose": "email_verification"},
        sort=[("created_at", -1)],
    )
    is_verified = False
    if doc and (doc.get("verified") or doc.get("used")):
        exp = doc.get("expires_at")
        if isinstance(exp, datetime):
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            is_verified = now_dt <= (exp + timedelta(minutes=15))
        else:
            is_verified = True

    return success_response(data={"email": email_lower, "verified": bool(is_verified)})


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
        "Silver": 20000,
        "Growth Plan": 35000,
        "Gold": 35000,
        "Hybrid & Scale": 75000,
    }
    mrr_rwf = plan_mrr_map.get(validated_data.planTier, 0 if str(validated_data.planTier).lower() == "free" else 20000)
    raw_payload = request.get_json(silent=True) or {}
    payment_message_copy = str(raw_payload.get("paymentMessageCopy") or "").strip()
    payment_screenshot = str(raw_payload.get("paymentScreenshot") or "").strip()
    payment_method = str(raw_payload.get("paymentMethod") or "MTN MoMo Business (+250 781 963 981)").strip()
    payment_ref = str(
        raw_payload.get("paymentReference")
        or (payment_message_copy[:60] if payment_message_copy else ("Screenshot Uploaded" if payment_screenshot else ""))
    ).strip()

    is_paid_plan = mrr_rwf > 0 and str(validated_data.planTier).strip().lower() != "free"
    billing_type = "Paid" if is_paid_plan else "Free"
    now_dt = datetime.now(timezone.utc)
    paid_at_iso = str(raw_payload.get("paidAt") or now_iso).strip() if is_paid_plan else ""
    subscription_expiry = (now_dt + timedelta(days=30)).strftime("%Y-%m-%d") if is_paid_plan else ""

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
        "monthlySpendRWF": float(mrr_rwf) if is_paid_plan else 0.0,
        "subscriptionStatus": "Active",
        "paidAt": paid_at_iso,
        "subscriptionStartAt": now_iso if is_paid_plan else "",
        "subscriptionExpiry": subscription_expiry,
        "paymentMethod": payment_method if is_paid_plan else "",
        "paymentReference": payment_ref if is_paid_plan else "",
        "paymentMessageCopy": payment_message_copy if is_paid_plan else "",
        "paymentScreenshot": payment_screenshot if is_paid_plan else "",
        "enabledActivities": enabled_activities,
        "verified": True,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    db.users.insert_one(user_doc)

    if is_paid_plan and (payment_message_copy or payment_screenshot or payment_ref):
        db.subscription_requests.insert_one(
            {
                "id": f"UPG-{now_ms}",
                "email": email_lower,
                "fullName": validated_data.fullName,
                "businessName": validated_data.businessName,
                "currentPlan": "Registration",
                "requestedPlan": validated_data.planTier,
                "amountRWF": float(mrr_rwf),
                "paymentMethod": payment_method,
                "paymentReference": payment_ref or "Registration Payment",
                "paymentMessageCopy": payment_message_copy,
                "paymentScreenshot": payment_screenshot,
                "payerPhone": validated_data.phone,
                "paidAt": paid_at_iso,
                "expiryDate": subscription_expiry,
                "status": "approved",
                "notes": "Submitted during business registration",
                "createdAt": now_iso,
            }
        )

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
        "mrrRWF": float(mrr_rwf) if is_paid_plan else 0.0,
        "monthlySpendRWF": float(mrr_rwf) if is_paid_plan else 0.0,
        "status": "Active",
        "branches": 1,
        "location": f"{validated_data.country}, {validated_data.location}".strip(", "),
        "joinedAt": now_iso[:10],
        "paidAt": paid_at_iso,
        "expiryDate": subscription_expiry,
        "paymentMethod": payment_method if is_paid_plan else "",
        "paymentMessageCopy": payment_message_copy if is_paid_plan else "",
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

    # Auto-connect Official ExBOS WhatsApp & send Welcome Message if opted in
    wa_result = None
    try:
        raw_payload = request.get_json(silent=True) or {}
        enable_wa = raw_payload.get("enableWhatsAppLink", True)
        if enable_wa and validated_data.phone:
            from app.services.whatsapp_client import (
                build_welcome_message,
                normalize_phone,
                send_whatsapp_message,
            )

            norm_phone = normalize_phone(validated_data.phone)
            official_num = os.getenv("WHATSAPP_OFFICIAL_NUMBER", "+250 792 946 680")
            if norm_phone:
                db.integrations.update_one(
                    {"userEmail": email_lower},
                    {
                        "$set": {
                            "userEmail": email_lower,
                            "whatsapp": {
                                "id": "whatsapp",
                                "connected": True,
                                "officialNumber": official_num,
                                "linkedBusinessPhone": norm_phone,
                                "connectedAt": now_iso,
                            },
                            "updated_at": now_iso,
                        }
                    },
                    upsert=True,
                )
                welcome_msg = build_welcome_message(
                    validated_data.businessName,
                    arch_id,
                    official_num,
                )
                wa_result = send_whatsapp_message(
                    norm_phone,
                    welcome_msg,
                    db=db,
                    metadata={"type": "registration_welcome", "userEmail": email_lower},
                )
    except Exception as wa_exc:
        logger.warning("Auto WhatsApp welcome skipped: %s", wa_exc)
        wa_result = {"sent": False, "status": "error", "error": str(wa_exc)}

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
    workspace_scope = (user_doc.get("ownerScopeKey") or email_lower).strip().lower()
    user_workspaces = _load_user_workspaces(db, workspace_scope)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": clean_user,
            "business": serialize_doc(biz_doc),
            "workspaces": user_workspaces,
            "whatsappWelcome": wa_result,
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

    # Enforce Super Admin account suspension (defaults to Active for existing accounts)
    if (user_doc.get("accountStatus") or "Active").strip().lower() == "suspended":
        reason = user_doc.get("suspensionReason") or "Your account has been suspended by the platform administrator."
        return error_response(
            error=f"Account suspended: {reason}",
            status_code=403,
        )

    # 2-Step Email Verification on Login (when enabled in user settings)
    if bool(user_doc.get("twoFactorEnabled")):
        otp_code = (validated_data.otpCode or "").strip()
        now_dt = datetime.now(timezone.utc)
        if not otp_code:
            code = generate_numeric_code(6)
            db.email_verifications.insert_one(
                {
                    "email": email_lower,
                    "code": code,
                    "purpose": "login_2fa",
                    "verified": False,
                    "created_at": now_dt,
                    "expires_at": now_dt + timedelta(minutes=15),
                }
            )
            user_name = user_doc.get("name") or user_doc.get("businessName") or "Business Owner"
            frontend_origin = _resolve_frontend_origin()
            verify_2fa_link = f"{frontend_origin}/login?email={quote(email_lower)}&otp={quote(code)}"
            copy_2fa_link = f"{frontend_origin}/login?email={quote(email_lower)}&otp={quote(code)}&copy=1"
            html_body = render_exbos_email(
                category="2-Step Login",
                title="Sign-In Security Verification",
                greeting=f"Hello <strong>{user_name}</strong>,",
                intro_html="A sign-in attempt to your ExBOS workspace requires 2-step verification. Enter the 6-digit security code below or click the verified link to complete your sign-in.",
                code=code,
                code_label="6-Digit Login Security Code",
                primary_cta=("Open Sign-In with Code Filled", verify_2fa_link),
                secondary_cta=("Copy 6-Digit Code", copy_2fa_link),
                footer_note="This security code expires in 15 minutes. If you did not attempt to sign in, please update your password immediately.",
                fallback_link=verify_2fa_link,
            )
            text_body = (
                f"Your ExBOS 2-Step Login Verification code is: {code} (valid for 15 minutes).\n"
                f"Or click this verified link to auto-fill your sign-in: {verify_2fa_link}"
            )
            email_sent = send_gmail_email(
                to_email=email_lower,
                subject=f"ExBOS Login Verification Code: {code}",
                html_body=html_body,
                text_body=text_body,
            )
            return success_response(
                data={
                    "requiresTwoFactor": True,
                    "email": email_lower,
                    "emailSent": email_sent,
                    "expiresInMinutes": 15,
                },
                message=f"6-digit login verification code sent to {email_lower}.",
                status_code=200,
            )
        else:
            otp_doc = db.email_verifications.find_one(
                {"email": email_lower, "code": otp_code, "purpose": "login_2fa", "verified": False},
                sort=[("created_at", -1)],
            )
            if not otp_doc:
                return error_response(
                    error="Invalid 6-digit verification code. Please check your email and try again.",
                    status_code=400,
                )
            exp = otp_doc.get("expires_at")
            if exp:
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if now_dt > exp:
                    return error_response(
                        error="Verification code has expired. Please request a new code.",
                        status_code=400,
                    )
            db.email_verifications.update_one(
                {"_id": otp_doc["_id"]},
                {"$set": {"verified": True, "verified_at": now_iso}},
            )

    updates = {
        "updated_at": now_iso,
        "lastLoginAt": now_iso,
    }
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
    workspace_scope = (user_doc.get("ownerScopeKey") or email_lower).strip().lower()
    user_workspaces = _load_user_workspaces(db, workspace_scope)

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
            if (user_doc.get("accountStatus") or "Active").strip().lower() == "suspended":
                reason = user_doc.get("suspensionReason") or "Account suspended by platform administrator."
                return error_response(error=f"Account suspended: {reason}", status_code=403)
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

    # Prevent non-Super-Admin users from self-upgrading to paid plans without payment verification
    if not _is_super_admin_user(user_doc):
        cur_plan = str(user_doc.get("plan") or user_doc.get("planTier") or "Free").strip().lower()
        for field_name in ("plan", "planTier"):
            if field_name in update_fields:
                req_plan = str(update_fields[field_name] or "free").strip().lower()
                if req_plan not in ("free", cur_plan):
                    update_fields.pop(field_name, None)

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

    frontend_origin = _resolve_frontend_origin()
    reset_link = f"{frontend_origin}/forgot-password?email={quote(email_lower)}&code={quote(code)}"
    copy_reset_link = f"{frontend_origin}/forgot-password?email={quote(email_lower)}&code={quote(code)}&copy=1"

    email_sent = send_gmail_email(
        to_email=email_lower,
        subject=f"ExBOS Password Reset Code: {code}",
        text_body=(
            f"Your ExBOS password reset code is: {code} (valid for 15 minutes).\n"
            f"Or open this verified reset link: {reset_link}"
        ),
        html_body=render_exbos_email(
            category="Password Reset",
            title="Reset Your ExBOS Password",
            intro_html="We received a request to reset the password for your ExBOS account. Use the 6-digit verification code below or click the button to open the password reset form pre-filled.",
            code=code,
            code_label="6-Digit Password Reset Code",
            primary_cta=("Reset Password via Verified Link", reset_link),
            secondary_cta=("Copy 6-Digit Code", copy_reset_link),
            footer_note="This reset code expires in 15 minutes. If you did not request a password reset, no action is required.",
            fallback_link=reset_link,
        ),
    )

    return success_response(
        data={
            "email": email_lower,
            "emailSent": email_sent,
            "expiresInMinutes": 15,
        },
        message="Password reset verification code and verified link sent to your email.",
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


def _resolve_team_actor(db):
    """Resolve authenticated user and their tenant ownerScopeKey."""
    email = _safe_jwt_email()
    if not email:
        q = (request.args.get("scopeKey") or "").strip().lower()
        if q and "@" in q:
            email = q
    if not email:
        return None, None
    actor = db.users.find_one({"email": email})
    if not actor:
        return None, None
    owner_scope = (actor.get("ownerScopeKey") or actor.get("email") or "").strip().lower()
    return actor, owner_scope


def _default_permissions_for_role(role: str) -> dict:
    r = (role or "Staff").strip().lower()
    if "owner" in r or "admin" in r:
        return {
            "canRecordSales": True,
            "canManageStock": True,
            "canViewProfits": True,
            "canApproveExpenses": True,
            "canDeleteRecords": True,
            "canManageTeam": True,
        }
    if "manager" in r:
        return {
            "canRecordSales": True,
            "canManageStock": True,
            "canViewProfits": True,
            "canApproveExpenses": True,
            "canDeleteRecords": False,
            "canManageTeam": False,
        }
    if "accountant" in r:
        return {
            "canRecordSales": False,
            "canManageStock": False,
            "canViewProfits": True,
            "canApproveExpenses": True,
            "canDeleteRecords": False,
            "canManageTeam": False,
        }
    # Cashier / Sales Staff / Default
    return {
        "canRecordSales": True,
        "canManageStock": False,
        "canViewProfits": False,
        "canApproveExpenses": False,
        "canDeleteRecords": False,
        "canManageTeam": False,
    }


@auth_bp.route("/team", methods=["GET"])
def list_team_members():
    """List the business owner and all team members linked to this tenant."""
    db = get_db()
    actor, owner_scope = _resolve_team_actor(db)
    if not actor or not owner_scope:
        return error_response("Authentication required to view team members.", status_code=401)

    docs = list(
        db.users.find(
            {"$or": [{"email": owner_scope}, {"ownerScopeKey": owner_scope}]}
        ).sort("created_at", 1)
    )

    members = []
    for doc in docs:
        is_owner = (doc.get("email") or "").strip().lower() == owner_scope and not doc.get("ownerScopeKey")
        members.append(
            {
                "id": str(doc.get("_id")),
                "fullName": doc.get("fullName") or doc.get("businessName") or doc.get("email"),
                "email": doc.get("email"),
                "role": "Owner" if is_owner else (doc.get("role") or "Staff"),
                "isOwner": is_owner,
                "assignedBranchId": doc.get("assignedBranchId") or "",
                "permissions": doc.get("permissions") or _default_permissions_for_role(
                    "Owner" if is_owner else doc.get("role", "Staff")
                ),
                "status": "Active",
                "createdAt": doc.get("created_at"),
            }
        )

    return success_response(data={"members": members, "ownerScopeKey": owner_scope})


@auth_bp.route("/team/invite", methods=["POST"])
def invite_team_member():
    """
    Create or update a real team member login in MongoDB db.users and email them
    a direct login link. Only the Business Owner can invite or modify staff accounts.
    """
    import secrets
    import string

    db = get_db()
    actor, owner_scope = _resolve_team_actor(db)
    if not actor or not owner_scope:
        return error_response("Authentication required.", status_code=401)

    is_owner = (actor.get("email") or "").strip().lower() == owner_scope and not actor.get("ownerScopeKey")
    if not is_owner:
        return error_response("Only the Business Owner can invite or manage team members.", status_code=403)

    payload = request.get_json(silent=True) or {}
    member_email = (payload.get("email") or "").strip().lower()
    full_name = (payload.get("fullName") or payload.get("name") or "").strip()
    role = (payload.get("role") or "Cashier").strip()
    raw_password = (payload.get("password") or "").strip()
    assigned_branch_id = (payload.get("assignedBranchId") or "").strip()
    custom_permissions = payload.get("permissions")
    app_origin = (payload.get("appOrigin") or "https://exbos.pages.dev").strip().rstrip("/")

    if not member_email or "@" not in member_email:
        return error_response("A valid staff email address is required.", status_code=400)
    if member_email == owner_scope:
        return error_response("You cannot invite your own owner email as a staff member.", status_code=400)
    if not full_name:
        full_name = member_email.split("@")[0].replace(".", " ").title()

    existing = db.users.find_one({"email": member_email})
    if not existing:
        from app.utils.entitlements import check_entitlement
        allowed, limit_err = check_entitlement(db, owner_scope, "maxStaff", actor)
        if not allowed:
            return error_response(
                error=limit_err["message"],
                details=limit_err,
                status_code=402,
            )
    if existing and (existing.get("ownerScopeKey") or "").strip().lower() != owner_scope:
        if not existing.get("ownerScopeKey"):
            return error_response(
                "This email is already registered as an independent ExBOS business owner.",
                status_code=409,
            )
        return error_response(
            "This email already belongs to another ExBOS organization.",
            status_code=409,
        )

    generated_password = False
    if not raw_password and not existing:
        alphabet = string.ascii_letters + string.digits
        raw_password = "".join(secrets.choice(alphabet) for _ in range(10))
        generated_password = True
    elif raw_password and len(raw_password) < 6:
        return error_response("Staff password must be at least 6 characters.", status_code=400)

    permissions = (
        custom_permissions
        if isinstance(custom_permissions, dict)
        else _default_permissions_for_role(role)
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    business_name = actor.get("businessName") or "ExBOS Business"

    user_fields = {
        "email": member_email,
        "fullName": full_name,
        "businessName": business_name,
        "ownerScopeKey": owner_scope,
        "role": role,
        "assignedBranchId": assigned_branch_id or None,
        "permissions": permissions,
        "architectureId": actor.get("architectureId") or "buy-and-sell",
        "currency": actor.get("currency") or "RWF",
        "plan": actor.get("plan") or actor.get("planTier") or "Free",
        "planTier": actor.get("planTier") or actor.get("plan") or "Free",
        "emailVerified": True,
        "updated_at": now_iso,
    }
    if raw_password:
        user_fields["password_hash"] = hash_password(raw_password)

    if existing:
        db.users.update_one({"email": member_email}, {"$set": user_fields})
    else:
        user_fields["created_at"] = now_iso
        db.users.insert_one(user_fields)

    login_link = f"{app_origin}/login?email={member_email}"
    email_sent = False
    try:
        invite_details = [
            ("Workspace", business_name),
            ("Login Email", member_email),
            ("Assigned Role", role),
        ]
        if raw_password:
            invite_details.append(
                (
                    "Temporary Password",
                    f'<code style="background:#EEF4FB;border:1px solid #BFDBFE;padding:3px 8px;border-radius:6px;color:#0A2786;font-family:monospace;">{raw_password}</code>',
                )
            )
        else:
            invite_details.append(("Password", "Use your existing ExBOS password"))

        html_body = render_exbos_email(
            category="Team Invitation",
            title=f"You Are Invited to {business_name}",
            greeting=f"Hello <strong>{full_name}</strong>,",
            intro_html=f"<strong>{actor.get('fullName') or owner_scope}</strong> has added you to the <strong>{business_name}</strong> workspace on ExBOS with the role of <strong>{role}</strong>.",
            details=invite_details,
            primary_cta=("Sign In to ExBOS Workspace", login_link),
            footer_note="For your security, please change your temporary password after your first sign-in.",
            fallback_link=login_link,
        )
        email_sent = send_gmail_email(
            to_email=member_email,
            subject=f"You're invited to {business_name} on ExBOS ({role})",
            html_body=html_body,
            text_body=f"Hello {full_name}, you have been added to {business_name} on ExBOS as {role}. Sign in at: {login_link}",
        )
    except Exception as exc:
        logger.warning("Failed to send team invite email to %s: %s", member_email, exc)

    member_doc = db.users.find_one({"email": member_email})
    member_payload = {
        "id": str(member_doc.get("_id")) if member_doc else member_email,
        "fullName": full_name,
        "email": member_email,
        "role": role,
        "isOwner": False,
        "assignedBranchId": assigned_branch_id or "",
        "permissions": permissions,
        "status": "Active",
        "createdAt": member_doc.get("created_at") if member_doc else now_iso,
    }
    return success_response(
        data={
            "member": member_payload,
            "loginLink": login_link,
            "emailSent": bool(email_sent),
            "generatedPassword": raw_password if generated_password else None,
        },
        message=f"Team account for {full_name} ({role}) is active."
        + (" Invitation email sent." if email_sent else " Share the login link directly."),
        status_code=201 if not existing else 200,
    )


@auth_bp.route("/team/<path:member_email>", methods=["DELETE"])
def remove_team_member(member_email: str):
    """Revoke and delete a team member account belonging to this tenant (owner-only)."""
    db = get_db()
    actor, owner_scope = _resolve_team_actor(db)
    if not actor or not owner_scope:
        return error_response("Authentication required.", status_code=401)

    is_owner = (actor.get("email") or "").strip().lower() == owner_scope and not actor.get("ownerScopeKey")
    if not is_owner:
        return error_response("Only the Business Owner can remove team members.", status_code=403)

    target_email = (member_email or "").strip().lower()
    if not target_email or target_email == owner_scope:
        return error_response("Cannot remove the Business Owner account here.", status_code=400)

    res = db.users.delete_one({"email": target_email, "ownerScopeKey": owner_scope})
    if res.deleted_count == 0:
        return error_response("Team member not found in your organization.", status_code=404)

    return success_response(message=f"Access revoked for {target_email}.")


@auth_bp.route("/subscription/requests", methods=["GET"])
def list_my_upgrade_requests():
    """Return the authenticated business owner's subscription upgrade requests."""
    db = get_db()
    actor, owner_scope = _resolve_team_actor(db)
    if not actor or not owner_scope:
        return error_response("Authentication required.", status_code=401)

    docs = list(
        db.subscription_requests.find({"email": owner_scope}).sort("createdAt", -1).limit(10)
    )
    cleaned = []
    for d in docs:
        item = serialize_doc(d)
        item.pop("_id", None)
        cleaned.append(item)
    return success_response(data={"requests": cleaned})


@auth_bp.route("/subscription/request-upgrade", methods=["POST"])
def submit_subscription_upgrade_request():
    """
    Submit a Rwanda payment verification request (MTN MoMo / Airtel Money / Bank Transfer)
    to upgrade to Bronze, Silver, or Gold. Reviewed & activated in 1 click by Super Admin.
    """
    from app.utils.entitlements import get_plan_limits, normalize_plan_name

    db = get_db()
    actor, owner_scope = _resolve_team_actor(db)
    if not actor or not owner_scope:
        return error_response("Authentication required.", status_code=401)

    payload = request.get_json(silent=True) or {}
    requested_plan = normalize_plan_name(payload.get("plan"))
    if requested_plan not in ("bronze", "silver", "gold"):
        return error_response("Select a valid paid plan: Bronze, Silver, or Gold.", status_code=400)

    payment_method = str(payload.get("paymentMethod") or "MTN MoMo Business").strip()
    payment_message_copy = str(payload.get("paymentMessageCopy") or "").strip()
    payment_screenshot = str(payload.get("paymentScreenshot") or "").strip()
    payment_reference = str(
        payload.get("paymentReference")
        or (payment_message_copy[:60] if payment_message_copy else ("Screenshot Uploaded" if payment_screenshot else ""))
    ).strip()
    payer_phone = str(payload.get("payerPhone") or actor.get("phone") or "").strip()
    notes = str(payload.get("notes") or payment_message_copy or "").strip()

    if not payment_reference and not payment_message_copy and not payment_screenshot:
        return error_response(
            "Please paste your Mobile Money / Bank payment confirmation message or upload a screenshot.",
            status_code=400,
        )

    plan_info = get_plan_limits(requested_plan)
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    paid_at_iso = str(payload.get("paidAt") or now_iso).strip()
    req_id = f"UPG-{int(now_dt.timestamp() * 1000)}"

    req_doc = {
        "id": req_id,
        "email": owner_scope,
        "fullName": actor.get("fullName") or actor.get("name") or owner_scope,
        "businessName": actor.get("businessName") or "ExBOS Business",
        "currentPlan": actor.get("plan") or actor.get("planTier") or "Free",
        "requestedPlan": requested_plan.title(),
        "amountRWF": float(plan_info.get("priceRWF") or 0),
        "paymentMethod": payment_method,
        "paymentReference": payment_reference,
        "paymentMessageCopy": payment_message_copy,
        "paymentScreenshot": payment_screenshot,
        "payerPhone": payer_phone,
        "paidAt": paid_at_iso,
        "notes": notes,
        "status": "pending",
        "createdAt": now_iso,
    }
    db.subscription_requests.insert_one(dict(req_doc))
    db.users.update_one(
        {"email": owner_scope},
        {
            "$set": {
                "lastPaymentSubmittedAt": paid_at_iso,
                "paymentMessageCopy": payment_message_copy or actor.get("paymentMessageCopy") or "",
                "paymentScreenshot": payment_screenshot or actor.get("paymentScreenshot") or "",
                "paymentMethod": payment_method,
            }
        },
    )

    # Notify Super Admin's registered WhatsApp recipient number(s) immediately
    try:
        from app.services.whatsapp_client import notify_registered_whatsapp_recipients
        wa_pay_alert = (
            f"*EXCELLENCE BOS — New Payment Proof Submitted*\n"
            f"Business: *{req_doc['businessName']}* ({owner_scope})\n"
            f"Requested Plan: *{req_doc['requestedPlan']}* ({int(round(req_doc['amountRWF'])):,} RWF)\n"
            f"Method: {payment_method}\n"
            f"Ref: {payment_reference}\n"
            f"Open /super-admin to verify and approve."
        )
        notify_registered_whatsapp_recipients(
            db,
            alert_type="paymentProofSubmitted",
            message_text=wa_pay_alert,
            target_roles=["super_admin"],
        )
    except Exception as exc:
        logger.debug("Optional Super Admin WhatsApp payment alert skipped: %s", exc)

    return success_response(
        data=req_doc,
        message=f"Upgrade request for {requested_plan.title()} submitted (Ref: {payment_reference}). Your plan will activate as soon as Super Admin verifies payment.",
        status_code=201,
    )



