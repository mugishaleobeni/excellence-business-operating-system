"""Cross-channel sync tests: WhatsApp <-> ExBOS Web Frontend (Products, Inventory, db.products, db.module_records, Profit/Loss warnings)."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask_jwt_extended import create_access_token

from app import create_app
from app.database import get_db
from app.services.whatsapp_engine import handle_incoming_whatsapp_message


class WhatsAppWebSyncTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.owner_email = "test_wa_web_sync@exbos.test"
        cls.owner_phone = "+250788551199"

    def _cleanup(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": self.owner_email})
            db.workspaces.delete_many({"scopeKey": self.owner_email})
            db.products.delete_many({"scopeKey": self.owner_email})
            db.module_records.delete_many({"scopeKey": self.owner_email})
            db.transactions.delete_many({"scopeKey": self.owner_email})
            db.whatsapp_sessions.delete_many({"phone": self.owner_phone})

    def setUp(self):
        self._cleanup()
        with self.app.app_context():
            db = get_db()
            db.users.insert_one({
                "id": "USR-SYNC-1",
                "name": "Sync Owner",
                "email": self.owner_email,
                "phone": self.owner_phone,
                "businessName": "Sync Electronics",
                "architectureId": "buy-and-sell",
                "role": "BUSINESS_OWNER",
                "plan": "Gold",
            })

    def tearDown(self):
        self._cleanup()

    def test_1_web_create_then_whatsapp_cost_edit_syncs_all_collections_and_shows_profit_warning(self):
        with self.app.app_context():
            db = get_db()
            token = create_access_token(identity=self.owner_email)

            # 1. Create product "make" (cost=20,000, sell=15,000) via Web REST API
            res = self.client.post(
                "/api/v1/workspaces/buy-and-sell/records/Products",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "id": "PRD-MAKE-1",
                    "title": "make",
                    "purchasePriceRWF": 20000,
                    "unitCostRWF": 20000,
                    "sellingPriceRWF": 15000,
                    "quantity": 10,
                    "currentStock": 10,
                },
            )
            self.assertIn(res.status_code, (200, 201))

            # 2. Update cost price from 20,000 -> 10,000 via WhatsApp (1 -> 1 -> 3 -> 10000 -> YES)
            r_list = handle_incoming_whatsapp_message(db, self.owner_phone, "1")
            self.assertIn("make", r_list["reply"])

            r_mgr = handle_incoming_whatsapp_message(db, self.owner_phone, "1")
            self.assertEqual(r_mgr["action"], "catalog_product_action")

            r_ask = handle_incoming_whatsapp_message(db, self.owner_phone, "3")
            self.assertEqual(r_ask["action"], "catalog_edit_cost_price")

            # First test entering a LOSS cost price (25,000 > 15,000 selling) -> must show LOSS WARNING!
            r_loss = handle_incoming_whatsapp_message(db, self.owner_phone, "25000")
            self.assertEqual(r_loss["action"], "confirm_product_edit")
            self.assertIn("WARNING (LOSS PER UNIT)", r_loss["reply"])

            # Reply EDIT -> 3 -> 10000 -> must show positive Expected Unit Profit (+5,000 RWF)!
            handle_incoming_whatsapp_message(db, self.owner_phone, "EDIT")
            handle_incoming_whatsapp_message(db, self.owner_phone, "3")
            r_ok = handle_incoming_whatsapp_message(db, self.owner_phone, "10000")
            self.assertEqual(r_ok["action"], "confirm_product_edit")
            self.assertIn("Expected Unit Profit", r_ok["reply"])
            self.assertIn("5,000 RWF", r_ok["reply"])

            r_yes = handle_incoming_whatsapp_message(db, self.owner_phone, "YES")
            self.assertEqual(r_yes["action"], "product_updated")

            # 3. Verify EVERY collection & Web REST endpoint now shows 10,000 RWF cost & +5,000 RWF profit!
            ws_resp = self.client.get(
                "/api/v1/workspaces/buy-and-sell",
                headers={"Authorization": f"Bearer {token}"},
            )
            ws_data = ws_resp.get_json()["data"]
            prod_in_products = next(p for p in ws_data["records"]["Products"] if p["id"] == "PRD-MAKE-1")
            self.assertEqual(prod_in_products["purchasePriceRWF"], 10000.0)
            self.assertEqual(prod_in_products["unitCostRWF"], 10000.0)
            self.assertEqual(prod_in_products["expectedUnitProfitRWF"], 5000.0)

            inv_items = ws_data["records"].get("Inventory") or []
            for inv in inv_items:
                if inv.get("id") == "PRD-MAKE-1" or inv.get("title") == "make":
                    self.assertEqual(inv["purchasePriceRWF"], 10000.0)
                    self.assertEqual(inv["unitCostRWF"], 10000.0)

            mirrored_prod = db.products.find_one({"scopeKey": self.owner_email, "id": "PRD-MAKE-1"})
            self.assertIsNotNone(mirrored_prod)
            self.assertEqual(mirrored_prod["purchasePriceRWF"], 10000.0)

            mirrored_mod = db.module_records.find_one(
                {"scopeKey": self.owner_email, "bucket": "Products", "id": "PRD-MAKE-1"}
            )
            self.assertIsNotNone(mirrored_mod)
            self.assertEqual(mirrored_mod["purchasePriceRWF"], 10000.0)

            # 4. Delete product via WhatsApp -> must vanish from ALL collections!
            handle_incoming_whatsapp_message(db, self.owner_phone, "1")
            handle_incoming_whatsapp_message(db, self.owner_phone, "1")
            handle_incoming_whatsapp_message(db, self.owner_phone, "5")
            r_del = handle_incoming_whatsapp_message(db, self.owner_phone, "YES")
            self.assertEqual(r_del["action"], "product_deleted")

            self.assertIsNone(db.products.find_one({"scopeKey": self.owner_email, "id": "PRD-MAKE-1"}))
            self.assertIsNone(db.module_records.find_one({"scopeKey": self.owner_email, "id": "PRD-MAKE-1"}))
            ws_after = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(len(ws_after["records"]["Products"]), 0)
            self.assertEqual(len(ws_after["records"].get("Inventory") or []), 0)


if __name__ == "__main__":
    unittest.main()

