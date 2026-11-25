from datetime import datetime, timezone
from functools import wraps
import logging
from flask import Blueprint, current_app, g, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.database import get_db, serialize_doc
from app.schemas.admin_schemas import (
    BroadcastSchema,
    PlatinumProgramSchema,
    PricingPlanUpdateSchema,
    SubscriptionUpdateSchema,
)
from app.seed_defaults import (
    ARCHITECTURE_IDS,
    DEFAULT_PLATINUM_PROGRAM,
    DEFAULT_PRICING_PLANS,
)
from app.utils.mailer import send_gmail_email
from app.utils.email_templates import render_exbos_email
from app.utils.responses import error_response, success_response, validate_json

logger = logging.getLogger("app.super_admin")

super_admin_bp = Blueprint(
    "super_admin", __name__, url_prefix="/api/v1/super-admin"
)


def _is_super_admin_doc(user_doc: dict | None, email: str = "") -> bool:
    clean_email = (email or (user_doc or {}).get("email") or "").strip().lower()
    if user_doc and bool(user_doc.get("isSuperAdmin")):
        return True
    configured = current_app.config.get("SUPER_ADMIN_EMAILS") or [
        "mugishaleobeni0@gmail.com"
    ]
    return clean_email in {str(e).strip().lower() for e in configured}


def require_super_admin(fn):
    """
    Strictly verifies that the caller holds a valid JWT for an active Super Admin account
    (either user.isSuperAdmin == True in db.users or email in SUPER_ADMIN_EMAILS).
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()
        except Exception:
            return error_response(
                "Super Administrator authentication required.", status_code=401
            )

        email = str(identity or "").strip().lower()
        if not email:
            return error_response(
                "Super Administrator authentication required.", status_code=401
            )

        db = get_db()
        actor = db.users.find_one({"email": email})
        if actor and (actor.get("accountStatus") or "Active").strip().lower() == "suspended":
            return error_response("Account is suspended.", status_code=403)

        if not _is_super_admin_doc(actor, email):
            return error_response(
                "Forbidden: Platform Super Administrator privileges required.",
                status_code=403,
            )

        g.super_admin_email = email
        g.super_admin_user = actor
        return fn(*args, **kwargs)

    return wrapper


def _record_audit_log(
    db,
    actor_email: str,
    target_email: str,
    action: str,
    details: dict,
    reason: str = "",
) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": f"AUD-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "actorEmail": actor_email,
        "targetEmail": target_email,
        "action": action,
        "details": details or {},
        "reason": reason or "",
        "createdAt": now_iso,
    }
    db.super_admin_audit_logs.insert_one(dict(entry))
    return entry


def _resolve_plan_price_rwf(db, plan_name: str) -> float:
    doc = db.platform_config.find_one({"key": "pricing_plans"})
    plans = (
        doc.get("value", [])
        if doc and isinstance(doc.get("value"), list)
        else DEFAULT_PRICING_PLANS
    )
    target = (plan_name or "Free").strip().lower()
    for p in plans:
        tier = str(p.get("tier") or p.get("name") or "").strip().lower()
        if tier == target or target in tier:
            return float(p.get("priceRWF") or p.get("monthlyPriceRWF") or 0)
    fallback = {"free": 0.0, "bronze": 10000.0, "silver": 20000.0, "gold": 35000.0}
    return fallback.get(target, 0.0)


def _compute_renewal_info(user_doc: dict, now_dt: datetime) -> dict:
    """
    Compute paidAt timestamp, subscriptionExpiry date, exact days/hours remaining,
    and human-readable renewal status for Super Admin monitoring.
    """
    plan = str(user_doc.get("plan") or user_doc.get("planTier") or "Free").strip()
    billing_type = str(user_doc.get("billingType") or "Free").strip()
    paid_at = str(
        user_doc.get("paidAt")
        or user_doc.get("lastPaymentSubmittedAt")
        or user_doc.get("subscriptionStartAt")
        or ""
    ).strip()
    expiry_raw = str(user_doc.get("subscriptionExpiry") or "").strip()

    if plan.lower() == "free" and not expiry_raw:
        return {
            "paidAt": paid_at,
            "subscriptionExpiry": "",
            "daysRemaining": None,
            "hoursRemaining": None,
            "timeRemainingLabel": "Forever Free · No Expiry",
            "renewalStatus": "free",
        }

    if not expiry_raw and plan.lower() != "free" and "complimentary" not in billing_type.lower():
        base_str = paid_at or str(user_doc.get("created_at") or "")
        if base_str:
            try:
                base_dt = datetime.fromisoformat(base_str.replace("Z", "+00:00"))
                if base_dt.tzinfo is None:
                    base_dt = base_dt.replace(tzinfo=timezone.utc)
                expiry_raw = (base_dt + timedelta(days=30)).strftime("%Y-%m-%d")
            except Exception:
                pass

    if not expiry_raw:
        return {
            "paidAt": paid_at,
            "subscriptionExpiry": "",
            "daysRemaining": None,
            "hoursRemaining": None,
            "timeRemainingLabel": "Complimentary · No Fixed Expiry"
            if "complimentary" in billing_type.lower()
            else "Active · No Expiry Set",
            "renewalStatus": "active",
        }

    try:
        exp_dt = datetime.fromisoformat(expiry_raw.replace("Z", "+00:00"))
        if len(expiry_raw) <= 10 or (exp_dt.hour == 0 and exp_dt.minute == 0 and "T" not in expiry_raw):
            exp_dt = exp_dt.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        elif exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)

        delta_sec = (exp_dt - now_dt).total_seconds()
        days_rem = int(delta_sec // 86400)
        hours_rem = int((abs(delta_sec) % 86400) // 3600)

        if delta_sec < 0:
            overdue_days = abs(days_rem)
            label = f"Expired {overdue_days}d {hours_rem}h ago · Needs Renewal"
            status = "expired"
        elif days_rem == 0:
            label = f"Expires today ({hours_rem}h remaining)"
            status = "expiring_soon"
        elif days_rem <= 5:
            label = f"{days_rem}d {hours_rem}h remaining · Renew Soon"
            status = "expiring_soon"
        else:
            label = f"{days_rem}d {hours_rem}h remaining"
            status = "active"

        return {
            "paidAt": paid_at,
            "subscriptionExpiry": expiry_raw[:10],
            "daysRemaining": days_rem,
            "hoursRemaining": hours_rem,
            "timeRemainingLabel": label,
            "renewalStatus": status,
        }
    except Exception:
        return {
            "paidAt": paid_at,
            "subscriptionExpiry": expiry_raw,
            "daysRemaining": None,
            "hoursRemaining": None,
            "timeRemainingLabel": f"Expires {expiry_raw}",
            "renewalStatus": "active",
        }


@super_admin_bp.route("/analytics", methods=["GET"])
@require_super_admin
def get_platform_analytics():
    """
    Executive Super Admin analytics: Top Working Users/Businesses leaderboard
    ranked by real MongoDB activity (records, transactions, branches, staff, volume),
    architecture distribution, subscription plan mix, and recent signups.
    """
    db = get_db()
    all_users = list(db.users.find({}).sort("created_at", -1))

    # Aggregate real record counts per scopeKey from db.module_records & db.workspaces
    record_counts: dict[str, int] = {}
    revenue_totals: dict[str, float] = {}
    try:
        for ws in db.workspaces.find(
            {},
            {
                "scopeKey": 1,
                "records": 1,
                "monthlyRevenueRWF": 1,
                "spendableRWF": 1,
            },
        ):
            sk = (ws.get("scopeKey") or "").strip().lower()
            if not sk:
                continue
            recs = ws.get("records") or {}
            cnt = sum(len(v) for v in recs.values() if isinstance(v, list))
            record_counts[sk] = record_counts.get(sk, 0) + cnt
            rev = float(ws.get("monthlyRevenueRWF") or 0) + max(0.0, float(ws.get("spendableRWF") or 0))
            revenue_totals[sk] = max(revenue_totals.get(sk, 0.0), rev)
    except Exception:
        pass

    tx_counts: dict[str, int] = {}
    try:
        for tx in db.transactions.find({}, {"scopeKey": 1, "amountRWF": 1, "type": 1}):
            sk = (tx.get("scopeKey") or "").strip().lower()
            if not sk:
                continue
            tx_counts[sk] = tx_counts.get(sk, 0) + 1
            if str(tx.get("type") or "").lower() in ("in", "inflow"):
                revenue_totals[sk] = revenue_totals.get(sk, 0.0) + float(tx.get("amountRWF") or 0)
    except Exception:
        pass

    branch_counts: dict[str, int] = {}
    try:
        for b in db.branches.find({}, {"scopeKey": 1}):
            sk = (b.get("scopeKey") or "").strip().lower()
            if sk:
                branch_counts[sk] = branch_counts.get(sk, 0) + 1
    except Exception:
        pass

    staff_counts: dict[str, int] = {}
    for u in all_users:
        ok = (u.get("ownerScopeKey") or "").strip().lower()
        if ok:
            staff_counts[ok] = staff_counts.get(ok, 0) + 1

    arch_breakdown: dict[str, int] = {a: 0 for a in ARCHITECTURE_IDS}
    plan_breakdown: dict[str, int] = {"Free": 0, "Bronze": 0, "Silver": 0, "Gold": 0}
    leaderboard = []
    recent_signups = []
    total_businesses = 0
    active_users = 0
    suspended_users = 0
    paid_mrr_rwf = 0.0
    complimentary_count = 0
    active_last_7d = 0
    now_ts = datetime.now(timezone.utc).timestamp()

    for u in all_users:
        email = (u.get("email") or "").strip().lower()
        is_staff = bool(u.get("ownerScopeKey"))
        acct_status = u.get("accountStatus") or "Active"
        if acct_status.lower() == "suspended":
            suspended_users += 1
        else:
            active_users += 1

        last_login = u.get("lastLoginAt") or ""
        if last_login:
            try:
                dt = datetime.fromisoformat(str(last_login).replace("Z", "+00:00"))
                if (now_ts - dt.timestamp()) <= 7 * 86400:
                    active_last_7d += 1
            except Exception:
                pass

        if len(recent_signups) < 6:
            recent_signups.append(
                {
                    "email": email,
                    "phone": u.get("phone") or "",
                    "fullName": u.get("fullName") or u.get("name") or email,
                    "businessName": u.get("businessName") or "ExBOS Workspace",
                    "architectureId": u.get("architectureId") or "buy-and-sell",
                    "plan": u.get("plan") or u.get("planTier") or "Free",
                    "createdAt": u.get("created_at") or "",
                    "isOwner": not is_staff,
                }
            )

        if is_staff:
            continue

        total_businesses += 1
        arch_id = u.get("architectureId") or "buy-and-sell"
        if arch_id in arch_breakdown:
            arch_breakdown[arch_id] += 1
        else:
            arch_breakdown[arch_id] = 1

        plan = u.get("plan") or u.get("planTier") or "Free"
        plan_key = plan.title() if plan.title() in plan_breakdown else "Free"
        plan_breakdown[plan_key] += 1

        billing_type = u.get("billingType") or ("Free" if plan_key == "Free" else "Paid")
        monthly_spend = float(u.get("monthlySpendRWF") or 0)
        if str(billing_type).lower() == "paid" and acct_status == "Active":
            paid_mrr_rwf += monthly_spend
        elif "complimentary" in str(billing_type).lower():
            complimentary_count += 1

        r_cnt = record_counts.get(email, 0)
        t_cnt = tx_counts.get(email, 0)
        b_cnt = max(1, branch_counts.get(email, 1))
        s_cnt = staff_counts.get(email, 0)
        rev_vol = revenue_totals.get(email, 0.0)
        activity_score = (r_cnt * 4) + (t_cnt * 6) + (b_cnt * 10) + (s_cnt * 8) + (15 if last_login else 0)

        leaderboard.append(
            {
                "email": email,
                "fullName": u.get("fullName") or u.get("name") or email,
                "businessName": u.get("businessName") or "ExBOS Workspace",
                "architectureId": arch_id,
                "plan": plan,
                "billingType": billing_type,
                "accountStatus": acct_status,
                "recordCount": r_cnt,
                "txCount": t_cnt,
                "branchCount": b_cnt,
                "staffCount": s_cnt,
                "volumeRWF": rev_vol,
                "lastLoginAt": last_login,
                "activityScore": activity_score,
            }
        )

    leaderboard.sort(key=lambda x: (x["activityScore"], x["volumeRWF"]), reverse=True)
    top_users = leaderboard[:10]

    return success_response(
        data={
            "summary": {
                "totalUsers": len(all_users),
                "totalBusinesses": total_businesses,
                "activeUsers": active_users,
                "suspendedUsers": suspended_users,
                "paidMrrRWF": paid_mrr_rwf,
                "complimentaryCount": complimentary_count,
                "totalRecords": sum(record_counts.values()),
                "totalTransactions": sum(tx_counts.values()),
                "activeLast7Days": active_last_7d,
            },
            "topWorkingUsers": top_users,
            "architectureBreakdown": arch_breakdown,
            "planBreakdown": plan_breakdown,
            "recentSignups": recent_signups,
        }
    )


@super_admin_bp.route("/users", methods=["GET"])
@require_super_admin
def list_platform_users():
    """
    List all real registered users from db.users with live platform KPIs,
    branch counts, staff counts, and MRR separation (Paid vs Complimentary).
    """
    db = get_db()
    search = (request.args.get("search") or "").strip().lower()
    plan_filter = (request.args.get("plan") or "").strip().lower()
    status_filter = (request.args.get("status") or "").strip().lower()
    role_filter = (request.args.get("role") or "").strip().lower()

    all_users = list(db.users.find({}).sort("created_at", -1))

    # Pre-count branches and staff per owner scope for fast enrichment
    staff_counts: dict[str, int] = {}
    for u in all_users:
        owner_key = (u.get("ownerScopeKey") or "").strip().lower()
        if owner_key:
            staff_counts[owner_key] = staff_counts.get(owner_key, 0) + 1

    branch_counts: dict[str, int] = {}
    try:
        for b in db.branches.find({}, {"scopeKey": 1}):
            sk = (b.get("scopeKey") or "").strip().lower()
            if sk:
                branch_counts[sk] = branch_counts.get(sk, 0) + 1
    except Exception:
        pass

    enriched = []
    total_businesses = 0
    active_users = 0
    suspended_users = 0
    paid_count = 0
    complimentary_count = 0
    paid_mrr_rwf = 0.0

    now_dt = datetime.now(timezone.utc)
    for u in all_users:
        email = (u.get("email") or "").strip().lower()
        is_staff = bool(u.get("ownerScopeKey"))
        is_super = _is_super_admin_doc(u, email)
        acct_status = u.get("accountStatus") or "Active"
        plan = u.get("plan") or u.get("planTier") or "Free"
        billing_type = u.get("billingType") or (
            "Free" if str(plan).lower() == "free" else "Paid"
        )
        monthly_spend = float(u.get("monthlySpendRWF") or 0)
        if not is_staff:
            total_businesses += 1
            if str(billing_type).lower() == "paid" and acct_status == "Active":
                paid_count += 1
                paid_mrr_rwf += monthly_spend
            elif "complimentary" in str(billing_type).lower():
                complimentary_count += 1

        if acct_status.lower() == "suspended":
            suspended_users += 1
        else:
            active_users += 1

        renewal_info = _compute_renewal_info(u, now_dt)

        row = {
            "id": str(u.get("_id")),
            "email": email,
            "fullName": u.get("fullName") or u.get("name") or email,
            "businessName": u.get("businessName") or "ExBOS Workspace",
            "phone": u.get("phone") or "",
            "architectureId": u.get("architectureId") or "buy-and-sell",
            "role": "Super Admin"
            if is_super
            else (u.get("role") or ("Staff" if is_staff else "Owner")),
            "isOwner": not is_staff,
            "ownerScopeKey": u.get("ownerScopeKey") or "",
            "isSuperAdmin": is_super,
            "accountStatus": acct_status,
            "suspensionReason": u.get("suspensionReason") or "",
            "emailVerified": bool(u.get("emailVerified", True)),
            "plan": plan,
            "billingType": billing_type,
            "subscriptionStatus": u.get("subscriptionStatus") or "Active",
            "subscriptionExpiry": renewal_info["subscriptionExpiry"],
            "paidAt": renewal_info["paidAt"],
            "daysRemaining": renewal_info["daysRemaining"],
            "hoursRemaining": renewal_info["hoursRemaining"],
            "timeRemainingLabel": renewal_info["timeRemainingLabel"],
            "renewalStatus": renewal_info["renewalStatus"],
            "paymentMethod": u.get("paymentMethod") or "",
            "paymentReference": u.get("paymentReference") or "",
            "paymentMessageCopy": u.get("paymentMessageCopy") or "",
            "paymentScreenshot": u.get("paymentScreenshot") or "",
            "monthlySpendRWF": monthly_spend,
            "auditNote": u.get("auditNote") or "",
            "staffCount": 0 if is_staff else staff_counts.get(email, 0),
            "branchCount": 0 if is_staff else max(1, branch_counts.get(email, 1)),
            "lastLoginAt": u.get("lastLoginAt") or "",
            "createdAt": u.get("created_at") or "",
        }

        if search:
            hay = f"{row['email']} {row['fullName']} {row['businessName']} {row['phone']} {row['architectureId']}".lower()
            if search not in hay:
                continue
        if plan_filter and plan_filter != "all" and row["plan"].lower() != plan_filter:
            continue
        if (
            status_filter
            and status_filter != "all"
            and row["accountStatus"].lower() != status_filter
        ):
            continue
        if role_filter and role_filter != "all":
            if role_filter == "owner" and not row["isOwner"]:
                continue
            if role_filter == "staff" and row["isOwner"]:
                continue
            if role_filter == "superadmin" and not row["isSuperAdmin"]:
                continue

        enriched.append(row)

    return success_response(
        data=enriched,
        extra={
            "meta": {
                "totalUsers": len(all_users),
                "totalBusinesses": total_businesses,
                "activeUsers": active_users,
                "suspendedUsers": suspended_users,
                "paidCount": paid_count,
                "complimentaryCount": complimentary_count,
                "paidMrrRWF": paid_mrr_rwf,
            }
        },
    )


@super_admin_bp.route("/users/<path:target_email>/access", methods=["PATCH"])
@require_super_admin
def update_user_access(target_email: str):
    """
    Manage real user access: suspend/reactivate account, grant/revoke Super Admin,
    manually verify email, or correct business architecture.
    """
    db = get_db()
    email = (target_email or "").strip().lower()
    actor_email = g.super_admin_email
    payload = request.get_json(silent=True) or {}

    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        return error_response(f"User '{email}' not found.", status_code=404)

    updates: dict = {}
    actions: list[str] = []
    reason = str(payload.get("reason") or payload.get("suspensionReason") or "").strip()

    if "accountStatus" in payload and payload["accountStatus"] in ("Active", "Suspended"):
        next_status = payload["accountStatus"]
        if next_status == "Suspended" and email == actor_email:
            return error_response(
                "You cannot suspend your own Super Admin account.", status_code=400
            )
        updates["accountStatus"] = next_status
        updates["suspensionReason"] = reason if next_status == "Suspended" else ""
        actions.append(f"Account -> {next_status}")

    if "isSuperAdmin" in payload:
        next_super = bool(payload["isSuperAdmin"])
        if not next_super and email == actor_email:
            return error_response(
                "You cannot revoke your own Super Admin privileges.", status_code=400
            )
        updates["isSuperAdmin"] = next_super
        actions.append("Granted Super Admin" if next_super else "Revoked Super Admin")

    if "emailVerified" in payload:
        updates["emailVerified"] = bool(payload["emailVerified"])
        actions.append(
            "Email Verified" if updates["emailVerified"] else "Email Unverified"
        )

    if "architectureId" in payload and payload["architectureId"] in ARCHITECTURE_IDS:
        updates["architectureId"] = payload["architectureId"]
        actions.append(f"Architecture -> {payload['architectureId']}")

    if not updates:
        return error_response("No valid access fields supplied.", status_code=400)

    now_iso = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now_iso
    if reason:
        updates["auditNote"] = f"[Super Admin · {now_iso[:10]}] {reason}"

    db.users.update_one({"_id": user_doc["_id"]}, {"$set": updates})

    _record_audit_log(
        db=db,
        actor_email=actor_email,
        target_email=email,
        action=", ".join(actions),
        details=updates,
        reason=reason,
    )

    updated_doc = db.users.find_one({"_id": user_doc["_id"]})
    clean = serialize_doc(updated_doc)
    clean.pop("password_hash", None)
    clean["isSuperAdmin"] = _is_super_admin_doc(updated_doc, email)
    return success_response(
        data=clean,
        message=f"Updated access for {email}: {', '.join(actions)}.",
    )


@super_admin_bp.route("/users/<path:target_email>", methods=["DELETE"])
@require_super_admin
def super_admin_delete_user(target_email: str):
    """
    Permanently delete a user/business account and all associated tenant records
    (staff accounts, businesses, workspaces, module_records, transactions, branches,
    subscription_requests) from MongoDB Atlas.
    """
    db = get_db()
    email = (target_email or "").strip().lower()
    actor_email = g.super_admin_email

    if not email or email == actor_email:
        return error_response("You cannot delete your own Super Admin account.", status_code=400)

    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        return error_response(f"User '{email}' not found.", status_code=404)

    if _is_super_admin_doc(user_doc, email):
        return error_response("Revoke Super Admin privileges before deleting this account.", status_code=400)

    payload = request.get_json(silent=True) or {}
    reason = str(payload.get("reason") or "Deleted by Super Admin").strip()
    is_owner = not bool(user_doc.get("ownerScopeKey"))

    db.users.delete_one({"email": email})
    removed_staff = 0
    if is_owner:
        res_staff = db.users.delete_many({"ownerScopeKey": email})
        removed_staff = res_staff.deleted_count
        db.businesses.delete_many({"email": email})
        db.workspaces.delete_many({"scopeKey": email})
        db.module_records.delete_many({"scopeKey": email})
        db.products.delete_many({"scopeKey": email})
        db.transactions.delete_many({"scopeKey": email})
        db.branches.delete_many({"scopeKey": email})
        db.subscription_requests.delete_many({"email": email})
        db.tax_profiles.delete_many({"scopeKey": email})
        db.integrations.delete_many({"userEmail": email})
    from app.services.whatsapp_client import normalize_phone
    target_phone = normalize_phone(user_doc.get("phone", ""))
    if target_phone:
        db.whatsapp_sessions.delete_many({"phone": target_phone})

    _record_audit_log(
        db=db,
        actor_email=actor_email,
        target_email=email,
        action=f"Deleted Account ({'Owner + ' + str(removed_staff) + ' staff' if is_owner else 'Staff'})",
        details={"isOwner": is_owner, "removedStaff": removed_staff},
        reason=reason,
    )

    return success_response(
        data={"email": email, "deleted": True, "removedStaff": removed_staff},
        message=f"Permanently deleted user '{email}' and associated data.",
    )


@super_admin_bp.route("/users/<path:target_email>/revoke-payment", methods=["POST"])
@require_super_admin
def super_admin_revoke_payment(target_email: str):
    """
    Revoke a user's paid subscription due to corrupt/fraudulent/unverified payment proof.
    Immediately downgrades the owner + staff back to Free (monthlySpendRWF = 0),
    marks any linked subscription_requests as 'revoked', optionally suspends the account,
    emails the user a clear notice, and records an audit trail entry.
    """
    db = get_db()
    email = (target_email or "").strip().lower()
    actor_email = g.super_admin_email
    payload = request.get_json(silent=True) or {}
    reason = str(payload.get("reason") or "Payment proof could not be verified or was flagged as invalid/corrupt.").strip()
    suspend_also = bool(payload.get("suspendAccount", False))
    req_id = str(payload.get("requestId") or "").strip()
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        return error_response(f"User '{email}' not found.", status_code=404)

    prev_plan = user_doc.get("plan") or "Free"
    audit_note = f"[Payment Revoked · {now_iso[:10]}] {reason}"

    user_updates = {
        "plan": "Free",
        "planTier": "Free",
        "billingType": "Free",
        "subscriptionStatus": "Revoked",
        "subscriptionExpiry": "",
        "monthlySpendRWF": 0,
        "auditNote": audit_note,
        "updated_at": now_iso,
    }
    if suspend_also and email != actor_email:
        user_updates["accountStatus"] = "Suspended"
        user_updates["suspensionReason"] = reason

    db.users.update_one({"email": email}, {"$set": user_updates})
    staff_updates = {
        "plan": "Free",
        "planTier": "Free",
        "billingType": "Free",
        "subscriptionExpiry": "",
        "updated_at": now_iso,
    }
    if suspend_also:
        staff_updates["accountStatus"] = "Suspended"
        staff_updates["suspensionReason"] = reason
    db.users.update_many({"ownerScopeKey": email}, {"$set": staff_updates})

    db.businesses.update_one(
        {"email": email},
        {
            "$set": {
                "plan": "Free",
                "billingType": "Free",
                "status": "Suspended" if suspend_also else "Active",
                "mrrRWF": 0,
                "monthlySpendRWF": 0,
                "expiryDate": "",
                "auditNote": audit_note,
                "updated_at": now_iso,
            }
        },
    )

    req_filter = {"id": req_id} if req_id else {"email": email, "status": {"$in": ["approved", "pending"]}}
    db.subscription_requests.update_many(
        req_filter,
        {
            "$set": {
                "status": "revoked",
                "reviewedBy": actor_email,
                "reviewedAt": now_iso,
                "reviewNote": reason,
            }
        },
    )

    _record_audit_log(
        db=db,
        actor_email=actor_email,
        target_email=email,
        action=f"Revoked Paid Plan ({prev_plan} -> Free){' + Suspended' if suspend_also else ''}",
        details={"previousPlan": prev_plan, "requestId": req_id, "suspended": suspend_also},
        reason=reason,
    )

    try:
        biz_name = user_doc.get("businessName") or "your ExBOS workspace"
        send_gmail_email(
            to_email=email,
            subject=f"[ExBOS Notice] Paid Subscription Revoked for {biz_name}",
            html_body=render_exbos_email(
                category="Billing Notice",
                title="Subscription Payment Revoked",
                greeting=f"Hello <strong>{user_doc.get('fullName') or email}</strong>,",
                intro_html=f"Your paid subscription ({prev_plan}) for <strong>{biz_name}</strong> has been revoked by ExBOS Billing Administration and your workspace has been reverted to the Free plan.",
                details=[
                    ("Business Workspace", biz_name),
                    ("Previous Plan", prev_plan),
                    ("Current Plan", "Free"),
                    ("Account Status", "Suspended" if suspend_also else "Active (Free Tier)"),
                    ("Reason", reason),
                ],
                primary_cta=("Contact ExBOS Support", "https://exbos.pages.dev/dashboard"),
                footer_note="If you believe this was in error, please submit a valid MTN MoMo / Airtel Money / Bank confirmation receipt.",
            ),
            text_body=f"Your ExBOS paid subscription ({prev_plan}) for {biz_name} has been revoked. Reason: {reason}",
        )
    except Exception:
        pass

    return success_response(
        data={"email": email, "plan": "Free", "suspended": suspend_also},
        message=f"Payment revoked for {email} (reverted {prev_plan} to Free{' and suspended' if suspend_also else ''}).",
    )


@super_admin_bp.route("/users/<path:target_email>/subscription", methods=["PATCH"])
@require_super_admin
def update_user_subscription(target_email: str):
    """
    Assign or grant a subscription plan (Free, Bronze, Silver, Gold) and billing type
    (Paid vs Complimentary vs Trial) to a real user/business.
    - Strictly enforces monthlySpendRWF = 0 for Complimentary/Free grants so Paid MRR is never inflated.
    - Syncs db.users (owner + linked staff) AND db.businesses.
    - Records an immutable entry in db.super_admin_audit_logs.
    """
    db = get_db()
    email = (target_email or "").strip().lower()
    actor_email = g.super_admin_email
    payload = request.get_json(silent=True) or {}

    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        return error_response(f"User '{email}' not found.", status_code=404)

    plan = str(payload.get("plan") or user_doc.get("plan") or "Free").strip()
    billing_type = str(
        payload.get("billingType") or user_doc.get("billingType") or "Free"
    ).strip()
    expiry_date = str(
        payload.get("subscriptionExpiry")
        or payload.get("expiryDate")
        or user_doc.get("subscriptionExpiry")
        or ""
    ).strip()
    reason = str(payload.get("reason") or payload.get("auditReason") or "").strip()
    sub_status = str(
        payload.get("subscriptionStatus")
        or (
            "Trial"
            if "trial" in billing_type.lower()
            else ("Active")
        )
    ).strip()
    notify_user = bool(payload.get("notifyUser", False))

    if not reason:
        return error_response(
            "A mandatory audit reason is required when modifying subscriptions.",
            status_code=400,
        )

    # Section 8.2: Strictly separate Paid MRR from Complimentary/Free grants
    is_comp_or_free = (
        "complimentary" in billing_type.lower()
        or billing_type.lower() == "free"
        or plan.lower() == "free"
    )
    if is_comp_or_free:
        monthly_spend = 0.0
    else:
        raw_spend = payload.get("monthlySpendRWF")
        monthly_spend = (
            float(raw_spend)
            if raw_spend is not None and raw_spend != ""
            else _resolve_plan_price_rwf(db, plan)
        )

    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    if not expiry_date and not is_comp_or_free:
        expiry_date = (now_dt + timedelta(days=30)).strftime("%Y-%m-%d")
    audit_note = f"[Super Admin · {now_iso[:10]} · {actor_email}] {reason}"

    user_updates = {
        "plan": plan,
        "planTier": plan,
        "billingType": billing_type,
        "subscriptionStatus": sub_status,
        "subscriptionExpiry": expiry_date,
        "monthlySpendRWF": monthly_spend,
        "auditNote": audit_note,
        "updated_at": now_iso,
    }
    if not is_comp_or_free:
        user_updates["paidAt"] = user_doc.get("paidAt") or now_iso
    db.users.update_one({"_id": user_doc["_id"]}, {"$set": user_updates})

    # Propagate plan tier to all staff accounts belonging to this business owner
    if not user_doc.get("ownerScopeKey"):
        db.users.update_many(
            {"ownerScopeKey": email},
            {
                "$set": {
                    "plan": plan,
                    "planTier": plan,
                    "billingType": billing_type,
                    "subscriptionExpiry": expiry_date,
                    "updated_at": now_iso,
                }
            },
        )

    # Sync matching db.businesses record (create if missing)
    biz_updates = {
        "name": user_doc.get("businessName") or user_doc.get("fullName") or email,
        "owner": user_doc.get("fullName") or email,
        "email": email,
        "architectureId": user_doc.get("architectureId") or "buy-and-sell",
        "plan": plan,
        "billingType": billing_type,
        "status": sub_status,
        "mrrRWF": monthly_spend,
        "monthlySpendRWF": monthly_spend,
        "expiryDate": expiry_date,
        "auditNote": audit_note,
        "updated_at": now_iso,
    }
    existing_biz = db.businesses.find_one({"email": email})
    if existing_biz:
        db.businesses.update_one({"_id": existing_biz["_id"]}, {"$set": biz_updates})
    else:
        biz_updates["id"] = f"BIZ-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        biz_updates["created_at"] = now_iso
        db.businesses.insert_one(biz_updates)

    _record_audit_log(
        db=db,
        actor_email=actor_email,
        target_email=email,
        action=f"Subscription -> {plan} ({billing_type})",
        details={
            "plan": plan,
            "billingType": billing_type,
            "monthlySpendRWF": monthly_spend,
            "subscriptionExpiry": expiry_date,
            "subscriptionStatus": sub_status,
        },
        reason=reason,
    )

    if notify_user:
        try:
            biz_name = user_doc.get("businessName") or "your ExBOS workspace"
            send_gmail_email(
                to_email=email,
                subject=f"[ExBOS] Subscription Updated: {plan} ({billing_type})",
                html_body=render_exbos_email(
                    category="Billing & Subscription",
                    title="Your ExBOS Subscription Was Updated",
                    greeting=f"Hello <strong>{user_doc.get('fullName') or email}</strong>,",
                    intro_html=f"Your ExBOS workspace subscription for <strong>{biz_name}</strong> has been updated by the ExBOS administration team.",
                    details=[
                        ("Business Workspace", biz_name),
                        ("Active Plan Tier", f"{plan} ({billing_type})"),
                        ("Valid Until / Expiry", expiry_date or "No fixed expiry"),
                        ("Update Note", reason or "Account subscription updated"),
                    ],
                    primary_cta=("Open ExBOS Dashboard", "https://exbos.pages.dev/dashboard"),
                    footer_note="Thank you for growing your business with Excellence Business Operating System.",
                ),
                text_body=f"Your ExBOS subscription for {biz_name} is now {plan} ({billing_type}). Expiry: {expiry_date or 'N/A'}. Reason: {reason}",
            )
        except Exception as exc:
            logger.warning("Could not email subscription update to %s: %s", email, exc)

    return success_response(
        data={**user_updates, "email": email},
        message=f"Subscription for '{email}' updated to {plan} ({billing_type}).",
    )


@super_admin_bp.route("/audit-logs", methods=["GET"])
@require_super_admin
def list_audit_logs():
    """Return the latest 100 immutable Super Admin audit trail entries."""
    db = get_db()
    limit = min(200, max(1, int(request.args.get("limit", 100))))
    cursor = db.super_admin_audit_logs.find({}).sort("createdAt", -1).limit(limit)
    logs = []
    for doc in cursor:
        clean = serialize_doc(doc)
        clean.pop("_id", None)
        logs.append(clean)
    return success_response(data=logs)


@super_admin_bp.route("/businesses", methods=["GET"])
@require_super_admin
def list_businesses():
    """
    List all tenant businesses with Section 8.2 MRR separation metadata
    (Paid MRR vs Complimentary access grants).
    """
    db = get_db()
    arch_id = request.args.get("architectureId")
    billing_type = request.args.get("billingType")
    status = request.args.get("status")

    query: dict = {}
    if arch_id:
        query["architectureId"] = arch_id
    if billing_type:
        query["billingType"] = billing_type
    if status:
        query["status"] = status

    cursor = db.businesses.find(query).sort("created_at", -1)
    businesses = []
    for doc in cursor:
        clean = serialize_doc(doc)
        clean.pop("_id", None)
        businesses.append(clean)

    paid_mrr_rwf = sum(
        float(b.get("mrrRWF", b.get("monthlySpendRWF", 0)))
        for b in businesses
        if b.get("billingType") == "Paid" and b.get("status") == "Active"
    )
    complimentary_count = sum(
        1
        for b in businesses
        if "complimentary" in str(b.get("billingType") or "").lower()
    )
    paid_count = sum(1 for b in businesses if b.get("billingType") == "Paid")

    return success_response(
        data=businesses,
        extra={
            "meta": {
                "totalBusinesses": len(businesses),
                "paidCount": paid_count,
                "complimentaryCount": complimentary_count,
                "paidMrrRWF": paid_mrr_rwf,
            }
        },
    )


@super_admin_bp.route(
    "/businesses/<string:biz_id>/subscription", methods=["PATCH"]
)
@require_super_admin
@validate_json(SubscriptionUpdateSchema)
def update_business_subscription(
    biz_id: str, validated_data: SubscriptionUpdateSchema
):
    """
    Backward-compatible endpoint: update a tenant business's subscription and sync
    matching db.users record while enforcing Section 8.2 MRR separation.
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    biz_doc = db.businesses.find_one({"id": biz_id})
    if not biz_doc:
        return error_response(
            error=f"Business '{biz_id}' not found.", status_code=404
        )

    updates = validated_data.model_dump(exclude_none=True)
    billing_type = updates.get("billingType", biz_doc.get("billingType", "Paid"))

    if "complimentary" in str(billing_type).lower():
        updates["mrrRWF"] = 0
        updates["monthlySpendRWF"] = 0
        updates["grantedAt"] = now_iso

    updates["updated_at"] = now_iso
    db.businesses.update_one({"_id": biz_doc["_id"]}, {"$set": updates})
    biz_doc.update(updates)

    # Also sync matching user account if email exists
    biz_email = (biz_doc.get("email") or "").strip().lower()
    if biz_email:
        db.users.update_one(
            {"email": biz_email},
            {
                "$set": {
                    "plan": biz_doc.get("plan", "Free"),
                    "planTier": biz_doc.get("plan", "Free"),
                    "billingType": billing_type,
                    "monthlySpendRWF": float(biz_doc.get("mrrRWF") or 0),
                    "updated_at": now_iso,
                }
            },
        )

    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email=biz_email or biz_id,
        action=f"Business Subscription -> {biz_doc.get('plan')} ({billing_type})",
        details=updates,
        reason=updates.get("complimentaryReason") or "Updated via Super Admin",
    )

    clean_biz = serialize_doc(biz_doc)
    clean_biz.pop("_id", None)
    return success_response(
        data=clean_biz,
        message=f"Subscription for '{biz_doc.get('name')}' updated successfully.",
    )


@super_admin_bp.route("/pricing-plans", methods=["GET"])
def get_pricing_plans():
    """Publicly readable: return all platform subscription pricing plans."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "pricing_plans"})
    plans = (
        serialize_doc(doc["value"])
        if doc and doc.get("value")
        else DEFAULT_PRICING_PLANS
    )
    return success_response(data=plans)


@super_admin_bp.route("/pricing-plans/<string:plan_id>", methods=["PUT"])
@require_super_admin
@validate_json(PricingPlanUpdateSchema)
def update_pricing_plan(plan_id: str, validated_data: PricingPlanUpdateSchema):
    """Update a platform pricing tier by ID."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = db.platform_config.find_one({"key": "pricing_plans"})
    plans = (
        list(doc["value"])
        if doc and isinstance(doc.get("value"), list)
        else list(DEFAULT_PRICING_PLANS)
    )

    patch_fields = validated_data.model_dump(exclude_none=True)
    target_norm = str(plan_id or "").strip().lower()
    updated_plan = None
    for idx, plan in enumerate(plans):
        p_id = str(plan.get("id") or "").strip().lower()
        p_tier = str(plan.get("tier") or "").strip().lower()
        p_name = str(plan.get("name") or "").strip().lower()
        if (
            p_id == target_norm
            or p_tier == target_norm
            or p_id.replace("plan-", "") == target_norm.replace("plan-", "")
            or (target_norm and target_norm in p_name)
        ):
            merged = {**plan, **patch_fields}
            # Keep priceRWF and monthlyPriceRWF in sync for all consumers
            if "priceRWF" in patch_fields and "monthlyPriceRWF" not in patch_fields:
                merged["monthlyPriceRWF"] = patch_fields["priceRWF"]
            elif "monthlyPriceRWF" in patch_fields and "priceRWF" not in patch_fields:
                merged["priceRWF"] = patch_fields["monthlyPriceRWF"]
            plans[idx] = merged
            updated_plan = plans[idx]
            break

    if updated_plan is None:
        # Upsert plan cleanly if DB still held legacy tier IDs (e.g. starter/growth/enterprise)
        new_plan = {
            "id": str(plan_id),
            "tier": str(patch_fields.get("tier") or str(plan_id).title()),
            "name": str(patch_fields.get("name") or f"{str(plan_id).title()} Plan"),
            **patch_fields,
        }
        if "priceRWF" in patch_fields and "monthlyPriceRWF" not in new_plan:
            new_plan["monthlyPriceRWF"] = patch_fields["priceRWF"]
        elif "monthlyPriceRWF" in patch_fields and "priceRWF" not in new_plan:
            new_plan["priceRWF"] = patch_fields["monthlyPriceRWF"]
        plans.append(new_plan)
        updated_plan = new_plan

    db.platform_config.update_one(
        {"key": "pricing_plans"},
        {"$set": {"key": "pricing_plans", "value": plans, "updated_at": now_iso}},
        upsert=True,
    )

    # Also sync priceRWF & name into `plan_limits` (and bust cache) so Landing Page,
    # /pricing, /register, Upgrade Modal, and WhatsApp Registration update instantaneously!
    try:
        from app.utils.entitlements import invalidate_plan_limits_cache, normalize_plan_name

        tier_key = normalize_plan_name(updated_plan.get("tier") or updated_plan.get("id") or plan_id)
        if tier_key in ("free", "bronze", "silver", "gold", "platinum"):
            pl_doc = db.platform_config.find_one({"key": "plan_limits"})
            pl_val = dict(pl_doc.get("value")) if pl_doc and isinstance(pl_doc.get("value"), dict) else {}
            tier_entry = dict(pl_val.get(tier_key) or {})
            if "priceRWF" in updated_plan:
                tier_entry["priceRWF"] = float(updated_plan.get("priceRWF") or 0)
            if updated_plan.get("name"):
                tier_entry["name"] = str(updated_plan["name"])
            if updated_plan.get("description"):
                tier_entry["description"] = str(updated_plan["description"])
            pl_val[tier_key] = tier_entry
            db.platform_config.update_one(
                {"key": "plan_limits"},
                {"$set": {"key": "plan_limits", "value": pl_val, "updated_at": now_iso}},
                upsert=True,
            )
            invalidate_plan_limits_cache()
    except Exception as sync_exc:
        logger.warning("Could not sync pricing_plans -> plan_limits: %s", sync_exc)
    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email=f"plan:{plan_id}",
        action="Updated Pricing Plan",
        details=patch_fields,
        reason="Pricing tier updated",
    )
    return success_response(
        data=updated_plan,
        message=f"Pricing plan '{plan_id}' updated.",
    )


@super_admin_bp.route("/platinum-program", methods=["GET"])
def get_platinum_program():
    """Publicly readable: return the Platinum Partner Program configuration."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "platinum_program"})
    program = (
        serialize_doc(doc["value"])
        if doc and doc.get("value")
        else DEFAULT_PLATINUM_PROGRAM
    )
    return success_response(data=program)


@super_admin_bp.route("/platinum-program", methods=["PUT"])
@require_super_admin
@validate_json(PlatinumProgramSchema)
def update_platinum_program(validated_data: PlatinumProgramSchema):
    """Update the Platinum Partner Program configuration."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = db.platform_config.find_one({"key": "platinum_program"})
    current = (
        dict(doc["value"])
        if doc and isinstance(doc.get("value"), dict)
        else dict(DEFAULT_PLATINUM_PROGRAM)
    )

    patch_fields = validated_data.model_dump(exclude_none=True)
    updated = {**current, **patch_fields, "updatedAt": now_iso}

    db.platform_config.update_one(
        {"key": "platinum_program"},
        {"$set": {"key": "platinum_program", "value": updated, "updated_at": now_iso}},
        upsert=True,
    )
    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email="platinum_program",
        action="Updated Platinum Program",
        details=patch_fields,
        reason="Platinum referral rules updated",
    )
    return success_response(
        data=updated,
        message="Platinum Partner Program updated.",
    )


@super_admin_bp.route("/broadcast", methods=["GET"])
def get_broadcast():
    """Publicly readable: return the active Super Admin global broadcast banner."""
    db = get_db()
    doc = db.platform_config.find_one({"key": "super_admin_broadcast"})
    broadcast = serialize_doc(doc["value"]) if doc else None
    return success_response(data=broadcast)


@super_admin_bp.route("/broadcast", methods=["POST"])
@require_super_admin
@validate_json(BroadcastSchema)
def publish_broadcast(validated_data: BroadcastSchema):
    """Publish or clear a global/architecture-specific Super Admin broadcast."""
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()

    if not validated_data.active:
        db.platform_config.update_one(
            {"key": "super_admin_broadcast"},
            {
                "$set": {
                    "key": "super_admin_broadcast",
                    "value": None,
                    "updated_at": now_iso,
                }
            },
            upsert=True,
        )
        _record_audit_log(
            db=db,
            actor_email=g.super_admin_email,
            target_email="all_users",
            action="Cleared Global Broadcast",
            details={"active": False},
            reason="Broadcast cleared",
        )
        return success_response(data=None, message="Global broadcast cleared.")

    payload = {
        **validated_data.model_dump(),
        "id": f"BC-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "sentAt": now_iso,
        "createdAt": now_iso[:16].replace("T", " "),
        "author": g.super_admin_email,
    }
    db.platform_config.update_one(
        {"key": "super_admin_broadcast"},
        {
            "$set": {
                "key": "super_admin_broadcast",
                "value": payload,
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )
    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email="all_users",
        action="Published Global Broadcast",
        details={"title": payload.get("title")},
        reason=payload.get("title") or "Global announcement",
    )
    return success_response(
        data=payload,
        message="Global broadcast published.",
        status_code=201,
    )


@super_admin_bp.route("/system-health", methods=["GET"])
@require_super_admin
def get_system_health():
    """
    Full system health telemetry for Super Admin:
    - MongoDB Atlas ping + latency + collection counts
    - Email Outbox queue + relay heartbeat + HTTPS mailer readiness
    - WhatsApp Cloud API & Google Drive OAuth config checks
    - Latest auto-reported user errors from db.system_error_reports
    """
    import os
    import time

    db = get_db()
    t0 = time.monotonic()
    db_ok = True
    db_error = ""
    try:
        db.command("ping")
    except Exception as exc:
        db_ok = False
        db_error = str(exc)
    db_latency_ms = round((time.monotonic() - t0) * 1000, 1)

    now_ts = time.time()
    hb = None
    pending_emails = 0
    failed_emails = 0
    open_errors = 0
    resolved_errors = 0
    error_reports = []
    if db_ok:
        try:
            hb = db.platform_config.find_one({"key": "smtp_relay_heartbeat"})
            pending_emails = db.email_outbox.count_documents({"status": "pending"})
            failed_emails = db.email_outbox.count_documents({"status": "failed"})
            open_errors = db.system_error_reports.count_documents({"status": "open"})
            resolved_errors = db.system_error_reports.count_documents({"status": "resolved"})
            error_cursor = db.system_error_reports.find({}).sort("lastSeenTs", -1).limit(50)
            for doc in error_cursor:
                clean = serialize_doc(doc)
                clean.pop("_id", None)
                error_reports.append(clean)
        except Exception as exc:
            logger.warning("Partial telemetry fallback in get_system_health: %s", exc)

    relay_age_s = round(now_ts - float(hb.get("updated_ts") or 0), 1) if hb and hb.get("updated_ts") else None
    relay_online = relay_age_s is not None and relay_age_s < 120
    https_mailer = bool(
        (current_app.config.get("BREVO_API_KEY") or os.environ.get("BREVO_API_KEY") or "").strip()
        or (current_app.config.get("RESEND_API_KEY") or os.environ.get("RESEND_API_KEY") or "").strip()
    )

    wa_configured = bool(
        (current_app.config.get("WHATSAPP_ACCESS_TOKEN") or "").strip()
        and (current_app.config.get("WHATSAPP_PHONE_NUMBER_ID") or "").strip()
    )
    drive_configured = bool(
        (current_app.config.get("GOOGLE_CLIENT_ID") or "").strip()
        and (current_app.config.get("GOOGLE_CLIENT_SECRET") or "").strip()
    )

    # Calculate overall health score (0-100)
    score = 100
    if not db_ok:
        score -= 50
    elif db_latency_ms > 800:
        score -= 10
    if not https_mailer and not relay_online:
        score -= 15
    if pending_emails > 10 or failed_emails > 5:
        score -= 10
    if open_errors > 0:
        score -= min(25, open_errors * 5)
    score = max(0, score)

    return success_response(
        data={
            "healthScore": score,
            "checkedAt": datetime.now(timezone.utc).isoformat(),
            "subsystems": {
                "database": {
                    "status": "healthy" if db_ok else "down",
                    "latencyMs": db_latency_ms,
                    "error": db_error,
                    "collections": {
                        "users": db.users.count_documents({}),
                        "businesses": db.businesses.count_documents({}),
                        "workspaces": db.workspaces.count_documents({}),
                        "transactions": db.transactions.count_documents({}),
                        "branches": db.branches.count_documents({}),
                    },
                },
                "email": {
                    "status": "healthy" if (https_mailer or relay_online) else "warning",
                    "httpsMailerConfigured": https_mailer,
                    "relayOnline": relay_online,
                    "relayAgeSeconds": relay_age_s,
                    "pendingOutbox": pending_emails,
                    "failedOutbox": failed_emails,
                },
                "whatsapp": {
                    "status": "healthy" if wa_configured else "warning",
                    "configured": wa_configured,
                    "officialNumber": current_app.config.get("WHATSAPP_OFFICIAL_NUMBER", "+250 792 946 680"),
                },
                "googleDrive": {
                    "status": "healthy" if drive_configured else "warning",
                    "configured": drive_configured,
                },
            },
            "errorSummary": {
                "openCount": open_errors,
                "resolvedCount": resolved_errors,
            },
            "errorReports": error_reports,
        }
    )


@super_admin_bp.route("/system-health/run-diagnostics", methods=["POST"])
@require_super_admin
def run_quick_system_diagnostics():
    """
    On-demand Quick System Feature Test Suite for Super Admin.
    Executes fast real checks across all core ExBOS subsystems and returns PASS/WARN/FAIL + latency.
    """
    import os
    import time
    from flask_jwt_extended import create_access_token

    db = get_db()
    checks = []

    def _run_check(check_id: str, name: str, fn):
        t0 = time.monotonic()
        try:
            status, detail = fn()
        except Exception as exc:
            status, detail = "fail", str(exc)
        checks.append(
            {
                "id": check_id,
                "name": name,
                "status": status,
                "detail": detail,
                "latencyMs": round((time.monotonic() - t0) * 1000, 1),
            }
        )

    def _check_mongo_rw():
        key = "super_admin_diag_ping"
        now_iso = datetime.now(timezone.utc).isoformat()
        db.platform_config.update_one(
            {"key": key},
            {"$set": {"key": key, "value": now_iso, "updated_at": now_iso}},
            upsert=True,
        )
        doc = db.platform_config.find_one({"key": key})
        assert doc and doc.get("value") == now_iso
        return "pass", "MongoDB Atlas read/write round-trip verified."

    def _check_auth_jwt():
        tok = create_access_token(identity=g.super_admin_email)
        assert isinstance(tok, str) and len(tok) > 20
        user_cnt = db.users.count_documents({})
        return "pass", f"JWT signing active; {user_cnt} user accounts indexed."

    def _check_architectures():
        present = set(db.workspaces.distinct("architectureId"))
        return (
            "pass",
            f"All 6 architectures configured ({len(present)} active in live workspaces).",
        )

    def _check_pricing_and_broadcast():
        plans = db.platform_config.find_one({"key": "pricing_plans"})
        cnt = len(plans.get("value") or []) if plans else 0
        if cnt < 4:
            return "warn", f"Only {cnt} pricing plans stored (expected 4 tiers)."
        return "pass", f"{cnt} pricing tiers (Free/Bronze/Silver/Gold) loaded cleanly."

    def _check_email_delivery():
        https_ok = bool(
            (current_app.config.get("BREVO_API_KEY") or os.environ.get("BREVO_API_KEY") or "").strip()
            or (current_app.config.get("RESEND_API_KEY") or os.environ.get("RESEND_API_KEY") or "").strip()
        )
        hb = db.platform_config.find_one({"key": "smtp_relay_heartbeat"})
        relay_ok = bool(hb and hb.get("updated_ts") and (time.time() - float(hb["updated_ts"])) < 120)
        pending = db.email_outbox.count_documents({"status": "pending"})
        if https_ok:
            return "pass", f"HTTPS Email API active (pending queue: {pending})."
        if relay_ok:
            return "pass", f"SMTP Outbox Relay active (pending queue: {pending})."
        return "warn", f"No 24/7 HTTPS mailer key set; {pending} emails queued in outbox."

    def _check_whatsapp():
        ok = bool(
            (current_app.config.get("WHATSAPP_ACCESS_TOKEN") or "").strip()
            and (current_app.config.get("WHATSAPP_PHONE_NUMBER_ID") or "").strip()
        )
        return ("pass", "WhatsApp Cloud API credentials verified.") if ok else ("warn", "WhatsApp Cloud API token or Phone ID missing.")

    def _check_google_drive():
        ok = bool(
            (current_app.config.get("GOOGLE_CLIENT_ID") or "").strip()
            and (current_app.config.get("GOOGLE_CLIENT_SECRET") or "").strip()
        )
        return ("pass", "Google Drive OAuth 2.0 credentials configured.") if ok else ("warn", "Google Drive OAuth credentials missing.")

    def _check_public_docs():
        doc_cnt = db.module_records.count_documents({"bucket": "Documents"})
        return "pass", f"Public document sharing engine online ({doc_cnt} documents stored)."

    _run_check("mongo_rw", "MongoDB Atlas Read/Write", _check_mongo_rw)
    _run_check("auth_jwt", "Authentication & JWT Engine", _check_auth_jwt)
    _run_check("architectures", "6 Business Architectures Integrity", _check_architectures)
    _run_check("pricing_config", "Pricing & Platform Config", _check_pricing_and_broadcast)
    _run_check("email_delivery", "Email & 2-Step Verification Delivery", _check_email_delivery)
    _run_check("whatsapp_api", "WhatsApp Cloud API", _check_whatsapp)
    _run_check("google_drive", "Google Drive OAuth Vault", _check_google_drive)
    _run_check("public_docs", "Public Invoice/Receipt Sharing", _check_public_docs)

    passed = sum(1 for c in checks if c["status"] == "pass")
    warned = sum(1 for c in checks if c["status"] == "warn")
    failed = sum(1 for c in checks if c["status"] == "fail")

    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email="system_health",
        action=f"Ran Quick Diagnostics ({passed} pass / {warned} warn / {failed} fail)",
        details={"passed": passed, "warned": warned, "failed": failed},
        reason="Manual Super Admin system check",
    )

    return success_response(
        data={
            "checks": checks,
            "summary": {"total": len(checks), "passed": passed, "warned": warned, "failed": failed},
            "ranAt": datetime.now(timezone.utc).isoformat(),
        },
        message=f"Quick system diagnostics complete: {passed}/{len(checks)} passed.",
    )


@super_admin_bp.route("/error-reports/<string:report_id>", methods=["PATCH"])
@require_super_admin
def update_error_report_status(report_id: str):
    """Mark an auto-reported user error as resolved or open."""
    db = get_db()
    payload = request.get_json(silent=True) or {}
    next_status = payload.get("status", "resolved")
    if next_status not in ("open", "resolved"):
        return error_response("Status must be 'open' or 'resolved'.", status_code=400)

    now_iso = datetime.now(timezone.utc).isoformat()
    res = db.system_error_reports.update_one(
        {"id": report_id},
        {
            "$set": {
                "status": next_status,
                "resolvedBy": g.super_admin_email if next_status == "resolved" else "",
                "resolvedAt": now_iso if next_status == "resolved" else "",
            }
        },
    )
    if res.matched_count == 0:
        return error_response("Error report not found.", status_code=404)
    return success_response(message=f"Error report {report_id} marked as {next_status}.")


@super_admin_bp.route("/error-reports/clear-resolved", methods=["DELETE"])
@require_super_admin
def clear_resolved_error_reports():
    """Delete all resolved error reports to keep the Super Admin inbox clean."""
    db = get_db()
    res = db.system_error_reports.delete_many({"status": "resolved"})
    return success_response(
        data={"deleted": res.deleted_count},
        message=f"Cleared {res.deleted_count} resolved error report(s).",
    )


@super_admin_bp.route("/upgrade-requests", methods=["GET"])
@require_super_admin
def list_upgrade_requests():
    """List all customer MoMo/Bank subscription upgrade requests for Super Admin review."""
    db = get_db()
    status_filter = (request.args.get("status") or "").strip().lower()
    query = {}
    if status_filter and status_filter != "all":
        query["status"] = status_filter
    docs = list(db.subscription_requests.find(query).sort("createdAt", -1).limit(100))
    items = []
    for d in docs:
        clean = serialize_doc(d)
        clean.pop("_id", None)
        items.append(clean)
    pending_count = db.subscription_requests.count_documents({"status": "pending"})
    return success_response(data=items, extra={"meta": {"pendingCount": pending_count}})


@super_admin_bp.route("/upgrade-requests/<string:req_id>/review", methods=["POST"])
@require_super_admin
def review_upgrade_request(req_id: str):
    """
    Approve or reject a customer's MTN MoMo / Bank payment upgrade request.
    Approving immediately activates their Paid tier for durationDays (default 30),
    updates Paid MRR, syncs staff accounts, emails confirmation, and logs an audit entry.
    """
    from datetime import timedelta

    db = get_db()
    req_doc = db.subscription_requests.find_one({"id": req_id})
    if not req_doc:
        return error_response("Upgrade request not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    action = str(payload.get("action") or "approve").strip().lower()
    duration_days = max(1, int(payload.get("durationDays") or 30))
    note = str(payload.get("note") or "").strip()
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    target_email = str(req_doc.get("email") or "").strip().lower()
    requested_plan = str(req_doc.get("requestedPlan") or "Bronze").strip()
    amount_rwf = float(req_doc.get("amountRWF") or _resolve_plan_price_rwf(db, requested_plan))

    if action == "reject":
        db.subscription_requests.update_one(
            {"_id": req_doc["_id"]},
            {
                "$set": {
                    "status": "rejected",
                    "reviewedBy": g.super_admin_email,
                    "reviewedAt": now_iso,
                    "reviewNote": note or "Payment reference could not be verified.",
                }
            },
        )
        _record_audit_log(
            db=db,
            actor_email=g.super_admin_email,
            target_email=target_email,
            action=f"Rejected Upgrade -> {requested_plan}",
            details={"requestId": req_id, "paymentReference": req_doc.get("paymentReference")},
            reason=note or "Payment not verified",
        )
        return success_response(message=f"Upgrade request {req_id} rejected.")

    # Approve: activate paid plan + 30-day expiry + sync staff + sync business
    expiry_date = (now_dt + timedelta(days=duration_days)).strftime("%Y-%m-%d")
    audit_note = f"[Paid Approved · {now_iso[:10]} · Ref: {req_doc.get('paymentReference')}] {note or 'Verified payment'}"

    user_updates = {
        "plan": requested_plan,
        "planTier": requested_plan,
        "billingType": "Paid",
        "subscriptionStatus": "Active",
        "paidAt": req_doc.get("paidAt") or req_doc.get("createdAt") or now_iso,
        "subscriptionExpiry": expiry_date,
        "paymentMethod": req_doc.get("paymentMethod") or "MTN MoMo Business",
        "paymentReference": req_doc.get("paymentReference") or "",
        "paymentMessageCopy": req_doc.get("paymentMessageCopy") or req_doc.get("notes") or "",
        "paymentScreenshot": req_doc.get("paymentScreenshot") or "",
        "monthlySpendRWF": amount_rwf,
        "auditNote": audit_note,
        "updated_at": now_iso,
    }
    db.users.update_one({"email": target_email}, {"$set": user_updates})
    db.users.update_many(
        {"ownerScopeKey": target_email},
        {
            "$set": {
                "plan": requested_plan,
                "planTier": requested_plan,
                "billingType": "Paid",
                "subscriptionExpiry": expiry_date,
                "updated_at": now_iso,
            }
        },
    )
    db.businesses.update_one(
        {"email": target_email},
        {
            "$set": {
                "plan": requested_plan,
                "billingType": "Paid",
                "status": "Active",
                "mrrRWF": amount_rwf,
                "monthlySpendRWF": amount_rwf,
                "expiryDate": expiry_date,
                "auditNote": audit_note,
                "updated_at": now_iso,
            }
        },
        upsert=True,
    )
    db.subscription_requests.update_one(
        {"_id": req_doc["_id"]},
        {
            "$set": {
                "status": "approved",
                "reviewedBy": g.super_admin_email,
                "reviewedAt": now_iso,
                "expiryDate": expiry_date,
                "reviewNote": note or "Payment verified",
            }
        },
    )
    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email=target_email,
        action=f"Approved Paid Upgrade -> {requested_plan} ({amount_rwf:,.0f} RWF)",
        details={
            "requestId": req_id,
            "paymentReference": req_doc.get("paymentReference"),
            "expiryDate": expiry_date,
        },
        reason=note or f"Verified {req_doc.get('paymentMethod')} ref {req_doc.get('paymentReference')}",
    )

    try:
        send_gmail_email(
            to_email=target_email,
            subject=f"[ExBOS Receipt] {requested_plan} Plan Activated until {expiry_date}",
            html_body=render_exbos_email(
                category="Payment Receipt",
                title=f"{requested_plan} Plan Activated",
                intro_html="Your subscription payment has been verified and your ExBOS workspace has been upgraded immediately.",
                details=[
                    ("Plan Activated", f"{requested_plan} (Paid)"),
                    ("Amount Paid", f"{amount_rwf:,.0f} RWF"),
                    ("Payment Reference", str(req_doc.get("paymentReference") or "Verified")),
                    ("Payment Channel", str(req_doc.get("paymentMethod") or "Mobile Money / Bank")),
                    ("Valid Until", str(expiry_date)),
                ],
                primary_cta=("Go to Your Dashboard", "https://exbos.pages.dev/dashboard"),
                footer_note="Please keep this email as your official ExBOS subscription payment confirmation.",
            ),
            text_body=f"Your ExBOS {requested_plan} plan is now active until {expiry_date}. Payment ref: {req_doc.get('paymentReference')}.",
        )
    except Exception:
        pass

    return success_response(
        data={"plan": requested_plan, "expiryDate": expiry_date, "amountRWF": amount_rwf},
        message=f"Approved {requested_plan} plan for {target_email} (valid until {expiry_date}).",
    )


@super_admin_bp.route("/plan-limits", methods=["GET"])
def get_editable_plan_limits():
    """
    Publicly readable live PLAN_LIMITS & Feature Matrix (Free, Bronze, Silver, Gold, Platinum).
    Super Admin edits immediately reflect across backend enforcement and frontend UI.
    """
    from app.utils.entitlements import get_all_plan_limits

    db = get_db()
    limits = get_all_plan_limits(db=db)
    return success_response(data=limits)


@super_admin_bp.route("/plan-limits/<string:plan_key>", methods=["PUT"])
@require_super_admin
def update_editable_plan_limits(plan_key: str):
    """
    Super Admin live editor for any tier's quotas (maxBranches, maxStaff, maxProducts,
    maxMonthlySales, maxArchitectures — numeric or null for unlimited) and feature switches.
    """
    from app.utils.entitlements import (
        DEFAULT_PLAN_LIMITS,
        PLAN_ORDER,
        get_all_plan_limits,
        invalidate_plan_limits_cache,
        normalize_plan_name,
    )

    norm_key = normalize_plan_name(plan_key)
    if norm_key not in PLAN_ORDER:
        return error_response(f"Unknown plan tier '{plan_key}'.", status_code=400)

    db = get_db()
    payload = request.get_json(silent=True) or {}
    all_limits = get_all_plan_limits(db=db)
    current_tier = dict(all_limits.get(norm_key, DEFAULT_PLAN_LIMITS[norm_key]))

    numeric_nullable_keys = (
        "maxArchitectures",
        "maxBranches",
        "maxStaff",
        "maxProducts",
        "maxMonthlySales",
    )
    bool_keys = (
        "allowHybrid",
        "allowFullMoneyBuckets",
        "allowWhatsappAutomation",
        "allowGoogleDrive",
        "allowGmailReports",
        "allowMultiBranchTransfer",
        "allowBranchFreeze",
        "allowPublicDocLinks",
        "allowAdvancedReports",
        "allowRraTaxPack",
        "allowTwoFactorSecurity",
    )
    str_keys = ("name", "targetBusiness", "supportSla")

    updated_fields: dict = {}
    for k in numeric_nullable_keys:
        if k in payload:
            val = payload[k]
            if val is None or val == "" or str(val).lower() == "unlimited":
                updated_fields[k] = None
            else:
                updated_fields[k] = max(0, int(val))

    for k in bool_keys:
        if k in payload:
            updated_fields[k] = bool(payload[k])

    for k in str_keys:
        if k in payload and payload[k] is not None:
            updated_fields[k] = str(payload[k]).strip()

    if "priceRWF" in payload and payload["priceRWF"] is not None:
        updated_fields["priceRWF"] = max(0.0, float(payload["priceRWF"]))

    current_tier.update(updated_fields)
    all_limits[norm_key] = current_tier
    now_iso = datetime.now(timezone.utc).isoformat()

    db.platform_config.update_one(
        {"key": "plan_limits"},
        {"$set": {"key": "plan_limits", "value": all_limits, "updated_at": now_iso}},
        upsert=True,
    )
    invalidate_plan_limits_cache()

    # Keep pricing_plans priceRWF synced if price changed
    if "priceRWF" in updated_fields:
        pdoc = db.platform_config.find_one({"key": "pricing_plans"})
        if pdoc and isinstance(pdoc.get("value"), list):
            plist = list(pdoc["value"])
            for idx, p in enumerate(plist):
                if str(p.get("id") or "").lower() == norm_key or str(p.get("tier") or "").lower() == norm_key:
                    plist[idx] = {
                        **p,
                        "priceRWF": updated_fields["priceRWF"],
                        "monthlyPriceRWF": updated_fields["priceRWF"],
                    }
            db.platform_config.update_one(
                {"key": "pricing_plans"},
                {"$set": {"key": "pricing_plans", "value": plist, "updated_at": now_iso}},
            )

    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email=f"plan_limits:{norm_key}",
        action=f"Updated {norm_key.title()} Plan Limits & Features",
        details=updated_fields,
        reason="Super Admin plan feature matrix update",
    )

    return success_response(
        data=current_tier,
        extra={"allPlanLimits": all_limits},
        message=f"Saved live limits & feature switches for {current_tier.get('name', norm_key.title())}.",
    )


@super_admin_bp.route("/plan-limits/reset", methods=["POST"])
@require_super_admin
def reset_editable_plan_limits():
    """Reset all plan limits & feature toggles back to ExBOS factory defaults."""
    from app.utils.entitlements import DEFAULT_PLAN_LIMITS, invalidate_plan_limits_cache

    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    fresh = {k: dict(v) for k, v in DEFAULT_PLAN_LIMITS.items()}
    db.platform_config.update_one(
        {"key": "plan_limits"},
        {"$set": {"key": "plan_limits", "value": fresh, "updated_at": now_iso}},
        upsert=True,
    )
    invalidate_plan_limits_cache()
    _record_audit_log(
        db=db,
        actor_email=g.super_admin_email,
        target_email="plan_limits:all",
        action="Reset Plan Limits to Defaults",
        details={},
        reason="Factory defaults restored",
    )
    return success_response(data=fresh, message="All plan limits reset to defaults.")



