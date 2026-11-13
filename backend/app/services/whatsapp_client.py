import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Optional

import requests

logger = logging.getLogger(__name__)

ARCH_LABELS = {
    "buy-and-sell": "Buy & Sell",
    "make-and-sell": "Make & Sell",
    "services": "Service-Based Business",
    "agriculture": "Agriculture & Livestock",
    "food-hospitality": "Food & Hospitality",
    "hybrid": "Hybrid Enterprise",
}


def normalize_phone(phone: str) -> str:
    """Normalize local or international phone strings into E.164 digits with leading '+'."""
    raw = str(phone or "").strip()
    if not raw:
        return ""
    digits = re.sub(r"[^\d+]", "", raw)
    if digits.startswith("+"):
        return digits
    if digits.startswith("00"):
        return "+" + digits[2:]
    if digits.startswith("250"):
        return "+" + digits
    if digits.startswith("07") and len(digits) == 10:
        return "+250" + digits[1:]
    if len(digits) == 9 and digits.startswith("7"):
        return "+250" + digits
    return "+" + digits if digits else ""


def is_meta_configured() -> bool:
    """Return True when Meta WhatsApp Cloud API credentials are present."""
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    return bool(token and phone_id)


def build_welcome_message(
    business_name: str,
    architecture_id: str = "buy-and-sell",
    official_number: str = "+250 781 963 981",
) -> str:
    """Build the official ExBOS WhatsApp welcome message and structured menu."""
    arch_label = ARCH_LABELS.get(architecture_id, "Buy & Sell")
    return (
        f"Welcome to *EXCELLENCE BOS* Official WhatsApp ({official_number})!\n\n"
        f"Your business *{business_name}* (*{arch_label}*) is now automatically connected.\n\n"
        "Reply with a *Menu Number* or *Fast Command* anytime:\n"
        "*0* - Show Main Menu\n"
        "*1* - View All Products / Items in Database\n"
        "*2* - Record a Sale\n"
        "*3* - Record a Purchase / Restock\n"
        "*4* - Record an Expense\n"
        "*5* - Get Live Business Report (Sales, P&L, Stock)\n"
        "*6* - View Unpaid Customers & Send Reminders\n"
        "*7* - Verify Customer Payment\n"
        "*8* - Add New Product / Item\n\n"
        "Example fast commands:\n"
        "- `PRODUCTS`\n"
        "- `SALE 2 iPhone 300000`\n"
        "- `EXPENSE Transport 5000`\n"
        "- `REPORT`"
    )


def send_whatsapp_message(
    to_phone: str,
    message_text: str,
    db: Any = None,
    metadata: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Send a WhatsApp text message via Meta WhatsApp Cloud API when configured,
    or log/queue it in MongoDB when Meta credentials are not yet supplied.
    """
    normalized = normalize_phone(to_phone)
    now_iso = datetime.now(timezone.utc).isoformat()
    meta_ready = is_meta_configured()

    result: dict[str, Any] = {
        "to": normalized,
        "message": message_text,
        "metaConfigured": meta_ready,
        "sent": False,
        "status": "queued_awaiting_meta_config",
        "timestamp": now_iso,
        "providerId": None,
        "error": None,
    }

    if not normalized:
        result["status"] = "skipped_missing_phone"
        result["error"] = "Missing destination phone number."
        return result

    if meta_ready:
        token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
        phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
        url = f"https://graph.facebook.com/v20.0/{phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": normalized.lstrip("+"),
            "type": "text",
            "text": {"preview_url": False, "body": message_text},
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=12)
            data = resp.json() if resp.content else {}
            if resp.ok:
                msg_ids = data.get("messages") or []
                result["sent"] = True
                result["status"] = "sent"
                result["providerId"] = msg_ids[0].get("id") if msg_ids else None
            else:
                err_msg = (data.get("error") or {}).get("message") or f"HTTP {resp.status_code}"
                result["status"] = "failed"
                result["error"] = err_msg
                logger.warning("Meta WhatsApp send error to %s: %s", normalized, err_msg)
        except Exception as exc:
            result["status"] = "failed"
            result["error"] = str(exc)
            logger.exception("Meta WhatsApp request failed")
    else:
        logger.info("WhatsApp message queued (Meta credentials not yet set) -> %s", normalized)

    if db is not None:
        try:
            log_doc = {
                **result,
                "direction": "outbound",
                "metadata": metadata or {},
            }
            db.whatsapp_messages.insert_one(log_doc)
        except Exception as exc:
            logger.warning("Failed to log outbound WhatsApp message: %s", exc)

    return result

