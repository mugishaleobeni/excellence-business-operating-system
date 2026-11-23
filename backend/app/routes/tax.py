from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime, timezone
from flask import Blueprint, Response, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.database import get_db
from app.utils.entitlements import check_entitlement
from app.utils.responses import error_response, success_response

tax_bp = Blueprint("tax", __name__, url_prefix="/api/v1/tax")

DEFAULT_TAX_PROFILE = {
    "rraEnabled": False,
    "tin": "",
    "regime": "turnover_3",  # vat_18 | turnover_3 | exempt
    "priceMode": "inclusive",  # inclusive | exclusive
    "filingFrequency": "monthly",  # monthly | quarterly
    "trackEbmNumbers": True,
    "showOnReceipts": True,
    "trackWithholdingTax": False,
    "accountantEmail": "",
}

SALE_BUCKETS = ("Sales", "Jobs", "KitchenOrders", "MixedSales", "LivestockSales")
PURCHASE_BUCKETS = ("Purchases", "FeedOrders", "RawMaterialPurchases")
EXPENSE_BUCKETS = ("Expenses",)


def _resolve_scope_and_user(db):
    email = ""
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        if ident:
            email = str(ident).strip().lower()
    except Exception:
        pass

    explicit_scope = (
        request.args.get("scopeKey")
        or (request.get_json(silent=True) or {}).get("scopeKey")
        or ""
    ).strip().lower()

    user_doc = None
    if email:
        user_doc = db.users.find_one({"email": email})
    elif explicit_scope and "@" in explicit_scope:
        user_doc = db.users.find_one({"email": explicit_scope})

    scope = explicit_scope or email or "default"
    if user_doc and user_doc.get("ownerScopeKey"):
        scope = str(user_doc["ownerScopeKey"]).strip().lower()
        parent = db.users.find_one({"email": scope})
        if parent:
            user_doc = parent
    elif user_doc and user_doc.get("email"):
        scope = str(user_doc["email"]).strip().lower()

    return scope, user_doc


def _get_tax_profile(db, scope: str) -> dict:
    doc = db.tax_profiles.find_one({"scopeKey": scope})
    profile = dict(DEFAULT_TAX_PROFILE)
    if doc:
        for k in DEFAULT_TAX_PROFILE:
            if k in doc and doc[k] is not None:
                profile[k] = doc[k]
    return profile


def _parse_date(raw: str | None) -> str:
    if not raw:
        return ""
    s = str(raw).strip()
    m = re.match(r"^(\d{4}-\d{2}-\d{2})", s)
    if m:
        return m.group(1)
    return ""


def _num(val) -> float:
    if val is None or val == "":
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    cleaned = re.sub(r"[^0-9.\-]", "", str(val))
    try:
        return float(cleaned) if cleaned else 0.0
    except ValueError:
        return 0.0


def _compute_vat_split(gross_amount: float, regime: str, price_mode: str, tax_category: str) -> tuple[float, float, float]:
    """Return (taxable_net, vat_amount, total_gross) rounded to 2 decimals."""
    amt = max(0.0, float(gross_amount or 0.0))
    cat = str(tax_category or "standard").strip().lower()
    if regime != "vat_18" or cat in ("exempt", "zero_rated", "zero-rated", "non_vat", "c", "b"):
        return round(amt, 2), 0.0, round(amt, 2)

    if price_mode == "exclusive":
        net = amt
        vat = round(net * 0.18, 2)
        total = round(net + vat, 2)
        return round(net, 2), vat, total

    # Default Rwanda retail mode: VAT-inclusive (18/118)
    vat = round(amt * 18.0 / 118.0, 2)
    net = round(amt - vat, 2)
    return net, vat, round(amt, 2)


def _next_rra_deadlines(today: date | None = None) -> dict:
    now_d = today or datetime.now(timezone.utc).date()
    # Monthly VAT / PAYE / WHT due on 15th of following month
    if now_d.day <= 15:
        next_monthly = date(now_d.year, now_d.month, 15)
    else:
        if now_d.month == 12:
            next_monthly = date(now_d.year + 1, 1, 15)
        else:
            next_monthly = date(now_d.year, now_d.month + 1, 15)

    # Rwanda IQP quarterly dates: March 31, June 30, Sept 30, Dec 31
    iqp_candidates = [
        date(now_d.year, 3, 31),
        date(now_d.year, 6, 30),
        date(now_d.year, 9, 30),
        date(now_d.year, 12, 31),
        date(now_d.year + 1, 3, 31),
    ]
    next_iqp = next(d for d in iqp_candidates if d >= now_d)

    return {
        "nextMonthlyDeadline": next_monthly.isoformat(),
        "daysUntilMonthly": (next_monthly - now_d).days,
        "nextIqpDeadline": next_iqp.isoformat(),
        "daysUntilIqp": (next_iqp - now_d).days,
    }


def _collect_tax_ledger(db, scope: str, profile: dict, start_date: str, end_date: str, branch_id: str = ""):
    regime = profile.get("regime") or "turnover_3"
    price_mode = profile.get("priceMode") or "inclusive"

    base_query: dict = {"scopeKey": scope}
    if branch_id and branch_id.lower() not in ("all", ""):
        base_query["branchId"] = branch_id

    all_records = list(
        db.module_records.find(
            {
                **base_query,
                "bucket": {"$in": list(SALE_BUCKETS + PURCHASE_BUCKETS + EXPENSE_BUCKETS)},
            }
        )
    )

    sales_rows = []
    purchases_rows = []
    total_gross_sales = 0.0
    taxable_sales_net = 0.0
    exempt_sales_total = 0.0
    output_vat_total = 0.0

    total_purchases_expenses = 0.0
    claimable_input_vat = 0.0
    non_claimable_input_vat = 0.0
    wht_15_base = 0.0

    missing_supplier_tin_count = 0
    missing_ebm_purchase_count = 0
    high_value_sales_no_ebm = 0

    for rec in all_records:
        rec_date = _parse_date(rec.get("date") or rec.get("created_at") or rec.get("createdAt"))
        if start_date and rec_date and rec_date < start_date:
            continue
        if end_date and rec_date and rec_date > end_date:
            continue

        bucket = rec.get("bucket") or ""
        amount = _num(
            rec.get("totalAmountRWF")
            or rec.get("totalRWF")
            or rec.get("amountRWF")
            or rec.get("amount")
            or rec.get("total")
            or 0
        )
        if amount <= 0:
            continue

        if bucket in SALE_BUCKETS:
            tax_cat = rec.get("taxCategory") or "standard"
            if rec.get("vatAmount") is not None and rec.get("netAmount") is not None:
                net_amt = round(_num(rec.get("netAmount")), 2)
                vat_amt = round(_num(rec.get("vatAmount")), 2)
                gross_amt = round(amount, 2)
            else:
                net_amt, vat_amt, gross_amt = _compute_vat_split(amount, regime, price_mode, tax_cat)

            total_gross_sales += gross_amt
            if vat_amt > 0:
                taxable_sales_net += net_amt
                output_vat_total += vat_amt
            else:
                exempt_sales_total += gross_amt

            ebm_no = str(rec.get("ebmNumber") or rec.get("ebmReceiptNo") or "").strip()
            if profile.get("trackEbmNumbers") and regime == "vat_18" and gross_amt >= 50000 and not ebm_no:
                high_value_sales_no_ebm += 1

            sales_rows.append(
                {
                    "id": str(rec.get("id") or rec.get("_id") or ""),
                    "date": rec_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "reference": str(rec.get("invoiceNumber") or rec.get("receiptNumber") or rec.get("id") or "")[:32],
                    "ebmNumber": ebm_no,
                    "customerName": str(rec.get("customerName") or rec.get("customer") or "Walk-in Customer"),
                    "customerTin": str(rec.get("customerTin") or "").strip(),
                    "item": str(rec.get("productName") or rec.get("title") or rec.get("name") or "Sale"),
                    "taxCategory": tax_cat,
                    "netAmount": net_amt,
                    "vatAmount": vat_amt,
                    "totalAmount": gross_amt,
                    "paymentMethod": str(rec.get("paymentMethod") or rec.get("account") or "Cash"),
                    "branchId": str(rec.get("branchId") or "hq"),
                }
            )
        else:
            # Purchase or Expense
            total_purchases_expenses += amount
            supplier_tin = str(rec.get("supplierTin") or "").strip()
            ebm_no = str(rec.get("ebmNumber") or rec.get("ebmReceiptNo") or "").strip()
            vat_included = bool(rec.get("vatIncluded")) if "vatIncluded" in rec else (regime == "vat_18" and bool(ebm_no))

            if vat_included and regime == "vat_18":
                net_amt, vat_amt, gross_amt = _compute_vat_split(amount, "vat_18", "inclusive", "standard")
                is_claimable = bool(supplier_tin and ebm_no)
                if is_claimable:
                    claimable_input_vat += vat_amt
                else:
                    non_claimable_input_vat += vat_amt
                    if not supplier_tin:
                        missing_supplier_tin_count += 1
                    if not ebm_no:
                        missing_ebm_purchase_count += 1
            else:
                net_amt, vat_amt, gross_amt = round(amount, 2), 0.0, round(amount, 2)
                is_claimable = False

            cat_lower = str(rec.get("category") or rec.get("title") or "").lower()
            if any(k in cat_lower for k in ("consult", "service", "rent", "commission", "professional", "legal")):
                wht_15_base += gross_amt

            purchases_rows.append(
                {
                    "id": str(rec.get("id") or rec.get("_id") or ""),
                    "date": rec_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "type": "Purchase" if bucket in PURCHASE_BUCKETS else "Expense",
                    "reference": str(rec.get("reference") or rec.get("invoiceNumber") or rec.get("id") or "")[:32],
                    "supplierName": str(rec.get("supplierName") or rec.get("supplier") or rec.get("title") or "Supplier"),
                    "supplierTin": supplier_tin,
                    "ebmNumber": ebm_no,
                    "vatIncluded": vat_included,
                    "claimable": is_claimable,
                    "netAmount": net_amt,
                    "vatAmount": vat_amt,
                    "totalAmount": gross_amt,
                    "branchId": str(rec.get("branchId") or "hq"),
                }
            )

    net_vat_payable = round(output_vat_total - claimable_input_vat, 2)
    turnover_tax_3 = round(total_gross_sales * 0.03, 2)
    estimated_wht_15 = round(wht_15_base * 0.15, 2)
    net_operating_profit = round(total_gross_sales - total_purchases_expenses, 2)

    warnings = []
    if not profile.get("rraEnabled"):
        warnings.append(
            {
                "severity": "info",
                "code": "RRA_OPTED_OUT",
                "message": "RRA Tax Tracking is currently turned OFF for this business. Turn it ON whenever you are ready to track TIN, VAT, and EBM receipts.",
            }
        )
    else:
        tin = str(profile.get("tin") or "").strip()
        if not re.match(r"^\d{9}$", tin):
            warnings.append(
                {
                    "severity": "warning",
                    "code": "MISSING_TIN",
                    "message": "Your 9-digit RRA Business TIN is missing or incomplete in Tax Settings.",
                }
            )
        if missing_supplier_tin_count > 0:
            warnings.append(
                {
                    "severity": "warning",
                    "code": "MISSING_SUPPLIER_TIN",
                    "message": f"{missing_supplier_tin_count} VAT-tagged purchase/expense record(s) are missing a Supplier TIN and cannot be claimed as Input VAT.",
                }
            )
        if missing_ebm_purchase_count > 0:
            warnings.append(
                {
                    "severity": "warning",
                    "code": "MISSING_EBM_PURCHASE",
                    "message": f"{missing_ebm_purchase_count} VAT-tagged purchase/expense record(s) are missing an RRA EBM Receipt #.",
                }
            )
        if high_value_sales_no_ebm > 0:
            warnings.append(
                {
                    "severity": "info",
                    "code": "SALES_MISSING_EBM",
                    "message": f"{high_value_sales_no_ebm} sale(s) above 50,000 RWF have no EBM reference number recorded yet.",
                }
            )
        if not warnings:
            warnings.append(
                {
                    "severity": "ok",
                    "code": "READY",
                    "message": "All checks passed! Your records for this period are clean and ready for RRA declaration.",
                }
            )

    sales_rows.sort(key=lambda r: r["date"], reverse=True)
    purchases_rows.sort(key=lambda r: r["date"], reverse=True)

    return {
        "profile": profile,
        "period": {"startDate": start_date, "endDate": end_date, "branchId": branch_id or "all"},
        "deadlines": _next_rra_deadlines(),
        "totals": {
            "totalGrossSales": round(total_gross_sales, 2),
            "taxableSalesNet": round(taxable_sales_net, 2),
            "exemptSalesTotal": round(exempt_sales_total, 2),
            "outputVat": round(output_vat_total, 2),
            "claimableInputVat": round(claimable_input_vat, 2),
            "nonClaimableInputVat": round(non_claimable_input_vat, 2),
            "netVatPayable": net_vat_payable,
            "turnoverTax3Percent": turnover_tax_3,
            "estimatedWht15Percent": estimated_wht_15,
            "totalPurchasesAndExpenses": round(total_purchases_expenses, 2),
            "estimatedNetProfit": net_operating_profit,
            "salesCount": len(sales_rows),
            "purchasesCount": len(purchases_rows),
        },
        "readinessWarnings": warnings,
        "salesAnnex": sales_rows,
        "purchasesAnnex": purchases_rows,
    }


@tax_bp.get("/profile")
def get_tax_profile():
    db = get_db()
    scope, _ = _resolve_scope_and_user(db)
    return success_response(data=_get_tax_profile(db, scope))


@tax_bp.put("/profile")
def update_tax_profile():
    db = get_db()
    scope, _ = _resolve_scope_and_user(db)
    payload = request.get_json(silent=True) or {}

    current = _get_tax_profile(db, scope)
    updated = dict(current)

    if "rraEnabled" in payload:
        updated["rraEnabled"] = bool(payload["rraEnabled"])
    if "tin" in payload:
        tin_clean = re.sub(r"\D", "", str(payload.get("tin") or ""))[:9]
        updated["tin"] = tin_clean
    if "regime" in payload and payload["regime"] in ("vat_18", "turnover_3", "exempt"):
        updated["regime"] = payload["regime"]
    if "priceMode" in payload and payload["priceMode"] in ("inclusive", "exclusive"):
        updated["priceMode"] = payload["priceMode"]
    if "filingFrequency" in payload and payload["filingFrequency"] in ("monthly", "quarterly"):
        updated["filingFrequency"] = payload["filingFrequency"]
    if "trackEbmNumbers" in payload:
        updated["trackEbmNumbers"] = bool(payload["trackEbmNumbers"])
    if "showOnReceipts" in payload:
        updated["showOnReceipts"] = bool(payload["showOnReceipts"])
    if "trackWithholdingTax" in payload:
        updated["trackWithholdingTax"] = bool(payload["trackWithholdingTax"])
    if "accountantEmail" in payload:
        updated["accountantEmail"] = str(payload.get("accountantEmail") or "").strip().lower()

    now_iso = datetime.now(timezone.utc).isoformat()
    db.tax_profiles.update_one(
        {"scopeKey": scope},
        {"$set": {**updated, "scopeKey": scope, "updatedAt": now_iso}},
        upsert=True,
    )
    return success_response(data=updated, message="RRA Tax Profile saved.")


@tax_bp.get("/summary")
def get_tax_summary():
    db = get_db()
    scope, _ = _resolve_scope_and_user(db)
    profile = _get_tax_profile(db, scope)

    today = datetime.now(timezone.utc).date()
    default_start = today.replace(day=1).isoformat()
    default_end = today.isoformat()

    start_date = _parse_date(request.args.get("startDate")) or default_start
    end_date = _parse_date(request.args.get("endDate")) or default_end
    branch_id = str(request.args.get("branchId") or "").strip()

    ledger = _collect_tax_ledger(db, scope, profile, start_date, end_date, branch_id)
    return success_response(data=ledger)


@tax_bp.get("/export/<export_type>")
def export_tax_csv(export_type: str):
    db = get_db()
    scope, user_doc = _resolve_scope_and_user(db)

    allowed, denial = check_entitlement(db, scope, "allowRraTaxPack", user_doc)
    if not allowed:
        return error_response(
            error=denial.get("message", "Upgrade your plan to export RRA Tax Packs."),
            details=[denial],
            status_code=402,
        )

    profile = _get_tax_profile(db, scope)
    today = datetime.now(timezone.utc).date()
    start_date = _parse_date(request.args.get("startDate")) or today.replace(day=1).isoformat()
    end_date = _parse_date(request.args.get("endDate")) or today.isoformat()
    branch_id = str(request.args.get("branchId") or "").strip()

    ledger = _collect_tax_ledger(db, scope, profile, start_date, end_date, branch_id)

    buf = io.StringIO()
    # UTF-8 BOM for seamless Microsoft Excel opening in Rwanda
    buf.write("\ufeff")
    writer = csv.writer(buf)

    if export_type == "sales-annex":
        writer.writerow([
            "Invoice Date",
            "Receipt / Invoice #",
            "EBM #",
            "Customer Name",
            "Customer TIN",
            "Item / Description",
            "Tax Category",
            "Taxable Amount (RWF)",
            "VAT 18% (RWF)",
            "Total Amount (RWF)",
            "Payment Method",
        ])
        for row in ledger["salesAnnex"]:
            writer.writerow([
                row["date"],
                row["reference"],
                row["ebmNumber"],
                row["customerName"],
                row["customerTin"],
                row["item"],
                row["taxCategory"],
                row["netAmount"],
                row["vatAmount"],
                row["totalAmount"],
                row["paymentMethod"],
            ])
        filename = f"rra-sales-annex-{start_date}_to_{end_date}.csv"

    elif export_type == "purchases-annex":
        writer.writerow([
            "Purchase Date",
            "Type",
            "Reference #",
            "Supplier Name",
            "Supplier TIN",
            "EBM Receipt #",
            "Net Amount (RWF)",
            "Input VAT 18% (RWF)",
            "Total Amount (RWF)",
            "RRA Claimable",
        ])
        for row in ledger["purchasesAnnex"]:
            writer.writerow([
                row["date"],
                row["type"],
                row["reference"],
                row["supplierName"],
                row["supplierTin"],
                row["ebmNumber"],
                row["netAmount"],
                row["vatAmount"],
                row["totalAmount"],
                "YES" if row["claimable"] else "NO",
            ])
        filename = f"rra-purchases-annex-{start_date}_to_{end_date}.csv"

    elif export_type == "summary-csv":
        t = ledger["totals"]
        writer.writerow(["ExBOS RRA Tax-Ready Summary", f"{start_date} to {end_date}"])
        writer.writerow(["Business TIN", profile.get("tin") or "Not Set"])
        writer.writerow(["Tax Regime", profile.get("regime")])
        writer.writerow([])
        writer.writerow(["Metric", "Amount (RWF)"])
        writer.writerow(["Total Gross Sales", t["totalGrossSales"]])
        writer.writerow(["Taxable Sales (Net)", t["taxableSalesNet"]])
        writer.writerow(["Exempt / Zero-Rated Sales", t["exemptSalesTotal"]])
        writer.writerow(["Output VAT (18%)", t["outputVat"]])
        writer.writerow(["Claimable Input VAT (with TIN & EBM)", t["claimableInputVat"]])
        writer.writerow(["Non-Claimable Input VAT (Missing TIN/EBM)", t["nonClaimableInputVat"]])
        writer.writerow(["Net VAT Payable / (Credit)", t["netVatPayable"]])
        writer.writerow(["Estimated 3% Turnover Tax (Small Taxpayer)", t["turnoverTax3Percent"]])
        writer.writerow(["Estimated 15% Withholding Tax Base", t["estimatedWht15Percent"]])
        writer.writerow(["Total Purchases & Operating Expenses", t["totalPurchasesAndExpenses"]])
        writer.writerow(["Estimated Net Operating Profit", t["estimatedNetProfit"]])
        filename = f"rra-tax-summary-{start_date}_to_{end_date}.csv"
    else:
        return error_response(error="Unsupported export type.", status_code=400)

    return Response(
        buf.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@tax_bp.post("/send-to-accountant")
def send_tax_pack_to_accountant():
    db = get_db()
    scope, user_doc = _resolve_scope_and_user(db)

    allowed, denial = check_entitlement(db, scope, "allowRraTaxPack", user_doc)
    if not allowed:
        return error_response(
            error=denial.get("message", "Upgrade your plan to email RRA Tax Packs."),
            details=[denial],
            status_code=402,
        )

    payload = request.get_json(silent=True) or {}
    profile = _get_tax_profile(db, scope)
    recipient = str(payload.get("recipientEmail") or profile.get("accountantEmail") or "").strip().lower()
    if not recipient or "@" not in recipient:
        return error_response(error="Please enter a valid Accountant Email address.", status_code=400)

    today = datetime.now(timezone.utc).date()
    start_date = _parse_date(payload.get("startDate")) or today.replace(day=1).isoformat()
    end_date = _parse_date(payload.get("endDate")) or today.isoformat()
    branch_id = str(payload.get("branchId") or "").strip()

    ledger = _collect_tax_ledger(db, scope, profile, start_date, end_date, branch_id)
    t = ledger["totals"]
    biz_name = (user_doc or {}).get("businessName") or "ExBOS Business"
    tin = profile.get("tin") or "Not Set"

    from app.utils.email_templates import render_exbos_email

    subject = f"RRA Tax-Ready Pack ({start_date} to {end_date}) — {biz_name}"
    html_body = render_exbos_email(
        category="RRA Tax Summary",
        title=f"RRA Tax-Ready Summary ({start_date} to {end_date})",
        intro_html=f"Below is the automated RRA tax preparation summary generated from live ExBOS ledgers for <strong>{biz_name}</strong> (TIN: <strong>{tin}</strong>, Regime: <strong>{profile.get('regime')}</strong>).",
        details=[
            ("Reporting Period", f"{start_date} to {end_date}"),
            ("Total Gross Sales", f"{t['totalGrossSales']:,.0f} RWF"),
            ("Output VAT (18%)", f"{t['outputVat']:,.0f} RWF"),
            ("Claimable Input VAT", f"{t['claimableInputVat']:,.0f} RWF"),
            ("Net VAT Payable / (Credit)", f"<span style='color:#059669;'>{t['netVatPayable']:,.0f} RWF</span>"),
            ("Est. 3% Turnover Tax", f"{t['turnoverTax3Percent']:,.0f} RWF"),
            ("Estimated Net Profit", f"{t['estimatedNetProfit']:,.0f} RWF"),
        ],
        primary_cta=("Open RRA Tax Center", "https://exbos.pages.dev/dashboard"),
        footer_note="Sign in to ExBOS to download the itemized RRA Sales & Purchases Annex CSV files.",
    )

    from app.utils.mailer import send_email

    sent_ok = False
    try:
        sent_ok = bool(send_email(recipient, subject, html_body))
    except Exception:
        sent_ok = False

    if not sent_ok:
        db.email_outbox.insert_one(
            {
                "to": recipient,
                "subject": subject,
                "html": html_body,
                "status": "pending",
                "createdAt": datetime.now(timezone.utc).isoformat(),
            }
        )

    return success_response(
        data={"recipient": recipient, "queued": not sent_ok, "sent": sent_ok},
        message=f"RRA Tax Summary sent to {recipient}.",
    )

