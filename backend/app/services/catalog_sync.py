"""
Unified Canonical Sync Layer shared by WhatsApp Engine and Web REST API.
Ensures that Products, Inventory, Sales, Purchases, Expenses, and Customers
stay 100% synchronized across:
  - db.workspaces (ALL matching buckets, e.g., Products + Inventory)
  - db.products (dedicated mirrored products collection)
  - db.module_records (canonical per-record collection)
"""

from datetime import datetime, timezone
from typing import Any, Optional

CATALOG_BUCKETS_BY_ARCH = {
    "buy-and-sell": ["Products", "Inventory"],
    "make-and-sell": ["Products", "RawMaterials", "Inventory"],
    "services": ["Services", "Inventory", "Products"],
    "agriculture": ["Animals", "Crops", "Inventory", "Products"],
    "food-hospitality": ["MenuItems", "Ingredients", "Inventory", "Products"],
    "hybrid": ["HybridItems", "Products", "Services", "Inventory"],
}


def _matches_branch(rec: Any, branch_id: Optional[str]) -> bool:
    if not branch_id:
        return True
    if not isinstance(rec, dict):
        return False
    return str(rec.get("branchId") or "main").strip() == str(branch_id).strip()


def _recompute_product_financials(item: dict[str, Any]) -> dict[str, Any]:
    """Recompute derived profit, margin, stock value, and status matching ProductModal.jsx."""
    next_item = dict(item)
    sell = float(next_item.get("sellingPriceRWF") or 0)
    cost = float(
        next_item.get("purchasePriceRWF")
        if next_item.get("purchasePriceRWF") is not None
        else next_item.get("unitCostRWF")
        if next_item.get("unitCostRWF") is not None
        else next_item.get("costPriceRWF") or 0
    )
    qty = float(
        next_item.get("quantity")
        if next_item.get("quantity") is not None
        else next_item.get("currentStock") or 0
    )
    low_stock = float(next_item.get("lowStockAlert") or 5)

    unit_profit = round(sell - cost, 2)
    margin_pct = round(((sell - cost) / sell) * 100, 1) if sell > 0 else 0.0
    qty_clean = int(qty) if qty.is_integer() else round(qty, 2)

    next_item["sellingPriceRWF"] = sell
    next_item["purchasePriceRWF"] = cost
    next_item["unitCostRWF"] = cost
    next_item["costPriceRWF"] = cost
    next_item["quantity"] = qty_clean
    next_item["currentStock"] = qty_clean
    next_item["expectedUnitProfitRWF"] = unit_profit
    next_item["expectedMarginPct"] = margin_pct
    if sell > 0:
        next_item["amountRWF"] = sell * qty if qty > 0 else sell
    next_item["status"] = "Low Stock" if qty <= low_stock else "Active"
    return next_item


def mirror_record_to_module_records(
    db: Any,
    scope_key: str,
    arch_id: str,
    bucket: str,
    record: dict[str, Any],
    now_iso: Optional[str] = None,
) -> None:
    """Mirror any record (Sale, Purchase, Expense, Customer, Product, Inventory) into db.module_records."""
    if db is None or not isinstance(record, dict):
        return
    rec_id = str(record.get("id") or "").strip()
    if not rec_id:
        return
    ts = now_iso or datetime.now(timezone.utc).isoformat()
    doc = {
        **record,
        "id": rec_id,
        "scopeKey": scope_key,
        "architectureId": arch_id,
        "bucket": bucket,
        "branchId": str(record.get("branchId") or "main").strip(),
        "updated_at": ts,
    }
    doc.pop("_id", None)
    db.module_records.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id, "bucket": bucket, "id": rec_id},
        {"$set": doc},
        upsert=True,
    )


def mirror_product_to_products_collection(
    db: Any,
    scope_key: str,
    arch_id: str,
    item: dict[str, Any],
    now_iso: Optional[str] = None,
) -> None:
    """Mirror a product/inventory item into the dedicated top-level db.products collection."""
    if db is None or not isinstance(item, dict):
        return
    rec_id = str(item.get("id") or "").strip()
    if not rec_id:
        return
    ts = now_iso or datetime.now(timezone.utc).isoformat()
    doc = {
        **item,
        "id": rec_id,
        "scopeKey": scope_key,
        "architectureId": arch_id,
        "branchId": str(item.get("branchId") or "main").strip(),
        "updated_at": ts,
    }
    doc.pop("_id", None)
    db.products.update_one(
        {"scopeKey": scope_key, "architectureId": arch_id, "id": rec_id},
        {"$set": doc},
        upsert=True,
    )


def sync_catalog_product_update(
    db: Any,
    scope_key: str,
    arch_id: str,
    product_id: str,
    updates: dict[str, Any],
    branch_id: Optional[str] = None,
    primary_bucket: str = "",
) -> Optional[dict[str, Any]]:
    """
    Update a product across ALL matching catalog buckets in db.workspaces (e.g. BOTH Products AND Inventory),
    recompute derived profit/margin/status, and mirror into db.products and db.module_records.
    """
    if not product_id or db is None:
        return None
    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id})
    if not ws:
        return None
    records = dict(ws.get("records") or {})
    now_iso = datetime.now(timezone.utc).isoformat()

    buckets_to_check = list(CATALOG_BUCKETS_BY_ARCH.get(arch_id, ["Products", "Inventory"]))
    if primary_bucket and primary_bucket not in buckets_to_check:
        buckets_to_check.insert(0, primary_bucket)

    # First pass: locate the target product's original title and branchId so sibling entries
    # in Inventory/Products with the same id OR same (title, branchId) stay 100% synchronized.
    orig_title_low = ""
    orig_branch_id = str(branch_id or "").strip()
    for b in buckets_to_check:
        for item in records.get(b) or []:
            if isinstance(item, dict) and str(item.get("id") or "") == str(product_id) and _matches_branch(item, branch_id):
                orig_title_low = str(item.get("title") or item.get("name") or "").strip().lower()
                orig_branch_id = str(item.get("branchId") or "main").strip()
                break
        if orig_title_low:
            break

    updated_primary: Optional[dict[str, Any]] = None
    any_changed = False

    for b in buckets_to_check:
        items = list(records.get(b) or [])
        bucket_changed = False
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            item_id = str(item.get("id") or "")
            item_title_low = str(item.get("title") or item.get("name") or "").strip().lower()
            item_branch = str(item.get("branchId") or "main").strip()

            is_id_match = item_id == str(product_id) and _matches_branch(item, branch_id)
            is_sibling_match = bool(
                orig_title_low
                and item_title_low == orig_title_low
                and item_branch == (orig_branch_id or "main")
            )
            if not (is_id_match or is_sibling_match):
                continue

            next_item = dict(item)
            if "name" in updates:
                next_item["title"] = updates["name"]
                next_item["name"] = updates["name"]
            if "sellingPriceRWF" in updates:
                next_item["sellingPriceRWF"] = float(updates["sellingPriceRWF"])
            if "costPriceRWF" in updates:
                cost_val = float(updates["costPriceRWF"])
                next_item["purchasePriceRWF"] = cost_val
                next_item["unitCostRWF"] = cost_val
                next_item["costPriceRWF"] = cost_val
            if "quantity" in updates:
                next_item["quantity"] = float(updates["quantity"])
                next_item["currentStock"] = float(updates["quantity"])
            if "deltaQty" in updates:
                cur_q = float(
                    next_item.get("quantity")
                    if next_item.get("quantity") is not None
                    else next_item.get("currentStock") or 0
                )
                next_q = max(0.0, cur_q + float(updates["deltaQty"]))
                next_item["quantity"] = next_q
                next_item["currentStock"] = next_q

            next_item = _recompute_product_financials(next_item)
            next_item["updated_at"] = now_iso
            items[idx] = next_item
            bucket_changed = True
            any_changed = True

            if is_id_match or updated_primary is None:
                updated_primary = next_item

            mirror_record_to_module_records(db, scope_key, arch_id, b, next_item, now_iso)
            mirror_product_to_products_collection(db, scope_key, arch_id, next_item, now_iso)

        if bucket_changed:
            records[b] = items

    if any_changed:
        db.workspaces.update_one(
            {"scopeKey": scope_key, "architectureId": arch_id},
            {"$set": {"records": records, "updated_at": now_iso}},
        )

    return updated_primary


def sync_catalog_product_delete(
    db: Any,
    scope_key: str,
    arch_id: str,
    product_id: str,
    branch_id: Optional[str] = None,
    primary_bucket: str = "",
) -> bool:
    """
    Permanently delete a product from ALL matching catalog buckets in db.workspaces
    (Products + Inventory + siblings), db.products, and db.module_records.
    """
    if not product_id or db is None:
        return False
    ws = db.workspaces.find_one({"scopeKey": scope_key, "architectureId": arch_id})
    if not ws:
        return False
    records = dict(ws.get("records") or {})
    now_iso = datetime.now(timezone.utc).isoformat()

    buckets_to_check = list(CATALOG_BUCKETS_BY_ARCH.get(arch_id, ["Products", "Inventory"]))
    if primary_bucket and primary_bucket not in buckets_to_check:
        buckets_to_check.insert(0, primary_bucket)

    orig_title_low = ""
    orig_branch_id = str(branch_id or "").strip()
    for b in buckets_to_check:
        for item in records.get(b) or []:
            if isinstance(item, dict) and str(item.get("id") or "") == str(product_id) and _matches_branch(item, branch_id):
                orig_title_low = str(item.get("title") or item.get("name") or "").strip().lower()
                orig_branch_id = str(item.get("branchId") or "main").strip()
                break
        if orig_title_low:
            break

    removed = False
    removed_ids: set[str] = {str(product_id)}

    for b in buckets_to_check:
        items = list(records.get(b) or [])
        kept = []
        for item in items:
            if not isinstance(item, dict):
                kept.append(item)
                continue
            item_id = str(item.get("id") or "")
            item_title_low = str(item.get("title") or item.get("name") or "").strip().lower()
            item_branch = str(item.get("branchId") or "main").strip()
            is_match = (item_id == str(product_id) and _matches_branch(item, branch_id)) or bool(
                orig_title_low
                and item_title_low == orig_title_low
                and item_branch == (orig_branch_id or "main")
            )
            if is_match:
                removed = True
                if item_id:
                    removed_ids.add(item_id)
            else:
                kept.append(item)
        if len(kept) != len(items):
            records[b] = kept

    if removed:
        db.workspaces.update_one(
            {"scopeKey": scope_key, "architectureId": arch_id},
            {"$set": {"records": records, "updated_at": now_iso}},
        )
        for rid in removed_ids:
            db.products.delete_many({"scopeKey": scope_key, "architectureId": arch_id, "id": rid})
            db.module_records.delete_many({"scopeKey": scope_key, "architectureId": arch_id, "id": rid})

    return removed

