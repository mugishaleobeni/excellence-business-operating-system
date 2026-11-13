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


def handle_incoming_whatsapp_message(
    db: Any,
    from_phone: str,
    text: str,
    user_doc: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Deterministic structured instruction & numbered menu engine.
    Handles menu selections (0-8), step-by-step sessions, and fast-path commands.
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
            "Welcome to *EXCELLENCE BOS* Official WhatsApp!\n\n"
            "This phone number is not yet linked to an ExBOS business account.\n"
            "Please register or enable WhatsApp in *Dashboard -> Integrations* to connect automatically."
        )
        return {"reply": reply, "action": "unlinked_user"}

    scope_key = (user_doc.get("email") or "").strip().lower()
    arch_id = user_doc.get("architectureId") or "buy-and-sell"
    business_name = user_doc.get("businessName") or user_doc.get("name") or "ExBOS Business"
    buckets = ARCH_BUCKETS.get(arch_id, ARCH_BUCKETS["buy-and-sell"])

    session = db.whatsapp_sessions.find_one({"phone": normalized_phone}, {"_id": 0}) or {}

    def set_session(step: Optional[str], data: Optional[dict[str, Any]] = None) -> None:
        if step is None:
            db.whatsapp_sessions.delete_one({"phone": normalized_phone})
        else:
            db.whatsapp_sessions.update_one(
                {"phone": normalized_phone},
                {"$set": {"phone": normalized_phone, "step": step, "data": data or {}, "updated_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )

    # Global reset / menu command
    if upper_text in ("0", "MENU", "HELP", "HI", "HELLO", "START", "CANCEL"):
        set_session(None)
        return {
            "reply": build_welcome_message(business_name, arch_id),
            "action": "menu",
        }

    # --- FAST-PATH COMMANDS ---
    if upper_text in ("1", "PRODUCTS", "STOCK", "ITEMS", "CATALOG"):
        set_session(None)
        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        items = _catalog_items(ws, arch_id)
        if not items:
            return {
                "reply": f"*{business_name} Catalog* is currently empty.\nReply *8* or send `ADD PRODUCT Name SellPrice CostPrice Qty` to add one.",
                "action": "list_products_empty",
            }
        lines = [f"*{business_name} — Database Items ({len(items)} total):*"]
        for idx, item in enumerate(items[:15], start=1):
            name = item.get("title") or item.get("name") or item.get("id")
            qty = item.get("quantity") if item.get("quantity") is not None else item.get("currentStock", 0)
            price = item.get("sellingPriceRWF") or item.get("amountRWF") or item.get("unitCostRWF") or 0
            lines.append(f"{idx}. *{name}* — Qty: {qty} | {_fmt_rwf(price)}")
        if len(items) > 15:
            lines.append(f"...and {len(items) - 15} more in your ExBOS Dashboard.")
        lines.append("\nReply *2* to record a Sale or *0* for Menu.")
        return {"reply": "\n".join(lines), "action": "list_products", "count": len(items)}

    if upper_text in ("5", "REPORT", "REPORTS", "PNL", "SUMMARY"):
        set_session(None)
        return {"reply": _build_report_text(db, scope_key, arch_id, business_name), "action": "report"}

    if upper_text in ("6", "UNPAID", "DEBTS", "OWED"):
        set_session(None)
        unpaid = get_unpaid_customers_summary(db, scope_key, arch_id)
        if not unpaid:
            return {"reply": "All customers are *Paid in Full*! Zero unpaid balances right now.", "action": "list_unpaid_empty"}
        lines = [f"*Unpaid Customers ({len(unpaid)}):*"]
        for idx, u in enumerate(unpaid[:10], start=1):
            lines.append(
                f"{idx}. *{u['customerName']}* ({u['productsBought']})\n"
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
                f"WhatsApp Reminders Processed:\n"
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
                f"Payment Verified!\n"
                f"- Customer: *{res['customerName']}*\n"
                f"- Verified Paid: *{_fmt_rwf(res['paidNowRWF'])}*\n"
                f"- Remaining: *{_fmt_rwf(res['remainingAmountRWF'])}* ({res['status']})\n"
                + ("Customer removed from Unpaid List." if res["clearedFromUnpaidList"] else "")
            ),
            "action": "payment_verified",
            "result": res,
        }

    # Fast command: SALE <qty> <item> [total_or_unit_price]
    if upper_text.startswith("SALE "):
        set_session(None)
        m = re.match(r"^SALE\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+(\d+(?:,\d{3})*))?$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `SALE <qty> <product name> [amountRWF]`\nExample: `SALE 2 iPhone 600000`", "action": "sale_usage"}
        qty = float(m.group(1))
        item_query = m.group(2).strip()
        explicit_amt = float(m.group(3).replace(",", "")) if m.group(3) else None

        ws = _get_or_init_workspace(db, scope_key, arch_id, business_name)
        catalog = _catalog_items(ws, arch_id)
        matched = next((i for i in catalog if item_query.lower() in str(i.get("title") or i.get("name") or "").lower()), None)
        unit_price = float(matched.get("sellingPriceRWF") or matched.get("amountRWF") or 0) if matched else 0.0
        total_amt = explicit_amt if explicit_amt is not None else (qty * unit_price)
        if total_amt <= 0:
            return {"reply": f"Please include the sale amount: `SALE {int(qty)} {item_query} <amountRWF>`", "action": "sale_needs_amount"}

        item_name = (matched.get("title") or matched.get("name")) if matched else item_query
        entry = _append_record_and_tx(
            db, scope_key, arch_id, buckets["sales"],
            record={
                "title": f"{int(qty) if qty.is_integer() else qty} × {item_name}",
                "productTitle": item_name,
                "productId": matched.get("id") if matched else None,
                "quantity": qty,
                "unitPriceRWF": total_amt / qty if qty else total_amt,
                "amountRWF": total_amt,
                "customerName": "WhatsApp Client",
                "status": "Paid in Full",
                "paymentMethod": "MoMo / Cash",
                "type": "in",
            },
            tx_type="INFLOW",
            tx_amount=total_amt,
            tx_title=f"{int(qty) if qty.is_integer() else qty} × {item_name}",
            tx_category=f"{buckets['sales']} (WhatsApp)",
        )
        return {
            "reply": f"Sale Recorded!\n- Item: *{entry['title']}*\n- Amount: *{_fmt_rwf(total_amt)}*\nSynced live to your Dashboard & Ledger.",
            "action": "sale_recorded",
            "record": entry,
        }

    # Fast command: PURCHASE <qty> <item> <amount>
    if upper_text.startswith("PURCHASE "):
        set_session(None)
        m = re.match(r"^PURCHASE\s+(\d+(?:\.\d+)?)\s+(.+?)\s+(\d+(?:,\d{3})*)$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `PURCHASE <qty> <item> <totalAmountRWF>`\nExample: `PURCHASE 10 Charger 50000`", "action": "purchase_usage"}
        qty = float(m.group(1))
        item_name = m.group(2).strip()
        total_amt = float(m.group(3).replace(",", ""))
        entry = _append_record_and_tx(
            db, scope_key, arch_id, buckets["purchases"],
            record={
                "title": f"{int(qty) if qty.is_integer() else qty} × {item_name}",
                "quantity": qty,
                "amountRWF": total_amt,
                "paidAmountRWF": total_amt,
                "status": "Paid in Full",
                "paymentMethod": "Cash / MoMo",
                "type": "out",
            },
            tx_type="OUTFLOW",
            tx_amount=total_amt,
            tx_title=f"Purchase: {item_name}",
            tx_category=f"{buckets['purchases']} (WhatsApp)",
        )
        return {"reply": f"Purchase Recorded!\n- *{entry['title']}* (*{_fmt_rwf(total_amt)}*)\nSynced to Dashboard.", "action": "purchase_recorded"}

    # Fast command: EXPENSE <title> <amount>
    if upper_text.startswith("EXPENSE "):
        set_session(None)
        m = re.match(r"^EXPENSE\s+(.+?)\s+(\d+(?:,\d{3})*)$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `EXPENSE <description> <amountRWF>`\nExample: `EXPENSE Transport 5000`", "action": "expense_usage"}
        title = m.group(1).strip()
        amt = float(m.group(2).replace(",", ""))
        entry = _append_record_and_tx(
            db, scope_key, arch_id, buckets["expenses"],
            record={"title": title, "amountRWF": amt, "category": "Operating Expense", "status": "Paid", "type": "out"},
            tx_type="OUTFLOW",
            tx_amount=amt,
            tx_title=title,
            tx_category=f"{buckets['expenses']} (WhatsApp)",
        )
        return {"reply": f"Expense Recorded!\n- *{title}*: *{_fmt_rwf(amt)}*\nSynced to Dashboard.", "action": "expense_recorded"}

    # Fast command: ADD PRODUCT <name> <sellPrice> <costPrice> <qty>
    if upper_text.startswith("ADD PRODUCT "):
        set_session(None)
        m = re.match(r"^ADD PRODUCT\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)$", clean_text, re.IGNORECASE)
        if not m:
            return {"reply": "Format: `ADD PRODUCT <Name> <SellPrice> <CostPrice> <Qty>`\nExample: `ADD PRODUCT Sugar 1500 1200 50`", "action": "add_product_usage"}
        name, sell_p, cost_p, qty = m.group(1).strip(), float(m.group(2)), float(m.group(3)), float(m.group(4))
        entry = _append_record_and_tx(
            db, scope_key, arch_id, buckets["primary_catalog"],
            record={
                "title": name,
                "name": name,
                "category": "General",
                "sellingPriceRWF": sell_p,
                "purchasePriceRWF": cost_p,
                "unitCostRWF": cost_p,
                "quantity": qty,
                "currentStock": qty,
                "amountRWF": qty * sell_p,
                "status": "Active",
            },
        )
        return {"reply": f"Product Added!\n- *{name}* | Qty: {int(qty)} | Price: {_fmt_rwf(sell_p)}", "action": "product_added", "record": entry}

    # --- NUMBERED INTERACTIVE MENU GUIDANCE ---
    if upper_text == "2":
        set_session("awaiting_sale")
        return {"reply": "Send your sale in one line:\n`SALE <qty> <product name> [amountRWF]`\nExample: `SALE 2 iPhone 600000`\n(Or reply *0* for Menu)", "action": "prompt_sale"}
    if upper_text == "3":
        set_session("awaiting_purchase")
        return {"reply": "Send your purchase in one line:\n`PURCHASE <qty> <item> <totalAmountRWF>`\nExample: `PURCHASE 10 Charger 50000`", "action": "prompt_purchase"}
    if upper_text == "4":
        set_session("awaiting_expense")
        return {"reply": "Send your expense in one line:\n`EXPENSE <description> <amountRWF>`\nExample: `EXPENSE Electricity 15000`", "action": "prompt_expense"}
    if upper_text == "7":
        set_session("awaiting_verify")
        return {"reply": "Send customer name or sale ID to verify payment:\n`VERIFY <Customer Name>`\nExample: `VERIFY Jean`", "action": "prompt_verify"}
    if upper_text == "8":
        set_session("awaiting_product")
        return {"reply": "Send new product details:\n`ADD PRODUCT <Name> <SellPrice> <CostPrice> <Qty>`\nExample: `ADD PRODUCT Coffee 5000 3500 20`", "action": "prompt_product"}

    # Fallback: show structured menu
    return {
        "reply": f"Command not recognized: `{clean_text}`\n\n" + build_welcome_message(business_name, arch_id),
        "action": "fallback_menu",
    }
