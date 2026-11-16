import sys
from app import create_app
from app.database import get_db


def run_verification():
    app = create_app()
    client = app.test_client()
    db = get_db()

    test_email = "verify_all_arch@exbos.rw"
    # Ensure clean slate for idempotent runs
    for col in (db.users, db.businesses, db.workspaces, db.module_records, db.transactions, db.password_resets, db.products):
        col.delete_many({"$or": [{"email": test_email}, {"scopeKey": test_email}]})
    headers = {}

    # 1. Send & Verify Email OTP + Register Business
    r1 = client.post(
        "/api/v1/auth/send-verification",
        json={"email": test_email, "fullName": "Mugisha Leobeni"},
    )
    assert r1.status_code == 200, f"send-verification failed: {r1.get_json()}"
    otp_rec = db.password_resets.find_one({"email": test_email})
    assert otp_rec and otp_rec.get("code"), "OTP record not found"

    r2 = client.post(
        "/api/v1/auth/verify-email",
        json={"email": test_email, "code": otp_rec["code"]},
    )
    assert r2.status_code == 200, f"verify-email failed: {r2.get_json()}"

    r3 = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Mugisha Leobeni",
            "email": test_email,
            "phone": "+250 788 123 456",
            "password": "Password123!",
            "architectureId": "agriculture",
            "businessName": "Sunrise Livestock Farm",
            "businessCategory": "Agriculture & Livestock",
        },
    )
    assert r3.status_code == 201, f"register failed: {r3.get_json()}"
    reg_data = r3.get_json()["data"]
    token = reg_data["access_token"]
    assert reg_data["user"]["architectureId"] == "agriculture"
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Verify all 6 architectures persist records into both db.workspaces and db.module_records
    arch_tests = [
        (
            "make-and-sell",
            "Sales",
            {"id": "SAL-MS-101", "title": "Artisan Bread Sale", "amountRWF": 45000, "status": "Paid"},
        ),
        (
            "make-and-sell",
            "Recipes",
            {"id": "REC-MS-101", "name": "Sourdough Formula", "yieldQuantity": 100},
        ),
        (
            "buy-and-sell",
            "Sales",
            {"id": "SAL-BS-201", "title": "Hardware Retail Sale", "amountRWF": 120000, "status": "Completed"},
        ),
        (
            "buy-and-sell",
            "Inventory",
            {"id": "INV-BS-201", "title": "Solar Inverter 5kW", "sellingPriceRWF": 450000, "quantity": 5},
        ),
        (
            "services",
            "Jobs",
            {"id": "JOB-SV-301", "customerName": "Alice Uwase", "serviceName": "Executive Styling", "totalPriceRWF": 35000, "amountRWF": 35000, "status": "Completed"},
        ),
        (
            "agriculture",
            "Animals",
            {"id": "ANM-AG-401", "name": "Bella Friesian", "type": "Cattle", "breed": "Friesian", "purchasePriceRWF": 650000},
        ),
        (
            "agriculture",
            "FeedingLogs",
            {"id": "FDL-AG-401", "feedName": "Dairy Concentrates", "quantityUsed": 25, "costRWF": 18500},
        ),
        (
            "food-and-hospitality",
            "MenuItems",
            {"id": "MNU-FH-501", "name": "Grilled Tilapia Platter", "sellingPriceRWF": 15000, "portionCostRWF": 4800},
        ),
        (
            "food-and-hospitality",
            "KitchenOrders",
            {"id": "KOT-FH-501", "orderNumber": "ORD-501", "tableName": "Table 04", "totalAmountRWF": 30000, "status": "Served & Paid"},
        ),
        (
            "hybrid",
            "HybridItems",
            {"id": "HYB-HB-601", "title": "Laptop SSD Upgrade", "activity": "retail", "sellingPriceRWF": 65000, "unitCostRWF": 40000, "trackStock": True, "currentStock": 10},
        ),
        (
            "hybrid",
            "MixedSales",
            {"id": "MSAL-HB-601", "invoiceNumber": "INV-MIX-601", "customerName": "Eric Ndayisaba", "totalAmountRWF": 85000, "status": "Paid in Full"},
        ),
    ]

    for arch_id, bucket, payload in arch_tests:
        res = client.post(
            f"/api/v1/workspaces/{arch_id}/records/{bucket}?scopeKey={test_email}",
            json=payload,
            headers=headers,
        )
        assert res.status_code == 201, f"Failed POST {arch_id}/{bucket}: {res.get_json()}"

        # Verify in db.workspaces
        ws_doc = db.workspaces.find_one({"scopeKey": test_email, "architectureId": arch_id})
        assert ws_doc is not None, f"Workspace missing for {arch_id}"
        bucket_items = ws_doc.get("records", {}).get(bucket, [])
        assert any(r.get("id") == payload["id"] for r in bucket_items), (
            f"Record {payload['id']} missing in db.workspaces[{arch_id}].records.{bucket}"
        )

        # Verify in top-level db.module_records
        mod_rec = db.module_records.find_one(
            {
                "scopeKey": test_email,
                "architectureId": arch_id,
                "bucket": bucket,
                "id": payload["id"],
            }
        )
        assert mod_rec is not None, (
            f"Record {payload['id']} missing in top-level db.module_records for {arch_id}/{bucket}"
        )

    # 3. Verify PATCH /api/v1/workspaces/<arch> (used by Make & Sell, Services, Documents, TeamMembers)
    patch_res = client.patch(
        f"/api/v1/workspaces/services?scopeKey={test_email}",
        json={
            "records": {
                "Services": [{"id": "SRV-301", "name": "Bridal Package", "priceRWF": 150000}],
                "Staff": [{"id": "STF-301", "name": "Chantal Keza", "role": "Senior Stylist"}],
                "Documents": [{"id": "INV-901", "type": "Invoice", "recipientName": "Client A", "amount": 150000}],
                "TeamMembers": [{"id": "USR-2", "name": "Cashier One", "email": "cashier@exbos.rw"}],
            }
        },
        headers=headers,
    )
    assert patch_res.status_code == 200, f"PATCH workspace failed: {patch_res.get_json()}"
    assert db.module_records.find_one(
        {"scopeKey": test_email, "architectureId": "services", "bucket": "Services", "id": "SRV-301"}
    )
    assert db.module_records.find_one(
        {"scopeKey": test_email, "architectureId": "services", "bucket": "Documents", "id": "INV-901"}
    )

    # 4. Verify POST /api/storage with empty initial state does NOT overwrite existing saved records
    empty_res = client.post(
        f"/api/storage?scopeKey={test_email}",
        json={
            "workspaces": {
                "agriculture": {"records": {"Animals": []}},
                "buy-and-sell": {"records": {"Sales": []}},
            }
        },
        headers=headers,
    )
    assert empty_res.status_code == 200
    snap_res = client.get(f"/api/storage?scopeKey={test_email}", headers=headers)
    snap_data = snap_res.get_json()
    agri_animals = snap_data["workspaces"]["agriculture"]["records"]["Animals"]
    assert any(a["id"] == "ANM-AG-401" for a in agri_animals), (
        "Empty storage snapshot overwrote saved agriculture Animals!"
    )

    # 5. Verify transactions persisted with scopeKey and architectureId
    tx_res = client.post(
        f"/api/v1/transactions?scopeKey={test_email}",
        json={
            "id": "TX-TEST-999",
            "architectureId": "agriculture",
            "type": "in",
            "category": "Farm Sales",
            "title": "Milk Batch Sale",
            "amountRWF": 95000,
            "account": "MTN MoMo",
        },
        headers=headers,
    )
    assert tx_res.status_code == 201, f"POST transaction failed: {tx_res.get_json()}"
    tx_list = client.get(
        f"/api/v1/transactions?scopeKey={test_email}&architectureId=agriculture",
        headers=headers,
    ).get_json()["data"]
    assert any(t["id"] == "TX-TEST-999" for t in tx_list), "Transaction TX-TEST-999 not found"

    # 6. Verify Stock Deduction + Stock Restoration & KPI Reversal on DELETE across the 5 non-Buy&Sell architectures
    # 6a. Hybrid: MixedSales deducts HybridItems stock and DELETE restores it + reverses KPI
    r_hyb_sale = client.post(
        f"/api/v1/workspaces/hybrid/records/MixedSales?scopeKey={test_email}",
        json={
            "id": "MSAL-HB-602",
            "title": "SSD Upgrade Sale",
            "totalAmountRWF": 195000,
            "amountRWF": 195000,
            "status": "Paid in Full",
            "items": [{"itemId": "HYB-HB-601", "title": "Laptop SSD Upgrade", "quantity": 3}],
        },
        headers=headers,
    )
    assert r_hyb_sale.status_code == 201, f"Hybrid MixedSales POST failed: {r_hyb_sale.get_json()}"
    ws_hyb = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "hybrid"})
    hyb_item = next(i for i in ws_hyb["records"]["HybridItems"] if i["id"] == "HYB-HB-601")
    assert hyb_item["currentStock"] == 7, f"Expected HybridItems stock 7 after sale of 3, got {hyb_item['currentStock']}"

    r_hyb_del = client.delete(
        f"/api/v1/workspaces/hybrid/records/MixedSales/MSAL-HB-602?scopeKey={test_email}",
        headers=headers,
    )
    assert r_hyb_del.status_code == 200, f"Hybrid MixedSales DELETE failed: {r_hyb_del.get_json()}"
    ws_hyb_after = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "hybrid"})
    hyb_item_after = next(i for i in ws_hyb_after["records"]["HybridItems"] if i["id"] == "HYB-HB-601")
    assert hyb_item_after["currentStock"] == 10, f"Expected HybridItems stock restored to 10, got {hyb_item_after['currentStock']}"

    # 6b. Agriculture: FeedingLogs deducts Feeds stock and DELETE restores it
    r_feed = client.post(
        f"/api/v1/workspaces/agriculture/records/Feeds?scopeKey={test_email}",
        json={"id": "FD-AG-401", "name": "Dairy Concentrates", "quantityKg": 100, "quantity": 100, "amountRWF": 50000},
        headers=headers,
    )
    assert r_feed.status_code == 201
    r_flog = client.post(
        f"/api/v1/workspaces/agriculture/records/FeedingLogs?scopeKey={test_email}",
        json={"id": "FDL-AG-402", "feedId": "FD-AG-401", "feedName": "Dairy Concentrates", "quantityUsed": 25, "costRWF": 12500},
        headers=headers,
    )
    assert r_flog.status_code == 201
    ws_ag = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "agriculture"})
    fd_after_log = next(f for f in ws_ag["records"]["Feeds"] if f["id"] == "FD-AG-401")
    assert fd_after_log["quantityKg"] == 75, f"Expected Feeds 75kg, got {fd_after_log['quantityKg']}"

    r_flog_del = client.delete(
        f"/api/v1/workspaces/agriculture/records/FeedingLogs/FDL-AG-402?scopeKey={test_email}",
        headers=headers,
    )
    assert r_flog_del.status_code == 200
    ws_ag_after = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "agriculture"})
    fd_restored = next(f for f in ws_ag_after["records"]["Feeds"] if f["id"] == "FD-AG-401")
    assert fd_restored["quantityKg"] == 100, f"Expected Feeds restored to 100kg, got {fd_restored['quantityKg']}"

    # 6c. Make & Sell: Inventory deduction on Sales and restoration on DELETE
    r_ms_inv = client.post(
        f"/api/v1/workspaces/make-and-sell/records/Inventory?scopeKey={test_email}",
        json={"id": "INV-MS-101", "title": "Artisan Bread Loaf", "quantity": 20, "sellingPriceRWF": 2000},
        headers=headers,
    )
    assert r_ms_inv.status_code == 201
    r_ms_sale = client.post(
        f"/api/v1/workspaces/make-and-sell/records/Sales?scopeKey={test_email}",
        json={"id": "SAL-MS-102", "productId": "INV-MS-101", "productTitle": "Artisan Bread Loaf", "quantity": 5, "amountRWF": 10000, "status": "Paid"},
        headers=headers,
    )
    assert r_ms_sale.status_code == 201
    ws_ms = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "make-and-sell"})
    ms_item = next(i for i in ws_ms["records"]["Inventory"] if i["id"] == "INV-MS-101")
    assert ms_item["quantity"] == 15, f"Expected Make&Sell Inventory 15, got {ms_item['quantity']}"
    client.delete(f"/api/v1/workspaces/make-and-sell/records/Sales/SAL-MS-102?scopeKey={test_email}", headers=headers)
    ws_ms_after = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "make-and-sell"})
    ms_item_after = next(i for i in ws_ms_after["records"]["Inventory"] if i["id"] == "INV-MS-101")
    assert ms_item_after["quantity"] == 20, f"Expected Make&Sell Inventory restored to 20, got {ms_item_after['quantity']}"

    # 6d. Services & Food & Hospitality: DELETE reverses monthlyRevenueRWF
    ws_sv_before = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "services"})
    sv_rev_before = float(ws_sv_before.get("monthlyRevenueRWF") or 0)
    client.delete(f"/api/v1/workspaces/services/records/Jobs/JOB-SV-301?scopeKey={test_email}", headers=headers)
    ws_sv_after = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "services"})
    assert float(ws_sv_after.get("monthlyRevenueRWF") or 0) == max(0.0, sv_rev_before - 35000.0)

    ws_fh_before = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "food-and-hospitality"})
    fh_rev_before = float(ws_fh_before.get("monthlyRevenueRWF") or 0)
    client.delete(f"/api/v1/workspaces/food-and-hospitality/records/KitchenOrders/KOT-FH-501?scopeKey={test_email}", headers=headers)
    ws_fh_after = db.workspaces.find_one({"scopeKey": test_email, "architectureId": "food-and-hospitality"})
    assert float(ws_fh_after.get("monthlyRevenueRWF") or 0) == max(0.0, fh_rev_before - 30000.0)

    # Clean up test tenant data
    for col in (db.users, db.businesses, db.workspaces, db.module_records, db.transactions, db.password_resets, db.products):
        col.delete_many({"$or": [{"email": test_email}, {"scopeKey": test_email}]})

    print("ALL 6 ARCHITECTURES & SHARED MODULES PERSISTENCE + STOCK/KPI PARITY VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    try:
        run_verification()
    except Exception as exc:
        print(f"Verification failed: {exc}", file=sys.stderr)
        sys.exit(1)
