from __future__ import annotations

import calendar
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.database import get_db
from app.utils.responses import error_response, serialize_doc, success_response

commitments_bp = Blueprint("commitments", __name__, url_prefix="/api/v1/commitments")


def _resolve_scope_and_user(db):
    email = ""
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        if ident:
            email = str(ident).strip().lower()
    except Exception:
        pass
    if not email:
        return "", None
    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        return email, None
    scope_key = str(user_doc.get("ownerScopeKey") or user_doc.get("email") or email).strip().lower()
    return scope_key, user_doc


def _compute_monthly_breakeven(
    db,
    scope_key: str,
    arch_id: str,
    branch_id: str,
    month_key: str,
    commitments: list[dict],
) -> tuple[list[dict], dict]:
    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id}) or {}
    records = ws.get("records") or {}

    sales_list = (
        list(records.get("Sales") or [])
        + list(records.get("ServiceJobs") or [])
        + list(records.get("KitchenOrders") or [])
        + list(records.get("MixedSales") or [])
    )
    expenses_list = list(records.get("Expenses") or [])

    # 1. Sum paid amounts per commitmentId for the selected month + variable (non-commitment) expenses
    paid_by_commitment: dict[str, float] = {}
    variable_expenses = 0.0

    for exp in expenses_list:
        if not isinstance(exp, dict):
            continue
        rec_branch = str(exp.get("branchId") or "main").strip()
        if branch_id and branch_id != "ALL" and rec_branch != branch_id:
            continue
        rec_month = str(exp.get("monthKey") or exp.get("date") or exp.get("createdAt") or "")[:7]
        if rec_month != month_key:
            continue
        amt = max(0.0, float(exp.get("amountRWF") or 0))
        cid = str(exp.get("commitmentId") or "").strip()
        if cid:
            paid_by_commitment[cid] = paid_by_commitment.get(cid, 0.0) + amt
        else:
            variable_expenses += amt

    # 2. Enrich each employee & fixed bill with Paid This Month & Remaining Owed
    enriched = []
    total_salaries = 0.0
    total_fixed_bills = 0.0
    paid_fixed_total = 0.0

    for c in commitments:
        monthly_amt = max(0.0, float(c.get("monthlyAmountRWF") or 0))
        paid_amt = round(paid_by_commitment.get(c["id"], 0.0))
        remaining_amt = max(0.0, round(monthly_amt - paid_amt))
        if monthly_amt <= 0 or remaining_amt <= 0:
            st = "Paid"
        elif paid_amt > 0:
            st = "Partial"
        else:
            st = "Unpaid"

        if c.get("kind") == "employee":
            total_salaries += monthly_amt
        else:
            total_fixed_bills += monthly_amt
        paid_fixed_total += min(monthly_amt, paid_amt)

        enriched.append(
            {
                **c,
                "monthlyAmountRWF": round(monthly_amt),
                "paidThisMonthRWF": round(paid_amt),
                "remainingThisMonthRWF": round(remaining_amt),
                "monthStatus": st,
            }
        )

    total_monthly_fixed = round(total_salaries + total_fixed_bills)
    remaining_fixed_total = max(0, round(total_monthly_fixed - paid_fixed_total))

    # 3. Compute this month's Sales Revenue, COGS, and Gross Profit
    month_sales = 0.0
    month_cogs = 0.0
    month_gross_profit = 0.0

    for s in sales_list:
        if not isinstance(s, dict):
            continue
        rec_branch = str(s.get("branchId") or "main").strip()
        if branch_id and branch_id != "ALL" and rec_branch != branch_id:
            continue
        rec_month = str(s.get("date") or s.get("createdAt") or "")[:7]
        if rec_month != month_key:
            continue
        rev = max(0.0, float(s.get("amountRWF") or s.get("totalAmount") or 0))
        qty = max(1.0, float(s.get("quantity") or 1))
        unit_cost = max(0.0, float(s.get("unitCostRWF") or s.get("purchasePriceRWF") or 0))
        if s.get("profitRWF") is not None and float(s.get("profitRWF") or 0) != 0:
            gp = float(s.get("profitRWF") or 0)
            cogs = max(0.0, rev - gp)
        elif unit_cost > 0:
            cogs = unit_cost * qty
            gp = rev - cogs
        else:
            # Conservative fallback when cost price wasn't entered on a sale
            cogs = round(rev * 0.65)
            gp = rev - cogs
        month_sales += rev
        month_cogs += cogs
        month_gross_profit += gp

    total_monthly_burden = round(total_monthly_fixed + variable_expenses)
    net_monthly_position = round(month_gross_profit - total_monthly_burden)
    is_profitable = net_monthly_position >= 0 and (month_gross_profit > 0 or total_monthly_burden == 0)

    if total_monthly_burden > 0:
        break_even_pct = min(100, max(0, round((month_gross_profit / total_monthly_burden) * 100)))
    else:
        break_even_pct = 100 if month_gross_profit > 0 else 0

    profit_gap = max(0, round(total_monthly_burden - month_gross_profit))
    avg_margin_ratio = (month_gross_profit / month_sales) if month_sales > 0 and month_gross_profit > 0 else 0.35
    avg_margin_ratio = max(0.10, min(0.95, avg_margin_ratio))
    sales_needed_for_breakeven = round(profit_gap / avg_margin_ratio) if profit_gap > 0 else 0

    # Remaining days in month
    now_d = datetime.now(timezone.utc).date()
    try:
        y_num, m_num = int(month_key[:4]), int(month_key[5:7])
        days_in_month = calendar.monthrange(y_num, m_num)[1]
        if y_num == now_d.year and m_num == now_d.month:
            remaining_days = max(1, days_in_month - now_d.day + 1)
        else:
            remaining_days = days_in_month
    except Exception:
        remaining_days = 15

    daily_sales_target = round(sales_needed_for_breakeven / remaining_days) if sales_needed_for_breakeven > 0 else 0

    summary = {
        "monthKey": month_key,
        "totalMonthlySalariesRWF": round(total_salaries),
        "totalMonthlyFixedBillsRWF": round(total_fixed_bills),
        "totalMonthlyFixedRWF": total_monthly_fixed,
        "paidFixedThisMonthRWF": round(paid_fixed_total),
        "remainingFixedThisMonthRWF": remaining_fixed_total,
        "monthSalesRWF": round(month_sales),
        "monthCogsRWF": round(month_cogs),
        "monthGrossProfitRWF": round(month_gross_profit),
        "monthVariableExpensesRWF": round(variable_expenses),
        "totalMonthlyBurdenRWF": total_monthly_burden,
        "netMonthlyProfitOrLossRWF": net_monthly_position,
        "profitGapToBreakEvenRWF": profit_gap,
        "salesNeededToBreakEvenRWF": sales_needed_for_breakeven,
        "breakEvenPercent": break_even_pct,
        "isProfitable": is_profitable,
        "remainingDaysInMonth": remaining_days,
        "dailySalesTargetToBreakEvenRWF": daily_sales_target,
    }
    return enriched, summary


@commitments_bp.route("", methods=["GET"])
@commitments_bp.route("/", methods=["GET"])
def list_commitments():
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    arch_id = str(request.args.get("archId") or user_doc.get("architectureId") or "buy-and-sell").strip()
    branch_id = str(user_doc.get("assignedBranchId") or request.args.get("branchId") or "main").strip()
    month_key = str(request.args.get("month") or datetime.now(timezone.utc).strftime("%Y-%m")).strip()[:7]

    query: dict = {"scopeKey": scope_key, "active": {"$ne": False}}
    if branch_id and branch_id != "ALL":
        query["branchId"] = branch_id

    docs = list(db.monthly_commitments.find(query))
    cleaned = [serialize_doc(d) for d in docs]
    for d in cleaned:
        d.pop("_id", None)
    cleaned.sort(key=lambda x: (0 if x.get("kind") == "employee" else 1, str(x.get("name") or "").lower()))

    enriched, summary = _compute_monthly_breakeven(db, scope_key, arch_id, branch_id, month_key, cleaned)
    return success_response(
        data={
            "employees": [c for c in enriched if c.get("kind") == "employee"],
            "fixedBills": [c for c in enriched if c.get("kind") != "employee"],
            "commitments": enriched,
            "breakEven": summary,
        }
    )


@commitments_bp.route("", methods=["POST"])
@commitments_bp.route("/", methods=["POST"])
def create_commitment():
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    payload = request.get_json(silent=True) or {}
    kind = "employee" if str(payload.get("kind") or "employee").strip().lower() == "employee" else "fixed_bill"
    name = str(payload.get("name") or "").strip()[:100]
    if not name:
        return error_response("Name is required.", status_code=400)

    monthly_amount = max(0.0, float(payload.get("monthlyAmountRWF") or 0))
    if monthly_amount <= 0:
        return error_response("Monthly amount must be greater than 0 RWF.", status_code=400)

    branch_id = str(user_doc.get("assignedBranchId") or payload.get("branchId") or "main").strip()
    arch_id = str(payload.get("archId") or user_doc.get("architectureId") or "buy-and-sell").strip()
    role_or_cat = str(payload.get("roleOrCategory") or ("Staff" if kind == "employee" else "Shop Rent")).strip()[:60]
    phone = str(payload.get("phone") or "").strip()[:40]
    due_day = max(1, min(31, int(payload.get("dueDay") or (28 if kind == "employee" else 5))))

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    prefix = "EMP" if kind == "employee" else "BILL"
    cid = f"{prefix}-{int(now.timestamp() * 1000)}"

    doc = {
        "id": cid,
        "scopeKey": scope_key,
        "branchId": branch_id,
        "architectureId": arch_id,
        "kind": kind,
        "name": name,
        "roleOrCategory": role_or_cat,
        "phone": phone,
        "monthlyAmountRWF": round(monthly_amount),
        "dueDay": due_day,
        "active": True,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    db.monthly_commitments.insert_one(doc)
    clean = serialize_doc(doc)
    clean.pop("_id", None)
    return success_response(data={"commitment": clean}, message="Monthly commitment saved.", status_code=201)


@commitments_bp.route("/<string:cid>", methods=["PUT"])
def update_commitment(cid: str):
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    existing = db.monthly_commitments.find_one({"scopeKey": scope_key, "id": cid})
    if not existing:
        return error_response("Commitment not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    updates: dict = {"updatedAt": datetime.now(timezone.utc).isoformat()}
    if "name" in payload and str(payload["name"]).strip():
        updates["name"] = str(payload["name"]).strip()[:100]
    if "roleOrCategory" in payload:
        updates["roleOrCategory"] = str(payload["roleOrCategory"] or "").strip()[:60]
    if "phone" in payload:
        updates["phone"] = str(payload["phone"] or "").strip()[:40]
    if "monthlyAmountRWF" in payload:
        updates["monthlyAmountRWF"] = max(0, round(float(payload["monthlyAmountRWF"] or 0)))
    if "dueDay" in payload:
        updates["dueDay"] = max(1, min(31, int(payload["dueDay"] or 28)))
    if "active" in payload:
        updates["active"] = bool(payload["active"])

    db.monthly_commitments.update_one({"scopeKey": scope_key, "id": cid}, {"$set": updates})
    merged = serialize_doc({**existing, **updates})
    merged.pop("_id", None)
    return success_response(data={"commitment": merged}, message="Monthly commitment updated.")


@commitments_bp.route("/<string:cid>", methods=["DELETE"])
def delete_commitment(cid: str):
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    db.monthly_commitments.delete_one({"scopeKey": scope_key, "id": cid})
    return success_response(data={"deletedId": cid}, message="Monthly commitment removed.")


@commitments_bp.route("/<string:cid>/pay", methods=["POST"])
def pay_commitment(cid: str):
    """
    Record a partial or full salary / fixed-bill payment for the selected month.
    Automatically appends to workspaces.records.Expenses and db.transactions (OUTFLOW)
    so Expenses, Where Is My Money, Profit & Loss, and Remaining Balance stay synchronized.
    """
    db = get_db()
    scope_key, user_doc = _resolve_scope_and_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    item = db.monthly_commitments.find_one({"scopeKey": scope_key, "id": cid})
    if not item:
        return error_response("Employee or fixed bill not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    amount = max(0.0, float(payload.get("amountRWF") or 0))
    if amount <= 0:
        return error_response("Payment amount must be greater than 0 RWF.", status_code=400)

    arch_id = str(payload.get("archId") or item.get("architectureId") or user_doc.get("architectureId") or "buy-and-sell").strip()
    branch_id = str(item.get("branchId") or "main").strip()
    month_key = str(payload.get("monthKey") or datetime.now(timezone.utc).strftime("%Y-%m")).strip()[:7]
    payment_method = str(payload.get("paymentMethod") or "MTN MoMo").strip()[:60]
    notes = str(payload.get("notes") or "").strip()[:240]

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_ms = int(now.timestamp() * 1000)

    is_emp = item.get("kind") == "employee"
    exp_title = f"Salary Payment — {item['name']} ({month_key})" if is_emp else f"{item.get('roleOrCategory') or 'Fixed Bill'} — {item['name']} ({month_key})"
    exp_category = "Payroll & Salaries" if is_emp else (item.get("roleOrCategory") or "Rent & Utilities")

    exp_id = f"EXP-CMT-{now_ms}"
    exp_record = {
        "id": exp_id,
        "title": exp_title,
        "category": exp_category,
        "amountRWF": round(amount),
        "paymentMethod": payment_method,
        "account": payment_method,
        "status": "Paid",
        "type": "out",
        "branchId": branch_id,
        "commitmentId": cid,
        "commitmentKind": item.get("kind"),
        "commitmentName": item.get("name"),
        "monthKey": month_key,
        "notes": notes,
        "date": now.strftime("%Y-%m-%d"),
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }

    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id}) or {
        "scopeKey": scope_key,
        "architectureId": arch_id,
        "records": {},
    }
    records = dict(ws.get("records") or {})
    exp_list = list(records.get("Expenses") or [])
    exp_list.insert(0, exp_record)
    records["Expenses"] = exp_list
    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records, "updatedAt": now_iso}},
        upsert=True,
    )

    # Mirror into db.transactions so Where Is My Money updates immediately
    tx_id = f"TX-CMT-{now_ms}"
    db.transactions.insert_one(
        {
            "id": tx_id,
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "branchId": branch_id,
            "recordId": exp_id,
            "sourceModule": "Expenses",
            "type": "OUTFLOW",
            "title": exp_title,
            "category": exp_category,
            "amountRWF": round(amount),
            "paymentMethod": payment_method,
            "account": payment_method,
            "date": now.strftime("%Y-%m-%d %H:%M"),
            "timestamp": now_iso,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
    )

    return success_response(
        data={"expense": exp_record, "transactionId": tx_id},
        message=f"Recorded {round(amount):,} RWF payment for {item['name']}.",
        status_code=201,
    )
