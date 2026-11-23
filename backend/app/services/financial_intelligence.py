"""
Centralized Financial Calculation & Intelligent Purchasing Engine for ExBOS.

Provides deterministic accounting reconciliation across all 6 business architectures:
- Total sales revenue vs. actual payments received vs. outstanding customer debts
- Operating expenses vs. Cost of Goods Sold (COGS) vs. Gross Profit vs. Net Profit
- Reconciled liquid balances by channel (Cash in Hand, Mobile Money, Bank)
- Outstanding supplier debts vs. open Purchase Order commitments
- Reserved operational funds & Available Purchasing Budget
- Intelligent purchase affordability, stock velocity, open PO duplicate detection,
  supplier price comparison, and actionable recommendations (including side money / capital top-up).
"""

from __future__ import annotations
import math
from datetime import datetime, timezone
from typing import Any


INFLOW_SALES_BUCKETS = (
    "Sales",
    "Jobs",
    "ServiceJobs",
    "KitchenOrders",
    "GuestFolios",
    "MixedSales",
)

STOCK_CATALOG_BUCKETS = (
    "Inventory",
    "Products",
    "RawMaterials",
    "Consumables",
    "Ingredients",
    "HybridItems",
    "Feeds",
)

OPEN_PO_DELIVERY_STATUSES = {
    "ordered",
    "pending delivery",
    "in transit",
    "committed",
    "purchase order",
    "po",
    "partially received",
}


def _num(val: Any, default: float = 0.0) -> float:
    if val is None or val == "":
        return default
    try:
        v = float(val)
        return v if math.isfinite(v) else default
    except (TypeError, ValueError):
        return default


def _classify_channel(account_or_method: Any) -> str:
    """Classify an account/paymentMethod string into 'momo', 'bank', 'credit', or 'cash'."""
    s = str(account_or_method or "").strip().lower()
    if any(k in s for k in ("credit", "unpaid", "pay later", "debt", "account payable")):
        return "credit"
    if any(k in s for k in ("momo", "mtn", "airtel", "mobile money")):
        return "momo"
    if any(k in s for k in ("bank", "bk", "equity", "bpr", "i&m", "cogebanque", "cheque", "transfer", "card")):
        return "bank"
    return "cash"


def _is_credit_status(status: Any, payment_status: Any = None) -> bool:
    combined = f"{status or ''} {payment_status or ''}".strip().lower()
    if "part-paid" in combined or "partial" in combined:
        return False
    if "paid in full" in combined:
        return False
    return any(k in combined for k in ("unpaid", "credit", "owed", "pending", "overdue"))


def _is_partial_status(status: Any, payment_status: Any = None) -> bool:
    combined = f"{status or ''} {payment_status or ''}".strip().lower()
    return "part-paid" in combined or "partial" in combined


def _extract_record_total(rec: dict) -> float:
    for k in (
        "totalAmountRWF",
        "amountRWF",
        "totalFolioRWF",
        "totalValueRWF",
        "total",
        "amount",
    ):
        v = _num(rec.get(k), -1.0)
        if v >= 0:
            return v
    qty = _num(rec.get("quantity"), 0.0)
    unit_p = _num(rec.get("unitPriceRWF") or rec.get("sellingPriceRWF") or rec.get("purchasePriceRWF"), 0.0)
    if qty > 0 and unit_p > 0:
        return qty * unit_p
    return 0.0


def _extract_sale_paid_and_remaining(sale: dict) -> tuple[float, float, float]:
    """Return (total_amount, paid_amount, remaining_debt) for a sale record."""
    total = _extract_record_total(sale)
    status = sale.get("status")
    pay_status = sale.get("paymentStatus")
    pay_method = sale.get("paymentMethod") or sale.get("account")

    explicit_paid = sale.get("paidAmountRWF")
    if explicit_paid is None:
        explicit_paid = sale.get("amountPaidRWF")
    if explicit_paid is None:
        explicit_paid = sale.get("paidRWF")

    explicit_rem = sale.get("remainingAmountRWF")
    if explicit_rem is None:
        explicit_rem = sale.get("balanceOwedRWF")
    if explicit_rem is None:
        explicit_rem = sale.get("balanceRWF")

    if explicit_paid is not None and explicit_paid != "":
        paid = min(total, max(0.0, _num(explicit_paid)))
        rem = max(0.0, _num(explicit_rem, total - paid))
        return total, paid, rem

    if _is_credit_status(status, pay_status) or _classify_channel(pay_method) == "credit":
        rem = _num(explicit_rem, total)
        paid = max(0.0, total - rem)
        return total, paid, rem

    if _is_partial_status(status, pay_status):
        rem = _num(explicit_rem, total * 0.5)
        paid = max(0.0, total - rem)
        return total, paid, rem

    return total, total, 0.0


def _extract_purchase_financials(purch: dict) -> dict:
    """
    Return normalized purchase details:
    total, paid, remaining, is_open_po, delivery_status, ordered_qty, received_qty, channel.
    """
    subtotal = _extract_record_total(purch)
    tax_rwf = _num(purch.get("taxAmountRWF"), 0.0)
    extra_rwf = _num(purch.get("additionalChargesRWF") or purch.get("shippingCostRWF"), 0.0)
    # If totalAmountRWF already includes tax/extra, don't double-add when explicit subtotal is present
    if purch.get("subtotalRWF") is not None:
        total = _num(purch.get("subtotalRWF")) + tax_rwf + extra_rwf
    else:
        total = subtotal

    status = purch.get("status")
    pay_status = purch.get("paymentStatus")
    pay_method = purch.get("paymentMethod") or purch.get("account")
    channel = _classify_channel(pay_method)

    explicit_paid = purch.get("paidAmountRWF")
    if explicit_paid is None:
        explicit_paid = purch.get("amountPaidRWF")
    if explicit_paid is None:
        explicit_paid = purch.get("paidRWF")

    explicit_rem = purch.get("remainingAmountRWF")
    if explicit_rem is None:
        explicit_rem = purch.get("balanceRWF")
    if explicit_rem is None:
        explicit_rem = purch.get("balanceOwedRWF")

    if explicit_paid is not None and explicit_paid != "":
        paid = min(total, max(0.0, _num(explicit_paid)))
        rem = max(0.0, _num(explicit_rem, total - paid))
    elif _is_credit_status(status, pay_status) or channel == "credit":
        paid = 0.0
        rem = total
    elif _is_partial_status(status, pay_status):
        rem = _num(explicit_rem, total * 0.5)
        paid = max(0.0, total - rem)
    else:
        paid = total
        rem = 0.0

    ordered_qty = _num(purch.get("orderedQuantity") or purch.get("quantity"), 0.0)
    delivery_raw = str(purch.get("deliveryStatus") or "").strip()
    auto_restock = purch.get("autoRestock")

    if delivery_raw:
        deliv_lower = delivery_raw.lower()
    elif auto_restock is False:
        deliv_lower = "ordered"
        delivery_raw = "Ordered"
    else:
        deliv_lower = "received"
        delivery_raw = "Received"

    if purch.get("receivedQuantity") is not None:
        received_qty = max(0.0, _num(purch.get("receivedQuantity")))
    elif deliv_lower in ("ordered", "pending delivery", "in transit", "committed", "purchase order", "po"):
        received_qty = 0.0
    else:
        received_qty = ordered_qty

    pending_qty = max(0.0, ordered_qty - received_qty)
    is_open_po = deliv_lower in OPEN_PO_DELIVERY_STATUSES and pending_qty > 0

    return {
        "total": total,
        "paid": paid,
        "remaining": rem,
        "deliveryStatus": delivery_raw,
        "isOpenPo": is_open_po,
        "orderedQty": ordered_qty,
        "receivedQty": received_qty,
        "pendingQty": pending_qty,
        "channel": "cash" if channel == "credit" else channel,
        "isReturn": bool(purch.get("isReturn")),
    }


def calculate_financial_intelligence(
    workspace: dict | None = None,
    transactions: list[dict] | None = None,
    arch_id: str = "buy-and-sell",
) -> dict:
    """
    Calculate the complete reconciled financial position for a business workspace.
    Never confuses sales revenue, profit, and available cash.
    Never treats unpaid customer invoices as available cash.
    """
    ws = workspace or {}
    records = ws.get("records") if isinstance(ws.get("records"), dict) else {}
    tx_list = [
        t
        for t in (transactions or [])
        if isinstance(t, dict) and (t.get("architectureId") or "buy-and-sell") == arch_id
    ]

    # Build catalog lookup for COGS & stock valuation
    catalog_items: list[dict] = []
    seen_prod_ids: set[str] = set()
    product_cost_by_id: dict[str, float] = {}
    product_cost_by_title: dict[str, float] = {}

    for bucket in STOCK_CATALOG_BUCKETS:
        for item in records.get(bucket, []) or []:
            if not isinstance(item, dict):
                continue
            pid = str(item.get("id") or "").strip()
            ptitle = str(item.get("title") or item.get("name") or item.get("feedName") or "").strip().lower()
            unit_cost = _num(
                item.get("purchasePriceRWF")
                or item.get("unitCostRWF")
                or item.get("costPerUnitRWF")
                or item.get("unitCost")
                or 0.0
            )
            if pid and unit_cost > 0:
                product_cost_by_id[pid] = unit_cost
            if ptitle and unit_cost > 0:
                product_cost_by_title[ptitle] = unit_cost
            dedup_key = pid or ptitle
            if dedup_key and dedup_key not in seen_prod_ids:
                seen_prod_ids.add(dedup_key)
                catalog_items.append(item)

    # 1. Sales Revenue, Actual Payments Received, Customer Debts & COGS
    sales_records: list[dict] = []
    sale_ids: set[str] = set()
    for s_bucket in INFLOW_SALES_BUCKETS:
        for s in records.get(s_bucket, []) or []:
            if isinstance(s, dict):
                sales_records.append(s)
                if s.get("id"):
                    sale_ids.add(str(s["id"]))

    total_sales_revenue = 0.0
    actual_payments_received = 0.0
    sales_unpaid_receivables = 0.0
    cogs_rwf = 0.0

    channel_flows = {
        "cash": {"in": 0.0, "out": 0.0},
        "momo": {"in": 0.0, "out": 0.0},
        "bank": {"in": 0.0, "out": 0.0},
    }

    for sale in sales_records:
        s_total, s_paid, s_rem = _extract_sale_paid_and_remaining(sale)
        total_sales_revenue += s_total
        actual_payments_received += s_paid
        sales_unpaid_receivables += s_rem

        ch = _classify_channel(sale.get("paymentMethod") or sale.get("account"))
        eff_ch = "momo" if ch == "credit" else ch
        channel_flows[eff_ch]["in"] += s_paid

        # COGS calculation for this sale
        explicit_cogs = _num(sale.get("costOfGoodsRWF") or sale.get("cogsRWF"), -1.0)
        if explicit_cogs >= 0:
            cogs_rwf += explicit_cogs
        elif sale.get("profitRWF") is not None:
            cogs_rwf += max(0.0, s_total - _num(sale.get("profitRWF")))
        else:
            s_pid = str(sale.get("productId") or "").strip()
            s_ptitle = str(sale.get("productTitle") or sale.get("title") or "").strip().lower()
            s_qty = _num(sale.get("quantity"), 1.0)
            unit_c = product_cost_by_id.get(s_pid) or product_cost_by_title.get(s_ptitle) or 0.0
            if unit_c > 0 and s_qty > 0:
                cogs_rwf += min(s_total, s_qty * unit_c)
            elif _num(sale.get("unitCostRWF"), 0.0) > 0:
                cogs_rwf += min(s_total, s_qty * _num(sale.get("unitCostRWF")))

    # 2. Purchases, Paid Purchases Outflow, Supplier Payables & Open PO Commitments
    purchases_records = [p for p in (records.get("Purchases", []) or []) if isinstance(p, dict)]
    purchase_ids = {str(p.get("id")) for p in purchases_records if p.get("id")}

    total_purchases_value = 0.0
    paid_purchases_outflow = 0.0
    unpaid_received_purchases = 0.0
    purchase_commitments = 0.0
    open_po_count = 0

    for purch in purchases_records:
        pf = _extract_purchase_financials(purch)
        if pf["isReturn"]:
            continue
        total_purchases_value += pf["total"]
        paid_purchases_outflow += pf["paid"]
        channel_flows[pf["channel"]]["out"] += pf["paid"]

        if pf["isOpenPo"]:
            # Open PO commitment: remaining unpaid balance on an unreceived/partially-received PO
            purchase_commitments += pf["remaining"]
            open_po_count += 1
        else:
            unpaid_received_purchases += pf["remaining"]

    # 3. Operating Expenses
    expenses_records = [e for e in (records.get("Expenses", []) or []) if isinstance(e, dict)]
    expense_ids = {str(e.get("id")) for e in expenses_records if e.get("id")}

    operating_expenses = 0.0
    paid_expenses_outflow = 0.0
    unpaid_scheduled_expenses = 0.0

    for exp in expenses_records:
        e_total = _extract_record_total(exp)
        operating_expenses += e_total
        if _is_credit_status(exp.get("status"), exp.get("paymentStatus")):
            unpaid_scheduled_expenses += e_total
        else:
            paid_expenses_outflow += e_total
            ch = _classify_channel(exp.get("paymentMethod") or exp.get("account"))
            eff_ch = "cash" if ch == "credit" else ch
            channel_flows[eff_ch]["out"] += e_total

    # 4. Standalone Transactions (Opening balances, direct collections, side-money top-ups, settlements)
    standalone_in_total = 0.0
    standalone_out_total = 0.0
    capital_injections_rwf = 0.0

    for tx in tx_list:
        tx_id = str(tx.get("id") or "")
        rec_id = str(tx.get("recordId") or "")
        if tx_id.startswith("TX-") and not rec_id:
            rec_id = tx_id[3:]

        tx_type = str(tx.get("type") or "").strip().lower()
        is_in = tx_type in ("in", "inflow")
        is_out = tx_type in ("out", "outflow")
        amt = _num(tx.get("amountRWF") or tx.get("amount"), 0.0)
        if amt <= 0:
            continue

        # Skip auto-mirrored transactions for records already counted above
        if rec_id and (rec_id in sale_ids or rec_id in purchase_ids or rec_id in expense_ids):
            # Exception: if this transaction is an explicit side-money / capital injection or standalone collection
            if not tx.get("isCapitalInjection") and not tx.get("isCustomerCollection"):
                continue

        src_mod = str(tx.get("sourceModule") or "")
        cat_str = str(tx.get("category") or "")
        if not tx.get("isCapitalInjection") and not tx.get("isCustomerCollection") and not tx.get("isSettlement"):
            if src_mod in ("Sales", "Purchases", "Expenses"):
                continue
            if tx.get("source") == "Live Dashboard" and any(
                cat_str.startswith(p) for p in ("Sales (", "Purchases (", "Expenses (")
            ):
                continue

        ch = _classify_channel(tx.get("account") or tx.get("paymentMethod") or tx.get("channel"))
        eff_ch = "cash" if ch == "credit" else ch

        if is_in:
            channel_flows[eff_ch]["in"] += amt
            if tx.get("isCapitalInjection") or "capital" in cat_str.lower() or "side money" in cat_str.lower() or "top-up" in cat_str.lower() or "opening" in cat_str.lower():
                capital_injections_rwf += amt
            elif tx.get("isCustomerCollection") or "receivable" in cat_str.lower() or "debt collection" in cat_str.lower():
                actual_payments_received += amt
                sales_unpaid_receivables = max(0.0, sales_unpaid_receivables - amt)
            else:
                standalone_in_total += amt
                total_sales_revenue += amt
                actual_payments_received += amt
        elif is_out:
            # If it's a supplier payment settlement for an existing purchase record whose paidAmountRWF was already updated,
            # do not double-subtract from channel_flows!
            if tx.get("isSettlement") and rec_id and rec_id in purchase_ids:
                continue
            channel_flows[eff_ch]["out"] += amt
            if "payable" in cat_str.lower() or "supplier payment" in str(tx.get("title") or "").lower():
                if not rec_id or rec_id not in purchase_ids:
                    paid_purchases_outflow += amt
                    unpaid_received_purchases = max(0.0, unpaid_received_purchases - amt)
            else:
                standalone_out_total += amt
                operating_expenses += amt
                paid_expenses_outflow += amt

    # 5. Customer & Supplier Ledger Reconciliation
    customers_list = [c for c in (records.get("Customers", []) or []) if isinstance(c, dict)]
    customer_ledger_debt = sum(
        _num(c.get("balanceOwedRWF") if c.get("balanceOwedRWF") is not None else (c.get("amountRWF") or c.get("debt")), 0.0)
        for c in customers_list
    )
    outstanding_customer_debts = max(sales_unpaid_receivables, customer_ledger_debt)

    suppliers_list = [s for s in (records.get("Suppliers", []) or []) if isinstance(s, dict)]
    supplier_ledger_debt = sum(
        _num(s.get("balanceOwedRWF") if s.get("balanceOwedRWF") is not None else (s.get("amountRWF") or s.get("debt")), 0.0)
        for s in suppliers_list
    )
    outstanding_supplier_debts = max(unpaid_received_purchases, supplier_ledger_debt)

    # 6. Stock Value on Shelf
    stock_value_rwf = 0.0
    for item in catalog_items:
        q = _num(item.get("currentStock") if item.get("currentStock") is not None else (item.get("stock") if item.get("stock") is not None else (item.get("quantityKg") if item.get("quantityKg") is not None else item.get("quantity"))), 0.0)
        c = _num(
            item.get("costPerUnitRWF")
            or item.get("unitCost")
            or item.get("purchasePriceRWF")
            or item.get("unitCostRWF")
            or item.get("sellingPriceRWF"),
            0.0,
        )
        if q > 0 and c > 0:
            stock_value_rwf += q * c

    # 7. Reconcile Cash, Mobile Money & Bank Balances
    opening_cash = _num(ws.get("openingCashRWF"), 0.0)
    opening_momo = _num(ws.get("openingMomoRWF"), 0.0)
    opening_bank = _num(ws.get("openingBankRWF"), 0.0)

    raw_cash = opening_cash + channel_flows["cash"]["in"] - channel_flows["cash"]["out"]
    raw_momo = opening_momo + channel_flows["momo"]["in"] - channel_flows["momo"]["out"]
    raw_bank = opening_bank + channel_flows["bank"]["in"] - channel_flows["bank"]["out"]

    # Net liquid cash flow across all business operations
    reconciled_total_liquid = max(
        0.0,
        (opening_cash + opening_momo + opening_bank)
        + actual_payments_received
        + capital_injections_rwf
        - paid_purchases_outflow
        - paid_expenses_outflow,
    )

    # Normalize channel balances so inter-channel timing never hides available pool while preserving per-channel clarity
    positive_channels_sum = max(0.0, raw_cash) + max(0.0, raw_momo) + max(0.0, raw_bank)
    if positive_channels_sum > 0 and reconciled_total_liquid > 0:
        scale = reconciled_total_liquid / positive_channels_sum
        cash_in_hand = round(max(0.0, raw_cash) * scale)
        mobile_money_balance = round(max(0.0, raw_momo) * scale)
        bank_balance = max(0.0, round(reconciled_total_liquid) - cash_in_hand - mobile_money_balance)
    else:
        cash_in_hand = max(0.0, round(raw_cash))
        mobile_money_balance = max(0.0, round(raw_momo))
        bank_balance = max(0.0, round(raw_bank))

    available_business_cash = float(cash_in_hand + mobile_money_balance + bank_balance)

    # 8. Gross Profit & Net Profit
    gross_profit = total_sales_revenue - cogs_rwf
    net_profit = gross_profit - operating_expenses

    # 9. Reserved Operational Funds & Available Purchasing Budget
    explicit_reserve = ws.get("reservedOperationalFundsRWF")
    if explicit_reserve is not None and _num(explicit_reserve, -1.0) >= 0:
        reserved_operational_funds = _num(explicit_reserve)
    else:
        # Default: 15% of recorded operating expenses + any unpaid scheduled expenses
        reserved_operational_funds = round(operating_expenses * 0.15) + unpaid_scheduled_expenses

    other_approved_reservations = _num(ws.get("otherCashReservationsRWF"), 0.0)

    available_purchasing_budget = max(
        0.0,
        available_business_cash
        - reserved_operational_funds
        - purchase_commitments
        - other_approved_reservations,
    )

    return {
        "architectureId": arch_id,
        "totalSalesRevenueRWF": round(total_sales_revenue),
        "actualPaymentsReceivedRWF": round(actual_payments_received),
        "outstandingCustomerDebtsRWF": round(outstanding_customer_debts),
        "operatingExpensesRWF": round(operating_expenses),
        "costOfGoodsSoldRWF": round(cogs_rwf),
        "grossProfitRWF": round(gross_profit),
        "netProfitRWF": round(net_profit),
        "cashInHandRWF": round(cash_in_hand),
        "mobileMoneyBalanceRWF": round(mobile_money_balance),
        "bankBalanceRWF": round(bank_balance),
        "availableBusinessCashRWF": round(available_business_cash),
        "capitalInjectionsRWF": round(capital_injections_rwf),
        "outstandingSupplierDebtsRWF": round(outstanding_supplier_debts),
        "purchaseCommitmentsRWF": round(purchase_commitments),
        "openPurchaseOrdersCount": open_po_count,
        "reservedOperationalFundsRWF": round(reserved_operational_funds),
        "otherCashReservationsRWF": round(other_approved_reservations),
        "availablePurchasingBudgetRWF": round(available_purchasing_budget),
        "totalPurchasesRWF": round(total_purchases_value),
        "paidPurchasesOutflowRWF": round(paid_purchases_outflow),
        "stockValueRWF": round(stock_value_rwf),
    }


def assess_purchase_decision(
    draft_purchase: dict,
    workspace: dict | None = None,
    transactions: list[dict] | None = None,
    arch_id: str = "buy-and-sell",
) -> dict:
    """
    Evaluate a draft or edited purchase against:
    1. Existing product stock, reorder threshold, historical sales velocity & days of stock coverage.
    2. Open Purchase Orders / in-transit deliveries (preventing duplicate ordering).
    3. Historical supplier prices & lower-price supplier alternatives.
    4. Business financial position, reserved operational funds, existing commitments,
       available purchasing budget, channel balance, and side-money / external funding options.
    """
    ws = workspace or {}
    records = ws.get("records") if isinstance(ws.get("records"), dict) else {}
    fin = calculate_financial_intelligence(ws, transactions, arch_id)

    prod_id = str(draft_purchase.get("productId") or draft_purchase.get("materialId") or "").strip()
    prod_title = str(
        draft_purchase.get("productTitle")
        or draft_purchase.get("materialName")
        or draft_purchase.get("title")
        or ""
    ).strip()
    prod_title_lower = prod_title.lower()

    qty = max(0.0, _num(draft_purchase.get("quantity"), 0.0))
    unit_price = max(0.0, _num(draft_purchase.get("unitPriceRWF") or draft_purchase.get("purchasePriceRWF"), 0.0))
    tax_rwf = max(0.0, _num(draft_purchase.get("taxAmountRWF"), 0.0))
    extra_charges_rwf = max(0.0, _num(draft_purchase.get("additionalChargesRWF"), 0.0))
    side_money_added_rwf = max(0.0, _num(draft_purchase.get("sideMoneyAddedRWF"), 0.0))

    subtotal_rwf = round(qty * unit_price)
    total_purchase_cost_rwf = round(subtotal_rwf + tax_rwf + extra_charges_rwf)

    payment_status = str(draft_purchase.get("paymentStatus") or "Paid in Full").strip()
    payment_method = str(draft_purchase.get("paymentMethod") or "MTN MoMo Business").strip()
    delivery_status = str(draft_purchase.get("deliveryStatus") or "Received").strip()
    supplier_name = str(draft_purchase.get("supplierName") or draft_purchase.get("supplier") or "").strip()

    channel = _classify_channel(payment_method)
    if _is_credit_status(payment_status, payment_status) or channel == "credit":
        immediate_cash_outlay_rwf = 0.0
    elif _is_partial_status(payment_status, payment_status):
        immediate_cash_outlay_rwf = min(
            total_purchase_cost_rwf,
            max(0.0, _num(draft_purchase.get("paidAmountRWF") or draft_purchase.get("amountPaidRWF"), 0.0)),
        )
    else:
        immediate_cash_outlay_rwf = float(total_purchase_cost_rwf)

    supplier_credit_created_rwf = max(0.0, total_purchase_cost_rwf - immediate_cash_outlay_rwf)

    # 1. Identify Product in Catalog
    matched_product = None
    for bucket in STOCK_CATALOG_BUCKETS:
        for item in records.get(bucket, []) or []:
            if not isinstance(item, dict):
                continue
            iid = str(item.get("id") or "").strip()
            ititle = str(item.get("title") or item.get("name") or item.get("feedName") or "").strip().lower()
            if (prod_id and iid == prod_id) or (prod_title_lower and ititle == prod_title_lower):
                matched_product = item
                break
        if matched_product:
            break

    product_exists = matched_product is not None
    current_stock = (
        _num(
            matched_product.get("currentStock")
            if matched_product.get("currentStock") is not None
            else (
                matched_product.get("stock")
                if matched_product.get("stock") is not None
                else (
                    matched_product.get("quantityKg")
                    if matched_product.get("quantityKg") is not None
                    else matched_product.get("quantity")
                )
            ),
            0.0,
        )
        if matched_product
        else 0.0
    )
    reorder_level = (
        _num(
            matched_product.get("lowStockAlert")
            if matched_product.get("lowStockAlert") is not None
            else (matched_product.get("minStock") or matched_product.get("reorderLevel") or 5),
            5.0,
        )
        if matched_product
        else 5.0
    )
    last_catalog_price = (
        _num(
            matched_product.get("purchasePriceRWF")
            or matched_product.get("unitCostRWF")
            or matched_product.get("costPerUnitRWF"),
            0.0,
        )
        if matched_product
        else 0.0
    )
    unit_label = (matched_product.get("unit") if matched_product else None) or draft_purchase.get("unit") or "units"

    # 2. Check Open Purchase Orders / In-Transit Stock & Historical Supplier Prices
    editing_id = str(draft_purchase.get("id") or "").strip()
    on_order_qty = 0.0
    open_pos_for_product: list[dict] = []
    historical_prices: list[dict] = []

    for p in records.get("Purchases", []) or []:
        if not isinstance(p, dict):
            continue
        if editing_id and str(p.get("id") or "") == editing_id:
            continue
        p_pid = str(p.get("productId") or p.get("materialId") or "").strip()
        p_title = str(p.get("productTitle") or p.get("materialName") or p.get("title") or "").strip().lower()
        matches_item = (prod_id and p_pid == prod_id) or (
            prod_title_lower and (p_title == prod_title_lower or prod_title_lower in p_title)
        )
        if not matches_item:
            continue

        pf = _extract_purchase_financials(p)
        if pf["isOpenPo"] and pf["pendingQty"] > 0:
            on_order_qty += pf["pendingQty"]
            open_pos_for_product.append(
                {
                    "id": p.get("id"),
                    "pendingQty": pf["pendingQty"],
                    "supplier": p.get("supplierName") or p.get("supplier") or "Supplier",
                    "deliveryStatus": pf["deliveryStatus"],
                }
            )

        p_unit_cost = _num(p.get("unitPriceRWF"), 0.0)
        if p_unit_cost <= 0 and pf["orderedQty"] > 0 and pf["total"] > 0:
            p_unit_cost = round(pf["total"] / pf["orderedQty"])
        p_sup = str(p.get("supplierName") or p.get("supplier") or "").strip()
        if p_unit_cost > 0:
            historical_prices.append({"supplier": p_sup or "Previous Supplier", "unitPriceRWF": p_unit_cost})

    # Also check Suppliers catalog for cheaper alternative
    cheaper_supplier = None
    best_price = unit_price if unit_price > 0 else (last_catalog_price or float("inf"))
    for hp in historical_prices:
        if 0 < hp["unitPriceRWF"] < best_price:
            if not supplier_name or hp["supplier"].lower() != supplier_name.lower():
                best_price = hp["unitPriceRWF"]
                cheaper_supplier = hp

    # 3. Historical Sales Demand & Days of Stock Coverage
    total_units_sold = 0.0
    matching_sales_count = 0
    for s_bucket in INFLOW_SALES_BUCKETS:
        for s in records.get(s_bucket, []) or []:
            if not isinstance(s, dict):
                continue
            s_pid = str(s.get("productId") or "").strip()
            s_title = str(s.get("productTitle") or s.get("title") or "").strip().lower()
            if (prod_id and s_pid == prod_id) or (
                prod_title_lower and (s_title == prod_title_lower or prod_title_lower in s_title)
            ):
                total_units_sold += max(1.0, _num(s.get("quantity"), 1.0))
                matching_sales_count += 1

    # Estimate daily demand over a 30-day window (minimum 0.5 unit/day when product has recorded sales)
    avg_daily_sales = round(total_units_sold / 30.0, 2) if total_units_sold > 0 else 0.0
    days_of_stock_coverage = (
        round(current_stock / avg_daily_sales) if avg_daily_sales > 0 else (0 if current_stock <= 0 else None)
    )
    projected_days_coverage = (
        round((current_stock + on_order_qty + qty) / avg_daily_sales) if avg_daily_sales > 0 else None
    )

    recommended_reorder_qty = max(
        reorder_level * 2,
        math.ceil(avg_daily_sales * 14) if avg_daily_sales > 0 else reorder_level * 2,
    )

    # 4. Affordability & Shortfall Calculation
    base_budget_rwf = float(fin["availablePurchasingBudgetRWF"])
    effective_budget_rwf = base_budget_rwf + side_money_added_rwf

    # Purchase shortfall against full purchase cost vs immediate cash outlay
    total_cost_shortfall_rwf = max(0.0, total_purchase_cost_rwf - effective_budget_rwf)
    immediate_cash_shortfall_rwf = max(0.0, immediate_cash_outlay_rwf - effective_budget_rwf)

    # Channel-specific balance check
    if channel == "momo":
        selected_channel_balance_rwf = float(fin["mobileMoneyBalanceRWF"]) + side_money_added_rwf
        selected_channel_label = "Mobile Money"
    elif channel == "bank":
        selected_channel_balance_rwf = float(fin["bankBalanceRWF"]) + side_money_added_rwf
        selected_channel_label = "Bank Account"
    elif channel == "credit":
        selected_channel_balance_rwf = effective_budget_rwf
        selected_channel_label = "Supplier Credit"
    else:
        selected_channel_balance_rwf = float(fin["cashInHandRWF"]) + side_money_added_rwf
        selected_channel_label = "Cash in Hand"

    remaining_budget_after_purchase_rwf = max(0.0, effective_budget_rwf - immediate_cash_outlay_rwf)
    is_affordable = immediate_cash_shortfall_rwf <= 0
    affordable_units = int(math.floor(effective_budget_rwf / unit_price)) if unit_price > 0 else 0

    # 5. Build Intelligent Recommendations
    recommendations: list[dict] = []

    if product_exists or prod_title:
        if current_stock <= 0:
            if on_order_qty > 0:
                recommendations.append(
                    {
                        "type": "warning",
                        "code": "ZERO_STOCK_WITH_OPEN_PO",
                        "message": f"You have 0 {unit_label} remaining on shelf, but you already have {int(on_order_qty) if on_order_qty.is_integer() else on_order_qty} {unit_label} on an outstanding purchase order.",
                    }
                )
            else:
                recommendations.append(
                    {
                        "type": "urgent",
                        "code": "ZERO_STOCK_REPLENISH",
                        "message": f"You have 0 {unit_label} remaining. Replenishment is recommended (suggested reorder: {int(recommended_reorder_qty)} {unit_label}).",
                    }
                )
        elif current_stock <= reorder_level:
            recommendations.append(
                {
                    "type": "warning",
                    "code": "BELOW_REORDER_LEVEL",
                    "message": f"Current stock ({int(current_stock) if current_stock.is_integer() else current_stock} {unit_label}) is at or below your reorder level ({int(reorder_level)} {unit_label}).",
                }
            )

        if days_of_stock_coverage is not None and current_stock > 0:
            recommendations.append(
                {
                    "type": "info",
                    "code": "DAYS_OF_COVERAGE",
                    "message": f"Your current stock can cover approximately {days_of_stock_coverage} days of expected sales"
                    + (f" ({projected_days_coverage} days after this purchase)." if projected_days_coverage else "."),
                }
            )

        if on_order_qty > 0:
            duplicate_covered = (current_stock + on_order_qty) >= recommended_reorder_qty
            recommendations.append(
                {
                    "type": "warning" if duplicate_covered else "info",
                    "code": "EXISTING_OPEN_PO",
                    "message": f"You already have {int(on_order_qty) if on_order_qty.is_integer() else on_order_qty} {unit_label} on an outstanding purchase order."
                    + (" Existing orders already cover your minimum stock target — avoid duplicate purchasing." if duplicate_covered else ""),
                }
            )

    if cheaper_supplier and unit_price > cheaper_supplier["unitPriceRWF"]:
        diff_per_unit = round(unit_price - cheaper_supplier["unitPriceRWF"])
        total_savings = round(diff_per_unit * qty)
        recommendations.append(
            {
                "type": "tip",
                "code": "LOWER_SUPPLIER_PRICE",
                "message": f"{cheaper_supplier['supplier']} offers a lower historical purchase price ({cheaper_supplier['unitPriceRWF']:,.0f} RWF vs {unit_price:,.0f} RWF — save {total_savings:,.0f} RWF).",
            }
        )

    if immediate_cash_shortfall_rwf > 0:
        recommendations.append(
            {
                "type": "danger",
                "code": "BUDGET_SHORTFALL",
                "message": f"This purchase exceeds your available purchasing budget by {immediate_cash_shortfall_rwf:,.0f} RWF.",
            }
        )
        if fin["availableBusinessCashRWF"] >= immediate_cash_outlay_rwf and fin["reservedOperationalFundsRWF"] > 0:
            recommendations.append(
                {
                    "type": "warning",
                    "code": "RESERVED_FUNDS_NOTICE",
                    "message": f"Your business has {fin['availableBusinessCashRWF']:,.0f} RWF total cash, but {fin['reservedOperationalFundsRWF']:,.0f} RWF is reserved for operational expenses and {fin['purchaseCommitmentsRWF']:,.0f} RWF for existing purchase commitments.",
                }
            )
    elif total_cost_shortfall_rwf > 0 and supplier_credit_created_rwf > 0:
        recommendations.append(
            {
                "type": "info",
                "code": "COVERED_BY_SUPPLIER_CREDIT",
                "message": f"Full cost exceeds cash budget by {total_cost_shortfall_rwf:,.0f} RWF, but immediate cash outlay ({immediate_cash_outlay_rwf:,.0f} RWF) fits within your budget using {supplier_credit_created_rwf:,.0f} RWF supplier credit.",
            }
        )
    elif total_purchase_cost_rwf > 0:
        recommendations.append(
            {
                "type": "success",
                "code": "AFFORDABLE_PURCHASE",
                "message": f"Affordable within your purchasing budget. Remaining purchasing budget after confirmation: {remaining_budget_after_purchase_rwf:,.0f} RWF.",
            }
        )

    if side_money_added_rwf > 0:
        recommendations.append(
            {
                "type": "success",
                "code": "SIDE_MONEY_APPLIED",
                "message": f"Includes +{side_money_added_rwf:,.0f} RWF external / owner side funds added to cover this purchase.",
            }
        )

    # Actionable alternatives when shortfall > 0
    alternatives: list[dict] = []
    if immediate_cash_shortfall_rwf > 0:
        if affordable_units > 0:
            alternatives.append(
                {
                    "action": "REDUCE_QUANTITY",
                    "label": f"Reduce quantity to {affordable_units} {unit_label} ({round(affordable_units * unit_price):,.0f} RWF)",
                    "suggestedQuantity": affordable_units,
                }
            )
        alternatives.append(
            {
                "action": "ADD_SIDE_MONEY",
                "label": f"I have other side money I can add (+{round(immediate_cash_shortfall_rwf):,.0f} RWF)",
                "suggestedSideMoneyRWF": round(immediate_cash_shortfall_rwf),
            }
        )
        if effective_budget_rwf > 0:
            alternatives.append(
                {
                    "action": "PARTIAL_CREDIT",
                    "label": f"Pay {round(effective_budget_rwf):,.0f} RWF now & put {round(total_purchase_cost_rwf - effective_budget_rwf):,.0f} RWF on Supplier Credit",
                    "suggestedPaidAmountRWF": round(effective_budget_rwf),
                }
            )
        alternatives.append(
            {
                "action": "SAVE_AS_PO",
                "label": "Save as Open Purchase Order (pay on delivery)",
                "deliveryStatus": "Ordered",
                "paymentStatus": "Unpaid (Supplier Credit / Debt)",
            }
        )

    return {
        "product": {
            "exists": product_exists,
            "productId": matched_product.get("id") if matched_product else prod_id,
            "title": (matched_product.get("title") or matched_product.get("name")) if matched_product else prod_title,
            "currentStock": current_stock,
            "reorderLevel": reorder_level,
            "recommendedReorderQty": recommended_reorder_qty,
            "lastPurchasePriceRWF": last_catalog_price,
            "onOrderQuantity": on_order_qty,
            "openPurchaseOrders": open_pos_for_product,
            "avgDailySalesUnits": avg_daily_sales,
            "daysOfStockCoverage": days_of_stock_coverage,
            "projectedDaysOfCoverage": projected_days_coverage,
            "unit": unit_label,
        },
        "pricing": {
            "quantity": qty,
            "unitPriceRWF": round(unit_price),
            "subtotalRWF": subtotal_rwf,
            "taxAmountRWF": round(tax_rwf),
            "additionalChargesRWF": round(extra_charges_rwf),
            "totalPurchaseCostRWF": total_purchase_cost_rwf,
            "immediateCashOutlayRWF": round(immediate_cash_outlay_rwf),
            "supplierCreditCreatedRWF": round(supplier_credit_created_rwf),
            "cheaperSupplierAlternative": cheaper_supplier,
        },
        "affordability": {
            "isAffordable": is_affordable,
            "availableBusinessCashRWF": fin["availableBusinessCashRWF"],
            "reservedOperationalFundsRWF": fin["reservedOperationalFundsRWF"],
            "existingPurchaseCommitmentsRWF": fin["purchaseCommitmentsRWF"],
            "baseAvailablePurchasingBudgetRWF": round(base_budget_rwf),
            "sideMoneyAddedRWF": round(side_money_added_rwf),
            "effectivePurchasingBudgetRWF": round(effective_budget_rwf),
            "purchaseShortfallRWF": round(immediate_cash_shortfall_rwf),
            "totalCostShortfallRWF": round(total_cost_shortfall_rwf),
            "remainingPurchasingBudgetRWF": round(remaining_budget_after_purchase_rwf),
            "affordableUnits": affordable_units,
            "selectedChannel": selected_channel_label,
            "selectedChannelBalanceRWF": round(selected_channel_balance_rwf),
            "deliveryStatus": delivery_status,
        },
        "financialPosition": fin,
        "recommendations": recommendations,
        "alternatives": alternatives,
    }
