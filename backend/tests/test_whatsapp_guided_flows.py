"""End-to-end tests for guided WhatsApp POS flows & mandatory verification before saving."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.database import get_db
from app.services.whatsapp_engine import handle_incoming_whatsapp_message


class WhatsAppGuidedFlowsTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.owner_email = "test_wa_guided_owner@exbos.test"
        cls.owner_phone = "+250788555444"

    def setUp(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": self.owner_email})
            db.workspaces.delete_many({"scopeKey": self.owner_email})
            db.transactions.delete_many({"scopeKey": self.owner_email})
            db.whatsapp_sessions.delete_many({"phone": self.owner_phone})

            self.user_doc = {
                "name": "Leo Test",
                "email": self.owner_email,
                "phone": self.owner_phone,
                "businessName": "Kigali Tech Shop",
                "architectureId": "buy-and-sell",
                "role": "Owner",
                "plan": "Gold",
            }
            db.users.insert_one(dict(self.user_doc))
            db.workspaces.insert_one({
                "scopeKey": self.owner_email,
                "architectureId": "buy-and-sell",
                "businessName": "Kigali Tech Shop",
                "records": {
                    "Products": [
                        {
                            "id": "PRD-1",
                            "title": "airtel router 4g",
                            "quantity": 7,
                            "currentStock": 7,
                            "sellingPriceRWF": 10000,
                            "purchasePriceRWF": 7000,
                        },
                        {
                            "id": "PRD-2",
                            "title": "mac book 2025",
                            "quantity": 4,
                            "currentStock": 4,
                            "sellingPriceRWF": 850000,
                            "purchasePriceRWF": 700000,
                        },
                    ],
                    "Sales": [],
                    "Purchases": [],
                    "Expenses": [],
                    "Customers": [],
                    "Suppliers": [],
                },
                "metrics": {},
            })

    def tearDown(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": self.owner_email})
            db.workspaces.delete_many({"scopeKey": self.owner_email})
            db.transactions.delete_many({"scopeKey": self.owner_email})
            db.whatsapp_sessions.delete_many({"phone": self.owner_phone})

    def test_natural_greeting_and_guided_sale_with_verification_gate(self):
        with self.app.app_context():
            db = get_db()

            # 1. Natural greeting 'Hy' must NOT return 'Command not recognized'
            r_hi = handle_incoming_whatsapp_message(db, self.owner_phone, "Hy", self.user_doc)
            self.assertEqual(r_hi["action"], "menu")
            self.assertNotIn("not recognized", r_hi["reply"].lower())

            # 2. Reply '2' -> lists real products from DB
            r_pick = handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            self.assertEqual(r_pick["action"], "sale_pick_product")
            self.assertIn("airtel router 4g", r_pick["reply"])
            self.assertIn("10,000 RWF", r_pick["reply"])

            # 3. Choose product #1 -> asks quantity with available stock
            r_qty_prompt = handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            self.assertEqual(r_qty_prompt["action"], "sale_enter_qty")
            self.assertIn("7 unit(s)", r_qty_prompt["reply"])

            # 4. Entering qty > stock (e.g. 99) is rejected cleanly
            r_too_much = handle_incoming_whatsapp_message(db, self.owner_phone, "99", self.user_doc)
            self.assertEqual(r_too_much["action"], "sale_qty_exceeds_stock")

            # 5. Enter valid qty '2' -> asks payment method
            r_pm = handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            self.assertEqual(r_pm["action"], "sale_pick_payment")
            self.assertIn("20,000 RWF", r_pm["reply"])

            # 6. Pick '2' (MTN MoMo) -> MUST show VERIFY BEFORE SAVING and NOT save yet!
            r_verify = handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            self.assertEqual(r_verify["action"], "confirm_sale")
            self.assertIn("VERIFY BEFORE SAVING", r_verify["reply"])
            self.assertIn("Reply *YES*", r_verify["reply"])

            ws_before = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(len(ws_before["records"]["Sales"]), 0)
            self.assertEqual(ws_before["records"]["Products"][0]["quantity"], 7)

            # 7. Reply 'YES' -> saves sale & deducts stock from 7 to 5!
            r_saved = handle_incoming_whatsapp_message(db, self.owner_phone, "YES", self.user_doc)
            self.assertEqual(r_saved["action"], "sale_recorded")
            self.assertIn("SALE SAVED", r_saved["reply"])

            ws_after = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(len(ws_after["records"]["Sales"]), 1)
            self.assertEqual(ws_after["records"]["Sales"][0]["amountRWF"], 20000.0)
            self.assertEqual(ws_after["records"]["Products"][0]["quantity"], 5)

    def test_typo_fast_sale_fuzzy_matches_and_cancel_prevents_save(self):
        with self.app.app_context():
            db = get_db()

            # Typo 'Sale 1 aitel' -> fuzzy matches 'airtel router 4g' & requires YES before save
            r_fast = handle_incoming_whatsapp_message(db, self.owner_phone, "Sale 1 aitel", self.user_doc)
            self.assertEqual(r_fast["action"], "confirm_sale")
            self.assertIn("airtel router 4g", r_fast["reply"])
            self.assertIn("10,000 RWF", r_fast["reply"])
            self.assertIn("VERIFY BEFORE SAVING", r_fast["reply"])

            # Reply 'NO' -> cancelled, nothing saved to DB!
            r_cancel = handle_incoming_whatsapp_message(db, self.owner_phone, "NO", self.user_doc)
            self.assertEqual(r_cancel["action"], "cancelled")
            ws = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(len(ws["records"]["Sales"]), 0)
            self.assertEqual(ws["records"]["Products"][0]["quantity"], 7)

    def test_guided_expense_with_verification_gate(self):
        with self.app.app_context():
            db = get_db()

            r1 = handle_incoming_whatsapp_message(db, self.owner_phone, "4", self.user_doc)
            self.assertEqual(r1["action"], "expense_enter_title")

            r2 = handle_incoming_whatsapp_message(db, self.owner_phone, "4", self.user_doc)
            self.assertEqual(r2["action"], "expense_enter_amount")
            self.assertIn("Transport", r2["reply"])

            r3 = handle_incoming_whatsapp_message(db, self.owner_phone, "5000", self.user_doc)
            self.assertEqual(r3["action"], "confirm_expense")
            self.assertIn("VERIFY BEFORE SAVING", r3["reply"])

            # Still 0 expenses before YES
            ws_before = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(len(ws_before["records"]["Expenses"]), 0)

            r4 = handle_incoming_whatsapp_message(db, self.owner_phone, "YES", self.user_doc)
            self.assertEqual(r4["action"], "expense_recorded")
            ws_after = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(len(ws_after["records"]["Expenses"]), 1)
            self.assertEqual(ws_after["records"]["Expenses"][0]["amountRWF"], 5000.0)

    def test_edit_before_save_and_kinyarwanda_language_switch(self):
        with self.app.app_context():
            db = get_db()

            # 1. Switch language to Kinyarwanda via menu 9 -> 2
            r_lang_menu = handle_incoming_whatsapp_message(db, self.owner_phone, "9", self.user_doc)
            self.assertEqual(r_lang_menu["action"], "choose_language")

            r_rw = handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            self.assertEqual(r_rw["action"], "language_changed")
            self.assertEqual(r_rw["language"], "rw")
            self.assertIn("Sisitemu y'Ubucuruzi", r_rw["reply"])

            # 2. Start Sale in Kinyarwanda: 2 -> 1 (airtel router 4g) -> 2 units -> 1 (Cash)
            r_s1 = handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            self.assertIn("Hitamo Igicuruzwa", r_s1["reply"])
            handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            r_verify = handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            self.assertEqual(r_verify["action"], "confirm_sale")
            self.assertIn("GENZURA MBERE YO KUBIKA", r_verify["reply"])
            self.assertIn("HINDURA", r_verify["reply"])

            # 3. User replies HINDURA (EDIT) -> 2 (Change Quantity) -> 3 units -> returns to verification with 30,000 RWF
            r_edit_menu = handle_incoming_whatsapp_message(db, self.owner_phone, "HINDURA", self.user_doc)
            self.assertEqual(r_edit_menu["action"], "edit_sale_pick")

            r_edit_qty = handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            self.assertEqual(r_edit_qty["action"], "sale_enter_qty")

            r_updated_verify = handle_incoming_whatsapp_message(db, self.owner_phone, "3", self.user_doc)
            self.assertEqual(r_updated_verify["action"], "confirm_sale")
            self.assertIn("30,000 RWF", r_updated_verify["reply"])

            # 4. User replies YEGO -> saves 3 units (30,000 RWF) and deducts stock 7 -> 4!
            r_done = handle_incoming_whatsapp_message(db, self.owner_phone, "YEGO", self.user_doc)
            self.assertEqual(r_done["action"], "sale_recorded")
            self.assertIn("IGURISHA RYABITSWE NEZA", r_done["reply"])

            ws_after = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(ws_after["records"]["Sales"][0]["amountRWF"], 30000.0)
            self.assertEqual(ws_after["records"]["Products"][0]["quantity"], 4)

            # 5. Switch back to English via fast command 'EN'
            r_en = handle_incoming_whatsapp_message(db, self.owner_phone, "EN", self.user_doc)
            self.assertEqual(r_en["language"], "en")
            self.assertIn("Official Business Console", r_en["reply"])

    def test_credit_sale_phone_capture_and_missing_phone_reminder_flow(self):
        with self.app.app_context():
            db = get_db()

            # A. Record credit sale WITHOUT phone (SKIP), then remind -> ExBOS asks for phone & saves it!
            handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            r_name = handle_incoming_whatsapp_message(db, self.owner_phone, "5", self.user_doc)
            self.assertEqual(r_name["action"], "sale_enter_customer")

            r_phone_ask = handle_incoming_whatsapp_message(db, self.owner_phone, "Jean Paul", self.user_doc)
            self.assertEqual(r_phone_ask["action"], "sale_enter_customer_phone")

            r_v1 = handle_incoming_whatsapp_message(db, self.owner_phone, "SKIP", self.user_doc)
            self.assertEqual(r_v1["action"], "confirm_sale")
            r_saved1 = handle_incoming_whatsapp_message(db, self.owner_phone, "YES", self.user_doc)
            self.assertEqual(r_saved1["action"], "sale_recorded")

            # Open 6 (Unpaid Customers) -> pick 1 (Jean Paul) -> asks for missing WhatsApp number!
            r_unpaid = handle_incoming_whatsapp_message(db, self.owner_phone, "6", self.user_doc)
            self.assertEqual(r_unpaid["action"], "list_unpaid")
            self.assertIn("Jean Paul", r_unpaid["reply"])
            self.assertIn("No WhatsApp Number", r_unpaid["reply"])

            r_ask_missing = handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            self.assertEqual(r_ask_missing["action"], "remind_enter_phone")

            # User supplies phone -> permanently saved & shows VERIFY BEFORE SENDING REMINDER
            r_confirm_rem = handle_incoming_whatsapp_message(db, self.owner_phone, "0788777666", self.user_doc)
            self.assertEqual(r_confirm_rem["action"], "confirm_reminder")
            self.assertIn("+250788777666", r_confirm_rem["reply"])

            r_sent = handle_incoming_whatsapp_message(db, self.owner_phone, "YES", self.user_doc)
            self.assertEqual(r_sent["action"], "reminder_sent")
            self.assertIn("+250788777666", r_sent["reply"])

            # Verify phone was saved onto both the Sale and Customers directory in MongoDB
            ws = db.workspaces.find_one({"scopeKey": self.owner_email, "architectureId": "buy-and-sell"})
            self.assertEqual(ws["records"]["Sales"][0]["customerPhone"], "+250788777666")
            self.assertEqual(ws["records"]["Customers"][0]["phone"], "+250788777666")

            # B. Record credit sale WITH phone immediately -> saved directly
            handle_incoming_whatsapp_message(db, self.owner_phone, "2", self.user_doc)
            handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            handle_incoming_whatsapp_message(db, self.owner_phone, "1", self.user_doc)
            handle_incoming_whatsapp_message(db, self.owner_phone, "5", self.user_doc)
            handle_incoming_whatsapp_message(db, self.owner_phone, "Marie Claire", self.user_doc)
            r_v2 = handle_incoming_whatsapp_message(db, self.owner_phone, "0788222333", self.user_doc)
            self.assertEqual(r_v2["action"], "confirm_sale")
            self.assertIn("+250788222333", r_v2["reply"])
            handle_incoming_whatsapp_message(db, self.owner_phone, "YES", self.user_doc)

            r_rem_direct = handle_incoming_whatsapp_message(db, self.owner_phone, "REMIND Marie", self.user_doc)
            self.assertEqual(r_rem_direct["action"], "confirm_reminder")
            self.assertIn("+250788222333", r_rem_direct["reply"])


if __name__ == "__main__":
    unittest.main()

