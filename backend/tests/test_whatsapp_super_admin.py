"""End-to-end tests for Super Admin WhatsApp Menu & Command Center."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.database import get_db
from app.services.whatsapp_engine import handle_incoming_whatsapp_message


class WhatsAppSuperAdminTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.sa_email = "test_wa_superadmin@exbos.test"
        cls.sa_phone = "+250788770001"
        cls.regular_email = "test_wa_regular_owner@exbos.test"
        cls.regular_phone = "+250788770002"
        cls.target_email = "test_wa_sa_target@exbos.test"

    def _cleanup(self):
        with self.app.app_context():
            db = get_db()
            emails = [self.sa_email, self.regular_email, self.target_email]
            phones = [self.sa_phone, self.regular_phone]
            db.users.delete_many({"email": {"$in": emails}})
            db.businesses.delete_many({"email": {"$in": emails}})
            db.subscription_requests.delete_many({"email": {"$in": emails}})
            db.super_admin_audit_logs.delete_many({"actorEmail": self.sa_email})
            db.whatsapp_sessions.delete_many({"phone": {"$in": phones}})

    def setUp(self):
        self._cleanup()
        with self.app.app_context():
            db = get_db()
            db.users.insert_one({
                "id": "USR-SA-TEST",
                "name": "Leo SuperAdmin",
                "email": self.sa_email,
                "phone": self.sa_phone,
                "businessName": "ExBOS HQ",
                "architectureId": "buy-and-sell",
                "role": "SUPER_ADMIN",
                "isSuperAdmin": True,
                "plan": "Platinum",
            })
            db.users.insert_one({
                "id": "USR-REG-TEST",
                "name": "Regular Owner",
                "email": self.regular_email,
                "phone": self.regular_phone,
                "businessName": "Regular Shop",
                "architectureId": "buy-and-sell",
                "role": "BUSINESS_OWNER",
                "isSuperAdmin": False,
                "plan": "Free",
            })
            db.users.insert_one({
                "id": "USR-TGT-TEST",
                "name": "Target Merchant",
                "email": self.target_email,
                "phone": "+250788770099",
                "businessName": "Target Kigali Mart",
                "architectureId": "buy-and-sell",
                "role": "BUSINESS_OWNER",
                "plan": "Silver",
                "planTier": "Silver",
                "billingType": "Paid",
                "monthlySpendRWF": 20000.0,
                "accountStatus": "Active",
            })
            db.subscription_requests.insert_one({
                "id": "UPG-SA-TEST-1",
                "email": self.target_email,
                "businessName": "Target Kigali Mart",
                "requestedPlan": "Silver",
                "amountRWF": 20000.0,
                "status": "approved",
                "paymentMessageCopy": "TXN 771122 paid 20,000 RWF",
                "createdAt": "2099-01-01T00:00:00+00:00",
            })

    def tearDown(self):
        self._cleanup()

    def test_1_super_admin_menu_visibility_and_non_admin_isolation(self):
        with self.app.app_context():
            db = get_db()

            # Super Admin sees option 10 in Main Menu
            r_sa = handle_incoming_whatsapp_message(db, self.sa_phone, "Hi")
            self.assertEqual(r_sa["action"], "menu")
            self.assertIn("*10.* Super Admin Command Center", r_sa["reply"])

            # Regular owner does NOT see option 10 and cannot open Super Admin via '10' or 'ADMIN'
            r_reg = handle_incoming_whatsapp_message(db, self.regular_phone, "Hi")
            self.assertEqual(r_reg["action"], "menu")
            self.assertNotIn("Super Admin", r_reg["reply"])

            r_reg_try = handle_incoming_whatsapp_message(db, self.regular_phone, "10")
            self.assertNotEqual(r_reg_try["action"], "sa_menu")

    def test_2_super_admin_overview_manage_user_and_revoke_payment(self):
        with self.app.app_context():
            db = get_db()

            # 1. Enter Super Admin Command Center via option 10
            r0 = handle_incoming_whatsapp_message(db, self.sa_phone, "10")
            self.assertEqual(r0["action"], "sa_menu")
            self.assertIn("SUPER ADMIN COMMAND CENTER", r0["reply"])

            # 2. Platform Overview (1)
            r1 = handle_incoming_whatsapp_message(db, self.sa_phone, "1")
            self.assertEqual(r1["action"], "sa_overview")
            self.assertIn("PLATFORM OVERVIEW", r1["reply"])

            # 3. Manage User Account (4) -> search target -> Suspend (2) -> YES
            r2 = handle_incoming_whatsapp_message(db, self.sa_phone, "4")
            self.assertEqual(r2["action"], "sa_search_user")

            r3 = handle_incoming_whatsapp_message(db, self.sa_phone, self.target_email)
            self.assertEqual(r3["action"], "sa_user_profile")
            self.assertIn("Target Kigali Mart", r3["reply"])

            r4 = handle_incoming_whatsapp_message(db, self.sa_phone, "2")
            self.assertEqual(r4["action"], "sa_confirm_action")
            self.assertIn("SUPER ADMIN VERIFY", r4["reply"])

            r5 = handle_incoming_whatsapp_message(db, self.sa_phone, "YES")
            self.assertEqual(r5["action"], "sa_status_updated")
            updated_target = db.users.find_one({"email": self.target_email})
            self.assertEqual(updated_target["accountStatus"], "Suspended")

            # 4. Payment Requests (3) -> Pick 1 (UPG-SA-TEST-1) -> Revoke (2) -> YES
            r6 = handle_incoming_whatsapp_message(db, self.sa_phone, "3")
            self.assertEqual(r6["action"], "sa_payments_list")
            self.assertIn("Target Kigali Mart", r6["reply"])

            r7 = handle_incoming_whatsapp_message(db, self.sa_phone, "1")
            self.assertEqual(r7["action"], "sa_payment_detail")

            r8 = handle_incoming_whatsapp_message(db, self.sa_phone, "2")
            self.assertEqual(r8["action"], "sa_confirm_action")

            r9 = handle_incoming_whatsapp_message(db, self.sa_phone, "YES")
            self.assertEqual(r9["action"], "sa_payment_revoked")

            revoked_user = db.users.find_one({"email": self.target_email})
            self.assertEqual(revoked_user["planTier"], "Free")
            self.assertEqual(revoked_user["subscriptionStatus"], "Revoked")

            audit_count = db.super_admin_audit_logs.count_documents({"actorEmail": self.sa_email})
            self.assertGreaterEqual(audit_count, 2)

            # 5. Exit Super Admin (0) returns to Business Main Menu with option 10 still shown
            r10 = handle_incoming_whatsapp_message(db, self.sa_phone, "0")
            self.assertEqual(r10["action"], "menu")
            self.assertIn("*10.* Super Admin Command Center", r10["reply"])

    def test_3_super_admin_delete_user_with_verification_and_self_protection(self):
        with self.app.app_context():
            db = get_db()

            # Enter Super Admin -> Manage User (4) -> search target -> Delete (5) -> YES
            handle_incoming_whatsapp_message(db, self.sa_phone, "10")
            handle_incoming_whatsapp_message(db, self.sa_phone, "4")
            r_prof = handle_incoming_whatsapp_message(db, self.sa_phone, self.target_email)
            self.assertEqual(r_prof["action"], "sa_user_profile")
            self.assertIn("*5.* Delete User Account Permanently", r_prof["reply"])

            r_ver = handle_incoming_whatsapp_message(db, self.sa_phone, "5")
            self.assertEqual(r_ver["action"], "sa_confirm_action")
            self.assertIn("DELETE USER PERMANENTLY", r_ver["reply"])

            r_del = handle_incoming_whatsapp_message(db, self.sa_phone, "YES")
            self.assertEqual(r_del["action"], "sa_user_deleted")
            self.assertIsNone(db.users.find_one({"email": self.target_email}))
            self.assertIsNone(db.subscription_requests.find_one({"email": self.target_email}))

            # Verify self-deletion is blocked
            handle_incoming_whatsapp_message(db, self.sa_phone, "4")
            r_self = handle_incoming_whatsapp_message(db, self.sa_phone, self.sa_email)
            self.assertNotIn("Delete User Account Permanently", r_self["reply"])
            r_block = handle_incoming_whatsapp_message(db, self.sa_phone, "5")
            self.assertEqual(r_block["action"], "sa_delete_blocked")
            self.assertIsNotNone(db.users.find_one({"email": self.sa_email}))


if __name__ == "__main__":
    unittest.main()

