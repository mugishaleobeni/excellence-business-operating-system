import logging
import os
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.database import get_db
from app.services.whatsapp_client import (
    build_welcome_message,
    is_meta_configured,
    normalize_phone,
    send_whatsapp_message,
)
from app.services.whatsapp_engine import (
    get_unpaid_customers_summary,
    handle_incoming_whatsapp_message,
    send_debt_reminders,
    verify_customer_payment,
)
from app.utils.responses import error_response, success_response

logger = logging.getLogger(__name__)
whatsapp_bp = Blueprint("whatsapp", __name__, url_prefix="/api/v1/whatsapp")


def _resolve_active_user(db):
    email = ""
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        if isinstance(ident, str) and ident.strip():
            email = ident.strip().lower()
    except Exception:
        pass

    if not email:
        arg_scope = (request.args.get("scopeKey") or "").strip().lower()
        if arg_scope and arg_scope != "default":
            email = arg_scope

    if email:
        user_doc = db.users.find_one({"email": email}, {"_id": 0})
        if user_doc:
            return user_doc

    snap = db.platform_config.find_one({"key": "active_user_snapshot"})
    if snap and isinstance(snap.get("value"), dict):
        snap_email = (snap["value"].get("email") or "").strip().lower()
        if snap_email:
            user_doc = db.users.find_one({"email": snap_email}, {"_id": 0})
            if user_doc:
                return user_doc

    return db.users.find_one({}, {"_id": 0}, sort=[("created_at", -1)])


@whatsapp_bp.route("/status", methods=["GET"])
def whatsapp_status():
    """Return Meta Cloud API readiness and user's WhatsApp connection status."""
    db = get_db()
    user_doc = _resolve_active_user(db)
    official_num = os.getenv("WHATSAPP_OFFICIAL_NUMBER", "+250 781 963 981")
    linked_phone = normalize_phone(user_doc.get("phone", "")) if user_doc else ""
    integ = None
    if user_doc:
        integ = db.integrations.find_one({"userEmail": user_doc.get("email")}, {"_id": 0})
    wa_integ = (integ or {}).get("whatsapp") or {}

    return success_response(
        data={
            "metaConfigured": is_meta_configured(),
            "officialNumber": official_num,
            "connected": bool(wa_integ.get("connected", bool(linked_phone))),
            "linkedBusinessPhone": wa_integ.get("linkedBusinessPhone") or linked_phone,
            "architectureId": (user_doc or {}).get("architectureId", "buy-and-sell"),
        },
        message="WhatsApp integration status fetched.",
    )


@whatsapp_bp.route("/webhook", methods=["GET"])
def verify_meta_webhook():
    """Meta WhatsApp Cloud API Webhook verification endpoint."""
    mode = request.args.get("hub.mode")
    token = request.args.get("hub.verify_token")
    challenge = request.args.get("hub.challenge")
    expected_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "exbos-whatsapp-verify-2026")

    if mode == "subscribe" and token == expected_token:
        return str(challenge or ""), 200
    return error_response("Webhook verification token mismatch.", status_code=403)


@whatsapp_bp.route("/webhook", methods=["POST"])
def receive_meta_webhook():
    """Meta WhatsApp Cloud API incoming message webhook."""
    db = get_db()
    payload = request.get_json(silent=True) or {}
    processed = []

    for entry in payload.get("entry") or []:
        for change in entry.get("changes") or []:
            value = change.get("value") or {}
            for msg in value.get("messages") or []:
                from_phone = msg.get("from", "")
                msg_type = msg.get("type", "text")
                text_body = ""
                if msg_type == "text":
                    text_body = (msg.get("text") or {}).get("body", "")
                elif msg_type == "interactive":
                    inter = msg.get("interactive") or {}
                    text_body = (
                        (inter.get("button_reply") or {}).get("id")
                        or (inter.get("list_reply") or {}).get("id")
                        or ""
                    )

                if from_phone and text_body:
                    db.whatsapp_messages.insert_one({
                        "direction": "inbound",
                        "from": normalize_phone(from_phone),
                        "message": text_body,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    engine_res = handle_incoming_whatsapp_message(db, from_phone, text_body)
                    send_res = send_whatsapp_message(
                        from_phone,
                        engine_res["reply"],
                        db=db,
                        metadata={"action": engine_res.get("action")},
                    )
                    processed.append({
                        "from": normalize_phone(from_phone),
                        "action": engine_res.get("action"),
                        "delivery": send_res.get("status"),
                    })

    return success_response(data={"processed": processed}, message="Webhook processed.")


@whatsapp_bp.route("/connect", methods=["POST"])
def connect_official_whatsapp():
    """Link user's phone to Official ExBOS WhatsApp and dispatch Welcome Message."""
    db = get_db()
    payload = request.get_json(silent=True) or {}
    user_doc = _resolve_active_user(db)
    if not user_doc:
        return error_response("Authenticated business user not found.", status_code=404)

    phone_input = payload.get("phone") or user_doc.get("phone") or ""
    normalized = normalize_phone(phone_input)
    if not normalized:
        return error_response("A valid WhatsApp phone number is required.", status_code=400)

    user_email = user_doc.get("email")
    arch_id = payload.get("architectureId") or user_doc.get("architectureId") or "buy-and-sell"
    business_name = user_doc.get("businessName") or user_doc.get("name") or "ExBOS Business"
    official_num = os.getenv("WHATSAPP_OFFICIAL_NUMBER", "+250 781 963 981")
    now_iso = datetime.now(timezone.utc).isoformat()

    db.users.update_one({"email": user_email}, {"$set": {"phone": normalized, "enableWhatsAppLink": True}})
    db.integrations.update_one(
        {"userEmail": user_email},
        {
            "$set": {
                "userEmail": user_email,
                "whatsapp": {
                    "id": "whatsapp",
                    "connected": True,
                    "officialNumber": official_num,
                    "linkedBusinessPhone": normalized,
                    "connectedAt": now_iso,
                },
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )

    welcome_text = build_welcome_message(business_name, arch_id, official_num)
    delivery = send_whatsapp_message(
        normalized,
        welcome_text,
        db=db,
        metadata={"type": "welcome_message", "userEmail": user_email},
    )

    return success_response(
        data={
            "connected": True,
            "officialNumber": official_num,
            "linkedBusinessPhone": normalized,
            "welcomeMessage": welcome_text,
            "delivery": delivery,
        },
        message="Official ExBOS WhatsApp connected and welcome message dispatched.",
    )


@whatsapp_bp.route("/simulate", methods=["POST"])
def simulate_whatsapp_command():
    """Execute the deterministic WhatsApp engine directly from Dashboard Simulator."""
    db = get_db()
    payload = request.get_json(silent=True) or {}
    text = (payload.get("message") or "").strip()
    if not text:
        return error_response("Message text is required.", status_code=400)

    user_doc = _resolve_active_user(db)
    if not user_doc:
        return error_response("No active business user found.", status_code=404)

    from_phone = payload.get("phone") or user_doc.get("phone") or "+250788000000"
    res = handle_incoming_whatsapp_message(db, from_phone, text, user_doc=user_doc)
    return success_response(data=res, message="WhatsApp command processed.")


@whatsapp_bp.route("/unpaid", methods=["GET"])
def list_unpaid_customers():
    """List all unpaid / part-paid customers with products bought, paid, and remaining amounts."""
    db = get_db()
    user_doc = _resolve_active_user(db)
    if not user_doc:
        return error_response("User workspace not found.", status_code=404)

    scope_key = user_doc.get("email", "").strip().lower()
    arch_id = request.args.get("archId") or user_doc.get("architectureId") or "buy-and-sell"
    items = get_unpaid_customers_summary(db, scope_key, arch_id)
    return success_response(
        data={"unpaid": items, "count": len(items)},
        message="Unpaid customers fetched.",
    )


@whatsapp_bp.route("/reminders/send", methods=["POST"])
def send_reminders_route():
    """Send itemized WhatsApp debt reminders (single or bulk 'ALL')."""
    db = get_db()
    payload = request.get_json(silent=True) or {}
    user_doc = _resolve_active_user(db)
    if not user_doc:
        return error_response("User workspace not found.", status_code=404)

    scope_key = user_doc.get("email", "").strip().lower()
    arch_id = payload.get("archId") or user_doc.get("architectureId") or "buy-and-sell"
    business_name = user_doc.get("businessName") or user_doc.get("name") or "ExBOS Business"
    target_id = payload.get("targetId") or "ALL"

    res = send_debt_reminders(
        db,
        scope_key,
        arch_id,
        target_id=target_id,
        business_name=business_name,
    )
    return success_response(data=res, message="Debt reminders processed.")


@whatsapp_bp.route("/reminders/verify", methods=["POST"])
def verify_payment_route():
    """Business owner verifies customer payment -> clears from unpaid list & posts INFLOW."""
    db = get_db()
    payload = request.get_json(silent=True) or {}
    user_doc = _resolve_active_user(db)
    if not user_doc:
        return error_response("User workspace not found.", status_code=404)

    target_id = payload.get("targetId") or payload.get("recordId") or ""
    if not target_id:
        return error_response("targetId is required to verify payment.", status_code=400)

    scope_key = user_doc.get("email", "").strip().lower()
    arch_id = payload.get("archId") or user_doc.get("architectureId") or "buy-and-sell"
    amount = payload.get("amount")
    payment_method = payload.get("paymentMethod") or "MoMo / Cash"

    res = verify_customer_payment(
        db,
        scope_key,
        arch_id,
        target_id=str(target_id),
        amount=float(amount) if amount is not None else None,
        payment_method=payment_method,
        source="Dashboard",
    )
    if not res.get("ok"):
        return error_response(res.get("error", "Verification failed."), status_code=404)

    return success_response(data=res, message="Customer payment verified and ledger updated.")

