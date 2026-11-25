"""
Silent Business Owner Audit Notifier for Branch Manager Product Actions.

Whenever a Branch Manager edits a product (name, selling price, cost price, stock)
or permanently deletes a product on WhatsApp or ExBOS Web, this service silently
notifies the Business Owner with an exact Before -> After report via:
  1. Persistent audit log (`db.branch_audit_logs`)
  2. In-app Owner Notification (`db.owner_notifications`)
  3. WhatsApp alert to the Business Owner's linked phone (when available & distinct from actor)
  4. Best-effort background email to the Business Owner's email (non-blocking)

The Branch Manager is NEVER informed that this report was sent.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, Optional

from app.services.whatsapp_client import normalize_phone, send_whatsapp_message

logger = logging.getLogger(__name__)


def _fmt_rwf(val: Any) -> str:
    try:
        return f"{float(val or 0):,.0f} RWF"
    except Exception:
        return f"{val} RWF"


def _fmt_qty(val: Any) -> str:
    try:
        f = float(val or 0)
        return str(int(f)) if f.is_integer() else str(f)
    except Exception:
        return str(val or 0)


def _send_email_async(app_obj: Any, to_email: str, subject: str, html_body: str, text_body: str) -> None:
    """Fire-and-forget email dispatch so Branch Manager requests never block or fail."""
    def _worker():
        try:
            with app_obj.app_context():
                from app.utils.mailer import send_gmail_email
                send_gmail_email(
                    to_email=to_email,
                    subject=subject,
                    html_body=html_body,
                    text_body=text_body,
                )
        except Exception as exc:
            logger.debug("Silent owner audit email skipped/failed: %s", exc)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()


def notify_owner_branch_product_action(
    db: Any,
    *,
    scope_key: str,
    branch_id: str,
    branch_name: str,
    manager_doc: dict[str, Any],
    action_type: str,
    product_title: str,
    product_id: str = "",
    changes: Optional[list[tuple[str, str]]] = None,
    channel: str = "WhatsApp",
    business_name: str = "ExBOS Business",
) -> dict[str, Any]:
    """
    Silently record & dispatch an executive audit alert to the Business Owner when a
    Branch Manager edits or deletes a product. Never raises exceptions to caller.
    """
    result = {
        "auditLogged": False,
        "inAppNotified": False,
        "whatsappSent": False,
        "emailQueued": False,
    }
    if db is None or not scope_key:
        return result

    try:
        owner_email = str(scope_key).strip().lower()
        manager_email = str((manager_doc or {}).get("email") or "").strip().lower()
        # Never send a branch-manager audit alert if the Business Owner performed the action
        if manager_email and manager_email == owner_email:
            return result

        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()
        time_display = now_dt.strftime("%Y-%m-%d %H:%M UTC")

        manager_name = str((manager_doc or {}).get("name") or manager_email or "Branch Manager").strip()
        manager_phone = normalize_phone(str((manager_doc or {}).get("phone") or ""))
        clean_branch_name = str(branch_name or branch_id or "Assigned Branch").strip()
        clean_product = str(product_title or product_id or "Unnamed Product").strip()
        change_rows = list(changes or [])

        # Resolve Business Owner user doc + linked WhatsApp phone
        owner_doc = db.users.find_one({"email": owner_email}) or {}
        owner_name = str(owner_doc.get("name") or "Business Owner").strip()
        owner_phone = normalize_phone(
            str(owner_doc.get("phone") or owner_doc.get("whatsappPhone") or "")
        )
        if not owner_phone:
            integ = db.integrations.find_one({"userEmail": owner_email}) or {}
            wa_cfg = integ.get("whatsapp") if isinstance(integ.get("whatsapp"), dict) else {}
            owner_phone = normalize_phone(str(wa_cfg.get("phone") or ""))

        summary_lines = [f"{label}: {val}" for label, val in change_rows]
        summary_text = " | ".join(summary_lines) if summary_lines else action_type

        # 1. Persistent Branch Audit Log
        audit_doc = {
            "id": f"audit-bm-{int(time.time() * 1000)}",
            "scopeKey": owner_email,
            "branchId": str(branch_id or ""),
            "branchName": clean_branch_name,
            "managerName": manager_name,
            "managerEmail": manager_email,
            "managerPhone": manager_phone,
            "actionType": action_type,
            "productId": str(product_id or ""),
            "productTitle": clean_product,
            "changes": [{"label": k, "detail": v} for k, v in change_rows],
            "channel": channel,
            "createdAt": now_iso,
        }
        db.branch_audit_logs.insert_one(dict(audit_doc))
        result["auditLogged"] = True

        # 2. Persistent In-App Owner Notification (Notification Bell on Main HQ Dashboard)
        notif_title = f"Branch Product Alert — {action_type}"
        notif_message = (
            f"{manager_name} ({clean_branch_name}) performed '{action_type}' on "
            f"'{clean_product}' via {channel}. {summary_text}"
        ).strip()
        notif_doc = {
            "id": f"notif-bmaudit-{int(time.time() * 1000)}",
            "scopeKey": owner_email,
            "type": "branch_manager_product_audit",
            "category": "branch_audit",
            "severity": "warning",
            "title": notif_title,
            "message": notif_message,
            "branchId": str(branch_id or ""),
            "branchName": clean_branch_name,
            "managerName": manager_name,
            "managerEmail": manager_email,
            "productId": str(product_id or ""),
            "productTitle": clean_product,
            "actionType": action_type,
            "channel": channel,
            "read": False,
            "createdAt": now_iso,
        }
        db.owner_notifications.insert_one(dict(notif_doc))
        result["inAppNotified"] = True

        # 3. Silent WhatsApp Executive Report to Business Owner (only if distinct phone)
        if owner_phone and owner_phone != manager_phone:
            detail_block = "\n".join(f"- {label}: {val}" for label, val in change_rows)
            wa_msg = (
                "*EXBOS OWNER AUDIT REPORT*\n"
                f"Business: *{business_name}*\n"
                f"Branch: *{clean_branch_name}*\n"
                f"Manager: *{manager_name}*\n"
                f"Action: *{action_type}*\n"
                f"Product: *{clean_product}*\n"
                f"{detail_block}\n"
                f"Channel: {channel} | Time: {time_display}"
            ).replace("\n\n", "\n")
            wa_res = send_whatsapp_message(
                owner_phone,
                wa_msg,
                db=db,
                metadata={
                    "type": "owner_branch_audit_alert",
                    "scopeKey": owner_email,
                    "branchId": str(branch_id or ""),
                    "actionType": action_type,
                },
            )
            result["whatsappSent"] = bool(wa_res.get("ok") or wa_res.get("sent") or wa_res.get("queued"))

        # 4. Best-effort background Email Alert to Business Owner
        if owner_email and "@" in owner_email and not owner_email.endswith(".test"):
            try:
                from flask import current_app
                from app.utils.email_templates import render_exbos_email

                email_details = [
                    ("Branch", clean_branch_name),
                    ("Branch Manager", f"{manager_name} ({manager_email or manager_phone or 'Staff'})"),
                    ("Action", action_type),
                    ("Product", clean_product),
                    *change_rows,
                    ("Channel", channel),
                    ("Timestamp", time_display),
                ]
                html_body = render_exbos_email(
                    category="Branch Audit Report",
                    title=f"Branch Product Activity — {clean_branch_name}",
                    greeting=f"Hello <strong>{owner_name}</strong>,",
                    intro_html=(
                        f"Your Branch Manager <strong>{manager_name}</strong> at "
                        f"<strong>{clean_branch_name}</strong> performed the following catalog action via {channel}:"
                    ),
                    details=email_details,
                )
                text_body = (
                    f"ExBOS Owner Audit Report\n"
                    f"Branch: {clean_branch_name}\n"
                    f"Manager: {manager_name}\n"
                    f"Action: {action_type}\n"
                    f"Product: {clean_product}\n"
                    + "\n".join(f"- {k}: {v}" for k, v in change_rows)
                    + f"\nChannel: {channel} | Time: {time_display}"
                )
                app_obj = current_app._get_current_object()
                _send_email_async(
                    app_obj,
                    owner_email,
                    f"ExBOS Branch Audit: {action_type} — {clean_product} ({clean_branch_name})",
                    html_body,
                    text_body,
                )
                result["emailQueued"] = True
            except Exception as email_exc:
                logger.debug("Silent owner audit email skipped: %s", email_exc)

    except Exception as exc:
        logger.warning("Silent owner audit notifier failed safely: %s", exc)

    return result

