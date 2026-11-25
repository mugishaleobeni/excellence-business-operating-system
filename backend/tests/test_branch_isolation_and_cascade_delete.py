"""Tests for strict Branch Manager isolation on WhatsApp/REST and full Branch Cascade Delete."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask_jwt_extended import create_access_token

from app import create_app
from app.database import get_db
from app.services.whatsapp_engine import handle_incoming_whatsapp_message


class BranchIsolationAndCascadeDeleteTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.owner_email = "test_branch_iso_owner@exbos.test"
        cls.owner_phone = "+250788660001"
        cls.mgr_email = "test_branch_iso_mgr@exbos.test"
        cls.mgr_phone = "+250788660002"
        cls.branch_b_id = "BR-NYABUGOGO-TEST"
        cls.branch_c_id = "BR-REMERA-TEST"

    def _cleanup(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": {"$in": [self.owner_email, self.mgr_email]}})
            db.users.delete_many({"ownerScopeKey": self.owner_email})
            db.workspaces.delete_many({"scopeKey": self.owner_email})
            db.branches.delete_many({"scopeKey": self.owner_email})
            db.transactions.delete_many({"scopeKey": self.owner_email})
            db.module_records.delete_many({"scopeKey": self.owner_email})
            db.products.delete_many({"scopeKey": self.owner_email})
            db.branch_invites.delete_many({"scopeKey": self.owner_email})
            db.owner_notifications.delete_many({"scopeKey": self.owner_email})
            db.integrations.delete_many({"userEmail": {"$in": [self.owner_email, self.mgr_email]}})
            db.whatsapp_sessions.delete_many({"phone": {"$in": [self.owner_phone, self.mgr_phone]}})

    def setUp(self):
        self._cleanup()
        with self.app.app_context():
            db = get_db()
            db.users.insert_one({
                "id": "USR-ISO-OWN",
                "name": "Owner ISO",
                "email": self.owner_email,
                "phone": self.owner_phone,
                "businessName": "Kigali MultiShop",
                "architectureId": "buy-and-sell",
                "role": "BUSINESS_OWNER",
                "plan": "Gold",
            })
            db.users.insert_one({
                "id": "USR-ISO-MGR",
                "name": "Nyabugogo Manager",
                "email": self.mgr_email,
                "phone": self.mgr_phone,
                "ownerScopeKey": self.owner_email,
                "assignedBranchId": self.branch_b_id,
                "businessName": "Kigali MultiShop",
                "architectureId": "buy-and-sell",
                "role": "Branch Manager",
                "plan": "Gold",
            })
            db.branches.insert_many([
                {"id": "main", "scopeKey": self.owner_email, "name": "Main HQ", "isMain": True, "status": "Active"},
                {
                    "id": self.branch_b_id,
                    "scopeKey": self.owner_email,
                    "name": "Nyabugogo Branch",
                    "isMain": False,
                    "status": "Active",
                    "permissions": {
                        "canDeleteRecords": False,
                        "canEditPrices": False,
                        "canViewProfitReports": False,
                        "canAddInventory": True,
                        "canRecordExpenses": True,
                    },
                },
                {"id": self.branch_c_id, "scopeKey": self.owner_email, "name": "Remera Branch", "isMain": False, "status": "Active"},
            ])
            db.workspaces.insert_one({
                "scopeKey": self.owner_email,
                "architectureId": "buy-and-sell",
                "businessName": "Kigali MultiShop",
                "records": {
                    "Products": [
                        {"id": "PRD-HQ", "title": "HQ Laptop Pro", "branchId": "main", "quantity": 10, "sellingPriceRWF": 900000},
                        {"id": "PRD-NYB", "title": "Branch Router Mini", "branchId": self.branch_b_id, "quantity": 5, "sellingPriceRWF": 25000},
                        {"id": "PRD-REM", "title": "Remera Phone", "branchId": self.branch_c_id, "quantity": 8, "sellingPriceRWF": 120000},
                    ],
                    "Sales": [
                        {"id": "SAL-HQ", "title": "HQ Laptop Pro", "branchId": "main", "amountRWF": 900000, "status": "Paid in Full"},
                        {"id": "SAL-NYB", "title": "Branch Router Mini", "branchId": self.branch_b_id, "amountRWF": 25000, "status": "Unpaid", "remainingAmountRWF": 25000, "customerName": "Eric Nyabugogo"},
                    ],
                    "Purchases": [],
                    "Expenses": [],
                    "Customers": [],
                    "Suppliers": [],
                },
                "metrics": {},
            })
            db.transactions.insert_many([
                {"id": "TX-HQ", "scopeKey": self.owner_email, "branchId": "main", "amountRWF": 900000},
                {"id": "TX-NYB", "scopeKey": self.owner_email, "branchId": self.branch_b_id, "amountRWF": 25000},
            ])
            db.branch_invites.insert_one({"token": "tok-nyb", "scopeKey": self.owner_email, "branchId": self.branch_b_id, "status": "pending"})
            db.owner_notifications.insert_one({"id": "NOT-NYB", "scopeKey": self.owner_email, "branchId": self.branch_b_id})
            db.integrations.insert_one({"userEmail": self.mgr_email, "whatsapp": {"connected": True}})

    def tearDown(self):
        self._cleanup()

    def test_1_branch_manager_whatsapp_and_rest_never_see_hq_or_other_branch(self):
        with self.app.app_context():
            db = get_db()

            # 1. WhatsApp Option 1 (Products) -> ONLY Branch Router Mini! NO HQ Laptop Pro, NO Remera Phone!
            r1 = handle_incoming_whatsapp_message(db, self.mgr_phone, "1")
            self.assertEqual(r1["action"], "list_products")
            self.assertIn("Branch Router Mini", r1["reply"])
            self.assertNotIn("HQ Laptop Pro", r1["reply"])
            self.assertNotIn("Remera Phone", r1["reply"])

            # 2. Branch Manager cannot delete product (canDeleteRecords=False)
            r_pick = handle_incoming_whatsapp_message(db, self.mgr_phone, "1")
            self.assertEqual(r_pick["action"], "catalog_product_action")
            r_del_block = handle_incoming_whatsapp_message(db, self.mgr_phone, "5")
            self.assertEqual(r_del_block["action"], "permission_denied")

            # 3. Reset & Report (5) -> hides Net Profit (canViewProfitReports=False) & only counts Branch B sales (25,000 RWF)
            handle_incoming_whatsapp_message(db, self.mgr_phone, "0")
            r_rep = handle_incoming_whatsapp_message(db, self.mgr_phone, "5")
            self.assertEqual(r_rep["action"], "report")
            self.assertIn("25,000 RWF", r_rep["reply"])
            self.assertNotIn("900,000 RWF", r_rep["reply"])
            self.assertNotIn("Net Profit", r_rep["reply"])

            # 4. Recording a new product via WhatsApp stamps branchId = BR-NYABUGOGO-TEST
            handle_incoming_whatsapp_message(db, self.mgr_phone, "8")
            handle_incoming_whatsapp_message(db, self.mgr_phone, "Branch Cable USB-C")
            handle_incoming_whatsapp_message(db, self.mgr_phone, "5000")
            handle_incoming_whatsapp_message(db, self.mgr_phone, "2000")
            handle_incoming_whatsapp_message(db, self.mgr_phone, "15")
            r_add = handle_incoming_whatsapp_message(db, self.mgr_phone, "YES")
            self.assertEqual(r_add["action"], "product_added")

            ws = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            added = next(p for p in ws["records"]["Products"] if p.get("title") == "Branch Cable USB-C")
            self.assertEqual(added.get("branchId"), self.branch_b_id)

            # 5. REST API GET /api/v1/workspaces as Branch Manager NEVER returns HQ products
            mgr_token = create_access_token(identity=self.mgr_email)
            resp = self.client.get(
                "/api/v1/workspaces/buy-and-sell",
                headers={"Authorization": f"Bearer {mgr_token}"},
            )
            self.assertEqual(resp.status_code, 200)
            prods = resp.get_json()["data"]["records"]["Products"]
            titles = [p.get("title") for p in prods]
            self.assertIn("Branch Router Mini", titles)
            self.assertNotIn("HQ Laptop Pro", titles)
            self.assertNotIn("Remera Phone", titles)

    def test_2_delete_branch_cascade_deletes_all_branch_data_and_preserves_hq(self):
        with self.app.app_context():
            db = get_db()
            owner_token = create_access_token(identity=self.owner_email)

            resp = self.client.delete(
                f"/api/v1/branches/{self.branch_b_id}",
                headers={"Authorization": f"Bearer {owner_token}"},
            )
            self.assertEqual(resp.status_code, 200)
            data = resp.get_json()["data"]
            self.assertEqual(data["deletedId"], self.branch_b_id)
            self.assertGreaterEqual(data["removedWorkspaceRecords"], 2)
            self.assertEqual(data["removedTransactions"], 1)
            self.assertEqual(data["removedManagers"], 1)
            self.assertEqual(data["removedInvites"], 1)

            # Verify ZERO data remains for deleted branch across all collections
            self.assertIsNone(db.branches.find_one({"scopeKey": self.owner_email, "id": self.branch_b_id}))
            self.assertIsNone(db.users.find_one({"email": self.mgr_email}))
            self.assertEqual(db.transactions.count_documents({"scopeKey": self.owner_email, "branchId": self.branch_b_id}), 0)
            self.assertEqual(db.branch_invites.count_documents({"scopeKey": self.owner_email, "branchId": self.branch_b_id}), 0)
            self.assertEqual(db.owner_notifications.count_documents({"scopeKey": self.owner_email, "branchId": self.branch_b_id}), 0)
            self.assertEqual(db.integrations.count_documents({"userEmail": self.mgr_email}), 0)

            ws = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            prod_ids = [p["id"] for p in ws["records"]["Products"]]
            sale_ids = [s["id"] for s in ws["records"]["Sales"]]
            self.assertNotIn("PRD-NYB", prod_ids)
            self.assertNotIn("SAL-NYB", sale_ids)
            # Main HQ and Branch C remain 100% intact!
            self.assertIn("PRD-HQ", prod_ids)
            self.assertIn("PRD-REM", prod_ids)
            self.assertIn("SAL-HQ", sale_ids)
            self.assertEqual(db.transactions.count_documents({"scopeKey": self.owner_email, "branchId": "main"}), 1)


if __name__ == "__main__":
    unittest.main()

