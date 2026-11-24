import logging
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.seed_defaults import (
    create_empty_record_buckets,
    create_zero_metrics,
    get_default_workspaces,
)
from app.services.whatsapp_client import (
    ARCH_LABELS,
    build_welcome_message,
    normalize_phone,
    notify_registered_whatsapp_recipients,
)
from app.utils.email_templates import render_exbos_email
from app.utils.entitlements import DEFAULT_PLAN_LIMITS
from app.utils.mailer import send_gmail_email
from app.utils.security import generate_numeric_code, hash_password

logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

ONBOARD_GREETING_WORDS = {
    "0", "MENU", "HELP", "HI", "HY", "HEY", "HELLO", "START",
    "MURAHO", "MWARAMUTSE", "MWIRIWE", "BONJOUR", "SALUT",
    "GOOD MORNING", "GOOD AFTERNOON", "GOOD EVENING",
}
CONFIRM_WORDS = {"YES", "Y", "CONFIRM", "OK", "YEGO", "SAVE", "SURE"}
EDIT_WORDS = {"EDIT", "CHANGE", "MODIFY", "UPDATE", "HINDURA", "KOSORA"}
CANCEL_WORDS = {"NO", "N", "CANCEL", "STOP", "OYA", "ABORT"}

ARCH_MENU_MAP = {
    "1": ("make-and-sell", "Make & Sell", "Gukora no Kugurisha (Make & Sell)"),
    "2": ("buy-and-sell", "Buy & Sell", "Kurangura no Kugurisha (Buy & Sell)"),
    "3": ("services", "Service-Based Business", "Ubucuruzi bwa Serivisi (Services)"),
    "4": ("agriculture", "Agriculture & Livestock", "Ubuhinzi n'Ubworozi (Agriculture)"),
    "5": ("food-hospitality", "Food & Hospitality", "Ibiribwa n'Amahoteli (Hospitality)"),
    "6": ("hybrid", "Hybrid Business", "Ubucuruzi Buvanze (Hybrid)"),
}

HYBRID_ACTIVITY_OPTIONS = {
    "1": "make-and-sell",
    "2": "buy-and-sell",
    "3": "services",
    "4": "agriculture",
    "5": "food-hospitality",
}


def _t(lang: str, en: str, rw: str) -> str:
    return rw if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda") else en


def _fmt_rwf(val: Any) -> str:
    try:
        return f"{int(round(float(val or 0))):,} RWF"
    except (TypeError, ValueError):
        return "0 RWF"


def _load_plan_options(db: Any) -> dict[str, dict[str, Any]]:
    """Load live subscription plan pricing from platform_config overrides or DEFAULT_PLAN_LIMITS."""
    overrides: dict[str, Any] = {}
    if db is not None:
        try:
            doc = db.platform_config.find_one({"key": "plan_matrix_overrides"}, {"_id": 0})
            if doc and isinstance(doc.get("value"), dict):
                overrides = doc["value"]
        except Exception:
            pass

    def _price(plan_key: str, default_val: int) -> int:
        ov = overrides.get(plan_key) if isinstance(overrides.get(plan_key), dict) else {}
        base = DEFAULT_PLAN_LIMITS.get(plan_key) or {}
        raw = ov.get("priceRWF", base.get("priceRWF", default_val))
        try:
            return int(round(float(raw or 0)))
        except (TypeError, ValueError):
            return default_val

    return {
        "1": {"tier": "Free", "key": "free", "priceRWF": 0},
        "2": {"tier": "Bronze", "key": "bronze", "priceRWF": _price("bronze", 10000)},
        "3": {"tier": "Silver", "key": "silver", "priceRWF": _price("silver", 20000)},
        "4": {"tier": "Gold", "key": "gold", "priceRWF": _price("gold", 35000)},
    }


def _build_onboard_menu(lang: str) -> str:
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return (
            "*EXCELLENCE BOS — Kaze kuri Sisitemu y'Ubucuruzi*\n"
            "--------------------------------\n"
            "Iyi nimero ntabwo irahuzwa na konti ya ExBOS.\n\n"
            "Subiza *Umubare* w'icyo ushaka gukora:\n"
            "*1.* Fungura Konti Nshya ya ExBOS (Gushyiraho Byose)\n"
            "*2.* Huza Konti ya ExBOS Usanzwe Ufite\n"
            "*3.* Hindura Ururimi (English / Kinyarwanda)\n"
            "--------------------------------\n"
            "Ushobora gufungura ubucuruzi bwawe bwose hano kuri WhatsApp."
        )
    return (
        "*EXCELLENCE BOS — Official Business Onboarding*\n"
        "--------------------------------\n"
        "This phone number is not yet linked to an ExBOS account.\n\n"
        "Reply with a *Menu Number* to begin:\n"
        "*1.* Create a New ExBOS Business Account (Full Setup)\n"
        "*2.* Link My Existing ExBOS Account\n"
        "*3.* Change Language (English / Kinyarwanda)\n"
        "--------------------------------\n"
        "Set up your full ExBOS business workspace directly from WhatsApp."
    )


def _build_architecture_prompt(lang: str) -> str:
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return (
            "*Intambwe 4/7 — Hitamo Ubwoko bw'Ubucuruzi (Architecture):*\n"
            "--------------------------------\n"
            "*1.* Gukora no Kugurisha (Make & Sell)\n"
            "*2.* Kurangura no Kugurisha (Buy & Sell)\n"
            "*3.* Ubucuruzi bwa Serivisi (Service-Based)\n"
            "*4.* Ubuhinzi n'Ubworozi (Agriculture & Livestock)\n"
            "*5.* Ibiribwa n'Amahoteli (Food & Hospitality)\n"
            "*6.* Ubucuruzi Buvanze (Hybrid Business)\n"
            "--------------------------------\n"
            "Subiza umubare (*1–6*) cyangwa *0* uhagarike."
        )
    return (
        "*Step 4/7 — Choose Your Business Architecture:*\n"
        "--------------------------------\n"
        "*1.* Make & Sell (Manufacturing, Bakery, Tailoring)\n"
        "*2.* Buy & Sell (Retail, Wholesale, Shop, Pharmacy)\n"
        "*3.* Service-Based Business (Salon, Clinic, Repairs, Agency)\n"
        "*4.* Agriculture & Livestock (Farming, Dairy, Poultry)\n"
        "*5.* Food & Hospitality (Restaurant, Cafe, Hotel, Lodge)\n"
        "*6.* Hybrid Business (Combine Multiple Models)\n"
        "--------------------------------\n"
        "Reply with a number (*1–6*) or *0* to cancel."
    )


def _build_plan_prompt(db: Any, lang: str) -> str:
    plans = _load_plan_options(db)
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return (
            "*Intambwe 6/7 — Hitamo Ifatabuguzi (Subscription Plan):*\n"
            "--------------------------------\n"
            f"*1.* Free — *{_fmt_rwf(plans['1']['priceRWF'])}* (Ubuntu iteka)\n"
            f"*2.* Bronze — *{_fmt_rwf(plans['2']['priceRWF'])}* / ukwezi\n"
            f"*3.* Silver — *{_fmt_rwf(plans['3']['priceRWF'])}* / ukwezi\n"
            f"*4.* Gold — *{_fmt_rwf(plans['4']['priceRWF'])}* / ukwezi\n"
            "--------------------------------\n"
            "Subiza umubare (*1–4*) cyangwa *0* uhagarike."
        )
    return (
        "*Step 6/7 — Choose Your Subscription Plan:*\n"
        "--------------------------------\n"
        f"*1.* Free — *{_fmt_rwf(plans['1']['priceRWF'])}* (Forever Free)\n"
        f"*2.* Bronze — *{_fmt_rwf(plans['2']['priceRWF'])}* / month\n"
        f"*3.* Silver — *{_fmt_rwf(plans['3']['priceRWF'])}* / month\n"
        f"*4.* Gold — *{_fmt_rwf(plans['4']['priceRWF'])}* / month\n"
        "--------------------------------\n"
        "Reply with a number (*1–4*) or *0* to cancel."
    )


def _build_payment_proof_prompt(plan_tier: str, price_rwf: int, lang: str) -> str:
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return (
            f"*Kwishyura Ifatabuguzi — {plan_tier} ({_fmt_rwf(price_rwf)}):*\n"
            "--------------------------------\n"
            "Ishyura ukoresheje *MTN MoMo / Airtel Money*:\n"
            "- Nimero: *0781 963 981* (+250 781 963 981)\n"
            f"- Amafaranga: *{_fmt_rwf(price_rwf)}*\n"
            "--------------------------------\n"
            "Nyuma yo kwishyura, ohereza hano:\n"
            "- *Ifoto (Screenshot)* y'ubwishyu, CYANGWA\n"
            "- *Ubutumwa bwa SMS* bwemeza ko wishyuye.\n\n"
            "Niba ushaka gutangira ku buntu, andika *FREE*."
        )
    return (
        f"*Payment Proof Required — {plan_tier} Plan ({_fmt_rwf(price_rwf)}):*\n"
        "--------------------------------\n"
        "Pay via *MTN MoMo / Airtel Money*:\n"
        "- Number: *0781 963 981* (+250 781 963 981)\n"
        f"- Amount: *{_fmt_rwf(price_rwf)}*\n"
        "--------------------------------\n"
        "After paying, send either:\n"
        "- A *WhatsApp Screenshot / Photo* of your payment confirmation, OR\n"
        "- The *pasted SMS confirmation message*.\n\n"
        "Or reply *FREE* to switch to the Forever Free plan instead."
    )


def _build_registration_verification_card(step_data: dict[str, Any], phone: str, lang: str) -> str:
    arch_id = str(step_data.get("architectureId") or "buy-and-sell")
    arch_label = ARCH_LABELS.get(arch_id, arch_id)
    plan_tier = str(step_data.get("planTier") or "Free")
    plan_price = int(step_data.get("planPriceRWF") or 0)
    is_paid = plan_price > 0 and plan_tier.lower() != "free"
    has_screenshot = bool(step_data.get("paymentScreenshot"))
    has_sms = bool(step_data.get("paymentMessageCopy"))

    if is_paid:
        if has_screenshot and has_sms:
            proof_str = _t(lang, "Screenshot + SMS Attached", "Ifoto + SMS Byatanzwe")
        elif has_screenshot:
            proof_str = _t(lang, "WhatsApp Screenshot Attached", "Ifoto y'Ubwishyu Yatanzwe")
        elif has_sms:
            proof_str = _t(lang, "SMS Confirmation Attached", "Ubutumwa bwa SMS Bwatanzwe")
        else:
            proof_str = _t(lang, "Pending", "Bitegereje")
    else:
        proof_str = _t(lang, "Not Required (Free Plan)", "Ntibikenewe (Ubuntu)")

    is_rw = str(lang or "en").lower() in ("rw", "kin", "kinyarwanda")
    header = "*GENZURA MBERE YO KUBIKA — KONTI NSHYA YA EXBOS*" if is_rw else "*VERIFY BEFORE SAVING — NEW EXBOS ACCOUNT*"
    rows = [
        (_t(lang, "Full Name", "Amazina"), str(step_data.get("fullName") or "")),
        (_t(lang, "Email (Verified)", "Imeri (Yemejwe)"), str(step_data.get("email") or "")),
        (_t(lang, "WhatsApp Phone", "Nimero ya WhatsApp"), phone),
        (_t(lang, "Business Name", "Izina ry'Ubucuruzi"), str(step_data.get("businessName") or "")),
        (_t(lang, "Location", "Aho Bukorera"), str(step_data.get("location") or "")),
        (_t(lang, "Category", "Icyiciro"), str(step_data.get("businessCategory") or "Operations")),
        (_t(lang, "Architecture", "Ubwoko bw'Ubucuruzi"), arch_label),
        (_t(lang, "Subscription Plan", "Ifatabuguzi"), f"{plan_tier} ({_fmt_rwf(plan_price)})"),
        (_t(lang, "Payment Proof", "Icyemezo cy'Ubwishyu"), proof_str),
    ]
    lines = [header, "--------------------------------"]
    for label, val in rows:
        lines.append(f"- {label}: *{val}*")
    lines.append("--------------------------------")
    if is_rw:
        lines.extend([
            "Subiza *YEGO* (cyangwa *YES*) ufungure konti muri ExBOS.",
            "Subiza *HINDURA* (cyangwa *EDIT*) ugire icyo ukosora.",
            "Subiza *OYA* (cyangwa *0*) uhagarike.",
        ])
    else:
        lines.extend([
            "Reply *YES* to confirm and create your ExBOS account.",
            "Reply *EDIT* to change any detail before creating.",
            "Reply *NO* (or *0*) to cancel.",
        ])
    return "\n".join(lines)


def _send_otp_email(db: Any, email_lower: str, full_name: str, purpose: str) -> str:
    """Create a 6-digit OTP in db.password_resets (15-min expiry) and send branded ExBOS email."""
    now = datetime.now(timezone.utc)
    code = generate_numeric_code(6)
    db.password_resets.insert_one(
        {
            "email": email_lower,
            "code": code,
            "purpose": purpose,
            "created_at": now,
            "expires_at": now + timedelta(minutes=15),
            "used": False,
            "verified": False,
        }
    )

    title = "Link Your WhatsApp to ExBOS" if purpose == "whatsapp_link" else "Verify Your Email Address"
    intro = (
        "Enter the 6-digit verification code below in your ExBOS WhatsApp chat to link your phone number to your existing ExBOS account."
        if purpose == "whatsapp_link"
        else "Thank you for setting up your ExBOS account via WhatsApp. Enter the 6-digit verification code below in your WhatsApp chat to continue."
    )
    try:
        send_gmail_email(
            to_email=email_lower,
            subject=f"ExBOS Verification Code: {code}",
            text_body=(
                f"Hello {full_name},\n\n"
                f"Your ExBOS 6-digit verification code is: {code}\n\n"
                f"Reply with this code in your ExBOS WhatsApp chat.\n"
                f"This code expires in 15 minutes."
            ),
            html_body=render_exbos_email(
                category="WhatsApp Account Security",
                title=title,
                greeting=f"Hello <strong>{full_name}</strong>,",
                intro_html=intro,
                code=code,
                code_label="6-Digit Verification Code",
                footer_note="This verification code is valid for 15 minutes. If you did not request this code, please ignore this email.",
            ),
        )
    except Exception as exc:
        logger.warning("Failed to dispatch WhatsApp OTP email to %s: %s", email_lower, exc)
    return code


def _verify_otp_code(db: Any, email_lower: str, code: str, purpose: str) -> bool:
    clean_code = re.sub(r"\D", "", str(code or ""))
    if len(clean_code) != 6:
        return False
    now_dt = datetime.now(timezone.utc)
    doc = db.password_resets.find_one(
        {"email": email_lower, "code": clean_code, "purpose": purpose, "used": {"$ne": True}},
        sort=[("created_at", -1)],
    )
    if not doc:
        return False
    exp = doc.get("expires_at")
    if isinstance(exp, datetime):
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now_dt > exp:
            return False
    db.password_resets.update_one(
        {"_id": doc["_id"]},
        {"$set": {"used": True, "verified": True, "used_at": now_dt.isoformat()}},
    )
    return True


def _provision_whatsapp_account(db: Any, normalized_phone: str, step_data: dict[str, Any], lang: str) -> dict[str, Any]:
    """
    Atomically create user, business, zero-base workspace, Main HQ branch,
    WhatsApp integration, and subscription request (if paid), with 100% parity with /api/v1/auth/register.
    """
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    now_ms = int(now_dt.timestamp() * 1000)

    email_lower = str(step_data.get("email") or "").strip().lower()
    full_name = str(step_data.get("fullName") or "Business Owner").strip()
    business_name = str(step_data.get("businessName") or "ExBOS Business").strip()
    location = str(step_data.get("location") or "Kigali").strip()
    business_category = str(step_data.get("businessCategory") or "Operations").strip()
    arch_id = str(step_data.get("architectureId") or "buy-and-sell").strip()
    enabled_activities = step_data.get("enabledActivities") or [arch_id]
    password_hash = str(step_data.get("passwordHash") or "").strip()

    plan_tier = str(step_data.get("planTier") or "Free").strip()
    mrr_rwf = float(step_data.get("planPriceRWF") or 0)
    is_paid_plan = mrr_rwf > 0 and plan_tier.lower() != "free"
    billing_type = "Paid" if is_paid_plan else "Free"
    paid_at_iso = now_iso if is_paid_plan else ""
    subscription_expiry = (now_dt + timedelta(days=30)).strftime("%Y-%m-%d") if is_paid_plan else ""

    payment_method = str(step_data.get("paymentMethod") or "MTN MoMo / Airtel Money (+250 781 963 981)").strip()
    payment_message_copy = str(step_data.get("paymentMessageCopy") or "").strip()
    payment_screenshot = str(step_data.get("paymentScreenshot") or "").strip()
    payment_ref = str(
        step_data.get("paymentReference")
        or (payment_message_copy[:60] if payment_message_copy else ("WhatsApp Screenshot Uploaded" if payment_screenshot else ""))
    ).strip()

    user_id = f"USR-{now_ms}"
    biz_id = f"BIZ-{now_ms}"
    official_num = os.getenv("WHATSAPP_OFFICIAL_NUMBER", "+250 792 946 680")
    lang_label = "Kinyarwanda" if str(lang).lower() == "rw" else "English"

    user_doc = {
        "id": user_id,
        "name": full_name,
        "email": email_lower,
        "phone": normalized_phone,
        "password_hash": password_hash,
        "role": "BUSINESS_OWNER",
        "businessId": biz_id,
        "businessName": business_name,
        "businessCategory": business_category,
        "architectureId": arch_id,
        "country": "Rwanda",
        "location": location,
        "currency": "RWF",
        "language": lang_label,
        "whatsappLanguage": "rw" if str(lang).lower() == "rw" else "en",
        "plan": plan_tier,
        "planTier": plan_tier,
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
        "enableWhatsAppLink": True,
        "registrationSource": "WhatsApp",
        "verified": True,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    db.users.insert_one(user_doc)

    # 2. Subscription Request (if paid plan) for Super Admin review & governance
    if is_paid_plan:
        db.subscription_requests.insert_one(
            {
                "id": f"UPG-{now_ms}",
                "email": email_lower,
                "fullName": full_name,
                "businessName": business_name,
                "currentPlan": "WhatsApp Registration",
                "requestedPlan": plan_tier,
                "amountRWF": float(mrr_rwf),
                "paymentMethod": payment_method,
                "paymentReference": payment_ref or "WhatsApp Registration Payment",
                "paymentMessageCopy": payment_message_copy,
                "paymentScreenshot": payment_screenshot,
                "payerPhone": normalized_phone,
                "paidAt": paid_at_iso,
                "expiryDate": subscription_expiry,
                "status": "approved",
                "notes": "Submitted via ExBOS Official WhatsApp Registration",
                "createdAt": now_iso,
            }
        )

    # 3. Official Business Registry Entry
    biz_doc = {
        "id": biz_id,
        "name": business_name,
        "owner": full_name,
        "email": email_lower,
        "phone": normalized_phone,
        "architecture": arch_id,
        "architectureId": arch_id,
        "plan": plan_tier,
        "billingType": billing_type,
        "mrrRWF": float(mrr_rwf) if is_paid_plan else 0.0,
        "monthlySpendRWF": float(mrr_rwf) if is_paid_plan else 0.0,
        "status": "Active",
        "branches": 1,
        "location": f"Rwanda, {location}".strip(", "),
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

    # 4. Strictly Isolated Zero-Base Workspace (0 RWF)
    base_ws = get_default_workspaces().get(arch_id, {})
    ws_doc = {
        **base_ws,
        "scopeKey": email_lower,
        "architectureId": arch_id,
        "ownerName": full_name,
        "businessName": business_name,
        "email": email_lower,
        "phone": normalized_phone,
        "location": location,
        "category": business_category,
        "spendableRWF": 0.0,
        "monthlyRevenueRWF": 0.0,
        "netProfitRWF": 0.0,
        "primaryItem": "",
        "enabledActivities": enabled_activities,
        "metrics": create_zero_metrics(),
        "records": create_empty_record_buckets(),
        "updated_at": now_iso,
    }
    db.workspaces.delete_many({"scopeKey": email_lower, "architectureId": {"$ne": arch_id}})
    db.workspaces.update_one(
        {"scopeKey": email_lower, "architectureId": arch_id},
        {"$set": ws_doc},
        upsert=True,
    )

    # 5. Main HQ Branch
    db.branches.update_one(
        {"scopeKey": email_lower, "id": "main"},
        {
            "$set": {
                "id": "main",
                "scopeKey": email_lower,
                "name": f"{business_name} (Main HQ)",
                "location": location,
                "isMain": True,
                "status": "Active",
                "requirePinForMainSwitch": True,
                "permissions": {
                    "canDeleteRecords": True,
                    "canEditPrices": True,
                    "canViewProfitReports": True,
                    "canAddInventory": True,
                    "canRecordExpenses": True,
                    "maxExpenseLimitRWF": 0,
                },
                "created_at": now_iso,
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )

    # 6. WhatsApp Integration Auto-Connected
    db.integrations.update_one(
        {"userEmail": email_lower},
        {
            "$set": {
                "userEmail": email_lower,
                "whatsapp": {
                    "id": "whatsapp",
                    "connected": True,
                    "officialNumber": official_num,
                    "linkedBusinessPhone": normalized_phone,
                    "connectedAt": now_iso,
                },
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )

    # 7. Notify Super Admin via WhatsApp if paid plan proof submitted
    if is_paid_plan:
        try:
            proof_tag = "Screenshot + SMS" if (payment_screenshot and payment_message_copy) else (
                "WhatsApp Screenshot" if payment_screenshot else "SMS Confirmation"
            )
            notify_registered_whatsapp_recipients(
                db,
                alert_type="paymentProofSubmitted",
                message_text=(
                    "*EXCELLENCE BOS — New Paid WhatsApp Registration*\n"
                    f"Business: *{business_name}* ({ARCH_LABELS.get(arch_id, arch_id)})\n"
                    f"Owner: *{full_name}* ({email_lower})\n"
                    f"Phone: *{normalized_phone}*\n"
                    f"Plan: *{plan_tier}* ({_fmt_rwf(mrr_rwf)})\n"
                    f"Proof: *{proof_tag}*\n"
                    "Inspect in Super Admin -> Subscriptions & Billing."
                ),
                scope_key=email_lower,
                target_roles=["super_admin"],
            )
        except Exception as exc:
            logger.warning("Super Admin WhatsApp payment alert skipped: %s", exc)

    # 8. Branded Welcome Email
    try:
        frontend_url = os.getenv("FRONTEND_URL", "https://exbos.pages.dev").strip().rstrip("/")
        login_url = f"{frontend_url}/login"
        send_gmail_email(
            to_email=email_lower,
            subject=f"Welcome to ExBOS — {business_name} is Ready",
            text_body=(
                f"Hello {full_name},\n\n"
                f"Your ExBOS Business Account for {business_name} ({ARCH_LABELS.get(arch_id, arch_id)}) "
                f"has been created via WhatsApp.\n"
                f"Plan: {plan_tier} ({_fmt_rwf(mrr_rwf)})\n"
                f"Web / PWA Login: {login_url}\n"
            ),
            html_body=render_exbos_email(
                category="Welcome to ExBOS",
                title=f"{business_name} Workspace Activated",
                greeting=f"Hello <strong>{full_name}</strong>,",
                intro_html=(
                    f"Your ExBOS Business Operating System account (<strong>{ARCH_LABELS.get(arch_id, arch_id)}</strong>) "
                    f"is live and connected to your WhatsApp number (<strong>{normalized_phone}</strong>)."
                ),
                primary_cta=("Open ExBOS Web Dashboard", login_url),
                footer_note="You can manage your entire business from both WhatsApp and the ExBOS Web/PWA Dashboard using the same email and password.",
                fallback_link=login_url,
            ),
        )
    except Exception as exc:
        logger.warning("Welcome email skipped for %s: %s", email_lower, exc)

    return user_doc


def handle_unregistered_whatsapp_message(
    db: Any,
    normalized_phone: str,
    text: str,
    media_data: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Full 7-step ExBOS Account Setup & Existing Account Linking state machine
    for unregistered phone numbers messaging ExBOS Official WhatsApp.
    """
    clean_text = (text or "").strip()
    upper_text = clean_text.upper()

    session = db.whatsapp_sessions.find_one({"phone": normalized_phone}, {"_id": 0}) or {}
    current_step = session.get("step")
    step_data = dict(session.get("data") or {})
    lang = str(step_data.get("lang") or "en").strip().lower()
    if lang not in ("en", "rw"):
        lang = "en"

    def set_session(step: Optional[str], data: Optional[dict[str, Any]] = None) -> None:
        if step is None:
            db.whatsapp_sessions.delete_one({"phone": normalized_phone})
        else:
            payload = dict(data or {})
            payload.setdefault("lang", lang)
            db.whatsapp_sessions.update_one(
                {"phone": normalized_phone},
                {
                    "$set": {
                        "phone": normalized_phone,
                        "step": step,
                        "data": payload,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
                upsert=True,
            )

    # Instant language switch from anywhere in onboarding (unless typing a password)
    if current_step != "reg_password":
        if upper_text in ("ENGLISH", "EN"):
            lang = "en"
            step_data["lang"] = "en"
            set_session(current_step or "onboard_menu", step_data)
            return {
                "reply": "Language switched to *English*.\n\n" + _build_onboard_menu("en"),
                "action": "onboard_language_changed",
                "language": "en",
            }
        if upper_text in ("KINYARWANDA", "RW", "KIN"):
            lang = "rw"
            step_data["lang"] = "rw"
            set_session(current_step or "onboard_menu", step_data)
            return {
                "reply": "Ururimi rwahinduwe mu *Kinyarwanda*.\n\n" + _build_onboard_menu("rw"),
                "action": "onboard_language_changed",
                "language": "rw",
            }

    # Global reset / greeting when not inside password entry
    if current_step != "reg_password" and (
        upper_text in ONBOARD_GREETING_WORDS
        or upper_text.startswith("HELLO")
        or upper_text.startswith("HI ")
        or upper_text.startswith("HY ")
        or upper_text.startswith("MURAHO")
    ):
        if upper_text.startswith("MURAHO") or upper_text in ("MWARAMUTSE", "MWIRIWE"):
            lang = "rw"
        set_session("onboard_menu", {"lang": lang})
        return {"reply": _build_onboard_menu(lang), "action": "onboard_menu"}

    # Global cancel inside a multi-step onboarding session (except confirm_registration which handles NO itself)
    if (
        current_step
        and current_step not in ("onboard_menu", "confirm_registration", "reg_password")
        and upper_text in CANCEL_WORDS
    ):
        set_session("onboard_menu", {"lang": lang})
        return {
            "reply": _t(
                lang,
                "Setup cancelled. No account was created.\n\n",
                "Gushyiraho konti byahagaritswe. Nta konti yafunguwe.\n\n",
            ) + _build_onboard_menu(lang),
            "action": "onboard_cancelled",
        }

    # =========================================================================
    # 0. UNREGISTERED WELCOME MENU & LANGUAGE PICKER
    # =========================================================================
    if current_step in (None, "onboard_menu"):
        if clean_text == "1":
            set_session("reg_full_name", {"lang": lang})
            return {
                "reply": _t(
                    lang,
                    "*Step 1/7 — Your Full Name:*\nPlease reply with your full name (e.g. *Jean Bosco Habimana*).\nReply *0* to cancel.",
                    "*Intambwe 1/7 — Amazina Yawe Yose:*\nAndika amazina yawe yose (urugero: *Jean Bosco Habimana*).\nSubiza *0* uhagarike.",
                ),
                "action": "reg_full_name",
            }
        if clean_text == "2":
            set_session("link_enter_email", {"lang": lang})
            return {
                "reply": _t(
                    lang,
                    "*Link Existing ExBOS Account*\nPlease enter the *email address* registered on your ExBOS account.\nReply *0* to cancel.",
                    "*Huza Konti ya ExBOS Usanzwe Ufite*\nAndika *imeri (email)* ukoresha kuri konti yawe ya ExBOS.\nSubiza *0* uhagarike.",
                ),
                "action": "link_enter_email",
            }
        if clean_text == "3":
            set_session("onboard_choose_language", {"lang": lang})
            return {
                "reply": (
                    "*Change Language / Hindura Ururimi*\n"
                    "--------------------------------\n"
                    "*1.* English\n"
                    "*2.* Kinyarwanda\n"
                    "--------------------------------\n"
                    "Reply *1* for English or *2* for Kinyarwanda."
                ),
                "action": "onboard_choose_language",
            }
        set_session("onboard_menu", {"lang": lang})
        return {"reply": _build_onboard_menu(lang), "action": "onboard_menu"}

    if current_step == "onboard_choose_language":
        if clean_text == "1":
            lang = "en"
            set_session("onboard_menu", {"lang": "en"})
            return {
                "reply": "Language set to *English*.\n\n" + _build_onboard_menu("en"),
                "action": "onboard_language_changed",
                "language": "en",
            }
        if clean_text == "2":
            lang = "rw"
            set_session("onboard_menu", {"lang": "rw"})
            return {
                "reply": "Ururimi rwahinduwe mu *Kinyarwanda*.\n\n" + _build_onboard_menu("rw"),
                "action": "onboard_language_changed",
                "language": "rw",
            }
        return {
            "reply": "Reply *1* for English or *2* for Kinyarwanda (or *0* to cancel).",
            "action": "onboard_choose_language_retry",
        }

    # =========================================================================
    # FLOW A: LINK EXISTING EXBOS ACCOUNT VIA EMAIL OTP
    # =========================================================================
    if current_step == "link_enter_email":
        email_lower = clean_text.lower()
        if not EMAIL_REGEX.match(email_lower):
            return {
                "reply": _t(
                    lang,
                    "Please enter a valid email address (e.g. *owner@business.rw*), or reply *0* to cancel.",
                    "Andika imeri yemewe (urugero: *owner@business.rw*), cyangwa subiza *0* uhagarike.",
                ),
                "action": "link_enter_email_retry",
            }
        existing = db.users.find_one({"email": email_lower}, {"_id": 0})
        if not existing:
            return {
                "reply": _t(
                    lang,
                    f"No ExBOS account was found for *{email_lower}*.\nCheck the spelling and try again, or reply *0* to create a new account.",
                    f"Nta konti ya ExBOS ibonetse kuri *{email_lower}*.\nReba niba wanditse neza wongere, cyangwa subiza *0* ufungure konti nshya.",
                ),
                "action": "link_email_not_found",
            }
        _send_otp_email(db, email_lower, existing.get("name") or "Business Owner", purpose="whatsapp_link")
        set_session("link_verify_otp", {"lang": lang, "email": email_lower, "userName": existing.get("name") or ""})
        return {
            "reply": _t(
                lang,
                f"A *6-digit verification code* has been sent to *{email_lower}*.\nReply with the 6-digit code to link your WhatsApp.\nReply *RESEND* for a new code or *0* to cancel.",
                f"*Kode y'imibare 6* yoherejwe kuri *{email_lower}*.\nSubiza wandika iyo kode y'imibare 6 uhuze WhatsApp yawe.\nAndika *RESEND* wohereze indi kode cyangwa *0* uhagarike.",
            ),
            "action": "link_otp_sent",
        }

    if current_step == "link_verify_otp":
        email_lower = str(step_data.get("email") or "").strip().lower()
        if upper_text in ("RESEND", "ONGERA"):
            _send_otp_email(db, email_lower, step_data.get("userName") or "Business Owner", purpose="whatsapp_link")
            return {
                "reply": _t(
                    lang,
                    f"A new 6-digit verification code has been sent to *{email_lower}*. Please reply with the code.",
                    f"Kode nshya y'imibare 6 yoherejwe kuri *{email_lower}*. Subiza wandika iyo kode.",
                ),
                "action": "link_otp_resent",
            }
        if not _verify_otp_code(db, email_lower, clean_text, purpose="whatsapp_link"):
            return {
                "reply": _t(
                    lang,
                    "Invalid or expired 6-digit code. Check your email and try again, or reply *RESEND*.",
                    "Kode si yo cyangwa yarangiye. Reba muri imeri wongere ugerageze, cyangwa andika *RESEND*.",
                ),
                "action": "link_otp_invalid",
            }
        now_iso = datetime.now(timezone.utc).isoformat()
        official_num = os.getenv("WHATSAPP_OFFICIAL_NUMBER", "+250 792 946 680")
        db.users.update_one(
            {"email": email_lower},
            {"$set": {"phone": normalized_phone, "enableWhatsAppLink": True, "whatsappLanguage": lang, "updated_at": now_iso}},
        )
        db.integrations.update_one(
            {"userEmail": email_lower},
            {
                "$set": {
                    "userEmail": email_lower,
                    "whatsapp": {
                        "id": "whatsapp",
                        "connected": True,
                        "officialNumber": official_num,
                        "linkedBusinessPhone": normalized_phone,
                        "connectedAt": now_iso,
                    },
                    "updated_at": now_iso,
                }
            },
            upsert=True,
        )
        set_session(None)
        linked_user = db.users.find_one({"email": email_lower}, {"_id": 0}) or {}
        biz_name = linked_user.get("businessName") or linked_user.get("name") or "ExBOS Business"
        arch_id = linked_user.get("architectureId") or "buy-and-sell"
        from app.services.whatsapp_super_admin import is_whatsapp_super_admin
        is_sa = is_whatsapp_super_admin(linked_user)
        return {
            "reply": _t(
                lang,
                f"*WhatsApp Linked Successfully!*\nYour number *{normalized_phone}* is now connected to *{biz_name}*.\n\n",
                f"*WhatsApp Yahujwe Neza!*\nNimero yawe *{normalized_phone}* yahujwe na *{biz_name}*.\n\n",
            ) + build_welcome_message(biz_name, arch_id, official_num, lang=lang, is_super_admin=is_sa),
            "action": "account_linked",
            "email": email_lower,
        }

    # =========================================================================
    # FLOW B: FULL 7-STEP NEW EXBOS ACCOUNT REGISTRATION
    # =========================================================================
    if current_step == "reg_full_name":
        if len(clean_text) < 2:
            return {
                "reply": _t(
                    lang,
                    "Please enter a valid full name (at least 2 characters).",
                    "Andika amazina yemewe (nibura inyuguti 2).",
                ),
                "action": "reg_full_name_retry",
            }
        step_data["fullName"] = clean_text
        if step_data.pop("_editing", False):
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }
        set_session("reg_email", step_data)
        return {
            "reply": _t(
                lang,
                "*Step 2/7 — Business Email Address:*\nEnter your email address. We will send a 6-digit verification code to confirm ownership.",
                "*Intambwe 2/7 — Imeri y'Ubucuruzi (Email):*\nAndika imeri yawe. Tuzakohereza kode y'imibare 6 yo kwemeza ko ari iyawe.",
            ),
            "action": "reg_email",
        }

    if current_step == "reg_email":
        if upper_text == "LINK" and step_data.get("_duplicateEmail"):
            dup_email = step_data["_duplicateEmail"]
            existing = db.users.find_one({"email": dup_email}, {"_id": 0}) or {}
            _send_otp_email(db, dup_email, existing.get("name") or "Business Owner", purpose="whatsapp_link")
            set_session("link_verify_otp", {"lang": lang, "email": dup_email, "userName": existing.get("name") or ""})
            return {
                "reply": _t(
                    lang,
                    f"A 6-digit linking code has been sent to *{dup_email}*. Reply with the code to link your WhatsApp.",
                    f"Kode y'imibare 6 yoherejwe kuri *{dup_email}*. Subiza wandika iyo kode uhuze WhatsApp yawe.",
                ),
                "action": "link_otp_sent",
            }

        email_lower = clean_text.lower()
        if not EMAIL_REGEX.match(email_lower):
            return {
                "reply": _t(
                    lang,
                    "Please enter a valid email address (e.g. *owner@business.rw*).",
                    "Andika imeri yemewe (urugero: *owner@business.rw*).",
                ),
                "action": "reg_email_retry",
            }
        if db.users.find_one({"email": email_lower}):
            step_data["_duplicateEmail"] = email_lower
            set_session("reg_email", step_data)
            return {
                "reply": _t(
                    lang,
                    f"An ExBOS account already exists for *{email_lower}*.\nReply *LINK* to connect this WhatsApp to that existing account, or type a different email address.",
                    f"Konti ya ExBOS isanzwe ihari kuri *{email_lower}*.\nSubiza *LINK* uhuze iyi WhatsApp n'iyo konti, cyangwa wandike indi imeri.",
                ),
                "action": "reg_email_exists",
            }
        step_data.pop("_duplicateEmail", None)
        step_data["email"] = email_lower
        _send_otp_email(db, email_lower, step_data.get("fullName") or "Business Owner", purpose="email_verification")
        set_session("reg_email_otp", step_data)
        return {
            "reply": _t(
                lang,
                f"A *6-digit verification code* has been emailed to *{email_lower}*.\nReply with the 6-digit code to verify your email.\nReply *RESEND* for a new code.",
                f"*Kode y'imibare 6* yoherejwe kuri *{email_lower}*.\nSubiza wandika iyo kode wemeze imeri yawe.\nAndika *RESEND* wohereze indi kode.",
            ),
            "action": "reg_email_otp",
        }

    if current_step == "reg_email_otp":
        email_lower = str(step_data.get("email") or "").strip().lower()
        if upper_text in ("RESEND", "ONGERA"):
            _send_otp_email(db, email_lower, step_data.get("fullName") or "Business Owner", purpose="email_verification")
            return {
                "reply": _t(
                    lang,
                    f"A new 6-digit verification code has been sent to *{email_lower}*. Please enter the code.",
                    f"Kode nshya y'imibare 6 yoherejwe kuri *{email_lower}*. Andika iyo kode.",
                ),
                "action": "reg_email_otp_resent",
            }
        if not _verify_otp_code(db, email_lower, clean_text, purpose="email_verification"):
            return {
                "reply": _t(
                    lang,
                    "Invalid or expired 6-digit code. Check your inbox and try again, or reply *RESEND*.",
                    "Kode si yo cyangwa yarangiye. Reba muri imeri wongere ugerageze, cyangwa andika *RESEND*.",
                ),
                "action": "reg_email_otp_invalid",
            }
        step_data["emailVerified"] = True
        if step_data.pop("_editing", False):
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }
        set_session("reg_password", step_data)
        return {
            "reply": _t(
                lang,
                "*Email Verified!*\n\n*Step 3/7 — Create Account Password:*\nChoose a password (minimum *6 characters*) for your ExBOS Web & Mobile login.\nFor privacy, you may delete your password message from chat right after sending.",
                "*Imeri Yemejwe!*\n\n*Intambwe 3/7 — Shyiraho Ijambo ry'Ibanga (Password):*\nHitamo ijambo ry'ibanga (nibura *inyuguti 6*) ryo kwinjira kuri ExBOS Web & Mobile.\nKu bw'umutekano, ushobora gusiba ubwo butumwa muri chat umaze kubwohereza.",
            ),
            "action": "reg_password",
        }

    if current_step == "reg_password":
        if upper_text in ("0", "CANCEL", "OYA"):
            set_session("onboard_menu", {"lang": lang})
            return {
                "reply": _t(lang, "Registration cancelled.\n\n", "Kwiyandikisha byahagaritswe.\n\n") + _build_onboard_menu(lang),
                "action": "onboard_cancelled",
            }
        if len(clean_text) < 6:
            return {
                "reply": _t(
                    lang,
                    "Password must be at least *6 characters*. Please send a stronger password.",
                    "Ijambo ry'ibanga rigomba kuba rifite nibura *inyuguti 6*. Ongera ugerageze.",
                ),
                "action": "reg_password_retry",
            }
        # Hash immediately with Argon2id — NEVER store plain-text password in session!
        step_data["passwordHash"] = hash_password(clean_text)
        set_session("reg_architecture", step_data)
        return {
            "reply": _t(
                lang,
                "Password secured (encrypted). You may delete your password message above.\n\n",
                "Ijambo ry'ibanga ryabitswe neza mu mutekano. Ushobora gusiba ubwo butumwa hejuru.\n\n",
            ) + _build_architecture_prompt(lang),
            "action": "reg_architecture",
        }

    if current_step == "reg_architecture":
        choice = ARCH_MENU_MAP.get(clean_text)
        if not choice:
            # Also match by text name
            low = clean_text.lower()
            for _, tup in ARCH_MENU_MAP.items():
                if low == tup[0] or low in tup[1].lower():
                    choice = tup
                    break
        if not choice:
            return {
                "reply": _t(
                    lang,
                    "Please reply with a number from *1 to 6* to choose your Business Architecture.",
                    "Subiza umubare hagati ya *1 na 6* uhitemo ubwoko bw'ubucuruzi.",
                ),
                "action": "reg_architecture_retry",
            }
        arch_id = choice[0]
        step_data["architectureId"] = arch_id
        if arch_id == "hybrid":
            set_session("reg_hybrid_activities", step_data)
            return {
                "reply": _t(
                    lang,
                    (
                        "*Hybrid Business — Select Active Modules:*\n"
                        "*1.* Make & Sell\n"
                        "*2.* Buy & Sell\n"
                        "*3.* Service-Based\n"
                        "*4.* Agriculture & Livestock\n"
                        "*5.* Food & Hospitality\n\n"
                        "Reply with the numbers you combine (e.g. *2, 3* or *ALL*)."
                    ),
                    (
                        "*Ubucuruzi Buvanze (Hybrid) — Hitamo Ibice Bikora:*\n"
                        "*1.* Make & Sell\n"
                        "*2.* Buy & Sell\n"
                        "*3.* Services\n"
                        "*4.* Agriculture & Livestock\n"
                        "*5.* Food & Hospitality\n\n"
                        "Subiza imibare uhuza (urugero: *2, 3* cyangwa *ALL*)."
                    ),
                ),
                "action": "reg_hybrid_activities",
            }
        step_data["enabledActivities"] = [arch_id]
        if step_data.pop("_editing", False):
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }
        set_session("reg_business_name", step_data)
        return {
            "reply": _t(
                lang,
                "*Step 5/7 — Business Name:*\nEnter your official Business Name (e.g. *Kigali Fresh Bakery*).",
                "*Intambwe 5/7 — Izina ry'Ubucuruzi:*\nAndika izina ry'ubucuruzi bwawe (urugero: *Kigali Fresh Bakery*).",
            ),
            "action": "reg_business_name",
        }

    if current_step == "reg_hybrid_activities":
        if upper_text in ("ALL", "BYOSE", "SKIP"):
            selected = list(HYBRID_ACTIVITY_OPTIONS.values())
        else:
            nums = re.findall(r"[1-5]", clean_text)
            selected = []
            for n in nums:
                act = HYBRID_ACTIVITY_OPTIONS.get(n)
                if act and act not in selected:
                    selected.append(act)
            if not selected:
                selected = ["buy-and-sell", "services"]
        step_data["enabledActivities"] = selected
        if step_data.pop("_editing", False):
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }
        set_session("reg_business_name", step_data)
        return {
            "reply": _t(
                lang,
                "*Step 5/7 — Business Name:*\nEnter your official Business Name (e.g. *Kigali Fresh Bakery*).",
                "*Intambwe 5/7 — Izina ry'Ubucuruzi:*\nAndika izina ry'ubucuruzi bwawe (urugero: *Kigali Fresh Bakery*).",
            ),
            "action": "reg_business_name",
        }

    if current_step == "reg_business_name":
        if len(clean_text) < 2:
            return {
                "reply": _t(
                    lang,
                    "Please enter a valid Business Name (at least 2 characters).",
                    "Andika izina ry'ubucuruzi ryemewe (nibura inyuguti 2).",
                ),
                "action": "reg_business_name_retry",
            }
        step_data["businessName"] = clean_text
        if step_data.pop("_editing", False):
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }
        set_session("reg_location", step_data)
        return {
            "reply": _t(
                lang,
                "Enter your *Business Location / District* (e.g. *Kigali, Gasabo* or *Musanze*).",
                "Andika *Aho Ubucuruzi Bukorera / Akarere* (urugero: *Kigali, Gasabo* cyangwa *Musanze*).",
            ),
            "action": "reg_location",
        }

    if current_step == "reg_location":
        if len(clean_text) < 2:
            return {
                "reply": _t(
                    lang,
                    "Please enter a valid location or district name.",
                    "Andika izina ry'akarere cyangwa aho ubucuruzi bukorera.",
                ),
                "action": "reg_location_retry",
            }
        step_data["location"] = clean_text
        set_session("reg_category", step_data)
        return {
            "reply": _t(
                lang,
                "Enter your *Business Category / Trade* (e.g. *Electronics*, *Pharmacy*, *Bakery*, *General Trading*).",
                "Andika *Icyiciro cy'Ubucuruzi* (urugero: *Electronics*, *Pharmacy*, *Bakery*, *Ubucuruzi Rusange*).",
            ),
            "action": "reg_category",
        }

    if current_step == "reg_category":
        step_data["businessCategory"] = clean_text if len(clean_text) >= 2 else "Operations"
        if step_data.pop("_editing", False):
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }
        set_session("reg_plan", step_data)
        return {"reply": _build_plan_prompt(db, lang), "action": "reg_plan"}

    if current_step == "reg_plan":
        plans = _load_plan_options(db)
        picked = plans.get(clean_text)
        if not picked:
            low = clean_text.lower()
            for p in plans.values():
                if low == p["key"] or low == p["tier"].lower():
                    picked = p
                    break
        if not picked:
            return {
                "reply": _t(
                    lang,
                    "Please reply with *1* (Free), *2* (Bronze), *3* (Silver), or *4* (Gold).",
                    "Subiza *1* (Free), *2* (Bronze), *3* (Silver), cyangwa *4* (Gold).",
                ),
                "action": "reg_plan_retry",
            }
        step_data["planTier"] = picked["tier"]
        step_data["planPriceRWF"] = picked["priceRWF"]
        if picked["priceRWF"] <= 0:
            step_data["paymentScreenshot"] = ""
            step_data["paymentMessageCopy"] = ""
            step_data["paymentReference"] = ""
            step_data.pop("_editing", None)
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }
        set_session("reg_payment_proof", step_data)
        return {
            "reply": _build_payment_proof_prompt(picked["tier"], picked["priceRWF"], lang),
            "action": "reg_payment_proof",
        }

    if current_step == "reg_payment_proof":
        if upper_text in ("FREE", "UBUNTU"):
            step_data["planTier"] = "Free"
            step_data["planPriceRWF"] = 0
            step_data["paymentScreenshot"] = ""
            step_data["paymentMessageCopy"] = ""
            step_data["paymentReference"] = ""
            step_data.pop("_editing", None)
            set_session("confirm_registration", step_data)
            return {
                "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
                "action": "confirm_registration",
            }

        has_img = bool(media_data and media_data.get("dataUri"))
        too_large = bool(media_data and media_data.get("tooLarge"))
        caption_or_sms = clean_text or str((media_data or {}).get("caption") or "").strip()

        if too_large and not caption_or_sms:
            return {
                "reply": _t(
                    lang,
                    "That screenshot image exceeds 4 MB. Please send a smaller screenshot or paste your MoMo/Airtel SMS confirmation text.",
                    "Iyo foto irenze 4 MB. Ohereza ifoto ntoya cyangwa wandike ubutumwa bwa SMS bwemeza ko wishyuye.",
                ),
                "action": "reg_payment_proof_too_large",
            }

        if not has_img and len(caption_or_sms) < 8:
            return {
                "reply": _t(
                    lang,
                    "Please send a *WhatsApp Screenshot / Photo* of your payment confirmation OR paste the full *MoMo/Airtel SMS* message (or reply *FREE* for the Free plan).",
                    "Ohereza *Ifoto (Screenshot)* y'ubwishyu CYANGWA *ubutumwa bwa SMS* bwose bwemeza ko wishyuye (cyangwa andika *FREE* uhitemo Ubuntu).",
                ),
                "action": "reg_payment_proof_retry",
            }

        if has_img:
            step_data["paymentScreenshot"] = str(media_data["dataUri"])
        if caption_or_sms:
            step_data["paymentMessageCopy"] = caption_or_sms
        step_data["paymentMethod"] = "MTN MoMo / Airtel Money (+250 781 963 981)"
        step_data["paymentReference"] = (
            caption_or_sms[:60] if caption_or_sms else "WhatsApp Payment Screenshot"
        )
        step_data.pop("_editing", None)
        set_session("confirm_registration", step_data)
        return {
            "reply": _build_registration_verification_card(step_data, normalized_phone, lang),
            "action": "confirm_registration",
        }

    # =========================================================================
    # STEP 7: VERIFY BEFORE SAVING (YES / EDIT / NO)
    # =========================================================================
    if current_step == "confirm_registration":
        if upper_text in CANCEL_WORDS or clean_text == "0":
            set_session("onboard_menu", {"lang": lang})
            return {
                "reply": _t(
                    lang,
                    "Registration cancelled. No account was created.\n\n",
                    "Kwiyandikisha byahagaritswe. Nta konti yafunguwe.\n\n",
                ) + _build_onboard_menu(lang),
                "action": "onboard_cancelled",
            }
        if upper_text in EDIT_WORDS:
            set_session("reg_edit_pick", step_data)
            return {
                "reply": _t(
                    lang,
                    (
                        "*EDIT REGISTRATION — Choose what to change:*\n"
                        "*1.* Full Name\n"
                        "*2.* Business Name\n"
                        "*3.* Location & Category\n"
                        "*4.* Business Architecture\n"
                        "*5.* Subscription Plan\n"
                        "*6.* Payment Proof (Screenshot / SMS)\n"
                        "*0.* Cancel Registration"
                    ),
                    (
                        "*HINDURA KWIYANDIKISHA — Hitamo icyo ushaka guhindura:*\n"
                        "*1.* Amazina Yawe\n"
                        "*2.* Izina ry'Ubucuruzi\n"
                        "*3.* Aho Bukorera n'Icyiciro\n"
                        "*4.* Ubwoko bw'Ubucuruzi (Architecture)\n"
                        "*5.* Ifatabuguzi (Plan)\n"
                        "*6.* Icyemezo cy'Ubwishyu (Ifoto / SMS)\n"
                        "*0.* Hagarika Kwiyandikisha"
                    ),
                ),
                "action": "reg_edit_pick",
            }
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Please reply *YES* to create your ExBOS account, *EDIT* to change a detail, or *NO* to cancel.",
                    "Subiza *YEGO* ufungure konti ya ExBOS, *HINDURA* ugire icyo ukosora, cyangwa *OYA* uhagarike.",
                ),
                "action": "awaiting_registration_confirmation",
            }

        # Double-check email uniqueness before creating
        email_lower = str(step_data.get("email") or "").strip().lower()
        if db.users.find_one({"email": email_lower}):
            set_session("onboard_menu", {"lang": lang})
            return {
                "reply": _t(
                    lang,
                    f"An account for *{email_lower}* already exists. Reply *2* to link your WhatsApp to it.",
                    f"Konti ya *{email_lower}* isanzwe ihari. Subiza *2* uhuze WhatsApp yawe nayo.",
                ),
                "action": "reg_email_exists",
            }

        created_user = _provision_whatsapp_account(db, normalized_phone, step_data, lang)
        set_session(None)
        biz_name = created_user.get("businessName") or "ExBOS Business"
        arch_id = created_user.get("architectureId") or "buy-and-sell"
        official_num = os.getenv("WHATSAPP_OFFICIAL_NUMBER", "+250 792 946 680")
        frontend_url = os.getenv("FRONTEND_URL", "https://exbos.pages.dev").strip().rstrip("/")
        login_url = f"{frontend_url}/login"

        header_msg = _t(
            lang,
            (
                "*EXBOS ACCOUNT CREATED SUCCESSFULLY!*\n"
                f"Business: *{biz_name}*\n"
                f"Architecture: *{ARCH_LABELS.get(arch_id, arch_id)}*\n"
                f"Plan: *{created_user.get('planTier', 'Free')}*\n"
                f"Web / PWA Login: {login_url}\n"
                f"Email: *{email_lower}*\n\n"
            ),
            (
                "*KONTI YA EXBOS YAFUNGUWE NEZA!*\n"
                f"Ubucuruzi: *{biz_name}*\n"
                f"Ubwoko: *{ARCH_LABELS.get(arch_id, arch_id)}*\n"
                f"Ifatabuguzi: *{created_user.get('planTier', 'Free')}*\n"
                f"Kwinjira kuri Web / PWA: {login_url}\n"
                f"Imeri: *{email_lower}*\n\n"
            ),
        )
        return {
            "reply": header_msg + build_welcome_message(biz_name, arch_id, official_num, lang=lang),
            "action": "registration_completed",
            "email": email_lower,
            "businessId": created_user.get("businessId"),
            "planTier": created_user.get("planTier"),
        }

    if current_step == "reg_edit_pick":
        step_data["_editing"] = True
        if clean_text == "1":
            set_session("reg_full_name", step_data)
            return {
                "reply": _t(lang, "Enter your updated *Full Name*:", "Andika *Amazina Yawe* mashya:"),
                "action": "reg_edit_full_name",
            }
        if clean_text == "2":
            set_session("reg_business_name", step_data)
            return {
                "reply": _t(lang, "Enter your updated *Business Name*:", "Andika *Izina ry'Ubucuruzi* rishya:"),
                "action": "reg_edit_business_name",
            }
        if clean_text == "3":
            set_session("reg_location", step_data)
            return {
                "reply": _t(lang, "Enter your updated *Location / District*:", "Andika *Aho Ubucuruzi Bukorera* hashya:"),
                "action": "reg_edit_location",
            }
        if clean_text == "4":
            set_session("reg_architecture", step_data)
            return {"reply": _build_architecture_prompt(lang), "action": "reg_edit_architecture"}
        if clean_text == "5":
            set_session("reg_plan", step_data)
            return {"reply": _build_plan_prompt(db, lang), "action": "reg_edit_plan"}
        if clean_text == "6":
            plan_tier = str(step_data.get("planTier") or "Free")
            price_rwf = int(step_data.get("planPriceRWF") or 0)
            if price_rwf <= 0:
                set_session("reg_plan", step_data)
                return {
                    "reply": _t(
                        lang,
                        "You are currently on the Free plan. Choose a paid plan first:\n\n",
                        "Uri ku ifatabuguzi ry'ubuntu. Banza uhitemo ifatabuguzi ryishyurwa:\n\n",
                    ) + _build_plan_prompt(db, lang),
                    "action": "reg_edit_plan",
                }
            set_session("reg_payment_proof", step_data)
            return {
                "reply": _build_payment_proof_prompt(plan_tier, price_rwf, lang),
                "action": "reg_edit_payment_proof",
            }
        return {
            "reply": _t(
                lang,
                "Reply *1–6* to edit a field, or *0* to cancel registration.",
                "Subiza *1–6* uhindure amakuru, cyangwa *0* uhagarike.",
            ),
            "action": "reg_edit_pick_retry",
        }

    # Fallback: show onboarding menu
    set_session("onboard_menu", {"lang": lang})
    return {"reply": _build_onboard_menu(lang), "action": "onboard_menu"}

