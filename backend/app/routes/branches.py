import logging
import secrets
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from urllib.parse import quote
from flask import Blueprint, request
from flask_jwt_extended import create_access_token, get_jwt_identity, verify_jwt_in_request

from app.database import get_db
from app.utils.mailer import send_gmail_email
from app.utils.email_templates import render_exbos_email
from app.utils.responses import error_response, success_response
from app.utils.security import hash_password, verify_password

logger = logging.getLogger(__name__)
branches_bp = Blueprint("branches", __name__, url_prefix="/api/v1/branches")


def _default_branch_permissions(is_main: bool = False) -> dict:
    if is_main:
        return {
            "canDeleteRecords": True,
            "canEditPrices": True,
            "canViewProfitReports": True,
            "canAddInventory": True,
            "canRecordExpenses": True,
            "maxExpenseLimitRWF": 0,
        }
    return {
        "canDeleteRecords": False,
        "canEditPrices": False,
        "canViewProfitReports": False,
        "canAddInventory": True,
        "canRecordExpenses": True,
        "maxExpenseLimitRWF": 0,
    }


def _normalize_branch_doc(b: dict) -> dict:
    out = dict(b)
    out.pop("_id", None)
    pin_hash = out.pop("ownerSwitchPinHash", None)
    is_main = bool(out.get("isMain") or out.get("id") == "main")
    out["isMain"] = is_main
    out["status"] = out.get("status") or "Active"
    if "requirePinForMainSwitch" not in out:
        out["requirePinForMainSwitch"] = True
    out["hasOwnerPin"] = bool(pin_hash)
    base_perms = _default_branch_permissions(is_main)
    existing_perms = out.get("permissions") if isinstance(out.get("permissions"), dict) else {}
    merged_perms = {**base_perms, **existing_perms}
    if is_main:
        merged_perms["canDeleteRecords"] = True
        merged_perms["canEditPrices"] = True
        merged_perms["canViewProfitReports"] = True
    out["permissions"] = merged_perms
    return out


def _is_branch_manager(user_doc: dict | None) -> bool:
    if not user_doc:
        return False
    role = str(user_doc.get("role") or "").strip().lower()
    assigned = str(user_doc.get("assignedBranchId") or "").strip()
    return role == "branch manager" or (bool(assigned) and assigned != "main")


def _resolve_scope_and_user(db):
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

    user_doc = None
    if email:
        user_doc = db.users.find_one({"email": email}, {"_id": 0})

    if not user_doc:
        snap = db.platform_config.find_one({"key": "active_user_snapshot"})
        if snap and isinstance(snap.get("value"), dict):
            snap_email = (snap["value"].get("email") or "").strip().lower()
            if snap_email:
                user_doc = db.users.find_one({"email": snap_email}, {"_id": 0})
                email = snap_email

    if not user_doc:
        user_doc = db.users.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
        if user_doc:
            email = (user_doc.get("email") or "").strip().lower()

    scope_key = (user_doc.get("ownerScopeKey") or email or "default").strip().lower() if user_doc else (email or "default")
    return scope_key, user_doc


def _ensure_main_branch(db, scope_key: str, user_doc: dict | None):
    arch_id = (user_doc or {}).get("architectureId") or "buy-and-sell"
    biz_name = (user_doc or {}).get("businessName") or (user_doc or {}).get("name") or "Main HQ"
    loc = (user_doc or {}).get("location") or "Headquarters"
    now_iso = datetime.now(timezone.utc).isoformat()

    existing = db.branches.find_one({"scopeKey": scope_key, "id": "main"}, {"_id": 0})
    if not existing:
        main_doc = {
            "id": "main",
            "scopeKey": scope_key,
            "name": f"{biz_name} (Main HQ)",
            "location": loc,
            "architectureId": arch_id,
            "isMain": True,
            "status": "Active",
            "requirePinForMainSwitch": True,
            "permissions": _default_branch_permissions(is_main=True),
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }
        db.branches.insert_one(dict(main_doc))
        return _normalize_branch_doc(main_doc)
    return _normalize_branch_doc(existing)


@branches_bp.route("", methods=["GET"])
@branches_bp.route("/", methods=["GET"])
def list_branches():
    """Return branches for the authenticated user. Branch Managers only see their assigned branch (Main HQ blocked)."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    _ensure_main_branch(db, scope_key, user_doc)

    raw_items = list(db.branches.find({"scopeKey": scope_key}, {"_id": 0}).sort("createdAt", 1))
    items = [_normalize_branch_doc(b) for b in raw_items]
    # Always keep Main HQ first
    items.sort(key=lambda b: (0 if b.get("isMain") or b.get("id") == "main" else 1, b.get("createdAt", "")))

    if _is_branch_manager(user_doc):
        assigned_id = str((user_doc or {}).get("assignedBranchId") or "").strip()
        if assigned_id:
            items = [b for b in items if b.get("id") == assigned_id]

    return success_response(
        data={"branches": items},
        extra={"branches": items},
        message="Branches loaded.",
    )


@branches_bp.route("", methods=["POST"])
@branches_bp.route("/", methods=["POST"])
def create_branch():
    """Create a new branch with strict sub-branch isolation defaults."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(user_doc):
        return error_response("Only the Business Owner at Main HQ can create new branches.", status_code=403)
    _ensure_main_branch(db, scope_key, user_doc)

    from app.utils.entitlements import check_entitlement
    allowed, limit_err = check_entitlement(db, scope_key, "maxBranches", user_doc)
    if not allowed:
        return error_response(
            error=limit_err["message"],
            details=limit_err,
            status_code=402,
        )

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return error_response("Branch name is required.", status_code=400)

    arch_id = payload.get("architectureId") or (user_doc or {}).get("architectureId") or "buy-and-sell"
    location = (payload.get("location") or "").strip() or "Rwanda"
    now_iso = datetime.now(timezone.utc).isoformat()
    slug = "".join(ch if ch.isalnum() else "-" for ch in name.lower()).strip("-")[:20] or "branch"
    branch_id = f"br-{slug}-{int(time.time() * 1000) % 10000}"

    default_perms = _default_branch_permissions(is_main=False)
    incoming_perms = payload.get("permissions") if isinstance(payload.get("permissions"), dict) else {}
    merged_perms = {**default_perms, **incoming_perms}

    branch_doc = {
        "id": branch_id,
        "scopeKey": scope_key,
        "name": name,
        "location": location,
        "architectureId": arch_id,
        "isMain": False,
        "status": str(payload.get("status") or "Active"),
        "requirePinForMainSwitch": bool(payload.get("requirePinForMainSwitch", True)),
        "permissions": merged_perms,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    owner_pin = str(payload.get("ownerPin") or "").strip()
    if owner_pin:
        branch_doc["ownerSwitchPinHash"] = hash_password(owner_pin)

    db.branches.insert_one(dict(branch_doc))
    clean_branch = _normalize_branch_doc(branch_doc)
    return success_response(
        data={"branch": clean_branch},
        extra={"branch": clean_branch},
        message=f"Branch '{name}' created with isolated access controls.",
        status_code=201,
    )


@branches_bp.route("/<branch_id>", methods=["PATCH"])
def update_branch(branch_id: str):
    """Edit an existing branch's name, location, status, Main HQ lock, or permissions."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(user_doc):
        return error_response("Only the Business Owner can modify branch settings or permissions.", status_code=403)
    _ensure_main_branch(db, scope_key, user_doc)

    existing = db.branches.find_one({"scopeKey": scope_key, "id": branch_id}, {"_id": 0})
    if not existing:
        return error_response("Branch not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    updates = {"updatedAt": datetime.now(timezone.utc).isoformat()}
    if "name" in payload:
        name = str(payload.get("name") or "").strip()
        if not name:
            return error_response("Branch name cannot be empty.", status_code=400)
        updates["name"] = name
    if "location" in payload:
        updates["location"] = str(payload.get("location") or "").strip() or "Rwanda"
    if "architectureId" in payload and not existing.get("isMain") and branch_id != "main":
        arch_id = str(payload.get("architectureId") or "").strip()
        if arch_id:
            updates["architectureId"] = arch_id
    if "status" in payload and branch_id != "main":
        st = str(payload.get("status") or "Active").strip()
        if st in ("Active", "Frozen"):
            updates["status"] = st
    if "requirePinForMainSwitch" in payload:
        updates["requirePinForMainSwitch"] = bool(payload.get("requirePinForMainSwitch"))
    if "ownerPin" in payload:
        raw_pin = str(payload.get("ownerPin") or "").strip()
        if raw_pin:
            updates["ownerSwitchPinHash"] = hash_password(raw_pin)
    if "permissions" in payload and isinstance(payload.get("permissions"), dict):
        is_main = bool(existing.get("isMain") or branch_id == "main")
        cur_perms = {**_default_branch_permissions(is_main), **(existing.get("permissions") or {})}
        for k in ("canDeleteRecords", "canEditPrices", "canViewProfitReports", "canAddInventory", "canRecordExpenses"):
            if k in payload["permissions"]:
                cur_perms[k] = bool(payload["permissions"][k])
        if "maxExpenseLimitRWF" in payload["permissions"]:
            try:
                cur_perms["maxExpenseLimitRWF"] = max(0.0, float(payload["permissions"]["maxExpenseLimitRWF"] or 0))
            except Exception:
                pass
        if is_main:
            cur_perms["canDeleteRecords"] = True
            cur_perms["canEditPrices"] = True
            cur_perms["canViewProfitReports"] = True
        updates["permissions"] = cur_perms

    db.branches.update_one({"scopeKey": scope_key, "id": branch_id}, {"$set": updates})
    updated = db.branches.find_one({"scopeKey": scope_key, "id": branch_id}, {"_id": 0})
    clean_updated = _normalize_branch_doc(updated)
    return success_response(
        data={"branch": clean_updated},
        extra={"branch": clean_updated},
        message="Branch settings & permissions updated.",
    )


@branches_bp.route("/<branch_id>/assign-manager", methods=["POST"])
def assign_branch_manager(branch_id: str):
    """
    Create or update a Branch Manager account with a password, assign them to this branch,
    and send them a direct dashboard login link via email (and WhatsApp if phone is provided).
    """
    db = get_db()
    scope_key, owner_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(owner_doc):
        return error_response("Only the Business Owner can assign branch managers.", status_code=403)
    _ensure_main_branch(db, scope_key, owner_doc)

    branch_doc = db.branches.find_one({"scopeKey": scope_key, "id": branch_id}, {"_id": 0})
    if not branch_doc:
        return error_response("Branch not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    manager_name = str(payload.get("name") or "").strip()
    manager_email = str(payload.get("email") or "").strip().lower()
    manager_phone = str(payload.get("phone") or "").strip()
    password = str(payload.get("password") or "")
    frontend_origin = str(payload.get("frontendOrigin") or "https://exbos.pages.dev").strip().rstrip("/")

    if not manager_name:
        return error_response("Manager full name is required.", status_code=400)
    if not manager_email or "@" not in manager_email:
        return error_response("A valid manager email address is required.", status_code=400)

    existing_user = db.users.find_one({"email": manager_email})
    if existing_user and existing_user.get("ownerScopeKey") not in (None, "", scope_key):
        return error_response("This email belongs to another independent ExBOS account.", status_code=409)
    if not existing_user and len(password) < 6:
        return error_response("Password must be at least 6 characters for a new manager account.", status_code=400)
    if password and len(password) < 6:
        return error_response("Password must be at least 6 characters.", status_code=400)

    now_iso = datetime.now(timezone.utc).isoformat()
    branch_arch = branch_doc.get("architectureId") or (owner_doc or {}).get("architectureId") or "buy-and-sell"
    biz_name = (owner_doc or {}).get("businessName") or branch_doc.get("name") or "ExBOS Business"

    user_updates = {
        "name": manager_name,
        "email": manager_email,
        "phone": manager_phone or (existing_user or {}).get("phone", ""),
        "role": "Branch Manager",
        "ownerScopeKey": scope_key,
        "assignedBranchId": branch_id,
        "assignedBranchName": branch_doc.get("name", ""),
        "businessName": biz_name,
        "architectureId": branch_arch,
        "enabledActivities": (owner_doc or {}).get("enabledActivities") or [branch_arch],
        "plan": (owner_doc or {}).get("plan") or "Starter",
        "location": branch_doc.get("location") or (owner_doc or {}).get("location") or "Rwanda",
        "emailVerified": True,
        "updated_at": now_iso,
    }
    if password:
        user_updates["password_hash"] = hash_password(password)

    if existing_user:
        db.users.update_one({"_id": existing_user["_id"]}, {"$set": user_updates})
    else:
        user_updates["created_at"] = now_iso
        db.users.insert_one(user_updates)

    manager_meta = {
        "name": manager_name,
        "email": manager_email,
        "phone": manager_phone,
        "assignedAt": now_iso,
    }
    db.branches.update_one(
        {"scopeKey": scope_key, "id": branch_id},
        {"$set": {"manager": manager_meta, "updatedAt": now_iso}},
    )
    updated_branch = db.branches.find_one({"scopeKey": scope_key, "id": branch_id}, {"_id": 0})

    login_link = f"{frontend_origin}/login?email={quote(manager_email)}&branch={quote(branch_id)}"
    branch_name = branch_doc.get("name", "Branch")

    branch_details = [
        ("Business", biz_name),
        ("Assigned Branch", branch_name),
        ("Role", "Branch Manager"),
        ("Login Email", manager_email),
    ]
    if password:
        branch_details.append(
            (
                "Password",
                f'<code style="background:#EEF4FB;border:1px solid #BFDBFE;padding:3px 8px;border-radius:6px;color:#0A2786;font-family:monospace;">{password}</code>',
            )
        )

    email_html = render_exbos_email(
        category="Branch Access",
        title=f"Branch Manager Access — {branch_name}",
        greeting=f"Hello <strong>{manager_name}</strong>,",
        intro_html=f"You have been assigned as the <strong>Branch Manager</strong> for <strong>{branch_name}</strong> ({biz_name}). Sign in using the credentials below to record sales, purchases, expenses, and inventory for your branch.",
        details=branch_details,
        primary_cta=("Open Branch Dashboard", login_link),
        footer_note=f"Your access is scoped directly to {branch_name} under Main HQ supervision.",
        fallback_link=login_link,
    )
    email_text = (
        f"Hello {manager_name}, you have been assigned as Branch Manager for {branch_name} ({biz_name}). "
        f"Login at: {login_link} with email {manager_email}"
        f"{f' and password {password}' if password else ''}."
    )
    email_sent = send_gmail_email(
        to_email=manager_email,
        subject=f"ExBOS Branch Manager Invite — {branch_name}",
        html_body=email_html,
        text_body=email_text,
    )

    whatsapp_sent = False
    if manager_phone:
        try:
            from app.routes.whatsapp import _send_whatsapp_message
            wa_msg = (
                f"Hello {manager_name}, you are now Branch Manager for *{branch_name}* ({biz_name}).\n"
                f"Email: {manager_email}\n"
                f"{f'Password: {password}' + chr(10) if password else ''}"
                f"Dashboard Link: {login_link}"
            )
            whatsapp_sent = bool(_send_whatsapp_message(db, scope_key, manager_phone, wa_msg))
        except Exception as exc:
            logger.debug("Optional WhatsApp invite skipped: %s", exc)

    result_payload = {
        "branch": _normalize_branch_doc(updated_branch) if updated_branch else None,
        "manager": manager_meta,
        "loginLink": login_link,
        "emailSent": email_sent,
        "whatsappSent": whatsapp_sent,
    }
    return success_response(
        data=result_payload,
        extra=result_payload,
        message=f"Branch Manager '{manager_name}' assigned to '{branch_name}'.",
        status_code=200,
    )


@branches_bp.route("/<branch_id>/manager-invite", methods=["POST"])
def create_branch_manager_invite(branch_id: str):
    """
    Generate a secure, single-use 7-day setup link for a Branch Manager.
    When the manager opens the link, they enter their own email & chosen password to activate their account.
    """
    db = get_db()
    scope_key, owner_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(owner_doc):
        return error_response("Only the Business Owner can generate branch manager invite links.", status_code=403)
    _ensure_main_branch(db, scope_key, owner_doc)

    branch_doc = db.branches.find_one({"scopeKey": scope_key, "id": branch_id}, {"_id": 0})
    if not branch_doc:
        return error_response("Branch not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    suggested_name = str(payload.get("name") or "").strip()
    suggested_email = str(payload.get("email") or "").strip().lower()
    suggested_phone = str(payload.get("phone") or "").strip()
    frontend_origin = str(payload.get("frontendOrigin") or "https://exbos.pages.dev").strip().rstrip("/")

    now_dt = datetime.now(timezone.utc)
    expires_dt = now_dt + timedelta(days=7)
    now_iso = now_dt.isoformat()
    expires_iso = expires_dt.isoformat()

    token = secrets.token_urlsafe(32)
    branch_name = branch_doc.get("name") or "Branch"
    branch_location = branch_doc.get("location") or "Rwanda"
    branch_arch = branch_doc.get("architectureId") or (owner_doc or {}).get("architectureId") or "buy-and-sell"
    biz_name = (owner_doc or {}).get("businessName") or branch_name or "ExBOS Business"
    owner_email = str((owner_doc or {}).get("email") or scope_key).strip().lower()

    # Invalidate older pending invites for the same branch so only the newest link is valid
    db.branch_invites.update_many(
        {"scopeKey": scope_key, "branchId": branch_id, "status": "pending"},
        {"$set": {"status": "replaced", "updatedAt": now_iso}},
    )

    invite_link = f"{frontend_origin}/branch-invite/{token}"
    invite_doc = {
        "token": token,
        "scopeKey": scope_key,
        "ownerEmail": owner_email,
        "branchId": branch_id,
        "branchName": branch_name,
        "branchLocation": branch_location,
        "businessName": biz_name,
        "architectureId": branch_arch,
        "suggestedName": suggested_name,
        "suggestedEmail": suggested_email,
        "suggestedPhone": suggested_phone,
        "status": "pending",
        "inviteLink": invite_link,
        "createdAt": now_iso,
        "expiresAt": expires_iso,
    }
    db.branch_invites.insert_one(dict(invite_doc))

    existing_manager = branch_doc.get("manager") if isinstance(branch_doc.get("manager"), dict) else {}
    manager_meta = {
        "name": suggested_name or existing_manager.get("name") or "Pending Branch Manager",
        "email": suggested_email or existing_manager.get("email") or "",
        "phone": suggested_phone or existing_manager.get("phone") or "",
        "status": "Pending Setup",
        "inviteLink": invite_link,
        "inviteCreatedAt": now_iso,
        "inviteExpiresAt": expires_iso,
    }
    db.branches.update_one(
        {"scopeKey": scope_key, "id": branch_id},
        {"$set": {"manager": manager_meta, "updatedAt": now_iso}},
    )
    updated_branch = db.branches.find_one({"scopeKey": scope_key, "id": branch_id}, {"_id": 0})

    email_sent = False
    if suggested_email and "@" in suggested_email:
        greeting_name = suggested_name or "Branch Manager"
        email_html = render_exbos_email(
            category="Branch Invitation",
            title=f"Set Up Your Branch Manager Account — {branch_name}",
            greeting=f"Hello <strong>{greeting_name}</strong>,",
            intro_html=(
                f"You have been invited to manage <strong>{branch_name}</strong> ({biz_name}) on ExBOS. "
                f"Click the secure setup button below to enter your email and choose your own password."
            ),
            details=[
                ("Business", biz_name),
                ("Assigned Branch", branch_name),
                ("Location", branch_location),
                ("Role", "Branch Manager"),
                ("Link Validity", "7 Days (Single-Use)"),
            ],
            primary_cta=("Set Up My Manager Account", invite_link),
            footer_note="For your security, you will choose your own private password on the setup page.",
            fallback_link=invite_link,
        )
        email_text = (
            f"Hello {greeting_name}, you have been invited to manage {branch_name} ({biz_name}) on ExBOS. "
            f"Open this secure link to enter your email and create your password: {invite_link}"
        )
        email_sent = send_gmail_email(
            to_email=suggested_email,
            subject=f"ExBOS Invitation — Set Up Your Branch Manager Account ({branch_name})",
            html_body=email_html,
            text_body=email_text,
        )

    whatsapp_sent = False
    if suggested_phone:
        try:
            from app.routes.whatsapp import _send_whatsapp_message
            wa_msg = (
                f"Hello {suggested_name or 'Branch Manager'}, you have been invited as Branch Manager for *{branch_name}* ({biz_name}).\n"
                f"Open this secure link to enter your email and set your own password:\n{invite_link}"
            )
            whatsapp_sent = bool(_send_whatsapp_message(db, scope_key, suggested_phone, wa_msg))
        except Exception as exc:
            logger.debug("Optional WhatsApp branch invite skipped: %s", exc)

    result_payload = {
        "branch": _normalize_branch_doc(updated_branch) if updated_branch else None,
        "inviteLink": invite_link,
        "token": token,
        "expiresAt": expires_iso,
        "emailSent": email_sent,
        "whatsappSent": whatsapp_sent,
    }
    return success_response(
        data=result_payload,
        extra=result_payload,
        message=f"Secure Branch Manager setup link generated for '{branch_name}'.",
        status_code=201,
    )


@branches_bp.route("/invite/<token>", methods=["GET"])
def get_branch_manager_invite(token: str):
    """Public endpoint to validate a Branch Manager setup link and return safe display details."""
    db = get_db()
    clean_token = str(token or "").strip()
    if not clean_token:
        return error_response("Invalid invitation link.", status_code=400)

    invite = db.branch_invites.find_one({"token": clean_token}, {"_id": 0})
    if not invite:
        return error_response("This invitation link is invalid or does not exist.", status_code=404)

    status = str(invite.get("status") or "pending").lower()
    if status == "used":
        return error_response("This invitation link has already been used. Please sign in on the login page.", status_code=410)
    if status != "pending":
        return error_response("This invitation link is no longer active. Please ask the business owner for a new link.", status_code=410)

    expires_at = str(invite.get("expiresAt") or "")
    try:
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
            db.branch_invites.update_one({"token": clean_token}, {"$set": {"status": "expired"}})
            return error_response("This invitation link has expired. Please ask the business owner for a fresh link.", status_code=410)
    except Exception:
        pass

    public_info = {
        "businessName": invite.get("businessName") or "ExBOS Business",
        "branchId": invite.get("branchId") or "",
        "branchName": invite.get("branchName") or "Branch",
        "branchLocation": invite.get("branchLocation") or "Rwanda",
        "suggestedName": invite.get("suggestedName") or "",
        "suggestedEmail": invite.get("suggestedEmail") or "",
        "suggestedPhone": invite.get("suggestedPhone") or "",
        "expiresAt": expires_at,
    }
    return success_response(data=public_info, extra=public_info, message="Invitation link is valid.")


@branches_bp.route("/invite/<token>/complete", methods=["POST"])
def complete_branch_manager_invite(token: str):
    """
    Public endpoint where the invited Branch Manager submits their own fullName, email, phone, and chosen password.
    Activates the branch manager account, notifies the Business Owner (in-app + branded email), and returns a JWT session.
    """
    db = get_db()
    clean_token = str(token or "").strip()
    invite = db.branch_invites.find_one({"token": clean_token})
    if not invite:
        return error_response("This invitation link is invalid or does not exist.", status_code=404)

    status = str(invite.get("status") or "pending").lower()
    if status == "used":
        return error_response("This invitation link has already been used. Please sign in normally.", status_code=410)
    if status != "pending":
        return error_response("This invitation link is no longer active.", status_code=410)

    expires_at = str(invite.get("expiresAt") or "")
    try:
        if expires_at and datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
            db.branch_invites.update_one({"token": clean_token}, {"$set": {"status": "expired"}})
            return error_response("This invitation link has expired.", status_code=410)
    except Exception:
        pass

    payload = request.get_json(silent=True) or {}
    full_name = str(payload.get("fullName") or payload.get("name") or invite.get("suggestedName") or "").strip()
    manager_email = str(payload.get("email") or "").strip().lower()
    manager_phone = str(payload.get("phone") or invite.get("suggestedPhone") or "").strip()
    password = str(payload.get("password") or "")
    confirm_password = str(payload.get("confirmPassword") or password)

    if not full_name:
        return error_response("Please enter your full name.", status_code=400)
    if not manager_email or "@" not in manager_email or "." not in manager_email.split("@")[-1]:
        return error_response("Please enter a valid email address.", status_code=400)
    if len(password) < 6:
        return error_response("Password must be at least 6 characters long.", status_code=400)
    if password != confirm_password:
        return error_response("Passwords do not match. Please re-enter.", status_code=400)

    scope_key = str(invite.get("scopeKey") or "").strip().lower()
    branch_id = str(invite.get("branchId") or "").strip()
    branch_name = str(invite.get("branchName") or "Branch").strip()
    biz_name = str(invite.get("businessName") or "ExBOS Business").strip()
    branch_arch = str(invite.get("architectureId") or "buy-and-sell").strip()
    owner_email = str(invite.get("ownerEmail") or scope_key).strip().lower()

    if manager_email == owner_email:
        return error_response("Branch manager email cannot be the same as the Business Owner's email.", status_code=409)

    existing_user = db.users.find_one({"email": manager_email})
    if existing_user and existing_user.get("ownerScopeKey") not in (None, "", scope_key):
        return error_response("This email already belongs to another independent ExBOS business account.", status_code=409)

    owner_doc = db.users.find_one({"email": owner_email}, {"_id": 0}) or {}
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "name": full_name,
        "email": manager_email,
        "phone": manager_phone,
        "role": "Branch Manager",
        "ownerScopeKey": scope_key,
        "assignedBranchId": branch_id,
        "assignedBranchName": branch_name,
        "businessName": biz_name,
        "architectureId": branch_arch,
        "enabledActivities": owner_doc.get("enabledActivities") or [branch_arch],
        "plan": owner_doc.get("plan") or "Free",
        "location": invite.get("branchLocation") or owner_doc.get("location") or "Rwanda",
        "emailVerified": True,
        "accountStatus": "Active",
        "password_hash": hash_password(password),
        "updated_at": now_iso,
    }

    if existing_user:
        db.users.update_one({"_id": existing_user["_id"]}, {"$set": user_doc})
    else:
        user_doc["created_at"] = now_iso
        db.users.insert_one(dict(user_doc))

    # Mark invite used
    db.branch_invites.update_one(
        {"token": clean_token},
        {
            "$set": {
                "status": "used",
                "usedAt": now_iso,
                "activatedEmail": manager_email,
                "activatedName": full_name,
            }
        },
    )

    # Update branch manager metadata to Active
    manager_meta = {
        "name": full_name,
        "email": manager_email,
        "phone": manager_phone,
        "status": "Active",
        "assignedAt": now_iso,
        "activatedAt": now_iso,
    }
    db.branches.update_one(
        {"scopeKey": scope_key, "id": branch_id},
        {"$set": {"manager": manager_meta, "updatedAt": now_iso}},
    )

    # 1) Create persistent in-app notification for the Business Owner / Admin
    notif_id = f"notif-bm-{int(time.time() * 1000)}"
    notif_doc = {
        "id": notif_id,
        "scopeKey": scope_key,
        "type": "branch_manager_activated",
        "title": "Branch Manager Account Activated",
        "message": f"{full_name} ({manager_email}) successfully set up their Branch Manager account for {branch_name}.",
        "branchId": branch_id,
        "branchName": branch_name,
        "managerName": full_name,
        "managerEmail": manager_email,
        "read": False,
        "createdAt": now_iso,
    }
    db.owner_notifications.insert_one(dict(notif_doc))

    # 2) Send branded ExBOS confirmation email to the Business Owner
    owner_notified_email = False
    if owner_email and "@" in owner_email:
        owner_name = owner_doc.get("name") or "Business Owner"
        frontend_origin = str(payload.get("frontendOrigin") or "https://exbos.pages.dev").strip().rstrip("/")
        owner_email_html = render_exbos_email(
            category="Branch Security Alert",
            title=f"Branch Manager Account Set Up — {branch_name}",
            greeting=f"Hello <strong>{owner_name}</strong>,",
            intro_html=(
                f"Your invited Branch Manager <strong>{full_name}</strong> has successfully completed their "
                f"account setup and is now active on <strong>{branch_name}</strong>."
            ),
            details=[
                ("Manager Name", full_name),
                ("Manager Email", manager_email),
                ("Phone", manager_phone or "Not provided"),
                ("Assigned Branch", branch_name),
                ("Status", "Active & Branch-Locked"),
                ("Activated At (UTC)", now_iso[:19].replace("T", " ")),
            ],
            primary_cta=("Manage Branches in ExBOS", f"{frontend_origin}/dashboard"),
            footer_note="You can review branch permissions, expense limits, or freeze branch access at any time from Settings -> Branches Control.",
        )
        owner_email_text = (
            f"Hello {owner_name}, {full_name} ({manager_email}) has successfully set up their Branch Manager account "
            f"for {branch_name} ({biz_name})."
        )
        owner_notified_email = send_gmail_email(
            to_email=owner_email,
            subject=f"ExBOS Alert: Branch Manager Account Activated — {branch_name}",
            html_body=owner_email_html,
            text_body=owner_email_text,
        )

    # 3) Send live WhatsApp alert to owner's registered Meta recipient number(s)
    try:
        from app.services.whatsapp_client import notify_registered_whatsapp_recipients
        wa_alert_text = (
            f"*EXCELLENCE BOS — Branch Security Alert*\n"
            f"Branch Manager *{full_name}* ({manager_email}) has successfully set up their account for *{branch_name}*.\n"
            f"Status: Active & Branch-Locked."
        )
        notify_registered_whatsapp_recipients(
            db,
            alert_type="branchManagerActivated",
            message_text=wa_alert_text,
            scope_key=scope_key,
            target_roles=["owner", "super_admin"],
        )
    except Exception as exc:
        logger.debug("Optional WhatsApp branch activation alert skipped: %s", exc)

    access_token = create_access_token(identity=manager_email)
    safe_user = {k: v for k, v in user_doc.items() if k not in ("password_hash", "_id")}

    res_payload = {
        "access_token": access_token,
        "user": safe_user,
        "branchId": branch_id,
        "branchName": branch_name,
        "ownerNotified": True,
        "ownerEmailSent": owner_notified_email,
    }
    return success_response(
        data=res_payload,
        extra=res_payload,
        message=f"Account set up successfully! Welcome to {branch_name}.",
        status_code=201,
    )


@branches_bp.route("/notifications", methods=["GET"])
def list_branch_notifications():
    """Return owner-scoped branch notifications (e.g., Branch Manager account activations)."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(user_doc):
        return success_response(data={"notifications": []}, extra={"notifications": []})

    items = list(
        db.owner_notifications.find({"scopeKey": scope_key, "read": {"$ne": True}}, {"_id": 0})
        .sort("createdAt", -1)
        .limit(30)
    )
    return success_response(
        data={"notifications": items},
        extra={"notifications": items},
        message="Owner notifications loaded.",
    )


@branches_bp.route("/notifications/<notif_id>/read", methods=["PATCH"])
def mark_branch_notification_read(notif_id: str):
    """Mark a single owner notification (or 'all') as read."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(user_doc):
        return error_response("Only the Business Owner can dismiss branch notifications.", status_code=403)

    if notif_id == "all":
        db.owner_notifications.update_many(
            {"scopeKey": scope_key, "read": {"$ne": True}},
            {"$set": {"read": True, "readAt": datetime.now(timezone.utc).isoformat()}},
        )
    else:
        db.owner_notifications.update_one(
            {"scopeKey": scope_key, "id": notif_id},
            {"$set": {"read": True, "readAt": datetime.now(timezone.utc).isoformat()}},
        )
    return success_response(data={"ok": True}, message="Notification marked as read.")


@branches_bp.route("/verify-owner-switch", methods=["POST"])
def verify_owner_switch():
    """
    Verify Business Owner password or Owner Branch PIN before unlocking a switch
    from a sub-branch into Main HQ (or unlocking restricted HQ settings).
    Branch Manager accounts are strictly blocked from Main HQ.
    """
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(user_doc):
        return error_response(
            "Access Denied: Sub-branch managers cannot enter Main HQ.",
            status_code=403,
        )

    payload = request.get_json(silent=True) or {}
    secret = str(payload.get("secret") or payload.get("password") or payload.get("pin") or "").strip()
    from_branch_id = str(payload.get("fromBranchId") or "").strip()
    if not secret:
        return error_response("Please enter the Business Owner password or security PIN.", status_code=400)

    owner_user = db.users.find_one({"email": scope_key}) or user_doc or {}
    owner_pw_hash = owner_user.get("password_hash") or ""

    verified = False
    if owner_pw_hash and verify_password(secret, owner_pw_hash):
        verified = True

    if not verified and from_branch_id:
        b_doc = db.branches.find_one({"scopeKey": scope_key, "id": from_branch_id})
        if b_doc and b_doc.get("ownerSwitchPinHash"):
            if verify_password(secret, b_doc["ownerSwitchPinHash"]):
                verified = True

    if not verified:
        main_doc = db.branches.find_one({"scopeKey": scope_key, "id": "main"})
        if main_doc and main_doc.get("ownerSwitchPinHash"):
            if verify_password(secret, main_doc["ownerSwitchPinHash"]):
                verified = True

    if not verified:
        return error_response(
            "Invalid Owner password or security PIN. Main HQ remains locked.",
            status_code=401,
        )

    return success_response(
        data={"verified": True, "scopeKey": scope_key},
        extra={"verified": True},
        message="Owner identity verified. Main HQ unlocked.",
    )


@branches_bp.route("/<branch_id>/transfer-stock", methods=["POST"])
def transfer_branch_stock(branch_id: str):
    """
    Transfer stock quantity of a product from Main HQ ('main') to a sub-branch atomically.
    Only the Business Owner can initiate inter-branch stock transfers.
    """
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(user_doc):
        return error_response("Only the Business Owner at Main HQ can transfer stock between branches.", status_code=403)

    from app.utils.entitlements import check_entitlement
    allowed, limit_err = check_entitlement(db, scope_key, "allowMultiBranchTransfer", user_doc)
    if not allowed:
        return error_response(
            error=limit_err["message"],
            details=limit_err,
            status_code=402,
        )
    if branch_id == "main":
        return error_response("Select a destination sub-branch to receive stock from Main HQ.", status_code=400)

    target_branch = db.branches.find_one({"scopeKey": scope_key, "id": branch_id}, {"_id": 0})
    if not target_branch:
        return error_response("Destination branch not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    product_id = str(payload.get("productId") or "").strip()
    arch_id = str(payload.get("architectureId") or target_branch.get("architectureId") or "buy-and-sell").strip()
    try:
        qty = float(payload.get("quantity") or 0)
    except Exception:
        qty = 0.0

    if not product_id or qty <= 0:
        return error_response("Valid product and positive transfer quantity are required.", status_code=400)

    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id})
    if not ws:
        return error_response("Workspace inventory not found.", status_code=404)

    records = ws.get("records") or {}
    now_iso = datetime.now(timezone.utc).isoformat()
    today_str = now_iso[:10]

    # Locate source product in Main HQ across Products and Inventory buckets
    source_prod = None
    source_bucket = None
    for b_name in ("Products", "Inventory"):
        arr = records.get(b_name)
        if not isinstance(arr, list):
            continue
        for item in arr:
            if (item.get("id") == product_id) and (item.get("branchId") or "main") == "main":
                source_prod = item
                source_bucket = b_name
                break
        if source_prod:
            break

    if not source_prod:
        return error_response("Source product not found in Main HQ inventory.", status_code=404)

    avail_qty = float(source_prod.get("quantity") if source_prod.get("quantity") is not None else (source_prod.get("stock") or 0))
    if qty > avail_qty:
        return error_response(
            f"Insufficient Main HQ stock for '{source_prod.get('title') or source_prod.get('name')}'. Available: {avail_qty:g}.",
            status_code=400,
        )

    new_hq_qty = max(0.0, avail_qty - qty)
    prod_title = (source_prod.get("title") or source_prod.get("name") or "Product").strip()

    # Deduct from matching Main HQ items in Products & Inventory
    for b_name in ("Products", "Inventory"):
        arr = records.get(b_name)
        if not isinstance(arr, list):
            continue
        for item in arr:
            item_title = (item.get("title") or item.get("name") or "").strip().lower()
            if (item.get("branchId") or "main") == "main" and (
                item.get("id") == product_id or (prod_title and item_title == prod_title.lower())
            ):
                item["quantity"] = new_hq_qty
                item["stock"] = new_hq_qty
                u_cost = float(item.get("unitCostRWF") or item.get("buyingPriceRWF") or item.get("costPrice") or 0)
                if u_cost > 0:
                    item["amountRWF"] = round(new_hq_qty * u_cost)
                item["status"] = "Out of Stock" if new_hq_qty <= 0 else ("Low Stock" if new_hq_qty <= 5 else "In Stock")
                item["updatedAt"] = now_iso

    # Add or increment in destination branch across Products & Inventory
    target_bucket = source_bucket or "Products"
    dest_arr = list(records.get(target_bucket) or [])
    dest_match = None
    for item in dest_arr:
        item_title = (item.get("title") or item.get("name") or "").strip().lower()
        if item.get("branchId") == branch_id and item_title == prod_title.lower():
            dest_match = item
            break

    unit_cost = float(source_prod.get("unitCostRWF") or source_prod.get("buyingPriceRWF") or source_prod.get("costPrice") or 0)
    sell_price = float(source_prod.get("sellingPriceRWF") or source_prod.get("unitPriceRWF") or source_prod.get("price") or 0)

    if dest_match:
        prev_dest_qty = float(dest_match.get("quantity") if dest_match.get("quantity") is not None else (dest_match.get("stock") or 0))
        next_dest_qty = prev_dest_qty + qty
        dest_match["quantity"] = next_dest_qty
        dest_match["stock"] = next_dest_qty
        if unit_cost > 0:
            dest_match["amountRWF"] = round(next_dest_qty * unit_cost)
        dest_match["status"] = "Low Stock" if next_dest_qty <= 5 else "In Stock"
        dest_match["updatedAt"] = now_iso
    else:
        cloned = {
            **source_prod,
            "id": f"PROD-{int(time.time() * 1000)}-{branch_id[-4:]}",
            "branchId": branch_id,
            "quantity": qty,
            "stock": qty,
            "unitCostRWF": unit_cost,
            "sellingPriceRWF": sell_price,
            "amountRWF": round(qty * (unit_cost or sell_price)),
            "status": "Low Stock" if qty <= 5 else "In Stock",
            "transferredFrom": "Main HQ",
            "date": today_str,
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }
        dest_arr.insert(0, cloned)
    records[target_bucket] = dest_arr

    # Mirror into Inventory bucket if source was Products so both views stay in sync
    if target_bucket == "Products":
        inv_arr = list(records.get("Inventory") or [])
        inv_match = next(
            (x for x in inv_arr if x.get("branchId") == branch_id and (x.get("title") or x.get("name") or "").strip().lower() == prod_title.lower()),
            None,
        )
        if inv_match:
            next_q = float(inv_match.get("quantity") or inv_match.get("stock") or 0) + qty
            inv_match["quantity"] = next_q
            inv_match["stock"] = next_q
            inv_match["status"] = "Low Stock" if next_q <= 5 else "In Stock"
        else:
            inv_arr.insert(0, {**dest_arr[0], "id": f"INV-{int(time.time() * 1000)}-{branch_id[-4:]}"})
        records["Inventory"] = inv_arr

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records, "updated_at": now_iso}},
    )

    clean_ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id}, {"_id": 0})
    return success_response(
        data={
            "workspace": clean_ws,
            "transferredQuantity": qty,
            "productTitle": prod_title,
            "targetBranchId": branch_id,
            "targetBranchName": target_branch.get("name"),
        },
        message=f"Transferred {qty:g} units of '{prod_title}' from Main HQ to {target_branch.get('name')}.",
    )


@branches_bp.route("/<branch_id>", methods=["DELETE"])
def delete_branch(branch_id: str):
    """Delete a sub-branch (Main HQ branch is protected)."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if _is_branch_manager(user_doc):
        return error_response("Only the Business Owner can delete branches.", status_code=403)
    if branch_id == "main":
        return error_response("The Main HQ branch cannot be deleted.", status_code=400)

    res = db.branches.delete_one({"scopeKey": scope_key, "id": branch_id})
    if res.deleted_count == 0:
        return error_response("Branch not found.", status_code=404)

    return success_response(data={"deletedId": branch_id}, message="Branch deleted.")


@branches_bp.route("/analytics", methods=["GET"])
def branch_analytics():
    """
    Aggregate cross-branch performance metrics, identify the Best Performing Branch,
    and build a GitHub-contribution-style daily activity & revenue heatmap.
    """
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    main_branch = _ensure_main_branch(db, scope_key, user_doc)

    branches = list(db.branches.find({"scopeKey": scope_key}, {"_id": 0}))
    branches.sort(key=lambda b: (0 if b.get("isMain") or b.get("id") == "main" else 1, b.get("createdAt", "")))

    arch_id = request.args.get("archId") or main_branch.get("architectureId") or "buy-and-sell"
    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id}, {"_id": 0}) or {}
    records = ws.get("records") or {}

    sales_list = list(records.get("Sales") or []) + list(records.get("ServiceJobs") or []) + list(records.get("KitchenOrders") or []) + list(records.get("MixedSales") or [])
    purchases_list = list(records.get("Purchases") or [])
    expenses_list = list(records.get("Expenses") or [])
    products_list = list(records.get("Products") or []) + list(records.get("Inventory") or [])

    branch_stats = {}
    for b in branches:
        bid = b["id"]
        branch_stats[bid] = {
            "id": bid,
            "name": b["name"],
            "location": b.get("location", ""),
            "isMain": bool(b.get("isMain") or bid == "main"),
            "revenueRWF": 0.0,
            "purchasesRWF": 0.0,
            "expensesRWF": 0.0,
            "netProfitRWF": 0.0,
            "salesCount": 0,
            "productsCount": 0,
        }

    # Daily heatmap aggregator (date -> {count, revenueRWF, byBranch})
    daily_map: dict[str, dict] = defaultdict(lambda: {"count": 0, "revenueRWF": 0.0})

    def _b_id(rec: dict) -> str:
        raw = rec.get("branchId") or "main"
        return raw if raw in branch_stats else "main"

    for s in sales_list:
        bid = _b_id(s)
        amt = float(s.get("amountRWF") or s.get("totalAmount") or 0)
        branch_stats[bid]["revenueRWF"] += amt
        branch_stats[bid]["salesCount"] += 1
        d_str = str(s.get("date") or "")[:10]
        if len(d_str) == 10:
            daily_map[d_str]["count"] += 1
            daily_map[d_str]["revenueRWF"] += amt

    for p in purchases_list:
        bid = _b_id(p)
        amt = float(p.get("amountRWF") or 0)
        branch_stats[bid]["purchasesRWF"] += amt
        d_str = str(p.get("date") or "")[:10]
        if len(d_str) == 10:
            daily_map[d_str]["count"] += 1

    for e in expenses_list:
        bid = _b_id(e)
        amt = float(e.get("amountRWF") or 0)
        branch_stats[bid]["expensesRWF"] += amt
        d_str = str(e.get("date") or "")[:10]
        if len(d_str) == 10:
            daily_map[d_str]["count"] += 1

    for prod in products_list:
        bid = _b_id(prod)
        branch_stats[bid]["productsCount"] += 1

    perf_list = []
    for bid, st in branch_stats.items():
        st["netProfitRWF"] = st["revenueRWF"] - st["purchasesRWF"] - st["expensesRWF"]
        perf_list.append(st)

    perf_sorted = sorted(perf_list, key=lambda x: (x["revenueRWF"], x["netProfitRWF"], x["salesCount"]), reverse=True)
    best_branch = perf_sorted[0] if perf_sorted else None

    # Build 24-week (168 days) GitHub-style calendar grid ending today
    today = datetime.now(timezone.utc).date()
    days_count = 168
    start_date = today - timedelta(days=days_count - 1)
    max_rev = max((v["revenueRWF"] for v in daily_map.values()), default=0) or 1
    max_cnt = max((v["count"] for v in daily_map.values()), default=0) or 1

    heatmap = []
    for i in range(days_count):
        cur = start_date + timedelta(days=i)
        d_iso = cur.isoformat()
        info = daily_map.get(d_iso, {"count": 0, "revenueRWF": 0.0})
        cnt = info["count"]
        rev = info["revenueRWF"]
        if cnt == 0 and rev == 0:
            level = 0
        else:
            ratio = max(rev / max_rev if max_rev else 0, cnt / max_cnt if max_cnt else 0)
            level = 1 if ratio <= 0.25 else 2 if ratio <= 0.5 else 3 if ratio <= 0.75 else 4
        heatmap.append({
            "date": d_iso,
            "count": cnt,
            "revenueRWF": rev,
            "level": level,
        })

    return success_response(
        data={
            "branches": perf_sorted,
            "bestBranch": best_branch,
            "heatmap": heatmap,
            "totalRevenueRWF": sum(b["revenueRWF"] for b in perf_sorted),
            "totalNetProfitRWF": sum(b["netProfitRWF"] for b in perf_sorted),
        },
        message="Branch analytics calculated.",
    )

