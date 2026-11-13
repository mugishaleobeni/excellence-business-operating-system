import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.database import get_db
from app.utils.responses import error_response, success_response

logger = logging.getLogger(__name__)
branches_bp = Blueprint("branches", __name__, url_prefix="/api/v1/branches")


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

    return (email or "default"), user_doc


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
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }
        db.branches.insert_one(dict(main_doc))
        return main_doc
    return existing


@branches_bp.route("", methods=["GET"])
@branches_bp.route("/", methods=["GET"])
def list_branches():
    """Return all branches for the authenticated user's business (Main HQ + sub-branches)."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    _ensure_main_branch(db, scope_key, user_doc)

    items = list(db.branches.find({"scopeKey": scope_key}, {"_id": 0}).sort("createdAt", 1))
    # Always keep Main HQ first
    items.sort(key=lambda b: (0 if b.get("isMain") or b.get("id") == "main" else 1, b.get("createdAt", "")))
    return success_response(data={"branches": items}, message="Branches loaded.")


@branches_bp.route("", methods=["POST"])
@branches_bp.route("/", methods=["POST"])
def create_branch():
    """Create a new branch, defaulting to the user's active architecture."""
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    _ensure_main_branch(db, scope_key, user_doc)

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return error_response("Branch name is required.", status_code=400)

    arch_id = payload.get("architectureId") or (user_doc or {}).get("architectureId") or "buy-and-sell"
    location = (payload.get("location") or "").strip() or "Rwanda"
    now_iso = datetime.now(timezone.utc).isoformat()
    slug = "".join(ch if ch.isalnum() else "-" for ch in name.lower()).strip("-")[:20] or "branch"
    branch_id = f"br-{slug}-{int(time.time() * 1000) % 10000}"

    branch_doc = {
        "id": branch_id,
        "scopeKey": scope_key,
        "name": name,
        "location": location,
        "architectureId": arch_id,
        "isMain": False,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    db.branches.insert_one(dict(branch_doc))
    return success_response(data={"branch": branch_doc}, message=f"Branch '{name}' created.", status_code=201)


@branches_bp.route("/<branch_id>", methods=["DELETE"])
def delete_branch(branch_id: str):
    """Delete a sub-branch (Main HQ branch is protected)."""
    db = get_db()
    scope_key, _ = _resolve_scope_and_user(db)
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

