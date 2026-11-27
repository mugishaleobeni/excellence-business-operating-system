import difflib
from functools import partial
import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Optional

from app.seed_defaults import create_empty_record_buckets, get_default_workspaces
from app.services.catalog_sync import (
    mirror_product_to_products_collection,
    mirror_record_to_module_records,
    sync_catalog_product_delete,
    sync_catalog_product_update,
)
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


def _matches_branch(rec: Any, branch_id: Optional[str]) -> bool:
    """Return True if a record belongs to the requested branch (or if no branch restriction applies)."""
    if not branch_id:
        return True
    if not isinstance(rec, dict):
        return False
    return str(rec.get("branchId") or "main").strip() == str(branch_id).strip()


def _catalog_items(ws: dict[str, Any], arch_id: str, branch_id: Optional[str] = None) -> list[dict[str, Any]]:
    records = ws.get("records") or {}
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])["catalog"]
    seen: set[str] = set()
    items: list[dict[str, Any]] = []
    for b in buckets:
        for item in records.get(b) or []:
            if not _matches_branch(item, branch_id):
                continue
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
    branch_id: Optional[str] = None,
) -> dict[str, Any]:
    """Insert a record into workspaces.records[module_name] and sync 1 canonical transaction."""
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    today_str = now.strftime("%Y-%m-%d")
    rec_id = str(record.get("id") or f"{module_name[:3].upper()}-{int(time.time() * 1000) % 1000000}")
    effective_branch = str(branch_id or record.get("branchId") or "main").strip()
    entry = {
        "id": rec_id,
        "date": today_str,
        "source": "WhatsApp",
        "branchId": effective_branch,
        **record,
    }
    entry["branchId"] = effective_branch

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

    # Mirror EVERY WhatsApp record (Sales, Purchases, Expenses, Products, Customers) into canonical collections
    # so Web Frontend and WhatsApp share 100% of the exact same MongoDB collections!
    mirror_record_to_module_records(db, scope_key, arch_id, module_name, entry, now_iso)
    if module_name in ("Products", "Inventory", "RawMaterials", "Services", "MenuItems", "HybridItems"):
        mirror_product_to_products_collection(db, scope_key, arch_id, entry, now_iso)
        if module_name == "Products":
            inv_list = list(records.get("Inventory") or [])
            inv_list = [entry] + [r for r in inv_list if str(r.get("id")) != rec_id]
            records["Inventory"] = inv_list
            db.workspaces.update_one(
                {"scopeKey": scope_key, "architectureId": arch_id},
                {"$set": {"records.Inventory": inv_list, "updated_at": now_iso}},
            )
            mirror_record_to_module_records(db, scope_key, arch_id, "Inventory", entry, now_iso)

    if tx_type and tx_amount > 0:
        tx_id = f"TX-{int(time.time() * 1000) % 10000000}"
        tx_doc = {
            "id": tx_id,
            "scopeKey": scope_key,
            "architectureId": arch_id,
            "branchId": effective_branch,
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


def get_unpaid_customers_summary(
    db: Any,
    scope_key: str,
    arch_id: str,
    branch_id: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Collect all unpaid / part-paid sales and customer debt records, including
    products bought, amount paid, and remaining balance owed.
    """
    ws = _get_or_init_workspace(db, scope_key, arch_id)
    records = ws.get("records") or {}
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])
    sales_bucket = buckets["sales"]

    customers = [c for c in (records.get("Customers") or []) if _matches_branch(c, branch_id)]
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
        if not _matches_branch(s, branch_id):
            continue
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
    branch_id: Optional[str] = None,
) -> dict[str, Any]:
    """
    Send WhatsApp debt reminders showing products bought, amount paid, and remaining balance.
    If target_id is None or 'ALL', sends to all unpaid customers with a valid phone number.
    """
    unpaid = get_unpaid_customers_summary(db, scope_key, arch_id, branch_id=branch_id)
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
            "sent": bool(res.get("sent")),
            "waMeLink": res.get("waMeLink") or "",
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
    branch_id: Optional[str] = None,
) -> dict[str, Any]:
    """
    Business owner verifies that an unpaid customer has paid.
    Updates sale/customer record, clears remaining balance if fully paid (removing from unpaid list),
    and posts an INFLOW transaction.
    """
    ws = _get_or_init_workspace(db, scope_key, arch_id)
    records = ws.get("records") or {}
    unpaid = get_unpaid_customers_summary(db, scope_key, arch_id, branch_id=branch_id)
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


def _build_report_text(
    db: Any,
    scope_key: str,
    arch_id: str,
    business_name: str,
    branch_id: Optional[str] = None,
    hide_profit: bool = False,
) -> str:
    ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
    records = ws.get("records") or {}
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])

    sales_raw = list(records.get(buckets["sales"]) or []) + (
        list(records.get("Sales") or []) if buckets["sales"] != "Sales" else []
    )
    sales_list = [s for s in sales_raw if _matches_branch(s, branch_id)]
    purchases_list = [p for p in (records.get(buckets["purchases"]) or []) if _matches_branch(p, branch_id)]
    expenses_list = [e for e in (records.get(buckets["expenses"]) or []) if _matches_branch(e, branch_id)]
    catalog = _catalog_items(ws, arch_id, branch_id=branch_id)
    unpaid = get_unpaid_customers_summary(db, scope_key, arch_id, branch_id=branch_id)

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
    profit_line = "" if hide_profit else f"- *Net Profit:* *{_fmt_rwf(net_profit)}*\n"

    return (
        f"*{business_name} — Live Business Report*\n"
        f"Architecture: *{ARCH_LABELS.get(arch_id, arch_id)}*\n\n"
        f"- *Total Sales:* {_fmt_rwf(total_sales)} ({len(sales_list)} records)\n"
        f"- *Total Purchases:* {_fmt_rwf(total_purchases)} ({len(purchases_list)} records)\n"
        f"- *Total Expenses:* {_fmt_rwf(total_expenses)} ({len(expenses_list)} records)\n"
        f"{profit_line}"
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
    branch_id: Optional[str] = None,
) -> Optional[float]:
    """Update product stock quantity across ALL catalog buckets + db.products + db.module_records."""
    if not product_id or db is None:
        return None
    updates: dict[str, Any] = {"deltaQty": float(delta_qty)}
    if new_unit_cost is not None and new_unit_cost > 0:
        updates["costPriceRWF"] = float(new_unit_cost)
    updated = sync_catalog_product_update(
        db,
        scope_key,
        arch_id,
        product_id=str(product_id),
        updates=updates,
        branch_id=branch_id,
    )
    if not updated:
        return None
    new_qty = float(updated.get("quantity") or 0)
    if float(delta_qty) < 0 and new_qty <= 0:
        from app.services.owner_audit_notifier import notify_out_of_stock_whatsapp
        notify_out_of_stock_whatsapp(
            db,
            scope_key=scope_key,
            branch_id=str(updated.get("branchId") or branch_id or "main"),
            product_title=str(updated.get("title") or updated.get("name") or product_id),
            product_id=str(product_id),
            sku=str(updated.get("sku") or ""),
            unit=str(updated.get("unit") or "piece"),
            remaining_qty=new_qty,
        )
    return new_qty


def _update_catalog_product(
    db: Any,
    scope_key: str,
    arch_id: str,
    product_id: str,
    bucket: str,
    updates: dict[str, Any],
    branch_id: Optional[str] = None,
) -> Optional[dict[str, Any]]:
    """Update a product across ALL catalog buckets (Products + Inventory) + db.products + db.module_records."""
    return sync_catalog_product_update(
        db,
        scope_key,
        arch_id,
        product_id=str(product_id),
        updates=updates,
        branch_id=branch_id,
        primary_bucket=bucket,
    )


def _delete_catalog_product(
    db: Any,
    scope_key: str,
    arch_id: str,
    product_id: str,
    bucket: str = "",
    branch_id: Optional[str] = None,
) -> bool:
    """Permanently delete a product across ALL catalog buckets + db.products + db.module_records."""
    return sync_catalog_product_delete(
        db,
        scope_key,
        arch_id,
        product_id=str(product_id),
        branch_id=branch_id,
        primary_bucket=bucket,
    )


def _t(lang: str, en: str, rw: str) -> str:
    return rw if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda") else en


def _format_verification_card(title_en: str, rows: list[tuple[str, str]], lang: str = "en", title_rw: Optional[str] = None) -> str:
    """Render a clear, executive verification prompt with YES / EDIT / NO options before writing to MongoDB."""
    is_rw = str(lang or "en").lower() in ("rw", "kin", "kinyarwanda")
    header = f"*GENZURA MBERE YO KUBIKA — {title_rw or title_en}*" if is_rw else f"*VERIFY BEFORE SAVING — {title_en}*"
    lines = [header, "--------------------------------"]
    for label, val in rows:
        lines.append(f"- {label}: *{val}*")
    lines.append("--------------------------------")
    if is_rw:
        lines.extend([
            "Subiza *YEGO* (cyangwa *YES*) wemeze ubike muri ExBOS.",
            "Subiza *HINDURA* (cyangwa *EDIT*) ugire icyo ukosora.",
            "Subiza *OYA* (cyangwa *0*) uhagarike.",
        ])
    else:
        lines.extend([
            "Reply *YES* to confirm and save to ExBOS.",
            "Reply *EDIT* to change any detail before saving.",
            "Reply *NO* (or *0*) to cancel.",
        ])
    return "\n".join(lines)


def _format_product_picker(business_name: str, catalog: list[dict[str, Any]], action_label: str, lang: str = "en") -> str:
    is_rw = str(lang or "en").lower() in ("rw", "kin", "kinyarwanda")
    lines = [
        f"*{business_name} — Hitamo Igicuruzwa ({action_label}):*"
        if is_rw
        else f"*{business_name} — Select Product for {action_label}:*"
    ]
    for idx, item in enumerate(catalog[:15], start=1):
        name = item.get("title") or item.get("name") or item.get("id")
        qty = item.get("quantity") if item.get("quantity") is not None else item.get("currentStock", 0)
        price = item.get("sellingPriceRWF") or item.get("amountRWF") or item.get("unitCostRWF") or 0
        stock_word = "Ububiko" if is_rw else "Stock"
        lines.append(f"*{idx}.* {name} — {stock_word}: *{qty}* | {_fmt_rwf(price)}")
    if is_rw:
        lines.append("\nSubiza *umubare w'igicuruzwa* (urugero: *1*) cyangwa wandike izina ryacyo.")
        lines.append("Subiza *0* uhagarike.")
    else:
        lines.append("\nReply with the *product number* (e.g. *1*) or type the product name.")
        lines.append("Reply *0* to cancel.")
    return "\n".join(lines)


def _save_customer_phone_on_record(
    db: Any,
    scope_key: str,
    arch_id: str,
    record_id: str,
    bucket: str,
    customer_name: str,
    phone: str,
    branch_id: Optional[str] = None,
) -> str:
    """Persist a customer's WhatsApp phone number onto their Sale/Customer record and Customers directory."""
    normalized = normalize_phone(phone)
    if not normalized or db is None:
        return ""
    ws = _get_or_init_workspace(db, scope_key, arch_id)
    records = ws.get("records") or {}
    now_iso = datetime.now(timezone.utc).isoformat()
    effective_branch = str(branch_id or "main").strip()

    # 1. Update matching sale/record in its bucket
    if bucket and record_id:
        bucket_list = list(records.get(bucket) or [])
        for idx, rec in enumerate(bucket_list):
            if str(rec.get("id") or "") == str(record_id) and _matches_branch(rec, branch_id):
                upd = dict(rec)
                if bucket == "Customers":
                    upd["phone"] = normalized
                else:
                    upd["customerPhone"] = normalized
                bucket_list[idx] = upd
                break
        records[bucket] = bucket_list

    # 2. Also upsert/update matching customer in Customers directory for future reminders
    cust_list = list(records.get("Customers") or [])
    cname_low = str(customer_name or "").strip().lower()
    matched_cust = False
    if cname_low and cname_low != "walk-in client":
        for idx, c in enumerate(cust_list):
            if str(c.get("title") or c.get("name") or "").strip().lower() == cname_low and _matches_branch(c, branch_id):
                c_upd = dict(c)
                c_upd["phone"] = normalized
                cust_list[idx] = c_upd
                matched_cust = True
                break
        if not matched_cust:
            cust_list.insert(0, {
                "id": f"CUS-{int(time.time() * 1000) % 1000000}",
                "title": customer_name,
                "name": customer_name,
                "phone": normalized,
                "branchId": effective_branch,
                "status": "Active",
                "source": "WhatsApp",
                "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            })
        records["Customers"] = cust_list

    db.workspaces.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id},
        {"$set": {"records": records, "updated_at": now_iso}},
    )
    return normalized


def _sale_verification_rows(step_data: dict[str, Any], lang: str = "en") -> list[tuple[str, str]]:
    qty = float(step_data.get("qty") or 1)
    qty_disp = int(qty) if qty.is_integer() else qty
    rem_stock = max(0.0, float(step_data.get("availableStock") or 0) - qty)
    rem_disp = int(rem_stock) if rem_stock.is_integer() else rem_stock
    pm_name = str(step_data.get("paymentMethod") or "Cash")
    pm_status = str(step_data.get("paymentStatus") or "Paid in Full")
    cust_name = str(step_data.get("customerName") or "Walk-in Client")
    cust_phone = str(step_data.get("customerPhone") or "").strip()
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        rows = [
            ("Igicuruzwa", str(step_data.get("productTitle") or "")),
            ("Umubare", f"{qty_disp}"),
            ("Ibisigara mu Bubiko", f"{rem_disp}"),
            ("Igiciro kuri Kimwe", _fmt_rwf(step_data.get("unitPriceRWF") or 0)),
            ("Igiteranyo", _fmt_rwf(step_data.get("totalAmountRWF") or 0)),
            ("Ubwishyu", f"{pm_name} ({pm_status})"),
            ("Umukiriya", cust_name),
        ]
        if cust_phone:
            rows.append(("WhatsApp y'Umukiriya", cust_phone))
        return rows
    rows = [
        ("Product", str(step_data.get("productTitle") or "")),
        ("Quantity", f"{qty_disp} unit(s)"),
        ("Stock After Sale", f"{rem_disp} unit(s)"),
        ("Unit Price", _fmt_rwf(step_data.get("unitPriceRWF") or 0)),
        ("Total Amount", _fmt_rwf(step_data.get("totalAmountRWF") or 0)),
        ("Payment", f"{pm_name} ({pm_status})"),
        ("Customer", cust_name),
    ]
    if cust_phone:
        rows.append(("Customer WhatsApp", cust_phone))
    return rows


def _reminder_verification_rows(step_data: dict[str, Any], lang: str = "en") -> list[tuple[str, str]]:
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return [
            ("Umukiriya", str(step_data.get("customerName") or "")),
            ("Nimero ya WhatsApp", str(step_data.get("customerPhone") or "")),
            ("Ibyo Yaguze", str(step_data.get("productsBought") or "")),
            ("Ayishyuye", _fmt_rwf(step_data.get("paidAmountRWF") or 0)),
            ("Ideni Risigaye", _fmt_rwf(step_data.get("remainingAmountRWF") or 0)),
        ]
    return [
        ("Customer", str(step_data.get("customerName") or "")),
        ("WhatsApp Number", str(step_data.get("customerPhone") or "")),
        ("Items Bought", str(step_data.get("productsBought") or "")),
        ("Amount Paid", _fmt_rwf(step_data.get("paidAmountRWF") or 0)),
        ("Remaining Balance", _fmt_rwf(step_data.get("remainingAmountRWF") or 0)),
    ]


def _purchase_verification_rows(step_data: dict[str, Any], lang: str = "en") -> list[tuple[str, str]]:
    qty = float(step_data.get("qty") or 1)
    amt = float(step_data.get("totalAmountRWF") or 0)
    qty_disp = int(qty) if qty.is_integer() else qty
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return [
            ("Igicuruzwa", str(step_data.get("productTitle") or "")),
            ("Umubare", f"{qty_disp}"),
            ("Igiciro kuri Kimwe", _fmt_rwf(amt / qty if qty else amt)),
            ("Igiteranyo cy'Irangura", _fmt_rwf(amt)),
            ("Ububiko", "Byakiriwe (Byongera ububiko)"),
        ]
    return [
        ("Item", str(step_data.get("productTitle") or "")),
        ("Quantity", f"{qty_disp} unit(s)"),
        ("Unit Cost", _fmt_rwf(amt / qty if qty else amt)),
        ("Total Cost", _fmt_rwf(amt)),
        ("Delivery Status", "Received (Updates Stock)"),
    ]


def _expense_verification_rows(step_data: dict[str, Any], lang: str = "en") -> list[tuple[str, str]]:
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return [
            ("Igisobanuro", str(step_data.get("title") or "")),
            ("Amafaranga", _fmt_rwf(step_data.get("amountRWF") or 0)),
            ("Uko Bihagaze", "Yishyuwe"),
        ]
    return [
        ("Description", str(step_data.get("title") or "")),
        ("Amount", _fmt_rwf(step_data.get("amountRWF") or 0)),
        ("Status", "Paid"),
    ]


def _format_profit_margin_row(sell: float, cost: float, lang: str = "en") -> tuple[str, str]:
    """Compute frontend-parity unit profit, margin %, and explicit LOSS WARNING when cost > selling."""
    profit = sell - cost
    margin = round((profit / sell) * 100, 1) if sell > 0 else 0.0
    is_rw = str(lang or "en").lower() in ("rw", "kin", "kinyarwanda")
    if profit < 0:
        loss_abs = _fmt_rwf(abs(profit))
        if is_rw:
            return (
                "UMUBURO W'IGIHOMBO",
                f"-{loss_abs} kuri kimwe (Irangura riruta kugurisha! Subiza HINDURA ukosore)",
            )
        return (
            "WARNING (LOSS PER UNIT)",
            f"-{loss_abs} ({margin}%) — Cost exceeds Selling Price! Reply EDIT to fix",
        )
    if is_rw:
        return ("Inyungu kuri Kimwe", f"+{_fmt_rwf(profit)} ({margin}%)")
    return ("Expected Unit Profit", f"+{_fmt_rwf(profit)} ({margin}% margin)")


def _product_verification_rows(step_data: dict[str, Any], lang: str = "en") -> list[tuple[str, str]]:
    qty = float(step_data.get("quantity") or 0)
    qty_disp = int(qty) if qty.is_integer() else qty
    sell = float(step_data.get("sellingPriceRWF") or 0)
    cost = float(step_data.get("costPriceRWF") or 0)
    profit_row = _format_profit_margin_row(sell, cost, lang)
    if str(lang or "en").lower() in ("rw", "kin", "kinyarwanda"):
        return [
            ("Izina ry'Igicuruzwa", str(step_data.get("name") or "")),
            ("Igiciro cyo Kugurisha", _fmt_rwf(sell)),
            ("Igiciro cy'Irangura", _fmt_rwf(cost)),
            profit_row,
            ("Ububiko bw'Itangiriro", f"{qty_disp}"),
        ]
    return [
        ("Product Name", str(step_data.get("name") or "")),
        ("Selling Price", _fmt_rwf(sell)),
        ("Cost Price", _fmt_rwf(cost)),
        profit_row,
        ("Opening Stock", f"{qty_disp} unit(s)"),
    ]


GREETING_WORDS = {
    "0", "MENU", "HELP", "HI", "HY", "HEY", "HELLO", "START",
    "MURAHO", "MWARAMUTSE", "MWIRIWE", "BONJOUR", "SALUT",
    "GOOD MORNING", "GOOD AFTERNOON", "GOOD EVENING",
}

CONFIRM_WORDS = {"YES", "Y", "CONFIRM", "OK", "YEGO", "SAVE", "SURE"}
EDIT_WORDS = {"EDIT", "CHANGE", "MODIFY", "UPDATE", "HINDURA", "KOSORA"}
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
    media_data: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Executive guided WhatsApp POS & Operations Engine.
    - Unregistered numbers enter the full 7-step ExBOS Account Setup & Account Linking engine.
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

    # If not matched directly on db.users, check if phone is registered as a Super Admin recipient
    if user_doc is None and normalized_phone:
        from app.services.whatsapp_super_admin import resolve_super_admin_by_registered_recipient
        user_doc = resolve_super_admin_by_registered_recipient(db, normalized_phone)

    if not user_doc:
        from app.services.whatsapp_onboarding import handle_unregistered_whatsapp_message
        return handle_unregistered_whatsapp_message(
            db,
            normalized_phone,
            clean_text,
            media_data=media_data,
        )

    from app.services.whatsapp_super_admin import (
        handle_super_admin_whatsapp_message,
        is_whatsapp_super_admin,
    )
    is_sa = is_whatsapp_super_admin(user_doc, normalized_phone)

    scope_key = (user_doc.get("ownerScopeKey") or user_doc.get("email") or "").strip().lower()
    arch_id = user_doc.get("architectureId") or "buy-and-sell"
    business_name = user_doc.get("businessName") or user_doc.get("name") or "ExBOS Business"
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])

    # Load preferred WhatsApp language ('en' or 'rw') from user profile
    lang = str(user_doc.get("whatsappLanguage") or user_doc.get("language") or "en").strip().lower()
    if lang not in ("en", "rw"):
        lang = "rw" if lang in ("kin", "kinyarwanda") else "en"

    # Strict Branch Manager Isolation: a Branch Manager ONLY sees & modifies their own branch's data
    role_str = str(user_doc.get("role") or "").strip().lower()
    assigned_branch_id = str(user_doc.get("assignedBranchId") or "").strip()
    is_branch_manager = role_str == "branch manager" or (bool(assigned_branch_id) and assigned_branch_id != "main")

    # Immediately block deactivated / suspended users (including cut-off Branch Managers) from WhatsApp POS
    acct_status = str(user_doc.get("accountStatus") or "Active").strip().lower()
    if not is_sa and acct_status in ("suspended", "deactivated", "deleted"):
        db.whatsapp_sessions.delete_one({"phone": normalized_phone})
        if lang == "rw":
            return (
                "Konti yawe ya ExBOS yahagaritswe n'umuyobozi w'ubucuruzi. "
                "Ntushobora gukoresha WhatsApp POS. Vugana na nyiri ubucuruzi kugira ngo yongere gufungurwa."
            )
        return (
            "Your ExBOS access has been deactivated by the Business Owner. "
            "WhatsApp POS operations are disabled for this account. Please contact your Business Owner."
        )

    # Live Subscription Entitlement Check for WhatsApp Business POS Chat
    # (Super Admins always bypass; Branch Managers inherit their Business Owner's active subscription)
    if not is_sa:
        from app.utils.entitlements import get_all_plan_limits, get_effective_plan, get_plan_limits

        user_email_lower = str(user_doc.get("email") or "").strip().lower()
        if scope_key and scope_key != user_email_lower:
            owner_sub_doc = db.users.find_one({"email": scope_key}, {"_id": 0}) or user_doc
        else:
            owner_sub_doc = user_doc

        eff_res = get_effective_plan(owner_sub_doc)
        if isinstance(eff_res, tuple):
            eff_plan, is_plan_expired = str(eff_res[0] or "free"), bool(eff_res[1])
        else:
            eff_plan, is_plan_expired = str(eff_res or "free"), False
        plan_limits = get_plan_limits(eff_plan, db=db)
        if not bool(plan_limits.get("allowWhatsappAutomation", False)):
            # Still allow language toggle (EN / RW) so users can read the upgrade notice in their preferred language
            if upper_text in ("EN", "ENGLISH", "RW", "KIN", "KINYARWANDA"):
                new_lang = "rw" if upper_text in ("RW", "KIN", "KINYARWANDA") else "en"
                if user_email_lower:
                    db.users.update_one(
                        {"email": user_email_lower},
                        {"$set": {"whatsappLanguage": new_lang, "language": new_lang}},
                    )
                lang = new_lang

            db.whatsapp_sessions.delete_one({"phone": normalized_phone})
            all_plans = get_all_plan_limits(db=db)
            bronze_p = int((all_plans.get("bronze") or {}).get("priceRWF") or 10000)
            silver_p = int((all_plans.get("silver") or {}).get("priceRWF") or 20000)
            gold_p = int((all_plans.get("gold") or {}).get("priceRWF") or 35000)
            raw_plan_label = str(owner_sub_doc.get("planTier") or owner_sub_doc.get("plan") or "Free").strip()
            was_paid_expired = is_plan_expired or (raw_plan_label.lower() not in ("", "free", "forever free") and eff_plan == "free")
            status_en = f"{raw_plan_label} (Expired)" if was_paid_expired else "Forever Free"
            status_rw = f"{raw_plan_label} (Yarangiye)" if was_paid_expired else "Forever Free (Ubuntu)"
            import os as _os
            upgrade_url = _os.getenv("FRONTEND_ORIGIN", "https://exbos.pages.dev").strip().rstrip("/") + "/dashboard"

            if is_branch_manager:
                action_en = "Please ask your Business Owner to upgrade the company subscription on ExBOS to unlock WhatsApp Business POS."
                action_rw = "Saba Nyir'ubucuruzi kuzamura gahunda y'ubucuruzi muri ExBOS kugira ngo mukoreshe WhatsApp Business POS."
            else:
                action_en = (
                    f"Upgrade anytime in ExBOS Dashboard -> Settings -> Subscription & Billing:\n{upgrade_url}"
                )
                action_rw = (
                    f"Zamura gahunda muri ExBOS Dashboard -> Settings -> Subscription & Billing:\n{upgrade_url}"
                )

            return {
                "reply": _t(
                    lang,
                    (
                        "*WHATSAPP BUSINESS POS — SUBSCRIPTION REQUIRED*\n"
                        f"Business: *{business_name}*\n"
                        f"Current Plan: *{status_en}*\n"
                        "--------------------------------\n"
                        "Your current subscription plan does not include *WhatsApp Business POS Chat*.\n\n"
                        "*Available Plans with WhatsApp POS:*\n"
                        f"- *Bronze:* {bronze_p:,} RWF / month\n"
                        f"- *Silver:* {silver_p:,} RWF / month\n"
                        f"- *Gold:* {gold_p:,} RWF / month\n\n"
                        f"{action_en}\n\n"
                        "Reply *RW* for Kinyarwanda."
                    ),
                    (
                        "*WHATSAPP BUSINESS POS — BISABA KUZAMURA GAHUNDA*\n"
                        f"Ubucuruzi: *{business_name}*\n"
                        f"Gahunda Iriho: *{status_rw}*\n"
                        "--------------------------------\n"
                        "Gahunda yawe y'ubu ntabwo yemerera gukoresha *WhatsApp Business POS Chat*.\n\n"
                        "*Gahunda Zemera WhatsApp POS:*\n"
                        f"- *Bronze:* {bronze_p:,} RWF / ukwezi\n"
                        f"- *Silver:* {silver_p:,} RWF / ukwezi\n"
                        f"- *Gold:* {gold_p:,} RWF / ukwezi\n\n"
                        f"{action_rw}\n\n"
                        "Subiza *EN* usome mu Cyongereza."
                    ),
                ),
                "action": "subscription_required",
                "effectivePlan": eff_plan,
                "language": lang,
            }
    effective_branch_id: Optional[str] = assigned_branch_id if is_branch_manager and assigned_branch_id else None
    branch_frozen = False
    branch_perms: dict[str, Any] = {}
    base_business_name = business_name
    branch_display_name = ""
    if is_branch_manager and effective_branch_id:
        branch_doc = db.branches.find_one({"scopeKey": scope_key, "id": effective_branch_id}, {"_id": 0})
        if not branch_doc:
            db.whatsapp_sessions.delete_one({"phone": normalized_phone})
            return {
                "reply": _t(
                    lang,
                    "Your assigned branch has been closed or deleted by the Business Owner. WhatsApp access for this branch is disabled.",
                    "Ishami ryawe ryafunzwe cyangwa ryasibwe na nyir'ubucuruzi. Kwinjira kuri WhatsApp kuri iri shami byahagaritswe.",
                ),
                "action": "branch_deleted",
            }
        branch_name = str(branch_doc.get("name") or effective_branch_id).strip()
        branch_display_name = branch_name
        if branch_name and branch_name.lower() not in business_name.lower():
            business_name = f"{business_name} ({branch_name})"
        branch_frozen = str(branch_doc.get("status") or "Active").strip().lower() == "frozen"
        branch_perms = branch_doc.get("permissions") if isinstance(branch_doc.get("permissions"), dict) else {}

    hide_profit = bool(is_branch_manager and not branch_perms.get("canViewProfitReports", False))
    menu_role_label = (
        _t(lang, "Branch Manager", "Umuyobozi w'Ishami (Branch Manager)")
        if is_branch_manager
        else ""
    )

    # Bind branch-scoped wrappers so EVERY read & write in this request is strictly isolated to effective_branch_id
    build_welcome_message = partial(globals()["build_welcome_message"], role_label=menu_role_label)
    _catalog_items = partial(globals()["_catalog_items"], branch_id=effective_branch_id)
    _append_record_and_tx = partial(globals()["_append_record_and_tx"], branch_id=effective_branch_id or "main")
    get_unpaid_customers_summary = partial(globals()["get_unpaid_customers_summary"], branch_id=effective_branch_id)
    send_debt_reminders = partial(globals()["send_debt_reminders"], branch_id=effective_branch_id)
    verify_customer_payment = partial(globals()["verify_customer_payment"], branch_id=effective_branch_id)
    _build_report_text = partial(globals()["_build_report_text"], branch_id=effective_branch_id, hide_profit=hide_profit)
    _adjust_product_stock = partial(globals()["_adjust_product_stock"], branch_id=effective_branch_id)
    _update_catalog_product = partial(globals()["_update_catalog_product"], branch_id=effective_branch_id)
    _delete_catalog_product = partial(globals()["_delete_catalog_product"], branch_id=effective_branch_id)
    _save_customer_phone_on_record = partial(globals()["_save_customer_phone_on_record"], branch_id=effective_branch_id)

    def set_user_language(next_lang: str) -> str:
        clean_l = "rw" if str(next_lang).lower() in ("rw", "kin", "kinyarwanda", "2") else "en"
        if user_doc.get("email"):
            db.users.update_one(
                {"email": user_doc["email"]},
                {"$set": {"whatsappLanguage": clean_l, "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
        user_doc["whatsappLanguage"] = clean_l
        return clean_l

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

    # Instant Language Switch Commands (work from anywhere)
    if upper_text in ("LANG", "LANGUAGE", "URURIMI", "9") and current_step is None:
        set_session("choose_language", {})
        return {
            "reply": (
                "*Change Language / Hindura Ururimi*\n"
                "--------------------------------\n"
                "*1.* English\n"
                "*2.* Kinyarwanda\n"
                "--------------------------------\n"
                "Reply *1* for English or *2* for Kinyarwanda."
            ),
            "action": "choose_language",
        }
    if upper_text in ("ENGLISH", "EN"):
        lang = set_user_language("en")
        set_session(None)
        return {
            "reply": "Language switched to *English*.\n\n" + build_welcome_message(business_name, arch_id, lang="en", is_super_admin=is_sa),
            "action": "language_changed",
            "language": "en",
        }
    if upper_text in ("KINYARWANDA", "RW", "KIN"):
        lang = set_user_language("rw")
        set_session(None)
        return {
            "reply": "Ururimi rwahinduwe mu *Kinyarwanda*.\n\n" + build_welcome_message(business_name, arch_id, lang="rw", is_super_admin=is_sa),
            "action": "language_changed",
            "language": "rw",
        }

    if current_step == "choose_language":
        if clean_text in ("1", "EN", "en", "English", "ENGLISH"):
            lang = set_user_language("en")
            set_session(None)
            return {
                "reply": "Language switched to *English*.\n\n" + build_welcome_message(business_name, arch_id, lang="en", is_super_admin=is_sa),
                "action": "language_changed",
                "language": "en",
            }
        if clean_text in ("2", "RW", "rw", "KIN", "Kinyarwanda", "KINYARWANDA"):
            lang = set_user_language("rw")
            set_session(None)
            return {
                "reply": "Ururimi rwahinduwe mu *Kinyarwanda*.\n\n" + build_welcome_message(business_name, arch_id, lang="rw", is_super_admin=is_sa),
                "action": "language_changed",
                "language": "rw",
            }
        return {
            "reply": "Reply *1* for English or *2* for Kinyarwanda (or *0* to cancel).",
            "action": "choose_language_retry",
        }

    # Super Admin Command Center routing (strictly restricted to verified Super Admins)
    if is_sa and (
        (current_step and str(current_step).startswith("sa_"))
        or (current_step is None and upper_text in ("10", "ADMIN", "SUPERADMIN", "SUPER ADMIN"))
    ):
        return handle_super_admin_whatsapp_message(
            db=db,
            user_doc=user_doc,
            normalized_phone=normalized_phone,
            clean_text=clean_text,
            current_step=current_step,
            step_data=step_data,
            lang=lang,
            set_session=set_session,
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
            "reply": build_welcome_message(business_name, arch_id, lang=lang, is_super_admin=is_sa),
            "action": "menu",
        }

    # Frozen Branch Guard: block any write commands/confirmations while branch is frozen by owner
    if branch_frozen and (
        upper_text in ("2", "3", "4", "8", "EDIT PRODUCT", "DELETE PRODUCT")
        or upper_text.startswith(("SALE ", "PURCHASE ", "EXPENSE ", "ADD PRODUCT "))
        or current_step in (
            "confirm_sale", "confirm_purchase", "confirm_expense",
            "confirm_product", "confirm_product_edit", "confirm_product_delete",
        )
    ):
        set_session(None)
        return {
            "reply": _t(
                lang,
                "This branch is currently *FROZEN* by the Business Owner. Recording, editing, or deleting items is temporarily disabled.",
                "Iri shami rirafunzwe by'agateganyo (*FROZEN*) na nyir'ubucuruzi. Kwandika, guhindura cyangwa gusiba byahagaritswe.",
            ),
            "action": "branch_frozen",
        }

    # Global cancel when inside a guided session
    if current_step and upper_text in CANCEL_WORDS:
        set_session(None)
        return {
            "reply": _t(
                lang,
                "Action cancelled. No changes were saved to your ExBOS database.\n\nReply *0* for Main Menu.",
                "Igikorwa cyahagaritswe. Nta na kimwe cyabitswe muri ExBOS.\n\nSubiza *0* usubire ahabanza.",
            ),
            "action": "cancelled",
        }

    # =========================================================================
    # STEP-BY-STEP GUIDED SESSIONS WITH VERIFICATION (YES / EDIT / NO)
    # =========================================================================

    # --- A. CONFIRMATION & EDIT GATE: SALE ---
    if current_step == "confirm_sale":
        if upper_text in EDIT_WORDS:
            set_session("edit_sale_pick", step_data)
            return {
                "reply": _t(
                    lang,
                    (
                        "*EDIT SALE — Choose what to change:*\n"
                        "*1.* Change Product\n"
                        "*2.* Change Quantity\n"
                        "*3.* Change Unit Price (RWF)\n"
                        "*4.* Change Payment Method / Customer\n"
                        "*0.* Cancel Sale"
                    ),
                    (
                        "*HINDURA IGURISHA — Hitamo icyo ushaka guhindura:*\n"
                        "*1.* Hindura Igicuruzwa\n"
                        "*2.* Hindura Umubare\n"
                        "*3.* Hindura Igiciro kuri Kimwe (RWF)\n"
                        "*4.* Hindura Uburyo bwo Kwishyura / Umukiriya\n"
                        "*0.* Hagarika Igurisha"
                    ),
                ),
                "action": "edit_sale_pick",
            }
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Please reply *YES* to confirm and save, *EDIT* to change a detail, or *NO* to cancel.",
                    "Subiza *YEGO* wemeze ubike, *HINDURA* ugire icyo ukosora, cyangwa *OYA* uhagarike.",
                ),
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
        customer_phone = str(step_data.get("customerPhone") or "").strip()
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
                "customerPhone": customer_phone,
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
        if customer_phone and customer_name != "Walk-in Client":
            _save_customer_phone_on_record(db, scope_key, arch_id, entry["id"], buckets["sales"], customer_name, customer_phone)
        new_stock = _adjust_product_stock(db, scope_key, arch_id, product_id, -qty)
        set_session(None)
        stock_val = int(new_stock) if new_stock is not None and float(new_stock).is_integer() else new_stock
        stock_line = (
            f"\n- {_t(lang, 'Remaining Stock', 'Ibisigara mu Bubiko')}: *{stock_val}*"
            if new_stock is not None
            else ""
        )
        return {
            "reply": (
                f"*{_t(lang, 'SALE SAVED & SYNCED TO EXBOS', 'IGURISHA RYABITSWE NEZA MURI EXBOS')}*\n"
                "--------------------------------\n"
                f"- {_t(lang, 'Reference', 'Nomero')}: *{entry['id']}*\n"
                f"- {_t(lang, 'Item', 'Igicuruzwa')}: *{entry['title']}*\n"
                f"- {_t(lang, 'Total Amount', 'Igiteranyo')}: *{_fmt_rwf(total_amt)}*\n"
                f"- {_t(lang, 'Payment', 'Ubwishyu')}: *{payment_method} ({payment_status})*\n"
                f"- {_t(lang, 'Customer', 'Umukiriya')}: *{customer_name}*"
                f"{stock_line}\n"
                "--------------------------------\n"
                + _t(lang, "Reply *2* for another Sale or *0* for Main Menu.", "Subiza *2* wandike irindi gurisha cyangwa *0* usubire ahabanza.")
            ),
            "action": "sale_recorded",
            "record": entry,
        }

    # --- A2. SALE EDIT SUB-FLOW ---
    if current_step == "edit_sale_pick":
        if clean_text == "1":
            ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
            catalog = _catalog_items(ws, arch_id)
            set_session("sale_pick_product", {})
            return {"reply": _format_product_picker(business_name, catalog, _t(lang, "Sale", "Igurisha"), lang=lang), "action": "sale_pick_product"}
        if clean_text == "2":
            step_data["returnToConfirm"] = True
            set_session("sale_enter_qty", step_data)
            avail = float(step_data.get("availableStock") or 0)
            avail_disp = int(avail) if avail.is_integer() else avail
            return {
                "reply": _t(
                    lang,
                    f"Enter the new quantity for *{step_data['productTitle']}* (Available stock: *{avail_disp}*):",
                    f"Andika umubare mushya wa *{step_data['productTitle']}* (Ububiko buhari: *{avail_disp}*):",
                ),
                "action": "sale_enter_qty",
            }
        if clean_text == "3":
            set_session("edit_sale_price", step_data)
            return {
                "reply": _t(
                    lang,
                    f"Enter the new *Unit Price in RWF* for *{step_data['productTitle']}* (current: {_fmt_rwf(step_data.get('unitPriceRWF'))}):",
                    f"Andika *Igiciro gishya kuri kimwe (RWF)* cya *{step_data['productTitle']}* (icyariho: {_fmt_rwf(step_data.get('unitPriceRWF'))}):",
                ),
                "action": "edit_sale_price",
            }
        if clean_text == "4":
            set_session("sale_pick_payment", step_data)
            return {
                "reply": _t(
                    lang,
                    "Select new Payment Method:\n*1.* Cash\n*2.* MTN MoMo Business\n*3.* Airtel Money\n*4.* Bank Transfer\n*5.* Customer Credit (Unpaid)",
                    "Hitamo uburyo bushya bwo kwishyura:\n*1.* Cash (Intoki)\n*2.* MTN MoMo Business\n*3.* Airtel Money\n*4.* Banki\n*5.* Ideni ry'Umukiriya",
                ),
                "action": "sale_pick_payment",
            }
        return {
            "reply": _t(lang, "Please reply *1*, *2*, *3*, or *4* to edit, or *0* to cancel.", "Subiza *1*, *2*, *3*, cyangwa *4* uhindure, cyangwa *0* uhagarike."),
            "action": "edit_sale_pick_retry",
        }

    if current_step == "edit_sale_price":
        new_price = _parse_positive_number(clean_text)
        if new_price is None:
            return {"reply": _t(lang, "Please enter a valid unit price in RWF (e.g. *10000*).", "Andika igiciro nyacyo mu RWF (urugero: *10000*)."), "action": "edit_sale_price_retry"}
        qty = float(step_data.get("qty") or 1)
        step_data["unitPriceRWF"] = new_price
        step_data["totalAmountRWF"] = round(qty * new_price, 2)
        set_session("confirm_sale", step_data)
        return {
            "reply": _format_verification_card("NEW SALE", _sale_verification_rows(step_data, lang), lang=lang, title_rw="IGURISHA RISHYA"),
            "action": "confirm_sale",
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
        if step_data.pop("returnToConfirm", False):
            set_session("confirm_sale", step_data)
            return {
                "reply": _format_verification_card("NEW SALE", _sale_verification_rows(step_data, lang), lang=lang, title_rw="IGURISHA RISHYA"),
                "action": "confirm_sale",
            }
        set_session("sale_pick_payment", step_data)
        qty_disp = int(qty) if qty.is_integer() else qty
        return {
            "reply": _t(
                lang,
                (
                    f"*Sale Total:* {qty_disp} × {step_data['productTitle']} = *{_fmt_rwf(total_amt)}*\n\n"
                    "Select Payment Method:\n"
                    "*1.* Cash (Paid in Full)\n"
                    "*2.* MTN MoMo Business (Paid in Full)\n"
                    "*3.* Airtel Money (Paid in Full)\n"
                    "*4.* Bank Transfer (Paid in Full)\n"
                    "*5.* Customer Credit (Unpaid)\n\n"
                    "Reply *1–5*, or *0* to cancel."
                ),
                (
                    f"*Igiteranyo:* {qty_disp} × {step_data['productTitle']} = *{_fmt_rwf(total_amt)}*\n\n"
                    "Hitamo Uburyo bwo Kwishyura:\n"
                    "*1.* Cash (Yishyuwe Yose)\n"
                    "*2.* MTN MoMo Business (Yishyuwe Yose)\n"
                    "*3.* Airtel Money (Yishyuwe Yose)\n"
                    "*4.* Banki (Yishyuwe Yose)\n"
                    "*5.* Ideni ry'Umukiriya (Ntiyishyuwe)\n\n"
                    "Subiza *1–5*, cyangwa *0* uhagarike."
                ),
            ),
            "action": "sale_pick_payment",
        }

    # --- D. SALE STEP 3: PICK PAYMENT METHOD ---
    if current_step == "sale_pick_payment":
        if clean_text not in PAYMENT_OPTIONS:
            return {
                "reply": _t(
                    lang,
                    "Please reply with *1* (Cash), *2* (MTN MoMo), *3* (Airtel Money), *4* (Bank), or *5* (Customer Credit).",
                    "Subiza *1* (Cash), *2* (MTN MoMo), *3* (Airtel Money), *4* (Banki), cyangwa *5* (Ideni).",
                ),
                "action": "sale_pick_payment_retry",
            }
        pm_name, pm_status = PAYMENT_OPTIONS[clean_text]
        step_data["paymentMethod"] = pm_name
        step_data["paymentStatus"] = pm_status
        if clean_text == "5":
            set_session("sale_enter_customer", step_data)
            return {
                "reply": _t(
                    lang,
                    "Enter the *Customer Name* for this credit sale (e.g. *Jean Paul*):",
                    "Andika *Izina ry'Umukiriya* w'iri deni (urugero: *Jean Paul*):",
                ),
                "action": "sale_enter_customer",
            }
        step_data["customerName"] = "Walk-in Client"
        set_session("confirm_sale", step_data)
        return {
            "reply": _format_verification_card("NEW SALE", _sale_verification_rows(step_data, lang), lang=lang, title_rw="IGURISHA RISHYA"),
            "action": "confirm_sale",
        }

    # --- E. SALE STEP 3b: ENTER CUSTOMER NAME & WHATSAPP NUMBER FOR CREDIT SALE ---
    if current_step == "sale_enter_customer":
        if len(clean_text) < 2:
            return {"reply": _t(lang, "Please enter a valid customer name (at least 2 characters).", "Andika izina ry'umukiriya ryuzuye."), "action": "sale_enter_customer_retry"}
        step_data["customerName"] = clean_text
        set_session("sale_enter_customer_phone", step_data)
        return {
            "reply": _t(
                lang,
                f"Enter *{clean_text}*'s WhatsApp phone number for payment reminders (e.g. *0788123456*), or reply *SKIP*:",
                f"Andika nimero ya WhatsApp ya *{clean_text}* izajya yohererezwaho ibutsa ry'ideni (urugero: *0788123456*), cyangwa subiza *SKIP*:",
            ),
            "action": "sale_enter_customer_phone",
        }

    if current_step == "sale_enter_customer_phone":
        if upper_text in ("SKIP", "NONE", "SIMBUKA", "-"):
            step_data["customerPhone"] = ""
        else:
            norm_p = normalize_phone(clean_text)
            if not norm_p or len(norm_p) < 10:
                return {
                    "reply": _t(
                        lang,
                        "Please enter a valid WhatsApp phone number (e.g. *0788123456* or *+250788123456*), or reply *SKIP*.",
                        "Andika nimero ya WhatsApp yuzuye (urugero: *0788123456*), cyangwa subiza *SKIP*.",
                    ),
                    "action": "sale_enter_customer_phone_retry",
                }
            step_data["customerPhone"] = norm_p
        set_session("confirm_sale", step_data)
        return {
            "reply": _format_verification_card("NEW CREDIT SALE", _sale_verification_rows(step_data, lang), lang=lang, title_rw="IGURISHA KU IDENI"),
            "action": "confirm_sale",
        }

    # --- E2. GUIDED UNPAID CUSTOMER REMINDER FLOW (ASK PHONE IF MISSING + VERIFY BEFORE SEND) ---
    if current_step == "unpaid_pick_customer":
        if not upper_text.startswith(("REMIND", "VERIFY", "SALE ", "PURCHASE ", "EXPENSE ", "ADD PRODUCT ")):
            unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
            target = None
            if clean_text.isdigit():
                idx = int(clean_text) - 1
                if 0 <= idx < len(unpaid):
                    target = unpaid[idx]
            elif len(clean_text) >= 2:
                q_low = clean_text.lower()
                target = next(
                    (u for u in unpaid if q_low in u["customerName"].lower() or str(u["id"]).lower() == q_low),
                    None,
                )
            if target:
                rem_data = {
                    "id": target["id"],
                    "bucket": target["bucket"],
                    "customerName": target["customerName"],
                    "customerPhone": target.get("customerPhone") or "",
                    "productsBought": target["productsBought"],
                    "totalAmountRWF": target["totalAmountRWF"],
                    "paidAmountRWF": target["paidAmountRWF"],
                    "remainingAmountRWF": target["remainingAmountRWF"],
                }
                if not rem_data["customerPhone"]:
                    set_session("remind_enter_phone", rem_data)
                    return {
                        "reply": _t(
                            lang,
                            (
                                f"*{target['customerName']}* does not have a WhatsApp number saved yet.\n"
                                f"- Remaining Balance: *{_fmt_rwf(target['remainingAmountRWF'])}*\n\n"
                                "Enter their WhatsApp phone number to save it and send the reminder (e.g. *0788123456*), or reply *0* to cancel:"
                            ),
                            (
                                f"*{target['customerName']}* ntaragira nimero ya WhatsApp ibitse.\n"
                                f"- Ideni Risigaye: *{_fmt_rwf(target['remainingAmountRWF'])}*\n\n"
                                "Andika nimero ye ya WhatsApp tuyibike tunamwoherereze ibutsa (urugero: *0788123456*), cyangwa *0* uhagarike:"
                            ),
                        ),
                        "action": "remind_enter_phone",
                    }
                set_session("confirm_reminder", rem_data)
                return {
                    "reply": _format_verification_card("SEND PAYMENT REMINDER", _reminder_verification_rows(rem_data, lang), lang=lang, title_rw="OHEREZA IBUTSA RY'IDENI"),
                    "action": "confirm_reminder",
                }
        # Otherwise fall through so REMIND ALL / VERIFY / menu commands work seamlessly!

    if current_step == "remind_enter_phone":
        norm_p = normalize_phone(clean_text)
        if not norm_p or len(norm_p) < 10:
            return {
                "reply": _t(
                    lang,
                    "Please enter a valid WhatsApp phone number (e.g. *0788123456* or *+250788123456*), or *0* to cancel.",
                    "Andika nimero ya WhatsApp nyayo (urugero: *0788123456*), cyangwa *0* uhagarike.",
                ),
                "action": "remind_enter_phone_retry",
            }
        # Save phone permanently onto the unpaid customer's record & directory
        _save_customer_phone_on_record(
            db,
            scope_key,
            arch_id,
            str(step_data.get("id") or ""),
            str(step_data.get("bucket") or "Sales"),
            str(step_data.get("customerName") or ""),
            norm_p,
        )
        step_data["customerPhone"] = norm_p
        set_session("confirm_reminder", step_data)
        return {
            "reply": _format_verification_card("SEND PAYMENT REMINDER", _reminder_verification_rows(step_data, lang), lang=lang, title_rw="OHEREZA IBUTSA RY'IDENI"),
            "action": "confirm_reminder",
        }

    if current_step == "confirm_reminder":
        if upper_text in EDIT_WORDS:
            set_session("remind_enter_phone", step_data)
            return {
                "reply": _t(
                    lang,
                    f"Enter the updated WhatsApp phone number for *{step_data.get('customerName')}*:",
                    f"Andika nimero nshya ya WhatsApp ya *{step_data.get('customerName')}*:",
                ),
                "action": "remind_enter_phone",
            }
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Reply *YES* to send this payment reminder, *EDIT* to change the phone number, or *NO* to cancel.",
                    "Subiza *YEGO* wohereze ibutsa, *HINDURA* uhindure nimero, cyangwa *OYA* uhagarike.",
                ),
                "action": "awaiting_reminder_confirmation",
            }
        res = send_debt_reminders(
            db,
            scope_key,
            arch_id,
            target_id=str(step_data.get("id") or step_data.get("customerName") or ""),
            business_name=business_name,
        )
        set_session(None)
        disp = (res.get("dispatched") or [{}])[0]
        wa_link = disp.get("waMeLink") or ""
        sent_ok = bool(disp.get("sent"))
        status_note = (
            _t(lang, "Delivered automatically via Meta WhatsApp.", "Yoherejwe ako kanya kuri WhatsApp.")
            if sent_ok
            else _t(
                lang,
                f"Prepared in Sandbox Mode — tap to send directly on WhatsApp:\n{wa_link}",
                f"Yateguwe (Sandbox) — kanda hano uyoherereze umukiriya kuri WhatsApp:\n{wa_link}",
            )
        )
        return {
            "reply": (
                f"*{_t(lang, 'PAYMENT REMINDER PROCESSED', 'IBUTSA RY\'IDENI RYATUNGANYIJWE')}*\n"
                "--------------------------------\n"
                f"- {_t(lang, 'Customer', 'Umukiriya')}: *{step_data.get('customerName')}*\n"
                f"- WhatsApp: *{step_data.get('customerPhone')}*\n"
                f"- {_t(lang, 'Remaining Balance', 'Ideni Risigaye')}: *{_fmt_rwf(step_data.get('remainingAmountRWF'))}*\n"
                f"- {status_note}\n"
                "--------------------------------\n"
                + _t(lang, "Reply *6* for Unpaid Customers or *0* for Main Menu.", "Subiza *6* urebe abandi batarishyura cyangwa *0* usubire ahabanza.")
            ),
            "action": "reminder_sent",
            "result": res,
        }

    # --- F. CONFIRMATION & EDIT GATE: PURCHASE ---
    if current_step == "confirm_purchase":
        if upper_text in EDIT_WORDS:
            set_session("edit_purchase_pick", step_data)
            return {
                "reply": _t(
                    lang,
                    "*EDIT PURCHASE — Choose what to change:*\n*1.* Change Item\n*2.* Change Quantity\n*3.* Change Total Cost\n*0.* Cancel",
                    "*HINDURA IRANGURA — Hitamo icyo guhindura:*\n*1.* Hindura Igicuruzwa\n*2.* Hindura Umubare\n*3.* Hindura Igiteranyo cy'Amafaranga\n*0.* Hagarika",
                ),
                "action": "edit_purchase_pick",
            }
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Please reply *YES* to save, *EDIT* to modify, or *NO* to cancel.",
                    "Subiza *YEGO* ubike, *HINDURA* ukosore, cyangwa *OYA* uhagarike.",
                ),
                "action": "awaiting_purchase_confirmation",
            }
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

    if current_step == "edit_purchase_pick":
        if clean_text == "1":
            ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
            set_session("purchase_pick_product", {})
            return {"reply": _format_product_picker(business_name, _catalog_items(ws, arch_id), _t(lang, "Purchase", "Irangura"), lang=lang), "action": "purchase_pick_product"}
        if clean_text == "2":
            step_data["returnToConfirm"] = True
            set_session("purchase_enter_qty", step_data)
            return {"reply": _t(lang, f"Enter new quantity for *{step_data['productTitle']}*:", f"Andika umubare mushya wa *{step_data['productTitle']}*:"), "action": "purchase_enter_qty"}
        if clean_text == "3":
            set_session("purchase_enter_amount", step_data)
            return {"reply": _t(lang, f"Enter new *Total Cost (RWF)* for *{step_data['productTitle']}*:", f"Andika igiteranyo gishya cy'amafaranga (RWF) ya *{step_data['productTitle']}*:"), "action": "purchase_enter_amount"}
        return {"reply": _t(lang, "Reply *1*, *2*, or *3* to edit, or *0* to cancel.", "Subiza *1*, *2*, cyangwa *3* uhindure, cyangwa *0* uhagarike."), "action": "edit_purchase_pick_retry"}

    if current_step == "purchase_enter_qty":
        qty = _parse_positive_number(clean_text)
        if qty is None:
            return {"reply": _t(lang, "Please enter a valid quantity greater than 0 (e.g. *10*).", "Andika umubare nyawo urenze 0 (urugero: *10*)."), "action": "purchase_qty_invalid"}
        step_data["qty"] = qty
        if step_data.pop("returnToConfirm", False):
            set_session("confirm_purchase", step_data)
            return {"reply": _format_verification_card("NEW PURCHASE / RESTOCK", _purchase_verification_rows(step_data, lang), lang=lang, title_rw="IRANGURA RISHYA"), "action": "confirm_purchase"}
        set_session("purchase_enter_amount", step_data)
        qty_disp = int(qty) if qty.is_integer() else qty
        return {
            "reply": _t(
                lang,
                f"Enter the *Total Purchase Cost in RWF* for {qty_disp} × {step_data['productTitle']} (e.g. *50000*):",
                f"Andika *Igiteranyo cy'Amafaranga y'Irangura (RWF)* ya {qty_disp} × {step_data['productTitle']} (urugero: *50000*):",
            ),
            "action": "purchase_enter_amount",
        }

    if current_step == "purchase_enter_amount":
        amt = _parse_positive_number(clean_text)
        if amt is None:
            return {"reply": _t(lang, "Please enter a valid total amount in RWF (e.g. *50000*).", "Andika amafaranga nyayo mu RWF (urugero: *50000*)."), "action": "purchase_amt_invalid"}
        step_data["totalAmountRWF"] = amt
        set_session("confirm_purchase", step_data)
        return {
            "reply": _format_verification_card("NEW PURCHASE / RESTOCK", _purchase_verification_rows(step_data, lang), lang=lang, title_rw="IRANGURA RISHYA"),
            "action": "confirm_purchase",
        }

    # --- G. CONFIRMATION & EDIT GATE: EXPENSE ---
    if current_step == "confirm_expense":
        if upper_text in EDIT_WORDS:
            set_session("edit_expense_pick", step_data)
            return {
                "reply": _t(
                    lang,
                    "*EDIT EXPENSE — Choose what to change:*\n*1.* Change Description\n*2.* Change Amount (RWF)\n*0.* Cancel",
                    "*HINDURA AMAFARANGA YAKORESHEJWE:*\n*1.* Hindura Igisobanuro\n*2.* Hindura Amafaranga (RWF)\n*0.* Hagarika",
                ),
                "action": "edit_expense_pick",
            }
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Please reply *YES* to save, *EDIT* to change, or *NO* to cancel.",
                    "Subiza *YEGO* ubike, *HINDURA* ukosore, cyangwa *OYA* uhagarike.",
                ),
                "action": "awaiting_expense_confirmation",
            }
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

    if current_step == "edit_expense_pick":
        if clean_text == "1":
            step_data["returnToConfirm"] = True
            set_session("expense_enter_title", step_data)
            return {"reply": _t(lang, "Enter the new expense description (or choose *1–6*):", "Andika igisobanuro gishya (cyangwa hitamo *1–6*):"), "action": "expense_enter_title"}
        if clean_text == "2":
            set_session("expense_enter_amount", step_data)
            return {"reply": _t(lang, f"Enter the new amount in RWF for *{step_data['title']}*:", f"Andika amafaranga mashya (RWF) ya *{step_data['title']}*:"), "action": "expense_enter_amount"}
        return {"reply": _t(lang, "Reply *1* or *2* to edit, or *0* to cancel.", "Subiza *1* cyangwa *2* uhindure, cyangwa *0* uhagarike."), "action": "edit_expense_pick_retry"}

    if current_step == "expense_enter_title":
        title = EXPENSE_CATEGORIES.get(clean_text, clean_text)
        if len(title) < 2:
            return {"reply": _t(lang, "Please choose *1–6* or type the expense description.", "Hitamo *1–6* cyangwa wandike igisobanuro."), "action": "expense_title_retry"}
        step_data["title"] = title
        if step_data.pop("returnToConfirm", False) and step_data.get("amountRWF"):
            set_session("confirm_expense", step_data)
            return {"reply": _format_verification_card("NEW EXPENSE", _expense_verification_rows(step_data, lang), lang=lang, title_rw="AMAFARANGA YAKORESHEJWE"), "action": "confirm_expense"}
        set_session("expense_enter_amount", {"title": title})
        return {
            "reply": _t(
                lang,
                f"*Expense:* {title}\n\nEnter the amount spent in *RWF* (e.g. *15000*):",
                f"*Igikorwa:* {title}\n\nAndika amafaranga yakoreshejwe mu *RWF* (urugero: *15000*):",
            ),
            "action": "expense_enter_amount",
        }

    if current_step == "expense_enter_amount":
        amt = _parse_positive_number(clean_text)
        if amt is None:
            return {"reply": _t(lang, "Please enter a valid expense amount in RWF (e.g. *15000*).", "Andika amafaranga nyayo mu RWF (urugero: *15000*)."), "action": "expense_amt_invalid"}
        step_data["amountRWF"] = amt
        set_session("confirm_expense", step_data)
        return {
            "reply": _format_verification_card("NEW EXPENSE", _expense_verification_rows(step_data, lang), lang=lang, title_rw="AMAFARANGA YAKORESHEJWE"),
            "action": "confirm_expense",
        }

    # --- H. CONFIRMATION & EDIT GATE: ADD PRODUCT ---
    if current_step == "confirm_product":
        if upper_text in EDIT_WORDS:
            set_session("edit_product_pick", step_data)
            return {
                "reply": _t(
                    lang,
                    "*EDIT PRODUCT — Choose what to change:*\n*1.* Change Name\n*2.* Change Selling Price\n*3.* Change Cost Price\n*4.* Change Opening Stock\n*0.* Cancel",
                    "*HINDURA IGICURUZWA:*\n*1.* Hindura Izina\n*2.* Hindura Igiciro cyo Kugurisha\n*3.* Hindura Igiciro cy'Irangura\n*4.* Hindura Ububiko bw'Itangiriro\n*0.* Hagarika",
                ),
                "action": "edit_product_pick",
            }
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Please reply *YES* to save, *EDIT* to modify, or *NO* to cancel.",
                    "Subiza *YEGO* ubike, *HINDURA* ukosore, cyangwa *OYA* uhagarike.",
                ),
                "action": "awaiting_product_confirmation",
            }
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

    if current_step == "edit_product_pick":
        if clean_text == "1":
            step_data["returnToConfirm"] = True
            set_session("product_enter_name", step_data)
            return {"reply": _t(lang, "Enter the new *Product Name*:", "Andika *Izina rishya ry'Igicuruzwa*:"), "action": "product_enter_name"}
        if clean_text == "2":
            step_data["returnToConfirm"] = True
            set_session("product_enter_sell", step_data)
            return {"reply": _t(lang, "Enter the new *Selling Price (RWF)*:", "Andika *Igiciro gishya cyo Kugurisha (RWF)*:"), "action": "product_enter_sell"}
        if clean_text == "3":
            step_data["returnToConfirm"] = True
            set_session("product_enter_cost", step_data)
            return {"reply": _t(lang, "Enter the new *Cost Price (RWF)*:", "Andika *Igiciro gishya cy'Irangura (RWF)*:"), "action": "product_enter_cost"}
        if clean_text == "4":
            set_session("product_enter_qty", step_data)
            return {"reply": _t(lang, "Enter the new *Opening Stock Quantity*:", "Andika *Umubare mushya w'Ububiko*:"), "action": "product_enter_qty"}
        return {"reply": _t(lang, "Reply *1–4* to edit, or *0* to cancel.", "Subiza *1–4* uhindure, cyangwa *0* uhagarike."), "action": "edit_product_pick_retry"}

    if current_step == "product_enter_name":
        if len(clean_text) < 2:
            return {"reply": _t(lang, "Please enter a valid product name (at least 2 characters).", "Andika izina ry'igicuruzwa ryuzuye."), "action": "product_name_retry"}
        step_data["name"] = clean_text
        if step_data.pop("returnToConfirm", False) and step_data.get("sellingPriceRWF"):
            set_session("confirm_product", step_data)
            return {"reply": _format_verification_card("NEW PRODUCT", _product_verification_rows(step_data, lang), lang=lang, title_rw="IGICURUZWA GISHYA"), "action": "confirm_product"}
        set_session("product_enter_sell", {"name": clean_text})
        return {"reply": _t(lang, f"*New Product:* {clean_text}\n\nEnter the *Selling Price* per unit in RWF (e.g. *10000*):", f"*Igicuruzwa Gishya:* {clean_text}\n\nAndika *Igiciro cyo Kugurisha* kuri kimwe mu RWF (urugero: *10000*):"), "action": "product_enter_sell"}

    if current_step == "product_enter_sell":
        sell_p = _parse_positive_number(clean_text)
        if sell_p is None:
            return {"reply": _t(lang, "Please enter a valid selling price in RWF (e.g. *10000*).", "Andika igiciro nyacyo mu RWF (urugero: *10000*)."), "action": "product_sell_retry"}
        step_data["sellingPriceRWF"] = sell_p
        if step_data.pop("returnToConfirm", False) and step_data.get("costPriceRWF"):
            set_session("confirm_product", step_data)
            return {"reply": _format_verification_card("NEW PRODUCT", _product_verification_rows(step_data, lang), lang=lang, title_rw="IGICURUZWA GISHYA"), "action": "confirm_product"}
        set_session("product_enter_cost", step_data)
        return {"reply": _t(lang, f"Enter the *Purchase / Cost Price* per unit in RWF for {step_data['name']} (e.g. *7000*):", f"Andika *Igiciro cy'Irangura* kuri kimwe mu RWF cya {step_data['name']} (urugero: *7000*):"), "action": "product_enter_cost"}

    if current_step == "product_enter_cost":
        cost_p = _parse_positive_number(clean_text)
        if cost_p is None:
            return {"reply": _t(lang, "Please enter a valid cost price in RWF (e.g. *7000*).", "Andika igiciro nyacyo cy'irangura mu RWF (urugero: *7000*)."), "action": "product_cost_retry"}
        step_data["costPriceRWF"] = cost_p
        if step_data.pop("returnToConfirm", False) and step_data.get("quantity"):
            set_session("confirm_product", step_data)
            return {"reply": _format_verification_card("NEW PRODUCT", _product_verification_rows(step_data, lang), lang=lang, title_rw="IGICURUZWA GISHYA"), "action": "confirm_product"}
        set_session("product_enter_qty", step_data)
        return {"reply": _t(lang, f"Enter the *Opening Stock Quantity* for {step_data['name']} (e.g. *10*):", f"Andika *Umubare w'Ububiko bw'Itangiriro* wa {step_data['name']} (urugero: *10*):"), "action": "product_enter_qty"}

    if current_step == "product_enter_qty":
        qty = _parse_positive_number(clean_text)
        if qty is None:
            return {"reply": _t(lang, "Please enter a valid opening stock quantity (e.g. *10*).", "Andika umubare nyawo w'ububiko (urugero: *10*)."), "action": "product_qty_retry"}
        step_data["quantity"] = qty
        set_session("confirm_product", step_data)
        return {
            "reply": _format_verification_card("NEW PRODUCT", _product_verification_rows(step_data, lang), lang=lang, title_rw="IGICURUZWA GISHYA"),
            "action": "confirm_product",
        }

    # --- MANAGE EXISTING PRODUCTS (EDIT NAME / PRICE / STOCK & DELETE PRODUCT) ---
    def _product_manage_menu(pdata: dict[str, Any]) -> str:
        pname = str(pdata.get("productTitle") or "")
        pqty = pdata.get("quantity", 0)
        psell = _fmt_rwf(pdata.get("sellingPriceRWF") or 0)
        pcost = _fmt_rwf(pdata.get("costPriceRWF") or 0)
        return _t(
            lang,
            (
                f"*MANAGE PRODUCT — {pname}*\n"
                "--------------------------------\n"
                f"- Selling Price: *{psell}*\n"
                f"- Cost Price: *{pcost}*\n"
                f"- Current Stock: *{pqty} unit(s)*\n"
                "--------------------------------\n"
                "Choose an action:\n"
                "*1.* Edit Product Name\n"
                "*2.* Edit Selling Price (RWF)\n"
                "*3.* Edit Cost Price (RWF)\n"
                "*4.* Edit Stock Quantity\n"
                "*5.* Delete Product Permanently\n"
                "*0.* Cancel / Main Menu"
            ),
            (
                f"*CUNGA IGICURUZWA — {pname}*\n"
                "--------------------------------\n"
                f"- Igiciro cyo Kugurisha: *{psell}*\n"
                f"- Igiciro cy'Irangura: *{pcost}*\n"
                f"- Ububiko Buriho: *{pqty}*\n"
                "--------------------------------\n"
                "Hitamo igikorwa:\n"
                "*1.* Hindura Izina ry'Igicuruzwa\n"
                "*2.* Hindura Igiciro cyo Kugurisha (RWF)\n"
                "*3.* Hindura Igiciro cy'Irangura (RWF)\n"
                "*4.* Hindura Umubare mu Bubiko\n"
                "*5.* Siba Igicuruzwa Burundu\n"
                "*0.* Hagarika / Ahabanza"
            ),
        )

    if current_step == "catalog_manage_pick":
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        chosen = None
        if clean_text.isdigit():
            idx = int(clean_text) - 1
            if 0 <= idx < len(catalog[:15]):
                chosen = catalog[idx]
        else:
            chosen = _fuzzy_match_product(catalog, clean_text)

        if not chosen:
            return {
                "reply": _t(
                    lang,
                    "Product not found. Reply with a *product number* from the list, type the product name, or reply *0* for Main Menu.",
                    "Igicuruzwa nticyabonetse. Subiza *umubare* uri ku rutonde, wandike izina ryacyo, cyangwa *0* usubire ahabanza.",
                ),
                "action": "catalog_manage_pick_retry",
            }
        pdata = {
            "productId": str(chosen.get("id") or ""),
            "bucket": str(chosen.get("_bucket") or buckets["primary_catalog"]),
            "productTitle": str(chosen.get("title") or chosen.get("name") or ""),
            "sellingPriceRWF": float(chosen.get("sellingPriceRWF") or chosen.get("amountRWF") or 0),
            "costPriceRWF": float(chosen.get("purchasePriceRWF") or chosen.get("unitCostRWF") or 0),
            "quantity": float(chosen.get("quantity") if chosen.get("quantity") is not None else chosen.get("currentStock") or 0),
        }
        if step_data.get("intent") == "delete":
            set_session("confirm_product_delete", pdata)
            return {
                "reply": _format_verification_card(
                    "DELETE PRODUCT PERMANENTLY",
                    [
                        (_t(lang, "Product Name", "Izina ry'Igicuruzwa"), pdata["productTitle"]),
                        (_t(lang, "Selling Price", "Igiciro cyo Kugurisha"), _fmt_rwf(pdata["sellingPriceRWF"])),
                        (_t(lang, "Current Stock", "Ububiko Buriho"), f"{int(pdata['quantity']) if pdata['quantity'].is_integer() else pdata['quantity']}"),
                        (_t(lang, "Action", "Igikorwa"), _t(lang, "Permanent Removal from Catalog", "Gisibwa Burundu mu Bubiko")),
                    ],
                    lang=lang,
                    title_rw="SIBA IGICURUZWA BURUNDU",
                ),
                "action": "confirm_product_delete",
            }
        set_session("catalog_product_action", pdata)
        return {"reply": _product_manage_menu(pdata), "action": "catalog_product_action"}

    if current_step == "catalog_product_action":
        if clean_text == "1":
            set_session("catalog_edit_name", step_data)
            return {
                "reply": _t(
                    lang,
                    f"Current Name: *{step_data['productTitle']}*\nEnter the *new Product Name* (or *0* to cancel):",
                    f"Izina Ririho: *{step_data['productTitle']}*\nAndika *Izina Rishya ry'Igicuruzwa* (cyangwa *0* uhagarike):",
                ),
                "action": "catalog_edit_name",
            }
        if clean_text == "2":
            set_session("catalog_edit_sell_price", step_data)
            return {
                "reply": _t(
                    lang,
                    f"Current Selling Price: *{_fmt_rwf(step_data['sellingPriceRWF'])}*\nEnter the *new Selling Price (RWF)*:",
                    f"Igiciro cyo Kugurisha Kiriho: *{_fmt_rwf(step_data['sellingPriceRWF'])}*\nAndika *Igiciro Rishya cyo Kugurisha (RWF)*:",
                ),
                "action": "catalog_edit_sell_price",
            }
        if clean_text == "3":
            set_session("catalog_edit_cost_price", step_data)
            return {
                "reply": _t(
                    lang,
                    f"Current Cost Price: *{_fmt_rwf(step_data['costPriceRWF'])}*\nEnter the *new Cost Price (RWF)*:",
                    f"Igiciro cy'Irangura Kiriho: *{_fmt_rwf(step_data['costPriceRWF'])}*\nAndika *Igiciro Rishya cy'Irangura (RWF)*:",
                ),
                "action": "catalog_edit_cost_price",
            }
        if clean_text == "4":
            set_session("catalog_edit_qty", step_data)
            return {
                "reply": _t(
                    lang,
                    f"Current Stock: *{step_data['quantity']}*\nEnter the *new Stock Quantity* (e.g. *10* or *0*):",
                    f"Ububiko Buriho: *{step_data['quantity']}*\nAndika *Umubare Mushya mu Bubiko* (urugero: *10* cyangwa *0*):",
                ),
                "action": "catalog_edit_qty",
            }
        if clean_text == "5":
            set_session("confirm_product_delete", step_data)
            qty_val = float(step_data.get("quantity") or 0)
            return {
                "reply": _format_verification_card(
                    "DELETE PRODUCT PERMANENTLY",
                    [
                        (_t(lang, "Product Name", "Izina ry'Igicuruzwa"), str(step_data.get("productTitle") or "")),
                        (_t(lang, "Selling Price", "Igiciro cyo Kugurisha"), _fmt_rwf(step_data.get("sellingPriceRWF") or 0)),
                        (_t(lang, "Current Stock", "Ububiko Buriho"), f"{int(qty_val) if qty_val.is_integer() else qty_val}"),
                        (_t(lang, "Action", "Igikorwa"), _t(lang, "Permanent Removal from Catalog", "Gisibwa Burundu mu Bubiko")),
                    ],
                    lang=lang,
                    title_rw="SIBA IGICURUZWA BURUNDU",
                ),
                "action": "confirm_product_delete",
            }
        return {
            "reply": _t(lang, "Reply *1–5* to edit or delete this product, or *0* to cancel.", "Subiza *1–5* uhindure cyangwa usibe iki gicuruzwa, cyangwa *0* uhagarike."),
            "action": "catalog_product_action_retry",
        }

    if current_step == "catalog_edit_name":
        if len(clean_text) < 2:
            return {
                "reply": _t(lang, "Please enter a valid product name (at least 2 characters).", "Andika izina ry'igicuruzwa ryemewe (nibura inyuguti 2)."),
                "action": "catalog_edit_name_retry",
            }
        step_data["editField"] = "name"
        step_data["newValue"] = clean_text
        set_session("confirm_product_edit", step_data)
        return {
            "reply": _format_verification_card(
                "UPDATE PRODUCT NAME",
                [
                    (_t(lang, "Old Name", "Izina Rya Kera"), str(step_data["productTitle"])),
                    (_t(lang, "New Name", "Izina Rishya"), clean_text),
                ],
                lang=lang,
                title_rw="HINDURA IZINA RY'IGICURUZWA",
            ),
            "action": "confirm_product_edit",
        }

    if current_step == "catalog_edit_sell_price":
        val = _parse_positive_number(clean_text)
        if val is None:
            return {
                "reply": _t(lang, "Please enter a valid Selling Price in RWF (e.g. *15000*).", "Andika igiciro cyemewe mu RWF (urugero: *15000*)."),
                "action": "catalog_edit_sell_price_retry",
            }
        step_data["editField"] = "sellingPriceRWF"
        step_data["newValue"] = val
        set_session("confirm_product_edit", step_data)
        profit_row = _format_profit_margin_row(val, float(step_data.get("costPriceRWF") or 0), lang)
        return {
            "reply": _format_verification_card(
                "UPDATE SELLING PRICE",
                [
                    (_t(lang, "Product", "Igicuruzwa"), str(step_data["productTitle"])),
                    (_t(lang, "Old Selling Price", "Igiciro Cya Kera"), _fmt_rwf(step_data["sellingPriceRWF"])),
                    (_t(lang, "New Selling Price", "Igiciro Gishya"), _fmt_rwf(val)),
                    profit_row,
                ],
                lang=lang,
                title_rw="HINDURA IGICIRO CYO KUGURISHA",
            ),
            "action": "confirm_product_edit",
        }

    if current_step == "catalog_edit_cost_price":
        val = _parse_positive_number(clean_text)
        if val is None:
            return {
                "reply": _t(lang, "Please enter a valid Cost Price in RWF (e.g. *10000*).", "Andika igiciro cy'irangura cyemewe mu RWF (urugero: *10000*)."),
                "action": "catalog_edit_cost_price_retry",
            }
        step_data["editField"] = "costPriceRWF"
        step_data["newValue"] = val
        set_session("confirm_product_edit", step_data)
        profit_row = _format_profit_margin_row(float(step_data.get("sellingPriceRWF") or 0), val, lang)
        return {
            "reply": _format_verification_card(
                "UPDATE COST PRICE",
                [
                    (_t(lang, "Product", "Igicuruzwa"), str(step_data["productTitle"])),
                    (_t(lang, "Old Cost Price", "Igiciro Cya Kera"), _fmt_rwf(step_data["costPriceRWF"])),
                    (_t(lang, "New Cost Price", "Igiciro Gishya"), _fmt_rwf(val)),
                    profit_row,
                ],
                lang=lang,
                title_rw="HINDURA IGICIRO CY'IRANGURA",
            ),
            "action": "confirm_product_edit",
        }

    if current_step == "catalog_edit_qty":
        raw_q = clean_text.replace(",", "").strip()
        try:
            q_val = float(raw_q)
            if q_val < 0:
                raise ValueError("negative")
        except ValueError:
            return {
                "reply": _t(lang, "Please enter a valid stock quantity (0 or more).", "Andika umubare w'ububiko wemewe (0 cyangwa hejuru)."),
                "action": "catalog_edit_qty_retry",
            }
        step_data["editField"] = "quantity"
        step_data["newValue"] = q_val
        set_session("confirm_product_edit", step_data)
        return {
            "reply": _format_verification_card(
                "UPDATE STOCK QUANTITY",
                [
                    (_t(lang, "Product", "Igicuruzwa"), str(step_data["productTitle"])),
                    (_t(lang, "Old Stock", "Ububiko Bwa Kera"), f"{step_data['quantity']}"),
                    (_t(lang, "New Stock", "Ububiko Bushya"), f"{int(q_val) if q_val.is_integer() else q_val}"),
                ],
                lang=lang,
                title_rw="HINDURA UMUBARE MU BUBIKO",
            ),
            "action": "confirm_product_edit",
        }

    if current_step == "confirm_product_edit":
        if upper_text in EDIT_WORDS:
            set_session("catalog_product_action", step_data)
            return {"reply": _product_manage_menu(step_data), "action": "catalog_product_action"}
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Please reply *YES* to confirm and save, *EDIT* to change another detail, or *NO* to cancel.",
                    "Subiza *YEGO* wemeze ubike, *HINDURA* ukosore, cyangwa *OYA* uhagarike.",
                ),
                "action": "awaiting_product_edit_confirmation",
            }
        field = str(step_data.get("editField") or "")
        new_val = step_data.get("newValue")
        updated = _update_catalog_product(
            db,
            scope_key,
            arch_id,
            product_id=str(step_data.get("productId") or ""),
            bucket=str(step_data.get("bucket") or ""),
            updates={field: new_val},
        )
        set_session(None)
        if not updated:
            return {
                "reply": _t(lang, "Could not update product (it may have been removed). Reply *1* to view products.", "Ntibyashobotse guhindura igicuruzwa. Subiza *1* urebe ibicuruzwa."),
                "action": "product_update_failed",
            }
        final_name = updated.get("title") or updated.get("name") or step_data.get("productTitle")
        if is_branch_manager:
            from app.services.owner_audit_notifier import notify_owner_branch_product_action

            field_meta = {
                "name": ("Edited Product Name", "Product Name", str(step_data.get("productTitle") or ""), str(new_val or "")),
                "sellingPriceRWF": ("Edited Selling Price", "Selling Price", _fmt_rwf(step_data.get("sellingPriceRWF") or 0), _fmt_rwf(new_val or 0)),
                "costPriceRWF": ("Edited Cost Price", "Cost Price", _fmt_rwf(step_data.get("costPriceRWF") or 0), _fmt_rwf(new_val or 0)),
                "quantity": ("Edited Stock Quantity", "Stock Quantity", str(step_data.get("quantity") or 0), str(new_val or 0)),
            }
            act_label, col_label, old_disp, new_disp = field_meta.get(
                field,
                ("Edited Product", field or "Detail", "", str(new_val or "")),
            )
            notify_owner_branch_product_action(
                db,
                scope_key=scope_key,
                branch_id=effective_branch_id or "",
                branch_name=branch_display_name or effective_branch_id or "Assigned Branch",
                manager_doc=user_doc,
                action_type=act_label,
                product_title=str(final_name or ""),
                product_id=str(step_data.get("productId") or ""),
                changes=[(col_label, f"{old_disp} -> {new_disp}")],
                channel="WhatsApp",
                business_name=base_business_name,
            )
        return {
            "reply": _t(
                lang,
                f"*PRODUCT UPDATED IN EXBOS*\n- Product: *{final_name}*\n- Selling Price: *{_fmt_rwf(updated.get('sellingPriceRWF') or 0)}*\n- Stock: *{updated.get('quantity', 0)} unit(s)*\n\nReply *1* to manage products or *0* for Main Menu.",
                f"*IGICURUZWA CYAHINDUWE MURI EXBOS*\n- Igicuruzwa: *{final_name}*\n- Igiciro: *{_fmt_rwf(updated.get('sellingPriceRWF') or 0)}*\n- Ububiko: *{updated.get('quantity', 0)}*\n\nSubiza *1* ucunge ibicuruzwa cyangwa *0* usubire ahabanza.",
            ),
            "action": "product_updated",
            "productId": step_data.get("productId"),
        }

    if current_step == "confirm_product_delete":
        if upper_text not in CONFIRM_WORDS:
            return {
                "reply": _t(
                    lang,
                    "Please reply *YES* to permanently delete this product, or *NO* to cancel.",
                    "Subiza *YEGO* usibe iki gicuruzwa burundu, cyangwa *OYA* uhagarike.",
                ),
                "action": "awaiting_product_delete_confirmation",
            }
        deleted = _delete_catalog_product(
            db,
            scope_key,
            arch_id,
            product_id=str(step_data.get("productId") or ""),
            bucket=str(step_data.get("bucket") or ""),
        )
        set_session(None)
        if not deleted:
            return {
                "reply": _t(lang, "Product was not found or already deleted. Reply *1* to view catalog.", "Igicuruzwa nticyabonetse cyangwa cyamaze gusibwa. Subiza *1*."),
                "action": "product_delete_failed",
            }
        if is_branch_manager:
            from app.services.owner_audit_notifier import notify_owner_branch_product_action

            notify_owner_branch_product_action(
                db,
                scope_key=scope_key,
                branch_id=effective_branch_id or "",
                branch_name=branch_display_name or effective_branch_id or "Assigned Branch",
                manager_doc=user_doc,
                action_type="Deleted Product Permanently",
                product_title=str(step_data.get("productTitle") or ""),
                product_id=str(step_data.get("productId") or ""),
                changes=[
                    ("Last Selling Price", _fmt_rwf(step_data.get("sellingPriceRWF") or 0)),
                    ("Last Cost Price", _fmt_rwf(step_data.get("costPriceRWF") or 0)),
                    ("Last Stock", f"{step_data.get('quantity', 0)} unit(s)"),
                ],
                channel="WhatsApp",
                business_name=base_business_name,
            )
        return {
            "reply": _t(
                lang,
                f"*PRODUCT DELETED FROM EXBOS*\nRemoved: *{step_data.get('productTitle', '')}*\n\nReply *1* to view remaining products or *0* for Main Menu.",
                f"*IGICURUZWA CYASIBWE MURI EXBOS*\nCyasibwe: *{step_data.get('productTitle', '')}*\n\nSubiza *1* urebe ibicuruzwa bisigaye cyangwa *0* usubire ahabanza.",
            ),
            "action": "product_deleted",
            "productId": step_data.get("productId"),
        }

    # --- FAST-PATH READ COMMANDS ---
    if upper_text in ("1", "PRODUCTS", "STOCK", "ITEMS", "CATALOG", "EDIT PRODUCT", "DELETE PRODUCT", "MANAGE PRODUCTS"):
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        items = _catalog_items(ws, arch_id)
        if not items:
            set_session(None)
            return {
                "reply": _t(
                    lang,
                    f"*{business_name} Catalog* is currently empty.\nReply *8* to add your first product or *0* for Main Menu.",
                    f"Ububiko bwa *{business_name}* burimo ubusa.\nSubiza *8* wongeremo igicuruzwa cya mbere cyangwa *0* usubire ahabanza.",
                ),
                "action": "list_products_empty",
            }
        intent = "delete" if upper_text == "DELETE PRODUCT" else "manage"
        set_session("catalog_manage_pick", {"intent": intent})
        lines = [
            _t(
                lang,
                f"*{business_name} — Products & Live Stock ({len(items)} total):*",
                f"*{business_name} — Ibicuruzwa n'Ububiko ({len(items)} byose):*",
            )
        ]
        for idx, item in enumerate(items[:15], start=1):
            name = item.get("title") or item.get("name") or item.get("id")
            qty = item.get("quantity") if item.get("quantity") is not None else item.get("currentStock", 0)
            price = item.get("sellingPriceRWF") or item.get("amountRWF") or item.get("unitCostRWF") or 0
            stock_lbl = "Ububiko" if str(lang).lower() == "rw" else "Stock"
            lines.append(f"*{idx}.* {name} — {stock_lbl}: *{qty}* | {_fmt_rwf(price)}")
        if len(items) > 15:
            lines.append(f"...and {len(items) - 15} more in your ExBOS Dashboard.")
        if intent == "delete":
            lines.append(
                _t(
                    lang,
                    "\nReply with a *product number* (e.g. *1*) or name to *Delete* it, or *0* to cancel.",
                    "\nSubiza *umubare w'igicuruzwa* (urugero: *1*) cyangwa izina kugira ngo *Ugisibe*, cyangwa *0* uhagarike.",
                )
            )
        else:
            lines.append(
                _t(
                    lang,
                    "\nReply with a *product number* (e.g. *1*) or name to *Edit Name / Price / Stock or Delete*, or *0* for Main Menu.",
                    "\nSubiza *umubare w'igicuruzwa* (urugero: *1*) cyangwa izina kugira ngo *Uhindure Izina / Igiciro / Ububiko cyangwa Usibe*, cyangwa *0* usubire ahabanza.",
                )
            )
        return {"reply": "\n".join(lines), "action": "list_products", "count": len(items)}

    if upper_text in ("5", "REPORT", "REPORTS", "PNL", "SUMMARY", "MONEY"):
        set_session(None)
        return {"reply": _build_report_text(db, scope_key, arch_id, business_name), "action": "report"}

    if upper_text in ("6", "UNPAID", "DEBTS", "OWED"):
        unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
        if not unpaid:
            set_session(None)
            return {
                "reply": _t(
                    lang,
                    "All customers are *Paid in Full*. Zero unpaid balances right now.\n\nReply *0* for Main Menu.",
                    "Abakiriya bose *Barishyuye*. Nta deni rihari ubu.\n\nSubiza *0* usubire ahabanza.",
                ),
                "action": "list_unpaid_empty",
            }
        set_session("unpaid_pick_customer", {})
        lines = [_t(lang, f"*Unpaid Customers ({len(unpaid)}):*", f"*Abakiriya Batarishyura ({len(unpaid)}):*")]
        for idx, u in enumerate(unpaid[:10], start=1):
            phone_lbl = u["customerPhone"] if u.get("customerPhone") else _t(lang, "No WhatsApp Number", "Nta Nimero ya WhatsApp")
            lines.append(
                f"*{idx}.* {u['customerName']} ({u['productsBought']})\n"
                f"   {_t(lang, 'Remaining', 'Ideni')}: *{_fmt_rwf(u['remainingAmountRWF'])}* | {phone_lbl}"
            )
        lines.append(
            _t(
                lang,
                "\nReply with a *customer number* (e.g. *1*) to send a reminder (if phone is missing, ExBOS will ask you for it).\nOr send `REMIND ALL` / `VERIFY <Name>` / *0* for Menu.",
                "\nSubiza *umubare w'umukiriya* (urugero: *1*) umwoherereze ibutsa (niba nta nimero afite, ExBOS irayigusaba).\nCyangwa wandike `REMIND ALL` / `VERIFY <Izina>` / *0*.",
            )
        )
        return {"reply": "\n".join(lines), "action": "list_unpaid"}

    if upper_text.startswith("REMIND"):
        arg = clean_text[6:].strip()
        unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
        if not unpaid:
            set_session(None)
            return {
                "reply": _t(
                    lang,
                    "All customers are *Paid in Full*. No unpaid customers to remind right now.\n\nReply *0* for Main Menu.",
                    "Abakiriya bose *Barishyuye*. Nta mukiriya ufite ideni ubu.\n\nSubiza *0* usubire ahabanza.",
                ),
                "action": "list_unpaid_empty",
            }
        # Bare 'REMIND' (no name/ALL) -> show numbered unpaid list and let user reply with number or customer name (e.g. 'Leo')
        if not arg:
            set_session("unpaid_pick_customer", {})
            lines = [_t(lang, "*Select Customer to Remind:*", "*Hitamo Umukiriya Woherereza Ibutsa:*")]
            for idx, u in enumerate(unpaid[:10], start=1):
                phone_lbl = u["customerPhone"] if u.get("customerPhone") else _t(lang, "No WhatsApp Number", "Nta Nimero ya WhatsApp")
                lines.append(
                    f"*{idx}.* {u['customerName']} — *{_fmt_rwf(u['remainingAmountRWF'])}* | {phone_lbl}"
                )
            lines.append(
                _t(
                    lang,
                    "\nReply with a *customer number* (e.g. *1*) or *customer name* (e.g. *Leo*), or `REMIND ALL`.",
                    "\nSubiza *umubare* (urugero: *1*) cyangwa *izina ry'umukiriya* (urugero: *Leo*), cyangwa `REMIND ALL`.",
                )
            )
            return {"reply": "\n".join(lines), "action": "remind_pick_customer"}

        if arg.upper() != "ALL":
            match = next(
                (u for u in unpaid if arg.lower() in u["customerName"].lower() or str(u["id"]).lower() == arg.lower()),
                None,
            )
            if not match:
                set_session("unpaid_pick_customer", {})
                names_list = "\n".join(f"*{i}.* {u['customerName']} ({_fmt_rwf(u['remainingAmountRWF'])})" for i, u in enumerate(unpaid[:10], start=1))
                return {
                    "reply": _t(
                        lang,
                        f"No unpaid customer found matching `{arg}`.\n\nCurrent unpaid customers:\n{names_list}\n\nReply with a number or name.",
                        f"Nta mukiriya ufite ideni uhuye na `{arg}`.\n\nAbafite amadeni ubu:\n{names_list}\n\nSubiza umubare cyangwa izina.",
                    ),
                    "action": "remind_not_found",
                }
            rem_data = {
                "id": match["id"],
                "bucket": match["bucket"],
                "customerName": match["customerName"],
                "customerPhone": match.get("customerPhone") or "",
                "productsBought": match["productsBought"],
                "totalAmountRWF": match["totalAmountRWF"],
                "paidAmountRWF": match["paidAmountRWF"],
                "remainingAmountRWF": match["remainingAmountRWF"],
            }
            if not rem_data["customerPhone"]:
                set_session("remind_enter_phone", rem_data)
                return {
                    "reply": _t(
                        lang,
                        f"*{match['customerName']}* has no WhatsApp number saved yet.\nEnter their WhatsApp phone number to save & send the reminder (e.g. *0788123456*), or *0* to cancel:",
                        f"*{match['customerName']}* nta nimero ya WhatsApp afite.\nAndika nimero ye ya WhatsApp tuyibike tunamwoherereze ibutsa (urugero: *0788123456*), cyangwa *0* uhagarike:",
                    ),
                    "action": "remind_enter_phone",
                }
            set_session("confirm_reminder", rem_data)
            return {
                "reply": _format_verification_card("SEND PAYMENT REMINDER", _reminder_verification_rows(rem_data, lang), lang=lang, title_rw="OHEREZA IBUTSA RY'IDENI"),
                "action": "confirm_reminder",
            }
        set_session(None)
        res = send_debt_reminders(db, scope_key, arch_id, target_id=arg, business_name=business_name)
        return {
            "reply": (
                "WhatsApp Reminders Processed:\n"
                f"- Targeted: {res['totalTargeted']}\n"
                f"- Dispatched/Queued: {res['dispatchedCount']}\n"
                f"- Skipped (no phone): {res['skippedCount']}\n\n"
                + _t(
                    lang,
                    "Reply *6* for Unpaid Customers or *0* for Main Menu.",
                    "Subiza *6* urebe abatarishyura cyangwa *0* usubire ahabanza.",
                )
            ),
            "action": "send_reminders",
            "result": res,
        }

    if upper_text.startswith("VERIFY"):
        set_session(None)
        arg = clean_text[6:].strip()
        if not arg:
            return {
                "reply": _t(
                    lang,
                    "Usage: `VERIFY <Customer Name or Sale ID>` (optional amount at end).\n\nReply *0* for Main Menu.",
                    "Uko bikoreshwa: `VERIFY <Izina ry'Umukiriya cyangwa ID>` (amafaranga ku mpera niba atishyuye yose).\n\nSubiza *0* usubire ahabanza.",
                ),
                "action": "verify_usage",
            }
        parts = arg.split()
        amt = None
        if len(parts) >= 2 and re.match(r"^\d+(\.\d+)?$", parts[-1].replace(",", "")):
            amt = float(parts[-1].replace(",", ""))
            target = " ".join(parts[:-1])
        else:
            target = arg
        res = verify_customer_payment(db, scope_key, arch_id, target_id=target, amount=amt, source="WhatsApp")
        if not res.get("ok"):
            return {
                "reply": (
                    res.get("error", "Could not verify payment.")
                    + "\n\n"
                    + _t(
                        lang,
                        "Reply *6* for Unpaid Customers or *0* for Main Menu.",
                        "Subiza *6* urebe abatarishyura cyangwa *0* usubire ahabanza.",
                    )
                ),
                "action": "verify_failed",
            }
        cleared_line_en = "Customer removed from Unpaid List.\n" if res["clearedFromUnpaidList"] else ""
        cleared_line_rw = "Umukiriya yakuwe ku rutonde rw'abatarishyura.\n" if res["clearedFromUnpaidList"] else ""
        return {
            "reply": _t(
                lang,
                (
                    "*PAYMENT VERIFIED*\n"
                    f"- Customer: *{res['customerName']}*\n"
                    f"- Verified Paid: *{_fmt_rwf(res['paidNowRWF'])}*\n"
                    f"- Remaining: *{_fmt_rwf(res['remainingAmountRWF'])}* ({res['status']})\n"
                    f"{cleared_line_en}"
                    "\nReply *6* for Unpaid Customers or *0* for Main Menu."
                ),
                (
                    "*UBWISHYU BWEMEJWE*\n"
                    f"- Umukiriya: *{res['customerName']}*\n"
                    f"- Ayishyuwe: *{_fmt_rwf(res['paidNowRWF'])}*\n"
                    f"- Asigaye: *{_fmt_rwf(res['remainingAmountRWF'])}* ({res['status']})\n"
                    f"{cleared_line_rw}"
                    "\nSubiza *6* urebe abandi batarishyura cyangwa *0* usubire ahabanza."
                ),
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
                "reply": _t(
                    lang,
                    f"*{business_name}* has no products in the database yet.\nReply *8* to add a product first or *0* for Main Menu.",
                    f"*{business_name}* ntiragira ibicuruzwa mu bubiko.\nSubiza *8* ubanze wongeremo igicuruzwa cyangwa *0* usubire ahabanza.",
                ),
                "action": "sale_no_products",
            }
        set_session("sale_pick_product", {})
        return {
            "reply": _format_product_picker(business_name, catalog, _t(lang, "Sale", "Igurisha"), lang=lang),
            "action": "sale_pick_product",
        }

    if upper_text == "3":
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        set_session("purchase_pick_product", {})
        if catalog:
            return {
                "reply": _format_product_picker(business_name, catalog, _t(lang, "Purchase / Restock", "Irangura"), lang=lang),
                "action": "purchase_pick_product",
            }
        return {
            "reply": _t(lang, "Enter the *Item Name* you are purchasing (or reply *0* to cancel):", "Andika *Izina ry'Igicuruzwa* urangura (cyangwa *0* uhagarike):"),
            "action": "purchase_pick_product",
        }

    if upper_text == "4":
        set_session("expense_enter_title", {})
        cat_lines = "\n".join(f"*{k}.* {v}" for k, v in EXPENSE_CATEGORIES.items())
        return {
            "reply": _t(
                lang,
                f"*{business_name} — Record an Expense*\nSelect a category or type your own description:\n{cat_lines}\n\nReply *1–6*, type a custom title, or *0* to cancel.",
                f"*{business_name} — Andika Amafaranga Yakoreshejwe*\nHitamo icyiciro cyangwa wandike igisobanuro:\n{cat_lines}\n\nSubiza *1–6*, wandike izina, cyangwa *0* uhagarike.",
            ),
            "action": "expense_enter_title",
        }

    if upper_text == "7":
        set_session(None)
        unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
        if not unpaid:
            return {"reply": _t(lang, "No unpaid customers found to verify right now. Reply *0* for Main Menu.", "Nta bakiriya bafite ideni bahari ubu. Subiza *0* usubire ahabanza."), "action": "verify_none"}
        lines = [_t(lang, "*Select Customer to Verify Payment:*", "*Hitamo Umukiriya Wemeza Ubwishyu:*")]
        for idx, u in enumerate(unpaid[:10], start=1):
            lines.append(f"*{idx}.* {u['customerName']} — {_t(lang, 'Owed', 'Ideni')}: *{_fmt_rwf(u['remainingAmountRWF'])}*")
        lines.append(_t(lang, "\nReply `VERIFY <Customer Name>` (e.g. `VERIFY Jean`) or *0* for Menu.", "\nSubiza `VERIFY <Izina ry'Umukiriya>` cyangwa *0* usubire ahabanza."))
        return {"reply": "\n".join(lines), "action": "prompt_verify"}

    if upper_text == "8":
        set_session("product_enter_name", {})
        return {
            "reply": _t(
                lang,
                f"*{business_name} — Add New Product*\n\nEnter the *Product Name* (e.g. *Airtel Router 4G*), or *0* to cancel:",
                f"*{business_name} — Ongeramo Igicuruzwa Gishya*\n\nAndika *Izina ry'Igicuruzwa* (urugero: *Airtel Router 4G*), cyangwa *0* uhagarike:",
            ),
            "action": "product_enter_name",
        }

    # Fallback: friendly, executive prompt without harsh error wording
    return {
        "reply": (
            _t(
                lang,
                f"I could not match `{clean_text}` to a menu option.\n\n",
                f"`{clean_text}` ntiyabonetse mu mahitamo.\n\n",
            )
            + build_welcome_message(business_name, arch_id, lang=lang, is_super_admin=is_sa)
        ),
        "action": "fallback_menu",
    }
