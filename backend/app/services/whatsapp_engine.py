import difflib
import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Optional

from app.seed_defaults import create_empty_record_buckets, get_default_workspaces
from app.services.whatsapp_client import (
    ARCH_LABELS,
    build_welcome_message,
    normalize_phone,
    send_whatsapp_message,
)

logger = logging.getLogger(__name__)

# Architecture-aware bucket mapping (scales existing workspace buckets across all 6 architectures)
ARCH_BUCKETS = {
    "buy-and-sell": {
        "catalog": ["Products", "Inventory"],
        "primary_catalog": "Products",
        "sales": "Sales",
        "purchases": "Purchases",
        "expenses": "Expenses",
        "customers": "Customers",
        "suppliers": "Suppliers",
    },
    "make-and-sell": {
        "catalog": ["Products", "RawMaterials", "Inventory"],
        "primary_catalog": "Products",
        "sales": "Sales",
        "purchases": "Purchases",
        "expenses": "Expenses",
        "customers": "Customers",
        "suppliers": "Suppliers",
    },
    "services": {
        "catalog": ["Services"],
        "primary_catalog": "Services",
        "sales": "ServiceJobs",
        "purchases": "Purchases",
        "expenses": "Expenses",
        "customers": "Customers",
        "suppliers": "Suppliers",
    },
    "agriculture": {
        "catalog": ["Animals", "Crops", "Inventory", "Products"],
        "primary_catalog": "Products",
        "sales": "Sales",
        "purchases": "Purchases",
        "expenses": "Expenses",
        "customers": "Customers",
        "suppliers": "Suppliers",
    },
    "food-hospitality": {
        "catalog": ["MenuItems", "Ingredients", "Inventory", "Products"],
        "primary_catalog": "Products",
        "sales": "KitchenOrders",
        "purchases": "Purchases",
        "expenses": "Expenses",
        "customers": "Customers",
        "suppliers": "Suppliers",
    },
    "hybrid": {
        "catalog": ["HybridItems", "Products", "Services", "Inventory"],
        "primary_catalog": "Products",
        "sales": "MixedSales",
        "purchases": "Purchases",
        "expenses": "Expenses",
        "customers": "Customers",
        "suppliers": "Suppliers",
    },
}


def _fmt_rwf(val: Any) -> str:
    try:
        return f"{int(round(float(val or 0))):,} RWF"
    except (TypeError, ValueError):
        return "0 RWF"


def _get_or_init_workspace(db: Any, scope_key: str, arch_id: str, business_name: str = "ExBOS Business") -> dict[str, Any]:
    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id}, {"_id": 0})
    if not ws:
        base = get_default_workspaces().get(arch_id, {})
        ws = {
            **base,
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "businessName": business_name,
            "records": base.get("records") or create_empty_record_buckets(),
        }
        db.workspaces.insert_one(dict(ws))
    return ws


def _catalog_items(ws: dict[str, Any], arch_id: str) -> list[dict[str, Any]]:
    records = ws.get("records") or {}
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])["catalog"]
    seen: set[str] = set()
    items: list[dict[str, Any]] = []
    for b in buckets:
        for item in records.get(b) or []:
            item_id = str(item.get("id") or "")
            if item_id and item_id in seen:
                continue
            if item_id:
                seen.add(item_id)
            items.append({**item, "_bucket": b})
    return items


def _append_record_and_tx(
    db: Any,
    scope_key: str,
    arch_id: str,
    module_name: str,
    record: dict[str, Any],
    tx_type: Optional[str] = None,
    tx_amount: float = 0.0,
    tx_title: str = "",
    tx_category: str = "",
) -> dict[str, Any]:
    """Insert a record into workspaces.records[module_name] and sync 1 canonical transaction."""
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    today_str = now.strftime("%Y-%m-%d")
    rec_id = str(record.get("id") or f"{module_name[:3].upper()}-{int(time.time() * 1000) % 1000000}")
    entry = {
        "id": rec_id,
        "date": today_str,
        "source": "WhatsApp",
        **record,
    }

    ws = _get_or_init_workspace(db, scope_key, arch_id)
    records = ws.get("records") or {}
    bucket_list = list(records.get(module_name) or [])
    bucket_list = [entry] + [r for r in bucket_list if str(r.get("id")) != rec_id]
    records[module_name] = bucket_list

    metrics = dict(ws.get("metrics") or {})
    amt = float(entry.get("amountRWF") or entry.get("sellingPriceRWF") or 0)
    if module_name in ("Sales", "ServiceJobs", "KitchenOrders", "MixedSales", "GuestFolios") and amt > 0:
        metrics["monthlyRevenueRWF"] = float(metrics.get("monthlyRevenueRWF", 0)) + amt
        metrics["todayMoneyInRWF"] = float(metrics.get("todayMoneyInRWF", 0)) + amt
        metrics["spendableRWF"] = float(metrics.get("spendableRWF", 0)) + amt
        profit = float(entry.get("profitRWF") or round(amt * 0.35))
        metrics["netProfitRWF"] = float(metrics.get("netProfitRWF", 0)) + profit
        metrics["todayProfitRWF"] = float(metrics.get("todayProfitRWF", 0)) + profit
    elif module_name in ("Purchases", "Expenses"):
        metrics["todayCostsRWF"] = float(metrics.get("todayCostsRWF", 0)) + amt
        metrics["spendableRWF"] = max(0.0, float(metrics.get("spendableRWF", 0)) - amt)

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records, "metrics": metrics, "updated_at": now_iso}},
        upsert=True,
    )

    if tx_type and tx_amount > 0:
        tx_id = f"TX-{int(time.time() * 1000) % 10000000}"
        tx_doc = {
            "id": tx_id,
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "recordId": rec_id,
            "sourceModule": module_name,
            "title": tx_title or entry.get("title") or module_name,
            "type": tx_type,
            "category": tx_category or f"{module_name} (WhatsApp)",
            "amountRWF": float(tx_amount),
            "paymentMethod": entry.get("paymentMethod") or "MoMo / Cash",
            "account": entry.get("paymentMethod") or "MoMo / Cash",
            "source": "WhatsApp",
            "status": "Posted",
            "date": now.strftime("%Y-%m-%d %H:%M"),
            "timestamp": now_iso,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        db.transactions.insert_one(tx_doc)

    return entry


def get_unpaid_customers_summary(db: Any, scope_key: str, arch_id: str) -> list[dict[str, Any]]:
    """
    Collect all unpaid / part-paid sales and customer debt records, including
    products bought, amount paid, and remaining balance owed.
    """
    ws = _get_or_init_workspace(db, scope_key, arch_id)
    records = ws.get("records") or {}
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])
    sales_bucket = buckets["sales"]

    customers = list(records.get("Customers") or [])
    customer_phone_by_name = {}
    for c in customers:
        cname = str(c.get("title") or c.get("name") or "").strip().lower()
        cphone = str(c.get("phone") or c.get("customerPhone") or "").strip()
        if cname and cphone:
            customer_phone_by_name[cname] = cphone

    unpaid_items: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    # 1. Unpaid / Part-paid sales records (primary source with exact products bought)
    for s in list(records.get(sales_bucket) or []) + list(records.get("Sales") or []):
        sid = str(s.get("id") or "")
        if not sid or sid in seen_ids:
            continue
        seen_ids.add(sid)

        total_amt = float(s.get("amountRWF") or s.get("totalAmount") or 0)
        status_str = str(s.get("status") or "").lower()
        paid_amt = s.get("paidAmountRWF")
        remaining_amt = s.get("remainingAmountRWF")

        if remaining_amt is None:
            if "paid in full" in status_str or status_str == "paid":
                remaining_amt = 0.0
                paid_amt = total_amt if paid_amt is None else float(paid_amt)
            elif "part" in status_str:
                paid_amt = float(paid_amt) if paid_amt is not None else round(total_amt / 2)
                remaining_amt = max(0.0, total_amt - paid_amt)
            elif "unpaid" in status_str or "credit" in status_str or "pending" in status_str or "owed" in status_str:
                paid_amt = float(paid_amt) if paid_amt is not None else 0.0
                remaining_amt = max(0.0, total_amt - paid_amt)
            else:
                remaining_amt = 0.0
                paid_amt = total_amt if paid_amt is None else float(paid_amt)
        else:
            remaining_amt = float(remaining_amt)
            paid_amt = float(paid_amt) if paid_amt is not None else max(0.0, total_amt - remaining_amt)

        if remaining_amt <= 0:
            continue

        cust_name = str(s.get("customerName") or s.get("customer") or s.get("category") or "Walk-in Client").strip()
        cust_phone = str(s.get("customerPhone") or "").strip() or customer_phone_by_name.get(cust_name.lower(), "")
        prod_desc = str(s.get("title") or s.get("productTitle") or "Product / Service").strip()

        unpaid_items.append({
            "id": sid,
            "recordType": "sale",
            "bucket": sales_bucket if s in (records.get(sales_bucket) or []) else "Sales",
            "customerName": cust_name,
            "customerPhone": cust_phone,
            "productsBought": prod_desc,
            "totalAmountRWF": total_amt,
            "paidAmountRWF": float(paid_amt),
            "remainingAmountRWF": float(remaining_amt),
            "date": s.get("date") or "",
            "status": s.get("status") or "Unpaid",
        })

    # 2. Standalone Customer directory balances (if not already covered by a sale)
    for c in customers:
        cid = str(c.get("id") or "")
        owed = float(c.get("balanceOwedRWF") or 0)
        if owed <= 0 or not cid:
            continue
        cname = str(c.get("title") or c.get("name") or "Customer").strip()
        if any(u["customerName"].lower() == cname.lower() for u in unpaid_items):
            continue
        unpaid_items.append({
            "id": cid,
            "recordType": "customer",
            "bucket": "Customers",
            "customerName": cname,
            "customerPhone": str(c.get("phone") or "").strip(),
            "productsBought": str(c.get("preferredProducts") or c.get("notes") or "Account Credit Balance"),
            "totalAmountRWF": float(c.get("totalBilledRWF") or owed),
            "paidAmountRWF": float(c.get("paidAmountRWF") or 0),
            "remainingAmountRWF": owed,
            "date": c.get("date") or "",
            "status": c.get("status") or "Credit Balance",
        })

    return unpaid_items


def send_debt_reminders(
    db: Any,
    scope_key: str,
    arch_id: str,
    target_id: Optional[str] = None,
    business_name: str = "ExBOS Business",
) -> dict[str, Any]:
    """
    Send WhatsApp debt reminders showing products bought, amount paid, and remaining balance.
    If target_id is None or 'ALL', sends to all unpaid customers with a valid phone number.
    """
    unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
    if target_id and str(target_id).upper() != "ALL":
        t_low = str(target_id).strip().lower()
        unpaid = [
            u for u in unpaid
            if str(u["id"]).lower() == t_low or t_low in u["customerName"].lower()
        ]

    sent_results = []
    skipped = []
    for item in unpaid:
        phone = item.get("customerPhone") or ""
        if not phone:
            skipped.append({
                "id": item["id"],
                "customerName": item["customerName"],
                "reason": "No customer phone number recorded",
            })
            continue

        msg = (
            f"Hello *{item['customerName']}*,\n"
            f"Payment reminder from *{business_name}*:\n\n"
            f"- *Items Bought:* {item['productsBought']}\n"
            f"- *Total Amount:* {_fmt_rwf(item['totalAmountRWF'])}\n"
            f"- *Amount Paid:* {_fmt_rwf(item['paidAmountRWF'])}\n"
            f"- *Remaining Balance:* *{_fmt_rwf(item['remainingAmountRWF'])}*\n\n"
            "Kindly complete your payment and notify us so we can verify and clear your balance. Thank you!"
        )
        res = send_whatsapp_message(
            phone,
            msg,
            db=db,
            metadata={"type": "debt_reminder", "recordId": item["id"], "scopeKey": scope_key},
        )
        sent_results.append({
            "id": item["id"],
            "customerName": item["customerName"],
            "phone": res.get("to"),
            "status": res.get("status"),
            "remainingAmountRWF": item["remainingAmountRWF"],
            "messagePreview": msg,
        })

    return {
        "totalTargeted": len(unpaid),
        "dispatchedCount": len(sent_results),
        "skippedCount": len(skipped),
        "dispatched": sent_results,
        "skipped": skipped,
    }


def verify_customer_payment(
    db: Any,
    scope_key: str,
    arch_id: str,
    target_id: str,
    amount: Optional[float] = None,
    payment_method: str = "MoMo / Cash",
    source: str = "Dashboard",
) -> dict[str, Any]:
    """
    Business owner verifies that an unpaid customer has paid.
    Updates sale/customer record, clears remaining balance if fully paid (removing from unpaid list),
    and posts an INFLOW transaction.
    """
    ws = _get_or_init_workspace(db, scope_key, arch_id)
    records = ws.get("records") or {}
    unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
    t_low = str(target_id).strip().lower()
    match = next(
        (u for u in unpaid if str(u["id"]).lower() == t_low or t_low in u["customerName"].lower()),
        None,
    )
    if not match:
        return {"ok": False, "error": f"No unpaid customer/sale found matching '{target_id}'."}

    remaining = float(match["remainingAmountRWF"])
    pay_amt = float(amount) if amount is not None and float(amount) > 0 else remaining
    pay_amt = min(pay_amt, remaining)
    new_paid = float(match["paidAmountRWF"]) + pay_amt
    new_remaining = max(0.0, remaining - pay_amt)
    is_cleared = new_remaining <= 0
    new_status = "Paid in Full" if is_cleared else "Part-paid"

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # Update matching sale or customer record in workspace
    bucket = match["bucket"]
    bucket_list = list(records.get(bucket) or [])
    for idx, rec in enumerate(bucket_list):
        if str(rec.get("id")) == str(match["id"]):
            updated = dict(rec)
            if match["recordType"] == "sale":
                updated["paidAmountRWF"] = new_paid
                updated["remainingAmountRWF"] = new_remaining
                updated["status"] = new_status
                updated["paymentMethod"] = payment_method
                updated["verifiedPaidAt"] = now_iso
            else:
                updated["paidAmountRWF"] = new_paid
                updated["balanceOwedRWF"] = new_remaining
                updated["status"] = "Active" if is_cleared else "Credit Balance"
                updated["verifiedPaidAt"] = now_iso
            bucket_list[idx] = updated
            break
    records[bucket] = bucket_list

    # Also clear matching customer balanceOwedRWF if sale was cleared
    if match["recordType"] == "sale" and is_cleared:
        cust_list = list(records.get("Customers") or [])
        for idx, c in enumerate(cust_list):
            cname = str(c.get("title") or c.get("name") or "").strip().lower()
            if cname and cname in match["customerName"].lower():
                c_upd = dict(c)
                cur_owed = float(c_upd.get("balanceOwedRWF") or 0)
                c_upd["balanceOwedRWF"] = max(0.0, cur_owed - pay_amt)
                if c_upd["balanceOwedRWF"] <= 0:
                    c_upd["status"] = "Active"
                cust_list[idx] = c_upd
        records["Customers"] = cust_list

    metrics = dict(ws.get("metrics") or {})
    metrics["todayMoneyInRWF"] = float(metrics.get("todayMoneyInRWF", 0)) + pay_amt
    metrics["spendableRWF"] = float(metrics.get("spendableRWF", 0)) + pay_amt
    metrics["owedToMeRWF"] = max(0.0, float(metrics.get("owedToMeRWF", 0)) - pay_amt)

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records, "metrics": metrics, "updated_at": now_iso}},
    )

    # Post INFLOW payment verification transaction
    tx_id = f"TX-{int(time.time() * 1000) % 10000000}"
    db.transactions.insert_one({
        "id": tx_id,
        "scopeKey": scope_key,
        "architectureId": arch_id,
        "recordId": match["id"] if match["recordType"] == "sale" else None,
        "sourceModule": "Sales",
        "title": f"Debt Payment Verified: {match['customerName']} ({match['productsBought']})",
        "type": "INFLOW",
        "category": "Customer Debt Collection",
        "amountRWF": pay_amt,
        "paymentMethod": payment_method,
        "account": payment_method,
        "source": source,
        "status": "Posted",
        "date": now.strftime("%Y-%m-%d %H:%M"),
        "timestamp": now_iso,
        "created_at": now_iso,
        "updated_at": now_iso,
    })

    # Send payment confirmation receipt to customer if phone exists
    if match.get("customerPhone"):
        receipt_msg = (
            f"Thank you *{match['customerName']}*!\n"
            f"Your payment of *{_fmt_rwf(pay_amt)}* for *{match['productsBought']}* has been verified.\n"
            f"Remaining Balance: *{_fmt_rwf(new_remaining)}* ({new_status})."
        )
        send_whatsapp_message(
            match["customerPhone"],
            receipt_msg,
            db=db,
            metadata={"type": "payment_verified", "recordId": match["id"]},
        )

    return {
        "ok": True,
        "recordId": match["id"],
        "customerName": match["customerName"],
        "paidNowRWF": pay_amt,
        "remainingAmountRWF": new_remaining,
        "clearedFromUnpaidList": is_cleared,
        "status": new_status,
    }


def _build_report_text(db: Any, scope_key: str, arch_id: str, business_name: str) -> str:
    ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
    records = ws.get("records") or {}
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])

    sales_list = list(records.get(buckets["sales"]) or []) + (
        list(records.get("Sales") or []) if buckets["sales"] != "Sales" else []
    )
    purchases_list = list(records.get(buckets["purchases"]) or [])
    expenses_list = list(records.get(buckets["expenses"]) or [])
    catalog = _catalog_items(ws, arch_id)
    unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)

    total_sales = sum(float(s.get("amountRWF") or s.get("totalAmount") or 0) for s in sales_list)
    total_purchases = sum(float(p.get("amountRWF") or 0) for p in purchases_list)
    total_expenses = sum(float(e.get("amountRWF") or 0) for e in expenses_list)
    net_profit = total_sales - total_purchases - total_expenses
    stock_val = sum(
        (float(i.get("quantity") or i.get("currentStock") or 0))
        * (float(i.get("sellingPriceRWF") or i.get("unitCostRWF") or i.get("purchasePriceRWF") or 0))
        for i in catalog
    )
    total_owed = sum(u["remainingAmountRWF"] for u in unpaid)

    return (
        f"*{business_name} — Live Business Report*\n"
        f"Architecture: *{ARCH_LABELS.get(arch_id, arch_id)}*\n\n"
        f"- *Total Sales:* {_fmt_rwf(total_sales)} ({len(sales_list)} records)\n"
        f"- *Total Purchases:* {_fmt_rwf(total_purchases)} ({len(purchases_list)} records)\n"
        f"- *Total Expenses:* {_fmt_rwf(total_expenses)} ({len(expenses_list)} records)\n"
        f"- *Net Profit:* *{_fmt_rwf(net_profit)}*\n"
        f"- *Catalog Items:* {len(catalog)} (Est. Value: {_fmt_rwf(stock_val)})\n"
        f"- *Unpaid Customers:* {len(unpaid)} (Total Owed: {_fmt_rwf(total_owed)})\n\n"
        "Reply *0* for Menu or *6* to manage Unpaid Customers."
    )


def _parse_positive_number(text: str) -> Optional[float]:
    raw = str(text or "").strip().replace(",", "").replace(" ", "")
    raw = re.sub(r"(?i)rwf$", "", raw).strip()
    if not raw:
        return None
    try:
        val = float(raw)
        return val if val > 0 else None
    except ValueError:
        return None


def _fuzzy_match_product(catalog: list[dict[str, Any]], query: str) -> Optional[dict[str, Any]]:
    """Match a product by exact name, substring, or close spelling (e.g. 'aitel' -> 'airtel router 4g')."""
    q = str(query or "").strip().lower()
    if not q or not catalog:
        return None
    # 1. Exact or substring match
    for item in catalog:
        name = str(item.get("title") or item.get("name") or "").strip().lower()
        if name == q:
            return item
    for item in catalog:
        name = str(item.get("title") or item.get("name") or "").strip().lower()
        if q in name or name in q:
            return item
    # 2. Fuzzy match against full product name and individual words
    names = [str(i.get("title") or i.get("name") or "").strip().lower() for i in catalog]
    close = difflib.get_close_matches(q, names, n=1, cutoff=0.55)
    if close:
        for item, nm in zip(catalog, names):
            if nm == close[0]:
                return item
    for item, nm in zip(catalog, names):
        words = nm.split()
        if difflib.get_close_matches(q, words, n=1, cutoff=0.65):
            return item
    return None


def _adjust_product_stock(
    db: Any,
    scope_key: str,
    arch_id: str,
    product_id: Optional[str],
    delta_qty: float,
    new_unit_cost: Optional[float] = None,
) -> Optional[float]:
    """Update product stock quantity in workspaces.records after a confirmed Sale or Purchase."""
    if not product_id or db is None:
        return None
    ws = _get_or_init_workspace(db, scope_key, arch_id)
    records = ws.get("records") or {}
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])["catalog"]
    updated_qty: Optional[float] = None

    for bucket in buckets:
        items = list(records.get(bucket) or [])
        changed = False
        for idx, item in enumerate(items):
            if str(item.get("id") or "") == str(product_id):
                cur_q = float(item.get("quantity") if item.get("quantity") is not None else item.get("currentStock") or 0)
                next_q = max(0.0, cur_q + float(delta_qty))
                next_item = dict(item)
                next_item["quantity"] = int(next_q) if next_q.is_integer() else round(next_q, 2)
                next_item["currentStock"] = next_item["quantity"]
                if new_unit_cost is not None and new_unit_cost > 0:
                    next_item["purchasePriceRWF"] = new_unit_cost
                    next_item["unitCostRWF"] = new_unit_cost
                items[idx] = next_item
                updated_qty = next_q
                changed = True
                break
        if changed:
            records[bucket] = items
            db.workspaces.update_one(
                {"scopeKey": scope_key, "architectureId": arch_id},
                {"$set": {"records": records, "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            break

    return updated_qty


def _format_verification_card(title: str, rows: list[tuple[str, str]]) -> str:
    """Render a clear, executive verification prompt before writing anything to MongoDB."""
    lines = [
        f"*VERIFY BEFORE SAVING — {title}*",
        "--------------------------------",
    ]
    for label, val in rows:
        lines.append(f"- {label}: *{val}*")
    lines.extend([
        "--------------------------------",
        "Reply *YES* to confirm and save to ExBOS.",
        "Reply *NO* (or *0*) to cancel.",
    ])
    return "\n".join(lines)


def _format_product_picker(business_name: str, catalog: list[dict[str, Any]], action_label: str) -> str:
    lines = [f"*{business_name} — Select Product for {action_label}:*"]
    for idx, item in enumerate(catalog[:15], start=1):
        name = item.get("title") or item.get("name") or item.get("id")
        qty = item.get("quantity") if item.get("quantity") is not None else item.get("currentStock", 0)
        price = item.get("sellingPriceRWF") or item.get("amountRWF") or item.get("unitCostRWF") or 0
        lines.append(f"*{idx}.* {name} — Stock: *{qty}* | {_fmt_rwf(price)}")
    lines.append("\nReply with the *product number* (e.g. *1*) or type the product name.")
    lines.append("Reply *0* to cancel.")
    return "\n".join(lines)


GREETING_WORDS = {
    "0", "MENU", "HELP", "HI", "HY", "HEY", "HELLO", "START",
    "MURAHO", "MWARAMUTSE", "MWIRIWE", "BONJOUR", "SALUT",
    "GOOD MORNING", "GOOD AFTERNOON", "GOOD EVENING",
}

CONFIRM_WORDS = {"YES", "Y", "CONFIRM", "OK", "YEGO", "SAVE", "SURE"}
CANCEL_WORDS = {"NO", "N", "CANCEL", "STOP", "OYA", "ABORT"}

PAYMENT_OPTIONS = {
    "1": ("Cash", "Paid in Full"),
    "2": ("MTN MoMo Business", "Paid in Full"),
    "3": ("Airtel Money", "Paid in Full"),
    "4": ("Bank Transfer", "Paid in Full"),
    "5": ("Customer Credit", "Unpaid"),
}

EXPENSE_CATEGORIES = {
    "1": "Rent & Premises",
    "2": "Staff Salaries",
    "3": "Electricity & Water",
    "4": "Transport & Delivery",
    "5": "Internet & Airtime",
    "6": "Supplies & Maintenance",
}


def handle_incoming_whatsapp_message(
    db: Any,
    from_phone: str,
    text: str,
    user_doc: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Executive guided WhatsApp POS & Operations Engine.
    - Recognizes natural greetings without error messages.
    - Walks users step-by-step through Sales (product -> qty -> payment -> VERIFY BEFORE SAVING),
      Purchases, Expenses, and New Products.
    - Requires explicit YES confirmation before writing any record to MongoDB.
    """
    normalized_phone = normalize_phone(from_phone)
    clean_text = (text or "").strip()
    upper_text = clean_text.upper()

    # Resolve business user by phone if not already supplied
    if user_doc is None and normalized_phone:
        candidates = db.users.find({}, {"_id": 0})
        for u in candidates:
            if normalize_phone(u.get("phone", "")) == normalized_phone:
                user_doc = u
                break

    if not user_doc:
        reply = (
            "Welcome to *EXCELLENCE BOS* Official WhatsApp.\n\n"
            "This phone number is not yet linked to an ExBOS business account.\n"
            "Open *Dashboard -> Integrations -> WhatsApp* to link your number."
        )
        return {"reply": reply, "action": "unlinked_user"}

    scope_key = (user_doc.get("ownerScopeKey") or user_doc.get("email") or "").strip().lower()
    arch_id = user_doc.get("architectureId") or "buy-and-sell"
    business_name = user_doc.get("businessName") or user_doc.get("name") or "ExBOS Business"
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])

    session = db.whatsapp_sessions.find_one({"phone": normalized_phone}, {"_id": 0}) or {}
    current_step = session.get("step")
    step_data = dict(session.get("data") or {})

    def set_session(step: Optional[str], data: Optional[dict[str, Any]] = None) -> None:
        if step is None:
            db.whatsapp_sessions.delete_one({"phone": normalized_phone})
        else:
            db.whatsapp_sessions.update_one(
                {"phone": normalized_phone},
                {
                    "$set": {
                        "phone": normalized_phone,
                        "step": step,
                        "data": data or {},
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
                upsert=True,
            )

    # Global reset / natural greeting
    if (
        upper_text in GREETING_WORDS
        or upper_text.startswith("HELLO")
        or upper_text.startswith("HI ")
        or upper_text.startswith("HY ")
        or upper_text.startswith("MURAHO")
    ):
        set_session(None)
        return {
            "reply": build_welcome_message(business_name, arch_id),
            "action": "menu",
        }

    # Global cancel when inside a guided session
    if current_step and upper_text in CANCEL_WORDS:
        set_session(None)
        return {
            "reply": "Action cancelled. No changes were saved to your ExBOS database.\n\nReply *0* for Main Menu.",
            "action": "cancelled",
        }

    # =========================================================================
    # STEP-BY-STEP GUIDED SESSIONS WITH MANDATORY VERIFICATION BEFORE SAVING
    # =========================================================================

    # --- A. CONFIRMATION GATE: SALE ---
    if current_step == "confirm_sale":
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": "Please reply *YES* to confirm and save this sale, or *NO* to cancel.",
                "action": "awaiting_sale_confirmation",
            }
        qty = float(step_data.get("qty") or 1)
        item_name = str(step_data.get("productTitle") or "Product")
        product_id = step_data.get("productId")
        unit_price = float(step_data.get("unitPriceRWF") or 0)
        unit_cost = float(step_data.get("unitCostRWF") or 0)
        total_amt = float(step_data.get("totalAmountRWF") or (qty * unit_price))
        payment_method = str(step_data.get("paymentMethod") or "Cash")
        payment_status = str(step_data.get("paymentStatus") or "Paid in Full")
        customer_name = str(step_data.get("customerName") or "Walk-in Client")
        is_credit = payment_status.lower() == "unpaid"
        paid_amt = 0.0 if is_credit else total_amt
        remaining_amt = total_amt if is_credit else 0.0
        cogs = round(qty * unit_cost, 2) if unit_cost > 0 else 0.0
        profit = round(total_amt - cogs, 2) if unit_cost > 0 else round(total_amt * 0.3, 2)

        qty_display = int(qty) if qty.is_integer() else qty
        entry = _append_record_and_tx(
            db,
            scope_key,
            arch_id,
            buckets["sales"],
            record={
                "title": f"{qty_display} × {item_name}",
                "productTitle": item_name,
                "productId": product_id,
                "quantity": qty_display,
                "unitPriceRWF": unit_price,
                "amountRWF": total_amt,
                "paidAmountRWF": paid_amt,
                "remainingAmountRWF": remaining_amt,
                "costOfGoodsRWF": cogs,
                "profitRWF": profit,
                "customerName": customer_name,
                "status": payment_status,
                "paymentStatus": payment_status,
                "paymentMethod": payment_method,
                "type": "in",
            },
            tx_type="INFLOW" if paid_amt > 0 else None,
            tx_amount=paid_amt,
            tx_title=f"{qty_display} × {item_name}",
            tx_category=f"{buckets['sales']} (WhatsApp)",
        )
        new_stock = _adjust_product_stock(db, scope_key, arch_id, product_id, -qty)
        set_session(None)
        stock_line = f"\n- Remaining Stock: *{int(new_stock) if new_stock is not None and float(new_stock).is_integer() else new_stock}*" if new_stock is not None else ""
        return {
            "reply": (
                "*SALE SAVED & SYNCED TO EXBOS*\n"
                "--------------------------------\n"
                f"- Reference: *{entry['id']}*\n"
                f"- Item: *{entry['title']}*\n"
                f"- Total Amount: *{_fmt_rwf(total_amt)}*\n"
                f"- Payment: *{payment_method} ({payment_status})*\n"
                f"- Customer: *{customer_name}*"
                f"{stock_line}\n"
                "--------------------------------\n"
                "Reply *2* for another Sale or *0* for Main Menu."
            ),
            "action": "sale_recorded",
            "record": entry,
        }

    # --- B. SALE STEP 1: PICK PRODUCT ---
    if current_step == "sale_pick_product":
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        chosen = None
        if clean_text.isdigit():
            idx = int(clean_text) - 1
            if 0 <= idx < len(catalog):
                chosen = catalog[idx]
        if not chosen:
            chosen = _fuzzy_match_product(catalog, clean_text)
        if not chosen:
            return {
                "reply": f"No product found matching `{clean_text}`.\n\n" + _format_product_picker(business_name, catalog, "Sale"),
                "action": "sale_pick_product_retry",
            }
        prod_name = str(chosen.get("title") or chosen.get("name") or "Product")
        avail_qty = float(chosen.get("quantity") if chosen.get("quantity") is not None else chosen.get("currentStock") or 0)
        unit_price = float(chosen.get("sellingPriceRWF") or chosen.get("amountRWF") or 0)
        unit_cost = float(chosen.get("purchasePriceRWF") or chosen.get("unitCostRWF") or 0)
        if avail_qty <= 0:
            return {
                "reply": (
                    f"*{prod_name}* is currently *OUT OF STOCK (0 units)*.\n"
                    "Please choose another product number, or reply *3* to record a Purchase / Restock."
                ),
                "action": "sale_out_of_stock",
            }
        set_session(
            "sale_enter_qty",
            {
                "productId": chosen.get("id"),
                "productTitle": prod_name,
                "availableStock": avail_qty,
                "unitPriceRWF": unit_price,
                "unitCostRWF": unit_cost,
            },
        )
        avail_disp = int(avail_qty) if avail_qty.is_integer() else avail_qty
        return {
            "reply": (
                f"*Selected Product:* {prod_name}\n"
                f"- Unit Price: *{_fmt_rwf(unit_price)}*\n"
                f"- Available Stock: *{avail_disp} unit(s)*\n\n"
                "How many units are you selling?\n"
                "Reply with a number (e.g. *1* or *2*), or *0* to cancel."
            ),
            "action": "sale_enter_qty",
        }

    # --- C. SALE STEP 2: ENTER QUANTITY ---
    if current_step == "sale_enter_qty":
        qty = _parse_positive_number(clean_text)
        avail_qty = float(step_data.get("availableStock") or 0)
        if qty is None:
            return {
                "reply": "Please enter a valid quantity greater than 0 (e.g. *1*, *2*, *5*), or *0* to cancel.",
                "action": "sale_qty_invalid",
            }
        if avail_qty > 0 and qty > avail_qty:
            avail_disp = int(avail_qty) if avail_qty.is_integer() else avail_qty
            return {
                "reply": f"Requested quantity exceeds available stock (*{avail_disp} unit(s)* available).\nPlease enter *{avail_disp}* or less, or *0* to cancel.",
                "action": "sale_qty_exceeds_stock",
            }
        unit_price = float(step_data.get("unitPriceRWF") or 0)
        total_amt = round(qty * unit_price, 2)
        step_data["qty"] = qty
        step_data["totalAmountRWF"] = total_amt
        set_session("sale_pick_payment", step_data)
        qty_disp = int(qty) if qty.is_integer() else qty
        return {
            "reply": (
                f"*Sale Total:* {qty_disp} × {step_data['productTitle']} = *{_fmt_rwf(total_amt)}*\n\n"
                "Select Payment Method:\n"
                "*1.* Cash (Paid in Full)\n"
                "*2.* MTN MoMo Business (Paid in Full)\n"
                "*3.* Airtel Money (Paid in Full)\n"
                "*4.* Bank Transfer (Paid in Full)\n"
                "*5.* Customer Credit (Unpaid)\n\n"
                "Reply *1–5*, or *0* to cancel."
            ),
            "action": "sale_pick_payment",
        }

    # --- D. SALE STEP 3: PICK PAYMENT METHOD ---
    if current_step == "sale_pick_payment":
        if clean_text not in PAYMENT_OPTIONS:
            return {
                "reply": "Please reply with *1* (Cash), *2* (MTN MoMo), *3* (Airtel Money), *4* (Bank), or *5* (Customer Credit).",
                "action": "sale_pick_payment_retry",
            }
        pm_name, pm_status = PAYMENT_OPTIONS[clean_text]
        step_data["paymentMethod"] = pm_name
        step_data["paymentStatus"] = pm_status
        if clean_text == "5":
            set_session("sale_enter_customer", step_data)
            return {
                "reply": "Enter the *Customer Name* for this credit sale (e.g. *Jean Paul*):",
                "action": "sale_enter_customer",
            }
        step_data["customerName"] = "Walk-in Client"
        set_session("confirm_sale", step_data)
        qty = float(step_data["qty"])
        qty_disp = int(qty) if qty.is_integer() else qty
        rem_stock = max(0.0, float(step_data.get("availableStock") or 0) - qty)
        rem_disp = int(rem_stock) if rem_stock.is_integer() else rem_stock
        return {
            "reply": _format_verification_card(
                "NEW SALE",
                [
                    ("Product", str(step_data["productTitle"])),
                    ("Quantity", f"{qty_disp} unit(s)"),
                    ("Stock After Sale", f"{rem_disp} unit(s)"),
                    ("Unit Price", _fmt_rwf(step_data["unitPriceRWF"])),
                    ("Total Amount", _fmt_rwf(step_data["totalAmountRWF"])),
                    ("Payment", f"{pm_name} ({pm_status})"),
                    ("Customer", "Walk-in Client"),
                ],
            ),
            "action": "confirm_sale",
        }

    # --- E. SALE STEP 3b: ENTER CUSTOMER NAME FOR CREDIT SALE ---
    if current_step == "sale_enter_customer":
        if len(clean_text) < 2:
            return {"reply": "Please enter a valid customer name (at least 2 characters).", "action": "sale_enter_customer_retry"}
        step_data["customerName"] = clean_text
        set_session("confirm_sale", step_data)
        qty = float(step_data["qty"])
        qty_disp = int(qty) if qty.is_integer() else qty
        rem_stock = max(0.0, float(step_data.get("availableStock") or 0) - qty)
        rem_disp = int(rem_stock) if rem_stock.is_integer() else rem_stock
        return {
            "reply": _format_verification_card(
                "NEW CREDIT SALE",
                [
                    ("Product", str(step_data["productTitle"])),
                    ("Quantity", f"{qty_disp} unit(s)"),
                    ("Stock After Sale", f"{rem_disp} unit(s)"),
                    ("Unit Price", _fmt_rwf(step_data["unitPriceRWF"])),
                    ("Total Amount", _fmt_rwf(step_data["totalAmountRWF"])),
                    ("Payment", "Customer Credit (Unpaid)"),
                    ("Customer", clean_text),
                ],
            ),
            "action": "confirm_sale",
        }

    # --- F. CONFIRMATION GATE: PURCHASE ---
    if current_step == "confirm_purchase":
        if upper_text not in CONFIRM_WORDS:
            return {"reply": "Please reply *YES* to confirm and save this purchase, or *NO* to cancel.", "action": "awaiting_purchase_confirmation"}
        qty = float(step_data.get("qty") or 1)
        item_name = str(step_data.get("productTitle") or "Item")
        product_id = step_data.get("productId")
        total_amt = float(step_data.get("totalAmountRWF") or 0)
        unit_cost = round(total_amt / qty, 2) if qty > 0 else total_amt
        qty_disp = int(qty) if qty.is_integer() else qty
        entry = _append_record_and_tx(
            db,
            scope_key,
            arch_id,
            buckets["purchases"],
            record={
                "title": f"{qty_disp} × {item_name}",
                "productTitle": item_name,
                "productId": product_id,
                "quantity": qty_disp,
                "orderedQuantity": qty_disp,
                "receivedQuantity": qty_disp,
                "deliveryStatus": "Received",
                "unitPriceRWF": unit_cost,
                "amountRWF": total_amt,
                "paidAmountRWF": total_amt,
                "remainingAmountRWF": 0.0,
                "status": "Paid in Full",
                "paymentMethod": "Cash / MoMo",
                "type": "out",
            },
            tx_type="OUTFLOW",
            tx_amount=total_amt,
            tx_title=f"Purchase: {item_name}",
            tx_category=f"{buckets['purchases']} (WhatsApp)",
        )
        new_stock = _adjust_product_stock(db, scope_key, arch_id, product_id, +qty, new_unit_cost=unit_cost)
        set_session(None)
        stock_line = f"\n- Updated Stock: *{int(new_stock) if new_stock is not None and float(new_stock).is_integer() else new_stock}*" if new_stock is not None else ""
        return {
            "reply": (
                "*PURCHASE SAVED & STOCK UPDATED*\n"
                "--------------------------------\n"
                f"- Reference: *{entry['id']}*\n"
                f"- Item: *{entry['title']}*\n"
                f"- Total Cost: *{_fmt_rwf(total_amt)}*"
                f"{stock_line}\n"
                "--------------------------------\n"
                "Reply *0* for Main Menu."
            ),
            "action": "purchase_recorded",
            "record": entry,
        }

    if current_step == "purchase_pick_product":
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        chosen = None
        if clean_text.isdigit():
            idx = int(clean_text) - 1
            if 0 <= idx < len(catalog):
                chosen = catalog[idx]
        if not chosen:
            chosen = _fuzzy_match_product(catalog, clean_text)
        prod_name = str(chosen.get("title") or chosen.get("name")) if chosen else clean_text
        set_session(
            "purchase_enter_qty",
            {"productId": chosen.get("id") if chosen else None, "productTitle": prod_name},
        )
        return {
            "reply": f"*Restock Item:* {prod_name}\n\nHow many units did you purchase? Reply with a number (e.g. *10*):",
            "action": "purchase_enter_qty",
        }

    if current_step == "purchase_enter_qty":
        qty = _parse_positive_number(clean_text)
        if qty is None:
            return {"reply": "Please enter a valid quantity greater than 0 (e.g. *10*).", "action": "purchase_qty_invalid"}
        step_data["qty"] = qty
        set_session("purchase_enter_amount", step_data)
        qty_disp = int(qty) if qty.is_integer() else qty
        return {
            "reply": f"Enter the *Total Purchase Cost in RWF* for {qty_disp} × {step_data['productTitle']} (e.g. *50000*):",
            "action": "purchase_enter_amount",
        }

    if current_step == "purchase_enter_amount":
        amt = _parse_positive_number(clean_text)
        if amt is None:
            return {"reply": "Please enter a valid total amount in RWF (e.g. *50000*).", "action": "purchase_amt_invalid"}
        step_data["totalAmountRWF"] = amt
        set_session("confirm_purchase", step_data)
        qty = float(step_data["qty"])
        qty_disp = int(qty) if qty.is_integer() else qty
        return {
            "reply": _format_verification_card(
                "NEW PURCHASE / RESTOCK",
                [
                    ("Item", str(step_data["productTitle"])),
                    ("Quantity", f"{qty_disp} unit(s)"),
                    ("Unit Cost", _fmt_rwf(amt / qty)),
                    ("Total Cost", _fmt_rwf(amt)),
                    ("Delivery Status", "Received (Updates Stock)"),
                ],
            ),
            "action": "confirm_purchase",
        }

    # --- G. CONFIRMATION GATE & GUIDED FLOW: EXPENSE ---
    if current_step == "confirm_expense":
        if upper_text not in CONFIRM_WORDS:
            return {"reply": "Please reply *YES* to confirm and save this expense, or *NO* to cancel.", "action": "awaiting_expense_confirmation"}
        title = str(step_data.get("title") or "Operating Expense")
        amt = float(step_data.get("amountRWF") or 0)
        entry = _append_record_and_tx(
            db,
            scope_key,
            arch_id,
            buckets["expenses"],
            record={"title": title, "amountRWF": amt, "category": title, "status": "Paid", "type": "out"},
            tx_type="OUTFLOW",
            tx_amount=amt,
            tx_title=title,
            tx_category=f"{buckets['expenses']} (WhatsApp)",
        )
        set_session(None)
        return {
            "reply": (
                "*EXPENSE SAVED & SYNCED TO EXBOS*\n"
                "--------------------------------\n"
                f"- Reference: *{entry['id']}*\n"
                f"- Expense: *{title}*\n"
                f"- Amount: *{_fmt_rwf(amt)}*\n"
                "--------------------------------\n"
                "Reply *0* for Main Menu."
            ),
            "action": "expense_recorded",
            "record": entry,
        }

    if current_step == "expense_enter_title":
        title = EXPENSE_CATEGORIES.get(clean_text, clean_text)
        if len(title) < 2:
            return {"reply": "Please choose *1–6* or type the expense description.", "action": "expense_title_retry"}
        set_session("expense_enter_amount", {"title": title})
        return {
            "reply": f"*Expense:* {title}\n\nEnter the amount spent in *RWF* (e.g. *15000*):",
            "action": "expense_enter_amount",
        }

    if current_step == "expense_enter_amount":
        amt = _parse_positive_number(clean_text)
        if amt is None:
            return {"reply": "Please enter a valid expense amount in RWF (e.g. *15000*).", "action": "expense_amt_invalid"}
        step_data["amountRWF"] = amt
        set_session("confirm_expense", step_data)
        return {
            "reply": _format_verification_card(
                "NEW EXPENSE",
                [
                    ("Description", str(step_data["title"])),
                    ("Amount", _fmt_rwf(amt)),
                    ("Status", "Paid"),
                ],
            ),
            "action": "confirm_expense",
        }

    # --- H. CONFIRMATION GATE & GUIDED FLOW: ADD PRODUCT ---
    if current_step == "confirm_product":
        if upper_text not in CONFIRM_WORDS:
            return {"reply": "Please reply *YES* to confirm and save this product, or *NO* to cancel.", "action": "awaiting_product_confirmation"}
        name = str(step_data.get("name") or "Product")
        sell_p = float(step_data.get("sellingPriceRWF") or 0)
        cost_p = float(step_data.get("costPriceRWF") or 0)
        qty = float(step_data.get("quantity") or 0)
        qty_disp = int(qty) if qty.is_integer() else qty
        entry = _append_record_and_tx(
            db,
            scope_key,
            arch_id,
            buckets["primary_catalog"],
            record={
                "title": name,
                "name": name,
                "category": "General",
                "sellingPriceRWF": sell_p,
                "purchasePriceRWF": cost_p,
                "unitCostRWF": cost_p,
                "quantity": qty_disp,
                "currentStock": qty_disp,
                "amountRWF": qty * sell_p,
                "status": "Active",
            },
        )
        set_session(None)
        return {
            "reply": (
                "*PRODUCT ADDED TO DATABASE*\n"
                "--------------------------------\n"
                f"- Product: *{name}*\n"
                f"- Selling Price: *{_fmt_rwf(sell_p)}*\n"
                f"- Cost Price: *{_fmt_rwf(cost_p)}*\n"
                f"- Opening Stock: *{qty_disp} unit(s)*\n"
                "--------------------------------\n"
                "Reply *1* to view catalog or *0* for Main Menu."
            ),
            "action": "product_added",
            "record": entry,
        }

    if current_step == "product_enter_name":
        if len(clean_text) < 2:
            return {"reply": "Please enter a valid product name (at least 2 characters).", "action": "product_name_retry"}
        set_session("product_enter_sell", {"name": clean_text})
        return {"reply": f"*New Product:* {clean_text}\n\nEnter the *Selling Price* per unit in RWF (e.g. *10000*):", "action": "product_enter_sell"}

    if current_step == "product_enter_sell":
        sell_p = _parse_positive_number(clean_text)
        if sell_p is None:
            return {"reply": "Please enter a valid selling price in RWF (e.g. *10000*).", "action": "product_sell_retry"}
        step_data["sellingPriceRWF"] = sell_p
        set_session("product_enter_cost", step_data)
        return {"reply": f"Enter the *Purchase / Cost Price* per unit in RWF for {step_data['name']} (e.g. *7000*):", "action": "product_enter_cost"}

    if current_step == "product_enter_cost":
        cost_p = _parse_positive_number(clean_text)
        if cost_p is None:
            return {"reply": "Please enter a valid cost price in RWF (e.g. *7000*).", "action": "product_cost_retry"}
        step_data["costPriceRWF"] = cost_p
        set_session("product_enter_qty", step_data)
        return {"reply": f"Enter the *Opening Stock Quantity* for {step_data['name']} (e.g. *10*):", "action": "product_enter_qty"}

    if current_step == "product_enter_qty":
        qty = _parse_positive_number(clean_text)
        if qty is None:
            return {"reply": "Please enter a valid opening stock quantity (e.g. *10*).", "action": "product_qty_retry"}
        step_data["quantity"] = qty
        set_session("confirm_product", step_data)
        qty_disp = int(qty) if qty.is_integer() else qty
        return {
            "reply": _format_verification_card(
                "NEW PRODUCT",
                [
                    ("Product Name", str(step_data["name"])),
                    ("Selling Price", _fmt_rwf(step_data["sellingPriceRWF"])),
                    ("Cost Price", _fmt_rwf(step_data["costPriceRWF"])),
                    ("Opening Stock", f"{qty_disp} unit(s)"),
                ],
            ),
            "action": "confirm_product",
        }

    # --- FAST-PATH READ COMMANDS ---
    if upper_text in ("1", "PRODUCTS", "STOCK", "ITEMS", "CATALOG"):
        set_session(None)
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        items = _catalog_items(ws, arch_id)
        if not items:
            return {
                "reply": f"*{business_name} Catalog* is currently empty.\nReply *8* to add your first product.",
                "action": "list_products_empty",
            }
        lines = [f"*{business_name} — Database Items ({len(items)} total):*"]
        for idx, item in enumerate(items[:15], start=1):
            name = item.get("title") or item.get("name") or item.get("id")
            qty = item.get("quantity") if item.get("quantity") is not None else item.get("currentStock", 0)
            price = item.get("sellingPriceRWF") or item.get("amountRWF") or item.get("unitCostRWF") or 0
            lines.append(f"*{idx}.* {name} — Stock: *{qty}* | {_fmt_rwf(price)}")
        if len(items) > 15:
            lines.append(f"...and {len(items) - 15} more in your ExBOS Dashboard.")
        lines.append("\nReply *2* to record a Sale or *0* for Main Menu.")
        return {"reply": "\n".join(lines), "action": "list_products", "count": len(items)}

    if upper_text in ("5", "REPORT", "REPORTS", "PNL", "SUMMARY", "MONEY"):
        set_session(None)
        return {"reply": _build_report_text(db, scope_key, arch_id, business_name), "action": "report"}

    if upper_text in ("6", "UNPAID", "DEBTS", "OWED"):
        set_session(None)
        unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
        if not unpaid:
            return {"reply": "All customers are *Paid in Full*. Zero unpaid balances right now.", "action": "list_unpaid_empty"}
        lines = [f"*Unpaid Customers ({len(unpaid)}):*"]
        for idx, u in enumerate(unpaid[:10], start=1):
            lines.append(
                f"*{idx}.* {u['customerName']} ({u['productsBought']})\n"
                f"   Paid: {_fmt_rwf(u['paidAmountRWF'])} | *Remaining: {_fmt_rwf(u['remainingAmountRWF'])}*"
            )
        lines.append("\nCommands:\n- `REMIND ALL` — send reminders to all\n- `REMIND <Name>` — remind one client\n- `VERIFY <Name>` — confirm payment & clear list")
        return {"reply": "\n".join(lines), "action": "list_unpaid"}

    if upper_text.startswith("REMIND"):
        set_session(None)
        arg = clean_text[6:].strip() or "ALL"
        res = send_debt_reminders(db, scope_key, arch_id, target_id=arg, business_name=business_name)
        return {
            "reply": (
                "WhatsApp Reminders Processed:\n"
                f"- Targeted: {res['totalTargeted']}\n"
                f"- Dispatched/Queued: {res['dispatchedCount']}\n"
                f"- Skipped (no phone): {res['skippedCount']}"
            ),
            "action": "send_reminders",
            "result": res,
        }

    if upper_text.startswith("VERIFY"):
        set_session(None)
        arg = clean_text[6:].strip()
        if not arg:
            return {"reply": "Usage: `VERIFY <Customer Name or Sale ID>` (optional amount at end).", "action": "verify_usage"}
        parts = arg.split()
        amt = None
        if len(parts) >= 2 and re.match(r"^\d+(\.\d+)?$", parts[-1].replace(",", "")):
            amt = float(parts[-1].replace(",", ""))
            target = " ".join(parts[:-1])
        else:
            target = arg
        res = verify_customer_payment(db, scope_key, arch_id, target_id=target, amount=amt, source="WhatsApp")
        if not res.get("ok"):
            return {"reply": res.get("error", "Could not verify payment."), "action": "verify_failed"}
        return {
            "reply": (
                "*PAYMENT VERIFIED*\n"
                f"- Customer: *{res['customerName']}*\n"
                f"- Verified Paid: *{_fmt_rwf(res['paidNowRWF'])}*\n"
                f"- Remaining: *{_fmt_rwf(res['remainingAmountRWF'])}* ({res['status']})\n"
                + ("Customer removed from Unpaid List." if res["clearedFromUnpaidList"] else "")
            ),
            "action": "payment_verified",
            "result": res,
        }

    # --- FAST-PATH WRITE COMMANDS (ALL ROUTE TO VERIFICATION BEFORE SAVING!) ---
    if upper_text.startswith("SALE "):
        m = re.match(r"^SALE\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+(\d+(?:,\d{3})*))?$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `SALE <qty> <product name> [amountRWF]`\nOr reply *2* for guided step-by-step Sale.", "action": "sale_usage"}
        qty = float(m.group(1))
        item_query = m.group(2).strip()
        explicit_amt = float(m.group(3).replace(",", "")) if m.group(3) else None

        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        matched = _fuzzy_match_product(catalog, item_query)
        if not matched:
            set_session("sale_pick_product", {})
            return {
                "reply": (
                    f"No product matched `{item_query}` in your catalog.\n"
                    "Please choose the exact product below:\n\n"
                    + _format_product_picker(business_name, catalog, "Sale")
                ),
                "action": "sale_pick_product",
            }

        item_name = str(matched.get("title") or matched.get("name"))
        avail_qty = float(matched.get("quantity") if matched.get("quantity") is not None else matched.get("currentStock") or 0)
        unit_price = float(matched.get("sellingPriceRWF") or matched.get("amountRWF") or 0)
        unit_cost = float(matched.get("purchasePriceRWF") or matched.get("unitCostRWF") or 0)
        if avail_qty > 0 and qty > avail_qty:
            avail_disp = int(avail_qty) if avail_qty.is_integer() else avail_qty
            return {
                "reply": f"*{item_name}* only has *{avail_disp} unit(s)* in stock. Please enter a quantity of {avail_disp} or less.",
                "action": "sale_qty_exceeds_stock",
            }
        total_amt = explicit_amt if explicit_amt is not None else round(qty * unit_price, 2)
        if total_amt <= 0:
            return {"reply": f"Please include the sale amount or set a price on *{item_name}*.", "action": "sale_needs_amount"}

        effective_unit = round(total_amt / qty, 2) if qty > 0 else total_amt
        rem_stock = max(0.0, avail_qty - qty)
        qty_disp = int(qty) if qty.is_integer() else qty
        rem_disp = int(rem_stock) if rem_stock.is_integer() else rem_stock
        set_session(
            "confirm_sale",
            {
                "productId": matched.get("id"),
                "productTitle": item_name,
                "availableStock": avail_qty,
                "qty": qty,
                "unitPriceRWF": effective_unit,
                "unitCostRWF": unit_cost,
                "totalAmountRWF": total_amt,
                "paymentMethod": "Cash / MoMo",
                "paymentStatus": "Paid in Full",
                "customerName": "Walk-in Client",
            },
        )
        return {
            "reply": _format_verification_card(
                "NEW SALE",
                [
                    ("Product", item_name),
                    ("Quantity", f"{qty_disp} unit(s)"),
                    ("Stock After Sale", f"{rem_disp} unit(s)"),
                    ("Unit Price", _fmt_rwf(effective_unit)),
                    ("Total Amount", _fmt_rwf(total_amt)),
                    ("Payment", "Cash / MoMo (Paid in Full)"),
                ],
            ),
            "action": "confirm_sale",
        }

    if upper_text.startswith("PURCHASE "):
        m = re.match(r"^PURCHASE\s+(\d+(?:\.\d+)?)\s+(.+?)\s+(\d+(?:,\d{3})*)$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `PURCHASE <qty> <item> <totalAmountRWF>`\nOr reply *3* for guided Purchase.", "action": "purchase_usage"}
        qty = float(m.group(1))
        item_query = m.group(2).strip()
        total_amt = float(m.group(3).replace(",", ""))
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        matched = _fuzzy_match_product(_catalog_items(ws, arch_id), item_query)
        item_name = str(matched.get("title") or matched.get("name")) if matched else item_query
        qty_disp = int(qty) if qty.is_integer() else qty
        set_session(
            "confirm_purchase",
            {
                "productId": matched.get("id") if matched else None,
                "productTitle": item_name,
                "qty": qty,
                "totalAmountRWF": total_amt,
            },
        )
        return {
            "reply": _format_verification_card(
                "NEW PURCHASE / RESTOCK",
                [
                    ("Item", item_name),
                    ("Quantity", f"{qty_disp} unit(s)"),
                    ("Unit Cost", _fmt_rwf(total_amt / qty)),
                    ("Total Cost", _fmt_rwf(total_amt)),
                ],
            ),
            "action": "confirm_purchase",
        }

    if upper_text.startswith("EXPENSE "):
        m = re.match(r"^EXPENSE\s+(.+?)\s+(\d+(?:,\d{3})*)$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `EXPENSE <description> <amountRWF>`\nOr reply *4* for guided Expense.", "action": "expense_usage"}
        title = m.group(1).strip()
        amt = float(m.group(2).replace(",", ""))
        set_session("confirm_expense", {"title": title, "amountRWF": amt})
        return {
            "reply": _format_verification_card(
                "NEW EXPENSE",
                [("Description", title), ("Amount", _fmt_rwf(amt)), ("Status", "Paid")],
            ),
            "action": "confirm_expense",
        }

    if upper_text.startswith("ADD PRODUCT "):
        m = re.match(r"^ADD PRODUCT\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `ADD PRODUCT <Name> <SellPrice> <CostPrice> <Qty>`\nOr reply *8* for guided setup.", "action": "add_product_usage"}
        name, sell_p, cost_p, qty = m.group(1).strip(), float(m.group(2)), float(m.group(3)), float(m.group(4))
        set_session(
            "confirm_product",
            {"name": name, "sellingPriceRWF": sell_p, "costPriceRWF": cost_p, "quantity": qty},
        )
        return {
            "reply": _format_verification_card(
                "NEW PRODUCT",
                [
                    ("Product Name", name),
                    ("Selling Price", _fmt_rwf(sell_p)),
                    ("Cost Price", _fmt_rwf(cost_p)),
                    ("Opening Stock", f"{int(qty)} unit(s)"),
                ],
            ),
            "action": "confirm_product",
        }

    # --- NUMBERED INTERACTIVE GUIDED MENU TRIGGERS ---
    if upper_text == "2":
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        if not catalog:
            set_session(None)
            return {
                "reply": f"*{business_name}* has no products in the database yet.\nReply *8* to add a product first.",
                "action": "sale_no_products",
            }
        set_session("sale_pick_product", {})
        return {
            "reply": _format_product_picker(business_name, catalog, "Sale"),
            "action": "sale_pick_product",
        }

    if upper_text == "3":
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        set_session("purchase_pick_product", {})
        if catalog:
            return {
                "reply": _format_product_picker(business_name, catalog, "Purchase / Restock"),
                "action": "purchase_pick_product",
            }
        return {
            "reply": "Enter the *Item Name* you are purchasing (or reply *0* to cancel):",
            "action": "purchase_pick_product",
        }

    if upper_text == "4":
        set_session("expense_enter_title", {})
        cat_lines = "\n".join(f"*{k}.* {v}" for k, v in EXPENSE_CATEGORIES.items())
        return {
            "reply": (
                f"*{business_name} — Record an Expense*\n"
                "Select a category or type your own description:\n"
                f"{cat_lines}\n\n"
                "Reply *1–6*, type a custom title, or *0* to cancel."
            ),
            "action": "expense_enter_title",
        }

    if upper_text == "7":
        set_session(None)
        unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
        if not unpaid:
            return {"reply": "No unpaid customers found to verify right now. Reply *0* for Main Menu.", "action": "verify_none"}
        lines = ["*Select Customer to Verify Payment:*"]
        for idx, u in enumerate(unpaid[:10], start=1):
            lines.append(f"*{idx}.* {u['customerName']} — Owed: *{_fmt_rwf(u['remainingAmountRWF'])}*")
        lines.append("\nReply `VERIFY <Customer Name>` (e.g. `VERIFY Jean`) or *0* for Menu.")
        return {"reply": "\n".join(lines), "action": "prompt_verify"}

    if upper_text == "8":
        set_session("product_enter_name", {})
        return {
            "reply": f"*{business_name} — Add New Product*\n\nEnter the *Product Name* (e.g. *Airtel Router 4G*), or *0* to cancel:",
            "action": "product_enter_name",
        }

    # Fallback: friendly, executive prompt without harsh error wording
    return {
        "reply": (
            f"I could not match `{clean_text}` to a menu option.\n\n"
            + build_welcome_message(business_name, arch_id)
        ),
        "action": "fallback_menu",
    }
