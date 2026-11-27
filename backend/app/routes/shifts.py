from __future__ import annotations

from datetime import datetime, timedelta, timezone
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.database import get_db
from app.utils.entitlements import check_entitlement
from app.utils.responses import error_response, serialize_doc, success_response

shifts_bp = Blueprint("shifts", __name__, url_prefix="/api/v1/shifts")


def _resolve_actor_and_scope(db):
    email = ""
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        if ident:
            email = str(ident).strip().lower()
    except Exception:
        pass
    if not email:
        return "", None, None
    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        return email, None, None
    scope_key = str(user_doc.get("ownerScopeKey") or user_doc.get("email") or email).strip().lower()
    owner_doc = user_doc
    if scope_key != email:
        parent = db.users.find_one({"email": scope_key})
        if parent:
            owner_doc = parent
    return scope_key, user_doc, owner_doc


def _compute_branch_period_totals(db, scope_key: str, arch_id: str, branch_id: str, since_iso: str) -> dict:
    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id}) or {}
    records = ws.get("records") or {}
    sales_list = (
        list(records.get("Sales") or [])
        + list(records.get("ServiceJobs") or [])
        + list(records.get("KitchenOrders") or [])
        + list(records.get("MixedSales") or [])
    )
    expenses_list = list(records.get("Expenses") or [])
    since_day = str(since_iso or "")[:10]

    cash_sales = 0.0
    momo_sales = 0.0
    bank_sales = 0.0
    credit_sales = 0.0
    sales_count = 0

    for s in sales_list:
        if not isinstance(s, dict):
            continue
        rec_branch = str(s.get("branchId") or "main").strip()
        if branch_id and branch_id != "ALL" and rec_branch != branch_id:
            continue
        rec_ts = str(s.get("createdAt") or s.get("date") or "")
        if since_day and rec_ts[:10] < since_day:
            continue
        amt = float(s.get("amountRWF") or s.get("totalAmount") or 0)
        pm = str(s.get("paymentMethod") or "Cash").lower()
        st = str(s.get("status") or "Paid").lower()
        sales_count += 1
        if "unpaid" in st or "credit" in st or "credit" in pm:
            credit_sales += amt
        elif "momo" in pm or "airtel" in pm or "mobile" in pm:
            momo_sales += amt
        elif "bank" in pm or "card" in pm:
            bank_sales += amt
        else:
            cash_sales += amt

    cash_expenses = 0.0
    total_expenses = 0.0
    for e in expenses_list:
        if not isinstance(e, dict):
            continue
        rec_branch = str(e.get("branchId") or "main").strip()
        if branch_id and branch_id != "ALL" and rec_branch != branch_id:
            continue
        rec_ts = str(e.get("createdAt") or e.get("date") or "")
        if since_day and rec_ts[:10] < since_day:
            continue
        amt = float(e.get("amountRWF") or 0)
        pm = str(e.get("paymentMethod") or "Cash").lower()
        total_expenses += amt
        if "cash" in pm or not pm:
            cash_expenses += amt

    total_sales = cash_sales + momo_sales + bank_sales + credit_sales
    return {
        "cashSalesRWF": round(cash_sales),
        "momoSalesRWF": round(momo_sales),
        "bankSalesRWF": round(bank_sales),
        "creditSalesRWF": round(credit_sales),
        "totalSalesRWF": round(total_sales),
        "salesCount": sales_count,
        "cashExpensesRWF": round(cash_expenses),
        "totalExpensesRWF": round(total_expenses),
    }


@shifts_bp.route("", methods=["GET"])
@shifts_bp.route("/", methods=["GET"])
def list_shifts():
    db = get_db()
    scope_key, user_doc, _ = _resolve_actor_and_scope(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    branch_id = str(request.args.get("branchId") or "").strip()
    if user_doc.get("assignedBranchId"):
        branch_id = str(user_doc["assignedBranchId"]).strip()

    query = {"scopeKey": scope_key}
    if branch_id and branch_id != "ALL":
        query["branchId"] = branch_id

    docs = list(db.cashier_shifts.find(query))
    cleaned = [serialize_doc(d) for d in docs]
    for d in cleaned:
        d.pop("_id", None)
    cleaned.sort(key=lambda x: str(x.get("openedAt") or ""), reverse=True)
    active_shift = next((s for s in cleaned if s.get("status") == "open"), None)
    return success_response(data={"activeShift": active_shift, "shifts": cleaned[:30]})


@shifts_bp.route("/open", methods=["POST"])
def open_shift():
    db = get_db()
    scope_key, user_doc, _ = _resolve_actor_and_scope(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    payload = request.get_json(silent=True) or {}
    branch_id = str(user_doc.get("assignedBranchId") or payload.get("branchId") or "main").strip()
    arch_id = str(payload.get("archId") or user_doc.get("architectureId") or "buy-and-sell").strip()
    opening_float = max(0.0, float(payload.get("openingFloatRWF") or 0))
    cashier_name = str(payload.get("cashierName") or user_doc.get("name") or user_doc.get("email") or "Cashier").strip()[:80]
    notes = str(payload.get("notes") or "").strip()[:300]

    existing_open = db.cashier_shifts.find_one({"scopeKey": scope_key, "branchId": branch_id, "status": "open"})
    if existing_open:
        return error_response("A cashier shift is already open for this branch. Close it before opening a new one.", status_code=409)

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    shift_id = f"SHF-{now.strftime('%Y%m%d')}-{int(now.timestamp() * 1000) % 10000:04d}"

    doc = {
        "id": shift_id,
        "scopeKey": scope_key,
        "branchId": branch_id,
        "architectureId": arch_id,
        "cashierName": cashier_name,
        "cashierEmail": str(user_doc.get("email") or scope_key).strip().lower(),
        "openingFloatRWF": round(opening_float),
        "notes": notes,
        "status": "open",
        "openedAt": now_iso,
        "closedAt": "",
    }
    db.cashier_shifts.insert_one(doc)
    clean = serialize_doc(doc)
    clean.pop("_id", None)
    return success_response(data={"shift": clean}, message="Cashier shift opened.", status_code=201)


@shifts_bp.route("/<string:shift_id>/close", methods=["POST"])
def close_shift(shift_id: str):
    db = get_db()
    scope_key, user_doc, owner_doc = _resolve_actor_and_scope(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    shift = db.cashier_shifts.find_one({"scopeKey": scope_key, "id": shift_id})
    if not shift:
        return error_response("Shift not found.", status_code=404)
    if shift.get("status") != "open":
        return error_response("This shift is already closed.", status_code=400)

    payload = request.get_json(silent=True) or {}
    counted_cash = max(0.0, float(payload.get("countedCashRWF") or 0))
    closing_notes = str(payload.get("closingNotes") or "").strip()[:400]

    totals = _compute_branch_period_totals(
        db,
        scope_key,
        shift.get("architectureId") or "buy-and-sell",
        shift.get("branchId") or "main",
        shift.get("openedAt") or "",
    )
    opening_float = float(shift.get("openingFloatRWF") or 0)
    expected_cash = round(opening_float + totals["cashSalesRWF"] - totals["cashExpensesRWF"])
    variance = round(counted_cash - expected_cash)

    now_iso = datetime.now(timezone.utc).isoformat()
    updates = {
        "status": "closed",
        "closedAt": now_iso,
        "closedBy": str(user_doc.get("email") or scope_key).strip().lower(),
        "countedCashRWF": round(counted_cash),
        "expectedCashRWF": expected_cash,
        "varianceRWF": variance,
        "closingNotes": closing_notes,
        **totals,
    }
    db.cashier_shifts.update_one({"scopeKey": scope_key, "id": shift_id}, {"$set": updates})
    merged = {**shift, **updates}
    clean = serialize_doc(merged)
    clean.pop("_id", None)

    # Alert Business Owner silently if significant cash shortage (> 1,000 RWF)
    if variance < -1000 and owner_doc:
        try:
            db.owner_notifications.insert_one(
                {
                    "id": f"NOTIF-SHF-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
                    "scopeKey": scope_key,
                    "title": f"Cash Drawer Shortage Detected ({shift_id})",
                    "message": (
                        f"{shift.get('cashierName')} closed shift with a cash shortage of "
                        f"{abs(variance):,} RWF (Expected {expected_cash:,} RWF vs Counted {round(counted_cash):,} RWF)."
                    ),
                    "severity": "warning",
                    "read": False,
                    "createdAt": now_iso,
                }
            )
            owner_phone = str(owner_doc.get("phone") or "").strip()
            if owner_phone:
                from app.services.whatsapp_client import send_whatsapp_message
                send_whatsapp_message(
                    owner_phone,
                    (
                        f"EXBOS SHIFT ALERT ({shift_id})\n"
                        f"Cashier: {shift.get('cashierName')}\n"
                        f"Expected Cash: {expected_cash:,} RWF\n"
                        f"Counted Cash: {round(counted_cash):,} RWF\n"
                        f"Shortage: {abs(variance):,} RWF"
                    ),
                )
        except Exception:
            pass

    return success_response(data={"shift": clean}, message="Cashier shift closed and Z-Report generated.")


# ---------------------------------------------------------------------------
# AUTOMATED DAILY OWNER DIGEST (WhatsApp End-of-Day Summary)
# ---------------------------------------------------------------------------


def build_daily_digest_summary(db, scope_key: str, arch_id: str) -> dict:
    today_iso = datetime.now(timezone.utc).date().isoformat()
    soon_iso = (datetime.now(timezone.utc).date() + timedelta(days=30)).isoformat()
    totals = _compute_branch_period_totals(db, scope_key, arch_id, "ALL", today_iso)

    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id}) or {}
    records = ws.get("records") or {}
    inv = list(records.get("Inventory") or []) + list(records.get("Products") or [])
    seen_ids = set()
    low_stock_count = 0
    expiring_soon_count = 0

    for item in inv:
        if not isinstance(item, dict):
            continue
        iid = str(item.get("id") or "")
        if iid and iid in seen_ids:
            continue
        if iid:
            seen_ids.add(iid)
        qty = float(item.get("quantity") or 0)
        alert = float(item.get("lowStockAlert") or 5)
        if qty <= alert:
            low_stock_count += 1
        exp = str(item.get("expiryDate") or "").strip()[:10]
        if exp and exp <= soon_iso:
            expiring_soon_count += 1

    net_today = round(totals["totalSalesRWF"] - totals["totalExpensesRWF"])
    return {
        "date": today_iso,
        "architectureId": arch_id,
        **totals,
        "netCashflowTodayRWF": net_today,
        "lowStockCount": low_stock_count,
        "expiringSoonCount": expiring_soon_count,
    }


@shifts_bp.route("/digest/settings", methods=["GET"])
def get_digest_settings():
    db = get_db()
    scope_key, user_doc, owner_doc = _resolve_actor_and_scope(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)
    doc = db.daily_digest_settings.find_one({"scopeKey": scope_key}) or {}
    return success_response(
        data={
            "enabled": bool(doc.get("enabled", False)),
            "sendHour": str(doc.get("sendHour") or "20:00"),
            "phone": str(doc.get("phone") or (owner_doc or user_doc).get("phone") or ""),
            "lastSentAt": doc.get("lastSentAt") or "",
        }
    )


@shifts_bp.route("/digest/settings", methods=["PUT"])
def update_digest_settings():
    db = get_db()
    scope_key, user_doc, owner_doc = _resolve_actor_and_scope(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    payload = request.get_json(silent=True) or {}
    enabled = bool(payload.get("enabled", False))
    if enabled:
        allowed, limit_err = check_entitlement(db, scope_key, "allowWhatsappAutomation")
        if not allowed:
            return error_response(error=limit_err["message"], details=limit_err, status_code=402)

    send_hour = str(payload.get("sendHour") or "20:00").strip()[:5]
    phone = str(payload.get("phone") or (owner_doc or user_doc).get("phone") or "").strip()
    now_iso = datetime.now(timezone.utc).isoformat()
    db.daily_digest_settings.update_one(
        {"scopeKey": scope_key},
        {"$set": {"scopeKey": scope_key, "enabled": enabled, "sendHour": send_hour, "phone": phone, "updatedAt": now_iso}},
        upsert=True,
    )
    return success_response(
        data={"enabled": enabled, "sendHour": send_hour, "phone": phone},
        message="Daily WhatsApp Digest settings saved.",
    )


@shifts_bp.route("/digest/send-now", methods=["POST"])
def send_digest_now():
    db = get_db()
    scope_key, user_doc, owner_doc = _resolve_actor_and_scope(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    allowed, limit_err = check_entitlement(db, scope_key, "allowWhatsappAutomation")
    if not allowed:
        return error_response(error=limit_err["message"], details=limit_err, status_code=402)

    payload = request.get_json(silent=True) or {}
    arch_id = str(payload.get("archId") or user_doc.get("architectureId") or "buy-and-sell").strip()
    settings_doc = db.daily_digest_settings.find_one({"scopeKey": scope_key}) or {}
    phone = str(payload.get("phone") or settings_doc.get("phone") or (owner_doc or user_doc).get("phone") or "").strip()
    if not phone:
        return error_response("Owner WhatsApp phone number is required to send daily digest.", status_code=400)

    digest = build_daily_digest_summary(db, scope_key, arch_id)
    biz_name = (owner_doc or user_doc).get("businessName") or "ExBOS Business"
    text = (
        f"EXBOS DAILY DIGEST — {biz_name} ({digest['date']})\n"
        f"Sales ({digest['salesCount']}): {digest['totalSalesRWF']:,} RWF\n"
        f"  Cash: {digest['cashSalesRWF']:,} RWF | MoMo: {digest['momoSalesRWF']:,} RWF | Credit: {digest['creditSalesRWF']:,} RWF\n"
        f"Expenses: {digest['totalExpensesRWF']:,} RWF\n"
        f"Net Cashflow Today: {digest['netCashflowTodayRWF']:,} RWF\n"
        f"Low Stock Alerts: {digest['lowStockCount']} | Expiring Soon (30d): {digest['expiringSoonCount']}"
    )

    from app.services.whatsapp_client import send_whatsapp_message
    wa_res = send_whatsapp_message(phone, text)
    now_iso = datetime.now(timezone.utc).isoformat()
    db.daily_digest_settings.update_one(
        {"scopeKey": scope_key},
        {"$set": {"scopeKey": scope_key, "lastSentAt": now_iso, "phone": phone}},
        upsert=True,
    )
    return success_response(
        data={"digest": digest, "whatsappResult": wa_res},
        message="Daily Business Digest sent to WhatsApp.",
    )
