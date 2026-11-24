import base64
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from urllib.parse import quote

import requests

logger = logging.getLogger(__name__)

DEFAULT_ALERTS_CONFIG = {
    "branchManagerActivated": True,
    "paymentProofSubmitted": True,
    "lowStockAlert": True,
    "dailySummary": True,
}


def build_wa_me_link(to_phone: str, message_text: str) -> str:
    """Build a 1-click wa.me fallback deep link pre-filled with the exact message."""
    normalized = normalize_phone(to_phone)
    digits = normalized.lstrip("+")
    if not digits:
        return ""
    return f"https://wa.me/{digits}?text={quote(str(message_text or ''))}"


def get_whatsapp_delivery_config(db: Any) -> dict[str, Any]:
    """Load platform WhatsApp Sandbox/Production mode, registered recipients, and alert switches."""
    default_cfg = {
        "mode": os.getenv("WHATSAPP_MODE", "sandbox").strip().lower() or "sandbox",
        "registeredRecipients": [],
        "alerts": dict(DEFAULT_ALERTS_CONFIG),
    }
    if db is None:
        return default_cfg
    doc = db.platform_config.find_one({"key": "whatsapp_delivery_config"}, {"_id": 0})
    val = (doc or {}).get("value") if isinstance((doc or {}).get("value"), dict) else {}
    mode = str(val.get("mode") or default_cfg["mode"]).strip().lower()
    if mode not in ("sandbox", "production"):
        mode = "sandbox"
    recipients = val.get("registeredRecipients") if isinstance(val.get("registeredRecipients"), list) else []
    alerts = {**DEFAULT_ALERTS_CONFIG, **(val.get("alerts") if isinstance(val.get("alerts"), dict) else {})}
    return {
        "mode": mode,
        "registeredRecipients": recipients,
        "alerts": alerts,
    }


def save_whatsapp_delivery_config(db: Any, config: dict[str, Any]) -> dict[str, Any]:
    """Persist WhatsApp delivery config in MongoDB platform_config."""
    now_iso = datetime.now(timezone.utc).isoformat()
    clean = {
        "mode": "production" if str(config.get("mode") or "").lower() == "production" else "sandbox",
        "registeredRecipients": config.get("registeredRecipients") or [],
        "alerts": {**DEFAULT_ALERTS_CONFIG, **(config.get("alerts") or {})},
        "updatedAt": now_iso,
    }
    if db is not None:
        db.platform_config.update_one(
            {"key": "whatsapp_delivery_config"},
            {"$set": {"key": "whatsapp_delivery_config", "value": clean, "updated_at": now_iso}},
            upsert=True,
        )
    return clean


def record_inbound_session(db: Any, phone: str) -> None:
    """Record the latest inbound WhatsApp timestamp so ExBOS tracks the 24-hour customer service window."""
    normalized = normalize_phone(phone)
    if not normalized or db is None:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db.whatsapp_window_sessions.update_one(
            {"phone": normalized},
            {"$set": {"phone": normalized, "lastInboundAt": now_iso, "updatedAt": now_iso}},
            upsert=True,
        )
    except Exception as exc:
        logger.debug("Could not record inbound WhatsApp session: %s", exc)


def get_session_window_status(db: Any, phone: str) -> dict[str, Any]:
    """Return whether the 24-hour Meta customer service window is open for this phone number."""
    normalized = normalize_phone(phone)
    if not normalized or db is None:
        return {"sessionWindowOpen": False, "hoursRemaining": 0.0, "lastInboundAt": None}
    doc = db.whatsapp_window_sessions.find_one({"phone": normalized}, {"_id": 0})
    last_iso = (doc or {}).get("lastInboundAt")
    if not last_iso:
        return {"sessionWindowOpen": False, "hoursRemaining": 0.0, "lastInboundAt": None}
    try:
        last_dt = datetime.fromisoformat(str(last_iso))
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        expires_dt = last_dt + timedelta(hours=24)
        remaining_sec = (expires_dt - datetime.now(timezone.utc)).total_seconds()
        if remaining_sec > 0:
            return {
                "sessionWindowOpen": True,
                "hoursRemaining": round(remaining_sec / 3600.0, 1),
                "lastInboundAt": last_iso,
            }
    except Exception:
        pass
    return {"sessionWindowOpen": False, "hoursRemaining": 0.0, "lastInboundAt": last_iso}

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


def download_meta_media_as_data_uri(
    media_id: str,
    max_bytes: int = 4 * 1024 * 1024,
) -> Optional[dict[str, Any]]:
    """
    Download an incoming WhatsApp media file (e.g. MoMo/Airtel payment screenshot) from Meta Graph API
    and return a base64 data URI compatible with Super Admin's payment screenshot viewer.
    """
    clean_id = str(media_id or "").strip()
    token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
    if not clean_id or not token:
        return None

    headers = {"Authorization": f"Bearer {token}"}
    try:
        meta_resp = requests.get(
            f"https://graph.facebook.com/v20.0/{clean_id}",
            headers=headers,
            timeout=12,
        )
        if not meta_resp.ok:
            logger.warning("Meta media lookup failed for %s: HTTP %s", clean_id, meta_resp.status_code)
            return None
        meta_json = meta_resp.json() if meta_resp.content else {}
        media_url = str(meta_json.get("url") or "").strip()
        mime_type = str(meta_json.get("mime_type") or "image/jpeg").strip()
        if not media_url:
            return None

        bin_resp = requests.get(media_url, headers=headers, timeout=15)
        if not bin_resp.ok or not bin_resp.content:
            logger.warning("Meta media download failed for %s: HTTP %s", clean_id, bin_resp.status_code)
            return None
        content = bin_resp.content
        if len(content) > max_bytes:
            logger.warning("Meta media %s exceeds %d bytes limit (%d bytes)", clean_id, max_bytes, len(content))
            return {"mediaId": clean_id, "mimeType": mime_type, "sizeBytes": len(content), "tooLarge": True, "dataUri": ""}

        b64 = base64.b64encode(content).decode("ascii")
        return {
            "mediaId": clean_id,
            "mimeType": mime_type,
            "sizeBytes": len(content),
            "tooLarge": False,
            "dataUri": f"data:{mime_type};base64,{b64}",
        }
    except Exception as exc:
        logger.warning("Failed to download Meta media %s: %s", clean_id, exc)
        return None


def build_welcome_message(
    business_name: str,
    architecture_id: str = "buy-and-sell",
    official_number: str = "+250 792 946 680",
    lang: str = "en",
    is_super_admin: bool = False,
) -> str:
    """Build the official ExBOS executive WhatsApp menu in English or Kinyarwanda."""
    arch_label = ARCH_LABELS.get(architecture_id, "Buy & Sell")
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        sa_line = "*10.* Ubuyobozi Bukuru (Super Admin Command Center)\n" if is_super_admin else ""
        return (
            f"*EXCELLENCE BOS — Sisitemu y'Ubucuruzi*\n"
            f"Ubucuruzi: *{business_name}* ({arch_label})\n"
            "--------------------------------\n"
            "Subiza *Umubare* w'ibyo ushaka:\n"
            "*1.* Reba, Hindura & Siba Ibicuruzwa (Ububiko)\n"
            "*2.* Andika Ibigiye Kugurishwa (Intambwe ku ntambwe)\n"
            "*3.* Andika Ibyaranguwe / Kongera Ububiko\n"
            "*4.* Andika Amafaranga Yakoreshejwe\n"
            "*5.* Raporo y'Ubucuruzi (Inyungu, Ububiko ,...)\n"
            "*6.* Abakiriya Batarishyura no kubibutsa\n"
            "*7.* Emeza Ubwishyu bw'Umukiriya\n"
            "*8.* Ongeramo Igicuruzwa Gishya\n"
            "*9.* Hindura Ururimi (English / Kinyarwanda)\n"
            f"{sa_line}"
            "*0.* Ahabanza / Hagarika\n"
            "--------------------------------\n"
            "Buri gikorwa kibanze kigusaba *Kugenzura (YEGO / HINDURA / OYA)* mbere yo kubikwa."
        )
    sa_line = "*10.* Super Admin Command Center (Platform Control)\n" if is_super_admin else ""
    return (
        f"*EXCELLENCE BOS — Official Business Console*\n"
        f"Business: *{business_name}* ({arch_label})\n"
        "--------------------------------\n"
        "Reply with a *Menu Number*:\n"
        "*1.* View, Edit & Delete Products (Live Stock)\n"
        "*2.* Record a Sale (Step-by-Step)\n"
        "*3.* Record a Purchase / Restock\n"
        "*4.* Record an Expense\n"
        "*5.* Live Business Report (Sales, P&L, Stock)\n"
        "*6.* Unpaid Customers & Reminders\n"
        "*7.* Verify Customer Payment\n"
        "*8.* Add New Product\n"
        "*9.* Change Language (English / Kinyarwanda)\n"
        f"{sa_line}"
        "*0.* Main Menu / Cancel\n"
        "--------------------------------\n"
        "Every entry shows a *Verification Summary* (*YES / EDIT / NO*) before saving."
    )


def send_whatsapp_message(
    to_phone: str,
    message_text: str,
    db: Any = None,
    metadata: Optional[dict[str, Any]] = None,
    force_template: bool = False,
) -> dict[str, Any]:
    """
    Send a WhatsApp text/template message via Meta WhatsApp Cloud API with Hybrid Sandbox awareness:
    - In 'sandbox' mode, numbers outside Registered Recipients gracefully return a 1-click wa.me fallback
      instead of hitting Meta error #131030.
    - Tracks 24-hour session window status and automatically falls back to Meta template on 131047/131026.
    """
    normalized = normalize_phone(to_phone)
    now_iso = datetime.now(timezone.utc).isoformat()
    meta_ready = is_meta_configured()
    wa_me_link = build_wa_me_link(normalized, message_text)

    cfg = get_whatsapp_delivery_config(db)
    mode = cfg.get("mode", "sandbox")
    registered_phones = {
        normalize_phone(r.get("phone", ""))
        for r in (cfg.get("registeredRecipients") or [])
        if r.get("phone")
    }
    is_registered = normalized in registered_phones if normalized else False
    window_info = get_session_window_status(db, normalized)

    result: dict[str, Any] = {
        "to": normalized,
        "message": message_text,
        "metaConfigured": meta_ready,
        "mode": mode,
        "isRegisteredRecipient": is_registered,
        "sessionWindowOpen": window_info["sessionWindowOpen"],
        "windowHoursLeft": window_info["hoursRemaining"],
        "waMeLink": wa_me_link,
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

    # Hybrid Sandbox Guard: if in sandbox mode and recipient is not registered in Meta's test list,
    # return clean wa.me fallback rather than failing with Meta #131030.
    if mode == "sandbox" and registered_phones and not is_registered:
        result["status"] = "sandbox_fallback_wa_me"
        result["note"] = (
            "Sandbox Mode: This number is not in your Meta Registered Recipients list yet. "
            "Use the 1-click WhatsApp (wa.me) link or add the number to Registered Recipients."
        )
    elif meta_ready:
        token = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
        phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
        url = f"https://graph.facebook.com/v20.0/{phone_id}/messages"
        template_name = os.getenv("WHATSAPP_WELCOME_TEMPLATE", "hello_world").strip()
        template_lang = os.getenv("WHATSAPP_WELCOME_TEMPLATE_LANG", "en_US").strip()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        try:
            if force_template and template_name:
                payload = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": normalized.lstrip("+"),
                    "type": "template",
                    "template": {
                        "name": template_name,
                        "language": {"code": template_lang},
                    },
                }
            else:
                payload = {
                    "messaging_product": "whatsapp",
                    "recipient_type": "individual",
                    "to": normalized.lstrip("+"),
                    "type": "text",
                    "text": {"preview_url": False, "body": message_text},
                }

            resp = requests.post(url, json=payload, headers=headers, timeout=12)
            data = resp.json() if resp.content else {}
            if resp.ok:
                msg_ids = data.get("messages") or []
                result["sent"] = True
                result["status"] = "sent_template" if force_template else "sent"
                if force_template:
                    result["templateUsed"] = template_name
                result["providerId"] = msg_ids[0].get("id") if msg_ids else None
            else:
                err_obj = data.get("error") or {}
                err_code = err_obj.get("code")
                err_msg = err_obj.get("message") or f"HTTP {resp.status_code}"
                if err_code == 131030:
                    result["status"] = "sandbox_fallback_wa_me"
                    result["error"] = "Meta #131030: Recipient phone number not added to Meta Developer allowed test list."
                    result["note"] = "Add this number in Meta WhatsApp API Setup -> Manage phone number list, or use the 1-click wa.me link."
                elif not force_template and template_name and (
                    err_code in (131047, 131026) or "24" in err_msg or "re-engagement" in err_msg.lower()
                ):
                    tpl_payload = {
                        "messaging_product": "whatsapp",
                        "recipient_type": "individual",
                        "to": normalized.lstrip("+"),
                        "type": "template",
                        "template": {
                            "name": template_name,
                            "language": {"code": template_lang},
                        },
                    }
                    tpl_resp = requests.post(url, json=tpl_payload, headers=headers, timeout=12)
                    tpl_data = tpl_resp.json() if tpl_resp.content else {}
                    if tpl_resp.ok:
                        msg_ids = tpl_data.get("messages") or []
                        result["sent"] = True
                        result["status"] = "sent_template_fallback"
                        result["templateUsed"] = template_name
                        result["providerId"] = msg_ids[0].get("id") if msg_ids else None
                        result["note"] = f"24h window closed ({err_msg}); sent template '{template_name}'. Reply 'Hi' on WhatsApp to reopen full messages."
                    else:
                        tpl_err = (tpl_data.get("error") or {}).get("message") or f"HTTP {tpl_resp.status_code}"
                        result["status"] = "failed"
                        result["error"] = f"Text: {err_msg} | Template ({template_name}): {tpl_err}"
                        logger.warning("Meta WhatsApp send error to %s: %s", normalized, result["error"])
                else:
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


def notify_registered_whatsapp_recipients(
    db: Any,
    alert_type: str,
    message_text: str,
    scope_key: Optional[str] = None,
    target_roles: Optional[list[str]] = None,
) -> list[dict[str, Any]]:
    """
    Dispatch a live automated WhatsApp alert to matching registered recipients when that alert switch is enabled.
    """
    if db is None:
        return []
    cfg = get_whatsapp_delivery_config(db)
    alerts = cfg.get("alerts") or {}
    if not alerts.get(alert_type, True):
        return []

    roles_filter = {str(r).lower() for r in (target_roles or ["owner", "super_admin"])}
    clean_scope = str(scope_key or "").strip().lower()
    results: list[dict[str, Any]] = []
    seen_phones: set[str] = set()

    for rec in cfg.get("registeredRecipients") or []:
        phone = normalize_phone(rec.get("phone", ""))
        if not phone or phone in seen_phones:
            continue
        rec_role = str(rec.get("role") or "owner").strip().lower()
        rec_scope = str(rec.get("scopeKey") or "").strip().lower()
        if rec_role not in roles_filter:
            continue
        # For non-super-admin alerts, match tenant scope if specified
        if rec_role != "super_admin" and clean_scope and rec_scope and rec_scope != clean_scope:
            continue
        seen_phones.add(phone)
        res = send_whatsapp_message(
            phone,
            message_text,
            db=db,
            metadata={"type": alert_type, "scopeKey": clean_scope, "role": rec_role},
        )
        results.append(res)

    return results

