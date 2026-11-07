import sys
from app import create_app
from app.database import get_db


def run_verification():
    app = create_app()
    client = app.test_client()
    db = get_db()

    test_email = "verify_all_arch@exbos.rw"
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

    print("ALL 6 ARCHITECTURES & SHARED MODULES PERSISTENCE VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    try:
        run_verification()
    except Exception as exc:
        print(f"Verification failed: {exc}", file=sys.stderr)
        sys.exit(1)
