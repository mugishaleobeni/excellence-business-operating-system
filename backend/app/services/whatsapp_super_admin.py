import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Optional

from flask import current_app

from app.services.whatsapp_client import (
    ARCH_LABELS,
    build_welcome_message,
    get_whatsapp_delivery_config,
    is_meta_configured,
    normalize_phone,
    save_whatsapp_delivery_config,
)

logger = logging.getLogger(__name__)

CONFIRM_WORDS = {"YES", "Y", "CONFIRM", "OK", "YEGO", "SAVE", "SURE"}
CANCEL_WORDS = {"NO", "N", "CANCEL", "STOP", "OYA", "ABORT"}

PLAN_PRICES_RWF = {
    "Free": 0.0,
    "Bronze": 10000.0,
    "Silver": 20000.0,
    "Gold": 35000.0,
    "Platinum": 0.0,
}

PLAN_CHOICES = {
    "1": "Free",
    "2": "Bronze",
    "3": "Silver",
    "4": "Gold",
    "5": "Platinum",
}


def _t(lang: str, en: str, rw: str) -> str:
    return rw if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda") else en


def _fmt_rwf(val: Any) -> str:
    try:
        return f"{int(round(float(val or 0))):,} RWF"
    except (TypeError, ValueError):
        return "0 RWF"


def _configured_super_admin_emails() -> set[str]:
    emails: list[str] = ["mugishaleobeni0@gmail.com"]
    try:
        cfg_list = current_app.config.get("SUPER_ADMIN_EMAILS")
        if isinstance(cfg_list, (list, tuple, set)):
            emails.extend(str(e).strip().lower() for e in cfg_list if str(e).strip())
    except RuntimeError:
        pass
    raw_env = os.getenv("SUPER_ADMIN_EMAILS", "mugishaleobeni0@gmail.com")
    emails.extend(e.strip().lower() for e in raw_env.split(",") if e.strip())
    return set(emails)


def _configured_super_admin_phones() -> set[str]:
    phones: list[str] = ["+250781963981"]
    try:
        cfg_list = current_app.config.get("SUPER_ADMIN_PHONES")
        if isinstance(cfg_list, (list, tuple, set)):
            phones.extend(normalize_phone(str(p)) for p in cfg_list if str(p).strip())
    except RuntimeError:
        pass
    raw_env = os.getenv("SUPER_ADMIN_PHONES", "+250781963981")
    phones.extend(normalize_phone(p) for p in raw_env.split(",") if p.strip())
    return {p for p in phones if p}


def is_whatsapp_super_admin(
    user_doc: Optional[dict[str, Any]],
    normalized_phone: str = "",
) -> bool:
    """Return True if the resolved WhatsApp user or phone has Platform Super Administrator privileges."""
    sa_phones = _configured_super_admin_phones()
    clean_phone = normalize_phone(normalized_phone)
    if clean_phone and clean_phone in sa_phones:
        return True
    if not user_doc:
        return False
    if bool(user_doc.get("isSuperAdmin")):
        return True
    role = str(user_doc.get("role") or "").strip().lower()
    if role in ("super_admin", "super admin"):
        return True
    email = str(user_doc.get("email") or "").strip().lower()
    if email and email in _configured_super_admin_emails():
        return True
    user_phone = normalize_phone(user_doc.get("phone", ""))
    return bool(user_phone and user_phone in sa_phones)


def resolve_super_admin_by_registered_recipient(db: Any, normalized_phone: str) -> Optional[dict[str, Any]]:
    """
    If a Super Admin messages from a configured Super Admin phone (e.g. +250 781 963 981) or
    a phone registered with role 'super_admin' in WhatsApp Control Panel, automatically resolve
    their Super Admin account.
    """
    if not normalized_phone or db is None:
        return None
    if normalized_phone in _configured_super_admin_phones():
        for sa_email in _configured_super_admin_emails():
            doc = db.users.find_one({"email": sa_email}, {"_id": 0})
            if doc:
                return doc
        doc = db.users.find_one({"isSuperAdmin": True}, {"_id": 0})
        if doc:
            return doc
    cfg = get_whatsapp_delivery_config(db)
    for rec in cfg.get("registeredRecipients") or []:
        if (
            str(rec.get("role") or "").strip().lower() == "super_admin"
            and normalize_phone(rec.get("phone", "")) == normalized_phone
        ):
            rec_scope = str(rec.get("scopeKey") or "").strip().lower()
            if rec_scope:
                doc = db.users.find_one({"email": rec_scope}, {"_id": 0})
                if doc and is_whatsapp_super_admin(doc, normalized_phone):
                    return doc
            doc = db.users.find_one({"isSuperAdmin": True}, {"_id": 0})
            if doc:
                return doc
            for sa_email in _configured_super_admin_emails():
                doc = db.users.find_one({"email": sa_email}, {"_id": 0})
                if doc:
                    return doc
    return None


def _record_sa_audit(db: Any, actor_email: str, target_email: str, action: str, details: dict[str, Any]) -> None:
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db.super_admin_audit_logs.insert_one(
            {
                "id": f"AUD-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
                "actorEmail": actor_email,
                "targetEmail": target_email,
                "action": action,
                "details": details,
                "reason": "Executed via ExBOS Official WhatsApp Super Admin Console",
                "source": "WhatsApp",
                "createdAt": now_iso,
            }
        )
    except Exception as exc:
        logger.warning("Could not write Super Admin WhatsApp audit log: %s", exc)


def _build_sa_menu(actor_name: str, lang: str) -> str:
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return (
            "*EXCELLENCE BOS — UBUYOBOZI BUKURU (SUPER ADMIN)*\n"
            f"Umuyobozi: *{actor_name}*\n"
            "--------------------------------\n"
            "Subiza *Umubare*:\n"
            "*1.* Incamake ya Sisitemu (Users, Businesses, MRR)\n"
            "*2.* Abakoresha n'Ubucuruzi Bwaherutse (10 ba mbere)\n"
            "*3.* Ibyemezo by'Ubwishyu n'Ifatabuguzi (Approve / Revoke)\n"
            "*4.* Gucunga Konti y'Umukoresha (Activate / Suspend / Plan)\n"
            "*5.* Imiterere ya WhatsApp (Sandbox / Production)\n"
            "*0.* Subira kuri Menu y'Ubucuruzi\n"
            "--------------------------------\n"
            "Buri mpinduka ikoresha *Kugenzura (YEGO / OYA)* mbere yo kubikwa."
        )
    return (
        "*EXCELLENCE BOS — SUPER ADMIN COMMAND CENTER*\n"
        f"Administrator: *{actor_name}*\n"
        "--------------------------------\n"
        "Reply with a *Command Number*:\n"
        "*1.* Platform Overview (Users, Businesses, MRR, Payments)\n"
        "*2.* Recent Users & Businesses (Latest 10)\n"
        "*3.* Subscription & Payment Requests (Approve / Revoke)\n"
        "*4.* Manage User Account (Activate / Suspend / Freeze / Plan)\n"
        "*5.* WhatsApp System Status (Sandbox / Production Mode)\n"
        "*0.* Exit to Business Main Menu\n"
        "--------------------------------\n"
        "All account & billing changes require *YES / NO* verification."
    )


def _build_sa_verify_card(title: str, rows: list[tuple[str, str]], lang: str) -> str:
    is_rw = str(lang or "en").lower() in ("rw", "kin", "kinyarwanda")
    header = f"*GENZURA SUPER ADMIN — {title}*" if is_rw else f"*SUPER ADMIN VERIFY — {title}*"
    lines = [header, "--------------------------------"]
    for label, val in rows:
        lines.append(f"- {label}: *{val}*")
    lines.append("--------------------------------")
    if is_rw:
        lines.append("Subiza *YEGO* (cyangwa *YES*) wemeze, cyangwa *OYA* uhagarike.")
    else:
        lines.append("Reply *YES* to confirm and apply, or *NO* to cancel.")
    return "\n".join(lines)


def _build_user_profile_card(target_user: dict[str, Any], lang: str) -> str:
    email = str(target_user.get("email") or "")
    name = str(target_user.get("name") or "User")
    biz = str(target_user.get("businessName") or "N/A")
    phone = str(target_user.get("phone") or "Not linked")
    arch = ARCH_LABELS.get(str(target_user.get("architectureId") or ""), str(target_user.get("architectureId") or "N/A"))
    plan = str(target_user.get("planTier") or target_user.get("plan") or "Free")
    status = str(target_user.get("accountStatus") or "Active")
    expiry = str(target_user.get("subscriptionExpiry") or "N/A")
    has_proof = bool(target_user.get("paymentScreenshot") or target_user.get("paymentMessageCopy"))

    is_target_sa = is_whatsapp_super_admin(target_user)
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        del_line = "*5.* Siba Konti y'Umukoresha Burundu (Delete)\n" if not is_target_sa else ""
        return (
            f"*KONTI Y'UMUKORESHA — {biz}*\n"
            "--------------------------------\n"
            f"- Amazina: *{name}*\n"
            f"- Imeri: *{email}*\n"
            f"- Telefoni: *{phone}*\n"
            f"- Ubwoko: *{arch}*\n"
            f"- Ifatabuguzi: *{plan}* (Rirangira: {expiry})\n"
            f"- Imiterere: *{status}*\n"
            f"- Icyemezo cy'Ubwishyu: *{'Gihari' if has_proof else 'Ntacyo'}*\n"
            "--------------------------------\n"
            "Hitamo igikorwa:\n"
            "*1.* Gufungura Konti (Activate)\n"
            "*2.* Guhagarika Konti (Suspend)\n"
            "*3.* Gukonjesha Konti (Freeze)\n"
            "*4.* Guhindura Ifatabuguzi (Change Plan)\n"
            f"{del_line}"
            "*0.* Subira kuri Menu ya Super Admin"
        )
    del_line = "*5.* Delete User Account Permanently\n" if not is_target_sa else ""
    return (
        f"*USER ACCOUNT PROFILE — {biz}*\n"
        "--------------------------------\n"
        f"- Owner: *{name}*\n"
        f"- Email: *{email}*\n"
        f"- Phone: *{phone}*\n"
        f"- Architecture: *{arch}*\n"
        f"- Plan: *{plan}* (Expiry: {expiry})\n"
        f"- Account Status: *{status}*\n"
        f"- Payment Proof: *{'Attached' if has_proof else 'None'}*\n"
        "--------------------------------\n"
        "Choose an action:\n"
        "*1.* Activate Account\n"
        "*2.* Suspend Account\n"
        "*3.* Freeze Account\n"
        "*4.* Change Subscription Plan\n"
        f"{del_line}"
        "*0.* Back to Super Admin Menu"
    )


def handle_super_admin_whatsapp_message(
    db: Any,
    user_doc: dict[str, Any],
    normalized_phone: str,
    clean_text: str,
    current_step: Optional[str],
    step_data: dict[str, Any],
    lang: str,
    set_session: Callable[[Optional[str], Optional[dict[str, Any]]], None],
) -> dict[str, Any]:
    """Handle all Super Admin Command Center menus and verified platform governance actions."""
    upper_text = clean_text.upper()
    actor_email = str(user_doc.get("email") or "").strip().lower()
    actor_name = str(user_doc.get("name") or actor_email or "Super Admin")
    biz_name = str(user_doc.get("businessName") or user_doc.get("name") or "ExBOS Business")
    arch_id = str(user_doc.get("architectureId") or "buy-and-sell")

    # Entry into Super Admin Menu
    if current_step is None or upper_text in ("ADMIN", "SUPERADMIN", "SUPER ADMIN"):
        set_session("sa_menu", {})
        return {"reply": _build_sa_menu(actor_name, lang), "action": "sa_menu"}

    # Exit back to Business Main Menu when pressing 0 from sa_menu
    if current_step == "sa_menu" and clean_text == "0":
        set_session(None)
        return {
            "reply": build_welcome_message(biz_name, arch_id, lang=lang, is_super_admin=True),
            "action": "menu",
        }

    # Inside any sub-step, 0 returns to sa_menu
    if current_step != "sa_menu" and clean_text == "0":
        set_session("sa_menu", {})
        return {"reply": _build_sa_menu(actor_name, lang), "action": "sa_menu"}

    # =========================================================================
    # SA MAIN MENU DISPATCH
    # =========================================================================
    if current_step == "sa_menu":
        if clean_text == "1":
            users = list(db.users.find({}, {"_id": 0}))
            total_users = len(users)
            active_users = sum(1 for u in users if str(u.get("accountStatus") or "Active").lower() == "active")
            suspended_users = sum(1 for u in users if str(u.get("accountStatus") or "").lower() in ("suspended", "frozen"))
            paid_users = sum(
                1 for u in users
                if str(u.get("billingType") or "").lower() == "paid"
                or float(u.get("monthlySpendRWF") or 0) > 0
            )
            total_mrr = sum(float(u.get("monthlySpendRWF") or 0) for u in users)
            total_businesses = db.businesses.count_documents({})
            total_workspaces = db.workspaces.count_documents({})
            total_sub_reqs = db.subscription_requests.count_documents({})
            wa_cfg = get_whatsapp_delivery_config(db)

            reply = _t(
                lang,
                (
                    "*EXBOS PLATFORM OVERVIEW (LIVE)*\n"
                    "--------------------------------\n"
                    f"- Total Users: *{total_users}* (Active: *{active_users}* | Suspended/Frozen: *{suspended_users}*)\n"
                    f"- Registered Businesses: *{total_businesses}*\n"
                    f"- Active Workspaces: *{total_workspaces}*\n"
                    f"- Paid Subscriptions: *{paid_users}* | Free: *{max(0, total_users - paid_users)}*\n"
                    f"- Monthly Recurring Revenue (MRR): *{_fmt_rwf(total_mrr)}*\n"
                    f"- Payment Submissions: *{total_sub_reqs}*\n"
                    f"- WhatsApp Mode: *{str(wa_cfg.get('mode', 'sandbox')).upper()}*\n"
                    "--------------------------------\n"
                    "Reply *1–5* for another Super Admin command or *0* for Business Menu."
                ),
                (
                    "*INCAMAKE YA SISITEMU EXBOS (LIVE)*\n"
                    "--------------------------------\n"
                    f"- Abakoresha Bose: *{total_users}* (Bakora: *{active_users}* | Bahagaritswe: *{suspended_users}*)\n"
                    f"- Ubucuruzi Bwanditswe: *{total_businesses}*\n"
                    f"- Workspaces Zikora: *{total_workspaces}*\n"
                    f"- Abishyura: *{paid_users}* | Ubuntu: *{max(0, total_users - paid_users)}*\n"
                    f"- Amafaranga y'Ukwezi (MRR): *{_fmt_rwf(total_mrr)}*\n"
                    f"- Ibyemezo by'Ubwishyu: *{total_sub_reqs}*\n"
                    f"- WhatsApp Mode: *{str(wa_cfg.get('mode', 'sandbox')).upper()}*\n"
                    "--------------------------------\n"
                    "Subiza *1–5* ku kindi gikorwa cyangwa *0* usubire kuri Menu y'Ubucuruzi."
                ),
            )
            return {"reply": reply, "action": "sa_overview"}

        if clean_text == "2":
            recent_users = list(db.users.find({}, {"_id": 0}).sort("created_at", -1).limit(10))
            if not recent_users:
                return {
                    "reply": _t(lang, "No registered users found yet.", "Nta bakoresha banditswe baraboneka."),
                    "action": "sa_recent_users_empty",
                }
            emails_list = [str(u.get("email") or "").lower() for u in recent_users]
            lines = [_t(lang, "*RECENT USERS & BUSINESSES (Latest 10):*", "*ABAKORESHA BAHERUTSE KWIYANDIKISHA (10):*"), "--------------------------------"]
            for idx, u in enumerate(recent_users, start=1):
                bname = u.get("businessName") or u.get("name") or "Business"
                u_email = u.get("email") or ""
                u_plan = u.get("planTier") or u.get("plan") or "Free"
                u_status = u.get("accountStatus") or "Active"
                lines.append(f"*{idx}.* {bname} ({u_plan} | {u_status})\n    {u_email}")
            lines.append("--------------------------------")
            lines.append(_t(lang, "Reply *1–10* to manage a user, or *0* for Super Admin Menu.", "Subiza *1–10* ucunge konti, cyangwa *0* usubire kuri Menu."))
            set_session("sa_pick_user", {"emails": emails_list})
            return {"reply": "\n".join(lines), "action": "sa_recent_users"}

        if clean_text == "3":
            reqs = list(db.subscription_requests.find({}, {"_id": 0}).sort("createdAt", -1).limit(10))
            if not reqs:
                return {
                    "reply": _t(
                        lang,
                        "No subscription payment requests found.\nReply *1–5* or *0* to exit Super Admin.",
                        "Nta byemezo by'ubwishyu biraboneka.\nSubiza *1–5* cyangwa *0* usohoke.",
                    ),
                    "action": "sa_payments_empty",
                }
            req_ids = [str(r.get("id") or "") for r in reqs]
            lines = [_t(lang, "*SUBSCRIPTION & PAYMENT PROOFS (Latest 10):*", "*IBYEMEZO BY'UBWISHYU (10 BIHERUTSE):*"), "--------------------------------"]
            for idx, r in enumerate(reqs, start=1):
                bname = r.get("businessName") or r.get("email") or "Business"
                rplan = r.get("requestedPlan") or "Plan"
                amt = _fmt_rwf(r.get("amountRWF") or 0)
                st = str(r.get("status") or "pending").upper()
                proof = "Screenshot" if r.get("paymentScreenshot") else ("SMS" if r.get("paymentMessageCopy") else "Ref")
                lines.append(f"*{idx}.* {bname} — *{rplan}* ({amt})\n    Status: *{st}* | Proof: {proof}")
            lines.append("--------------------------------")
            lines.append(_t(lang, "Reply *1–10* to inspect/approve/revoke, or *0* to go back.", "Subiza *1–10* ugenzure/wemeze/uhagarike, cyangwa *0* usubire inyuma."))
            set_session("sa_pick_payment", {"reqIds": req_ids})
            return {"reply": "\n".join(lines), "action": "sa_payments_list"}

        if clean_text == "4":
            set_session("sa_search_user", {})
            return {
                "reply": _t(
                    lang,
                    "*Manage User Account*\nEnter the user's *Email*, *Business Name*, or *Phone Number* (or *0* to go back):",
                    "*Gucunga Konti y'Umukoresha*\nAndika *Imeri*, *Izina ry'Ubucuruzi*, cyangwa *Telefoni* (cyangwa *0* usubire inyuma):",
                ),
                "action": "sa_search_user",
            }

        if clean_text == "5":
            wa_cfg = get_whatsapp_delivery_config(db)
            mode = str(wa_cfg.get("mode") or "sandbox").upper()
            recips = wa_cfg.get("registeredRecipients") or []
            set_session("sa_wa_mode", {})
            return {
                "reply": _t(
                    lang,
                    (
                        "*WHATSAPP SYSTEM STATUS*\n"
                        "--------------------------------\n"
                        f"- Delivery Mode: *{mode}*\n"
                        f"- Meta Cloud API: *{'Connected' if is_meta_configured() else 'Not Configured'}*\n"
                        f"- Registered Recipients: *{len(recips)}*\n"
                        "--------------------------------\n"
                        "*1.* Switch Mode to *SANDBOX*\n"
                        "*2.* Switch Mode to *PRODUCTION*\n"
                        "*0.* Back to Super Admin Menu"
                    ),
                    (
                        "*IMITERERE YA WHATSAPP*\n"
                        "--------------------------------\n"
                        f"- Uburyo bwo Kohereza: *{mode}*\n"
                        f"- Meta Cloud API: *{'Irakora' if is_meta_configured() else 'Ntirashyirwaho'}*\n"
                        f"- Nimero Zanditswe: *{len(recips)}*\n"
                        "--------------------------------\n"
                        "*1.* Hindura kuri *SANDBOX*\n"
                        "*2.* Hindura kuri *PRODUCTION*\n"
                        "*0.* Subira kuri Menu ya Super Admin"
                    ),
                ),
                "action": "sa_wa_status",
            }

        return {"reply": _build_sa_menu(actor_name, lang), "action": "sa_menu"}

    # =========================================================================
    # SA PICK USER FROM RECENT LIST / SEARCH USER
    # =========================================================================
    if current_step == "sa_pick_user":
        emails_list = step_data.get("emails") or []
        target_email = ""
        if clean_text.isdigit():
            idx = int(clean_text) - 1
            if 0 <= idx < len(emails_list):
                target_email = emails_list[idx]
        elif "@" in clean_text:
            target_email = clean_text.strip().lower()
        if not target_email:
            return {
                "reply": _t(lang, "Reply with a number (*1–10*), an email address, or *0* to go back.", "Subiza umubare (*1–10*), imeri, cyangwa *0* usubire inyuma."),
                "action": "sa_pick_user_retry",
            }
        target_user = db.users.find_one({"email": target_email}, {"_id": 0})
        if not target_user:
            return {
                "reply": _t(lang, f"User *{target_email}* not found. Try again or reply *0*.", f"Umukoresha *{target_email}* ntabonetse. Ongera cyangwa subiza *0*."),
                "action": "sa_user_not_found",
            }
        set_session("sa_user_action", {"targetEmail": target_email})
        return {"reply": _build_user_profile_card(target_user, lang), "action": "sa_user_profile"}

    if current_step == "sa_search_user":
        q = clean_text.strip().lower()
        q_phone = normalize_phone(clean_text)
        target_user = db.users.find_one({"email": q}, {"_id": 0})
        if not target_user:
            for u in db.users.find({}, {"_id": 0}):
                if (
                    q in str(u.get("email") or "").lower()
                    or q in str(u.get("businessName") or "").lower()
                    or q in str(u.get("name") or "").lower()
                    or (q_phone and normalize_phone(u.get("phone", "")) == q_phone)
                ):
                    target_user = u
                    break
        if not target_user:
            return {
                "reply": _t(
                    lang,
                    f"No user matched '{clean_text}'. Enter another email/name/phone or *0* to go back.",
                    f"Nta mukoresha uhuye na '{clean_text}'. Andika indi meri/izina/telefoni cyangwa *0*.",
                ),
                "action": "sa_user_not_found",
            }
        set_session("sa_user_action", {"targetEmail": str(target_user.get("email") or "").lower()})
        return {"reply": _build_user_profile_card(target_user, lang), "action": "sa_user_profile"}

    if current_step == "sa_user_action":
        target_email = str(step_data.get("targetEmail") or "").lower()
        target_user = db.users.find_one({"email": target_email}, {"_id": 0}) or {}
        target_biz = str(target_user.get("businessName") or target_email)

        if clean_text in ("1", "2", "3"):
            status_map = {"1": "Active", "2": "Suspended", "3": "Frozen"}
            next_status = status_map[clean_text]
            set_session(
                "sa_confirm_action",
                {"op": "set_user_status", "targetEmail": target_email, "nextStatus": next_status},
            )
            return {
                "reply": _build_sa_verify_card(
                    _t(lang, "CHANGE ACCOUNT STATUS", "HINDURA IMITERERE YA KONTI"),
                    [
                        (_t(lang, "Business", "Ubucuruzi"), target_biz),
                        (_t(lang, "Email", "Imeri"), target_email),
                        (_t(lang, "New Status", "Imiterere Mishya"), next_status),
                    ],
                    lang,
                ),
                "action": "sa_confirm_action",
            }
        if clean_text == "4":
            set_session("sa_user_pick_plan", {"targetEmail": target_email})
            return {
                "reply": _t(
                    lang,
                    (
                        f"*Change Plan for {target_biz}*\n"
                        "*1.* Free (0 RWF)\n"
                        "*2.* Bronze (10,000 RWF)\n"
                        "*3.* Silver (20,000 RWF)\n"
                        "*4.* Gold (35,000 RWF)\n"
                        "*5.* Platinum (Partner)\n"
                        "Reply *1–5* or *0* to cancel."
                    ),
                    (
                        f"*Hindura Ifatabuguzi rya {target_biz}*\n"
                        "*1.* Free (0 RWF)\n"
                        "*2.* Bronze (10,000 RWF)\n"
                        "*3.* Silver (20,000 RWF)\n"
                        "*4.* Gold (35,000 RWF)\n"
                        "*5.* Platinum (Partner)\n"
                        "Subiza *1–5* cyangwa *0* uhagarike."
                    ),
                ),
                "action": "sa_user_pick_plan",
            }
        if clean_text == "5":
            if not target_email or target_email == actor_email or is_whatsapp_super_admin(target_user):
                return {
                    "reply": _t(
                        lang,
                        "Protected account: You cannot delete your own or another Super Admin account.\nReply *0* for Super Admin Menu.",
                        "Konti irinzwe: Ntushobora gusiba konti yawe cyangwa iya Super Admin.\nSubiza *0* usubire kuri Menu ya Super Admin.",
                    ),
                    "action": "sa_delete_blocked",
                }
            set_session(
                "sa_confirm_action",
                {"op": "delete_user", "targetEmail": target_email, "targetBiz": target_biz},
            )
            return {
                "reply": _build_sa_verify_card(
                    _t(lang, "DELETE USER PERMANENTLY", "SIBA KONTI BURUNDU"),
                    [
                        (_t(lang, "Business", "Ubucuruzi"), target_biz),
                        (_t(lang, "Email", "Imeri"), target_email),
                        (_t(lang, "Phone", "Telefoni"), str(target_user.get("phone") or "N/A")),
                        (_t(lang, "Action", "Igikorwa"), _t(lang, "Permanent removal of user, staff, workspaces & records", "Gusiba burundu konti, abakozi, ububiko n'amakuru yose")),
                    ],
                    lang,
                ),
                "action": "sa_confirm_action",
            }
        return {
            "reply": _t(lang, "Reply *1–5* to manage this user, or *0* for Super Admin Menu.", "Subiza *1–5* cyangwa *0* usubire kuri Menu ya Super Admin."),
            "action": "sa_user_action_retry",
        }

    if current_step == "sa_user_pick_plan":
        target_email = str(step_data.get("targetEmail") or "").lower()
        new_plan = PLAN_CHOICES.get(clean_text)
        if not new_plan:
            return {
                "reply": _t(lang, "Reply *1–5* to choose a plan, or *0* to cancel.", "Subiza *1–5* uhitemo ifatabuguzi, cyangwa *0* uhagarike."),
                "action": "sa_user_pick_plan_retry",
            }
        set_session(
            "sa_confirm_action",
            {"op": "set_user_plan", "targetEmail": target_email, "newPlan": new_plan},
        )
        return {
            "reply": _build_sa_verify_card(
                _t(lang, "CHANGE SUBSCRIPTION PLAN", "HINDURA IFATABUGUZI"),
                [
                    (_t(lang, "Email", "Imeri"), target_email),
                    (_t(lang, "New Plan", "Ifatabuguzi Rishya"), f"{new_plan} ({_fmt_rwf(PLAN_PRICES_RWF[new_plan])})"),
                ],
                lang,
            ),
            "action": "sa_confirm_action",
        }

    # =========================================================================
    # SA PAYMENT REQUEST INSPECTION & APPROVE / REVOKE
    # =========================================================================
    if current_step == "sa_pick_payment":
        req_ids = step_data.get("reqIds") or []
        req_id = ""
        if clean_text.isdigit():
            idx = int(clean_text) - 1
            if 0 <= idx < len(req_ids):
                req_id = req_ids[idx]
        if not req_id:
            return {
                "reply": _t(lang, "Reply with a number (*1–10*) or *0* to go back.", "Subiza umubare (*1–10*) cyangwa *0* usubire inyuma."),
                "action": "sa_pick_payment_retry",
            }
        req_doc = db.subscription_requests.find_one({"id": req_id}, {"_id": 0})
        if not req_doc:
            set_session("sa_menu", {})
            return {"reply": _t(lang, "Payment request not found.", "Icyemezo cy'ubwishyu nticyabonetse.") + "\n\n" + _build_sa_menu(actor_name, lang), "action": "sa_menu"}

        set_session("sa_payment_action", {"reqId": req_id, "targetEmail": str(req_doc.get("email") or "").lower()})
        sms_preview = str(req_doc.get("paymentMessageCopy") or req_doc.get("paymentReference") or "None")[:140]
        has_ss = "Yes (View in Web Super Admin)" if req_doc.get("paymentScreenshot") else "No"
        return {
            "reply": _t(
                lang,
                (
                    f"*PAYMENT PROOF — {req_doc.get('businessName', '')}*\n"
                    "--------------------------------\n"
                    f"- Email: *{req_doc.get('email', '')}*\n"
                    f"- Requested Plan: *{req_doc.get('requestedPlan', '')}* ({_fmt_rwf(req_doc.get('amountRWF', 0))})\n"
                    f"- Status: *{str(req_doc.get('status', 'pending')).upper()}*\n"
                    f"- Screenshot Attached: *{has_ss}*\n"
                    f"- SMS / Ref: _{sms_preview}_\n"
                    "--------------------------------\n"
                    "*1.* Approve & Activate Plan (30 Days)\n"
                    "*2.* Revoke Payment & Downgrade to Free\n"
                    "*0.* Back to Super Admin Menu"
                ),
                (
                    f"*ICYEMEZO CY'UBWISHYU — {req_doc.get('businessName', '')}*\n"
                    "--------------------------------\n"
                    f"- Imeri: *{req_doc.get('email', '')}*\n"
                    f"- Ifatabuguzi: *{req_doc.get('requestedPlan', '')}* ({_fmt_rwf(req_doc.get('amountRWF', 0))})\n"
                    f"- Imiterere: *{str(req_doc.get('status', 'pending')).upper()}*\n"
                    f"- Ifoto (Screenshot): *{has_ss}*\n"
                    f"- SMS / Ref: _{sms_preview}_\n"
                    "--------------------------------\n"
                    "*1.* Emeza & Fungura Ifatabuguzi (Iminsi 30)\n"
                    "*2.* Hagarika Ubwishyu & Subiza ku Buntu (Revoke)\n"
                    "*0.* Subira kuri Menu ya Super Admin"
                ),
            ),
            "action": "sa_payment_detail",
        }

    if current_step == "sa_payment_action":
        req_id = str(step_data.get("reqId") or "")
        req_doc = db.subscription_requests.find_one({"id": req_id}, {"_id": 0}) or {}
        target_email = str(req_doc.get("email") or step_data.get("targetEmail") or "").lower()
        plan_name = str(req_doc.get("requestedPlan") or "Silver")

        if clean_text == "1":
            set_session(
                "sa_confirm_action",
                {"op": "approve_payment", "reqId": req_id, "targetEmail": target_email, "newPlan": plan_name},
            )
            return {
                "reply": _build_sa_verify_card(
                    _t(lang, "APPROVE PAYMENT", "EMEZA UBWISHYU"),
                    [
                        (_t(lang, "Business", "Ubucuruzi"), str(req_doc.get("businessName") or target_email)),
                        (_t(lang, "Plan", "Ifatabuguzi"), f"{plan_name} (30 Days)"),
                    ],
                    lang,
                ),
                "action": "sa_confirm_action",
            }
        if clean_text == "2":
            set_session(
                "sa_confirm_action",
                {"op": "revoke_payment", "reqId": req_id, "targetEmail": target_email},
            )
            return {
                "reply": _build_sa_verify_card(
                    _t(lang, "REVOKE PAYMENT & DOWNGRADE TO FREE", "HAGARIKA UBWISHYU (REVOKE)"),
                    [
                        (_t(lang, "Business", "Ubucuruzi"), str(req_doc.get("businessName") or target_email)),
                        (_t(lang, "Action", "Igikorwa"), "Revoke Payment -> Downgrade to Free"),
                    ],
                    lang,
                ),
                "action": "sa_confirm_action",
            }
        return {
            "reply": _t(lang, "Reply *1* to Approve, *2* to Revoke, or *0* to go back.", "Subiza *1* wemeze, *2* uhagarike, cyangwa *0* usubire inyuma."),
            "action": "sa_payment_action_retry",
        }

    # =========================================================================
    # SA WHATSAPP MODE TOGGLE
    # =========================================================================
    if current_step == "sa_wa_mode":
        if clean_text in ("1", "2"):
            next_mode = "sandbox" if clean_text == "1" else "production"
            set_session("sa_confirm_action", {"op": "set_wa_mode", "nextMode": next_mode})
            return {
                "reply": _build_sa_verify_card(
                    _t(lang, "SWITCH WHATSAPP DELIVERY MODE", "HINDURA WHATSAPP MODE"),
                    [(_t(lang, "New Mode", "Uburyo Bushya"), next_mode.upper())],
                    lang,
                ),
                "action": "sa_confirm_action",
            }
        return {
            "reply": _t(lang, "Reply *1* for SANDBOX, *2* for PRODUCTION, or *0* to go back.", "Subiza *1* (SANDBOX), *2* (PRODUCTION), cyangwa *0*."),
            "action": "sa_wa_mode_retry",
        }

    # =========================================================================
    # SA CONFIRMATION GATE (YES / NO)
    # =========================================================================
    if current_step == "sa_confirm_action":
        if upper_text in CANCEL_WORDS:
            set_session("sa_menu", {})
            return {
                "reply": _t(lang, "Super Admin action cancelled.\n\n", "Igikorwa cya Super Admin cyahagaritswe.\n\n") + _build_sa_menu(actor_name, lang),
                "action": "sa_cancelled",
            }
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(lang, "Reply *YES* to confirm and apply, or *NO* to cancel.", "Subiza *YEGO* wemeze, cyangwa *OYA* uhagarike."),
                "action": "sa_awaiting_confirmation",
            }

        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()
        op = step_data.get("op")
        target_email = str(step_data.get("targetEmail") or "").lower()

        if op == "set_user_status":
            next_status = str(step_data.get("nextStatus") or "Active")
            db.users.update_one(
                {"email": target_email},
                {"$set": {"accountStatus": next_status, "updated_at": now_iso}},
            )
            db.businesses.update_one(
                {"email": target_email},
                {"$set": {"status": next_status, "updated_at": now_iso}},
            )
            _record_sa_audit(db, actor_email, target_email, f"SET_STATUS_{next_status.upper()}", {"accountStatus": next_status})
            set_session("sa_menu", {})
            return {
                "reply": _t(
                    lang,
                    f"*Confirmed:* Account *{target_email}* status updated to *{next_status}*.\n\n",
                    f"*Byemejwe:* Imiterere ya konti *{target_email}* yahinduwe *{next_status}*.\n\n",
                ) + _build_sa_menu(actor_name, lang),
                "action": "sa_status_updated",
            }

        if op == "set_user_plan":
            new_plan = str(step_data.get("newPlan") or "Free")
            price = PLAN_PRICES_RWF.get(new_plan, 0.0)
            is_paid = new_plan.lower() not in ("free", "platinum") and price > 0
            expiry = (now_dt + timedelta(days=30)).strftime("%Y-%m-%d") if is_paid else ""
            db.users.update_one(
                {"email": target_email},
                {
                    "$set": {
                        "plan": new_plan,
                        "planTier": new_plan,
                        "billingType": "Paid" if is_paid else "Free",
                        "monthlySpendRWF": price if is_paid else 0.0,
                        "subscriptionStatus": "Active",
                        "subscriptionExpiry": expiry,
                        "paidAt": now_iso if is_paid else "",
                        "updated_at": now_iso,
                    }
                },
            )
            db.businesses.update_one(
                {"email": target_email},
                {"$set": {"plan": new_plan, "mrrRWF": price if is_paid else 0.0, "expiryDate": expiry, "updated_at": now_iso}},
            )
            _record_sa_audit(db, actor_email, target_email, "CHANGE_PLAN", {"plan": new_plan, "mrrRWF": price})
            set_session("sa_menu", {})
            return {
                "reply": _t(
                    lang,
                    f"*Confirmed:* *{target_email}* updated to *{new_plan}* plan.\n\n",
                    f"*Byemejwe:* *{target_email}* yahinduriwe ifatabuguzi rya *{new_plan}*.\n\n",
                ) + _build_sa_menu(actor_name, lang),
                "action": "sa_plan_updated",
            }

        if op == "approve_payment":
            req_id = str(step_data.get("reqId") or "")
            new_plan = str(step_data.get("newPlan") or "Silver")
            price = PLAN_PRICES_RWF.get(new_plan, 20000.0)
            expiry = (now_dt + timedelta(days=30)).strftime("%Y-%m-%d")
            db.subscription_requests.update_one(
                {"id": req_id},
                {"$set": {"status": "approved", "reviewedBy": actor_email, "reviewedAt": now_iso, "expiryDate": expiry}},
            )
            db.users.update_one(
                {"email": target_email},
                {
                    "$set": {
                        "plan": new_plan,
                        "planTier": new_plan,
                        "billingType": "Paid",
                        "monthlySpendRWF": price,
                        "subscriptionStatus": "Active",
                        "paidAt": now_iso,
                        "subscriptionExpiry": expiry,
                        "updated_at": now_iso,
                    }
                },
            )
            db.businesses.update_one(
                {"email": target_email},
                {"$set": {"plan": new_plan, "billingType": "Paid", "mrrRWF": price, "expiryDate": expiry, "updated_at": now_iso}},
            )
            _record_sa_audit(db, actor_email, target_email, "APPROVE_PAYMENT", {"reqId": req_id, "plan": new_plan})
            set_session("sa_menu", {})
            return {
                "reply": _t(
                    lang,
                    f"*Payment Approved:* *{target_email}* is active on *{new_plan}* until *{expiry}*.\n\n",
                    f"*Ubwishyu Bwemejwe:* *{target_email}* afite ifatabuguzi rya *{new_plan}* kugeza *{expiry}*.\n\n",
                ) + _build_sa_menu(actor_name, lang),
                "action": "sa_payment_approved",
            }

        if op == "revoke_payment":
            req_id = str(step_data.get("reqId") or "")
            db.subscription_requests.update_one(
                {"id": req_id},
                {"$set": {"status": "revoked", "reviewedBy": actor_email, "reviewedAt": now_iso}},
            )
            db.users.update_one(
                {"email": target_email},
                {
                    "$set": {
                        "plan": "Free",
                        "planTier": "Free",
                        "billingType": "Free",
                        "monthlySpendRWF": 0.0,
                        "subscriptionStatus": "Revoked",
                        "subscriptionExpiry": "",
                        "paidAt": "",
                        "updated_at": now_iso,
                    }
                },
            )
            db.businesses.update_one(
                {"email": target_email},
                {"$set": {"plan": "Free", "billingType": "Free", "mrrRWF": 0.0, "expiryDate": "", "updated_at": now_iso}},
            )
            _record_sa_audit(db, actor_email, target_email, "REVOKE_PAYMENT", {"reqId": req_id})
            set_session("sa_menu", {})
            return {
                "reply": _t(
                    lang,
                    f"*Payment Revoked:* *{target_email}* downgraded to *Free* plan.\n\n",
                    f"*Ubwishyu Bwahagaritswe:* *{target_email}* yasubijwe ku ifatabuguzi ry'ubuntu (*Free*).\n\n",
                ) + _build_sa_menu(actor_name, lang),
                "action": "sa_payment_revoked",
            }

        if op == "delete_user":
            t_doc = db.users.find_one({"email": target_email})
            if not t_doc:
                set_session("sa_menu", {})
                return {
                    "reply": _t(lang, f"User *{target_email}* was already deleted.\n\n", f"Umukoresha *{target_email}* yamaze gusibwa.\n\n") + _build_sa_menu(actor_name, lang),
                    "action": "sa_user_not_found",
                }
            if target_email == actor_email or is_whatsapp_super_admin(t_doc):
                set_session("sa_menu", {})
                return {
                    "reply": _t(lang, "Cannot delete a Super Admin account.\n\n", "Ntushobora gusiba konti ya Super Admin.\n\n") + _build_sa_menu(actor_name, lang),
                    "action": "sa_delete_blocked",
                }
            is_owner = not bool(t_doc.get("ownerScopeKey"))
            t_phone = normalize_phone(t_doc.get("phone", ""))
            db.users.delete_one({"email": target_email})
            removed_staff = 0
            if is_owner:
                res_staff = db.users.delete_many({"ownerScopeKey": target_email})
                removed_staff = res_staff.deleted_count
                db.businesses.delete_many({"email": target_email})
                db.workspaces.delete_many({"scopeKey": target_email})
                db.module_records.delete_many({"scopeKey": target_email})
                db.products.delete_many({"scopeKey": target_email})
                db.transactions.delete_many({"scopeKey": target_email})
                db.branches.delete_many({"scopeKey": target_email})
                db.subscription_requests.delete_many({"email": target_email})
                db.tax_profiles.delete_many({"scopeKey": target_email})
                db.integrations.delete_many({"userEmail": target_email})
            if t_phone:
                db.whatsapp_sessions.delete_many({"phone": t_phone})
            _record_sa_audit(
                db,
                actor_email,
                target_email,
                f"DELETE_USER_ACCOUNT ({'Owner + ' + str(removed_staff) + ' staff' if is_owner else 'Staff'})",
                {"isOwner": is_owner, "removedStaff": removed_staff},
            )
            set_session("sa_menu", {})
            return {
                "reply": _t(
                    lang,
                    f"*User Permanently Deleted:* *{target_email}* and all associated workspaces/records have been removed.\n\n",
                    f"*Konti Yasibwe Burundu:* *{target_email}* n'amakuru yayo yose byasibwe.\n\n",
                ) + _build_sa_menu(actor_name, lang),
                "action": "sa_user_deleted",
            }

        if op == "set_wa_mode":
            next_mode = str(step_data.get("nextMode") or "sandbox")
            wa_cfg = get_whatsapp_delivery_config(db)
            wa_cfg["mode"] = next_mode
            save_whatsapp_delivery_config(db, wa_cfg)
            _record_sa_audit(db, actor_email, "platform", "SET_WHATSAPP_MODE", {"mode": next_mode})
            set_session("sa_menu", {})
            return {
                "reply": _t(
                    lang,
                    f"*Confirmed:* WhatsApp delivery mode switched to *{next_mode.upper()}*.\n\n",
                    f"*Byemejwe:* WhatsApp delivery mode yahinduwe kuri *{next_mode.upper()}*.\n\n",
                ) + _build_sa_menu(actor_name, lang),
                "action": "sa_wa_mode_updated",
            }

    set_session("sa_menu", {})
    return {"reply": _build_sa_menu(actor_name, lang), "action": "sa_menu"}

