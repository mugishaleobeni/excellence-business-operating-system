"""End-to-end tests for Full ExBOS Account Registration & Linking via WhatsApp."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.database import get_db
from app.services.whatsapp_engine import handle_incoming_whatsapp_message
from app.utils.security import verify_password


class WhatsAppOnboardingTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.free_phone = "+250788991101"
        cls.free_email = "test_wa_reg_free@exbos.test"
        cls.paid_phone = "+250788991102"
        cls.paid_email = "test_wa_reg_paid@exbos.test"
        cls.link_phone = "+250788991103"
        cls.link_email = "test_wa_link_existing@exbos.test"

    def _cleanup(self):
        with self.app.app_context():
            db = get_db()
            emails = [self.free_email, self.paid_email, self.link_email]
            phones = [self.free_phone, self.paid_phone, self.link_phone]
            db.users.delete_many({"email": {"$in": emails}})
            db.businesses.delete_many({"email": {"$in": emails}})
            db.workspaces.delete_many({"scopeKey": {"$in": emails}})
            db.branches.delete_many({"scopeKey": {"$in": emails}})
            db.integrations.delete_many({"userEmail": {"$in": emails}})
            db.subscription_requests.delete_many({"email": {"$in": emails}})
            db.password_resets.delete_many({"email": {"$in": emails}})
            db.whatsapp_sessions.delete_many({"phone": {"$in": phones}})
            db.whatsapp_window_sessions.delete_many({"phone": {"$in": phones}})

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()

    @patch("app.services.whatsapp_onboarding.send_gmail_email", return_value=True)
    def test_1_full_free_registration_english_with_edit_before_save(self, mock_mail):
        with self.app.app_context():
            db = get_db()

            # 1. Unregistered greeting opens onboarding menu
            r0 = handle_incoming_whatsapp_message(db, self.free_phone, "Hi")
            self.assertEqual(r0["action"], "onboard_menu")
            self.assertIn("Create a New ExBOS Business Account", r0["reply"])

            # 2. Choose 1 -> Full Name
            r1 = handle_incoming_whatsapp_message(db, self.free_phone, "1")
            self.assertEqual(r1["action"], "reg_full_name")

            r2 = handle_incoming_whatsapp_message(db, self.free_phone, "Alice Uwimana")
            self.assertEqual(r2["action"], "reg_email")

            # 3. Email -> 6-digit OTP stored in password_resets
            r3 = handle_incoming_whatsapp_message(db, self.free_phone, self.free_email)
            self.assertEqual(r3["action"], "reg_email_otp")
            otp_doc = db.password_resets.find_one(
                {"email": self.free_email, "purpose": "email_verification"},
                sort=[("created_at", -1)],
            )
            self.assertIsNotNone(otp_doc)
            otp_code = otp_doc["code"]
            self.assertNotIn(otp_code, r3["reply"])  # Never expose OTP in WhatsApp chat!

            # 4. Verify OTP -> Password
            r4 = handle_incoming_whatsapp_message(db, self.free_phone, otp_code)
            self.assertEqual(r4["action"], "reg_password")

            # 5. Password -> immediately Argon2id hashed (no plaintext in session!)
            r5 = handle_incoming_whatsapp_message(db, self.free_phone, "SecurePass2026!")
            self.assertEqual(r5["action"], "reg_architecture")
            sess = db.whatsapp_sessions.find_one({"phone": self.free_phone})
            self.assertNotIn("SecurePass2026!", str(sess))
            self.assertTrue(verify_password("SecurePass2026!", sess["data"]["passwordHash"]))

            # 6. Architecture (2 = Buy & Sell), Business Name, Location, Category
            r6 = handle_incoming_whatsapp_message(db, self.free_phone, "2")
            self.assertEqual(r6["action"], "reg_business_name")

            r7 = handle_incoming_whatsapp_message(db, self.free_phone, "Kigali Draft Shop")
            self.assertEqual(r7["action"], "reg_location")

            r8 = handle_incoming_whatsapp_message(db, self.free_phone, "Kigali, Gasabo")
            self.assertEqual(r8["action"], "reg_category")

            r9 = handle_incoming_whatsapp_message(db, self.free_phone, "Electronics")
            self.assertEqual(r9["action"], "reg_plan")

            # 7. Select Free Plan (1) -> VERIFY BEFORE SAVING
            r10 = handle_incoming_whatsapp_message(db, self.free_phone, "1")
            self.assertEqual(r10["action"], "confirm_registration")
            self.assertIn("VERIFY BEFORE SAVING", r10["reply"])
            self.assertIn("Kigali Draft Shop", r10["reply"])

            # 8. EDIT -> 2 (Business Name) -> Updated Name -> returns to VERIFY card
            r11 = handle_incoming_whatsapp_message(db, self.free_phone, "EDIT")
            self.assertEqual(r11["action"], "reg_edit_pick")

            r12 = handle_incoming_whatsapp_message(db, self.free_phone, "2")
            self.assertEqual(r12["action"], "reg_edit_business_name")

            r13 = handle_incoming_whatsapp_message(db, self.free_phone, "Kigali Prime Electronics")
            self.assertEqual(r13["action"], "confirm_registration")
            self.assertIn("Kigali Prime Electronics", r13["reply"])

            # 9. Confirm YES -> provisions user, business, 0 RWF workspace, Main HQ branch, integration
            r14 = handle_incoming_whatsapp_message(db, self.free_phone, "YES")
            self.assertEqual(r14["action"], "registration_completed")
            self.assertIn("EXBOS ACCOUNT CREATED SUCCESSFULLY", r14["reply"])
            self.assertIn("Official Business Console", r14["reply"])

            user = db.users.find_one({"email": self.free_email})
            self.assertIsNotNone(user)
            self.assertEqual(user["businessName"], "Kigali Prime Electronics")
            self.assertEqual(user["architectureId"], "buy-and-sell")
            self.assertEqual(user["planTier"], "Free")
            self.assertTrue(verify_password("SecurePass2026!", user["password_hash"]))

            ws = db.workspaces.find_one({"scopeKey": self.free_email, "architectureId": "buy-and-sell"})
            self.assertIsNotNone(ws)
            self.assertEqual(float(ws["metrics"]["spendableRWF"]), 0.0)

            branch = db.branches.find_one({"scopeKey": self.free_email, "id": "main"})
            self.assertIsNotNone(branch)
            self.assertTrue(branch["isMain"])

            integ = db.integrations.find_one({"userEmail": self.free_email})
            self.assertTrue(integ["whatsapp"]["connected"])

            # 10. Immediately usable as registered business console!
            r15 = handle_incoming_whatsapp_message(db, self.free_phone, "5")
            self.assertEqual(r15["action"], "report")
            self.assertIn("Kigali Prime Electronics", r15["reply"])

    @patch("app.routes.whatsapp.send_whatsapp_message", return_value={"status": "sent", "sent": True})
    @patch(
        "app.routes.whatsapp.download_meta_media_as_data_uri",
        return_value={
            "mediaId": "media-silver-001",
            "mimeType": "image/jpeg",
            "sizeBytes": 128,
            "tooLarge": False,
            "dataUri": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==",
        },
    )
    @patch("app.services.whatsapp_onboarding.notify_registered_whatsapp_recipients", return_value=[])
    @patch("app.services.whatsapp_onboarding.send_gmail_email", return_value=True)
    def test_2_paid_silver_registration_kinyarwanda_with_image_webhook(
        self, mock_mail, mock_notify, mock_download, mock_send
    ):
        with self.app.app_context():
            db = get_db()

            # 1. Start in Kinyarwanda with "Muraho"
            r0 = handle_incoming_whatsapp_message(db, self.paid_phone, "Muraho")
            self.assertEqual(r0["action"], "onboard_menu")
            self.assertIn("Fungura Konti Nshya ya ExBOS", r0["reply"])

            handle_incoming_whatsapp_message(db, self.paid_phone, "1")
            handle_incoming_whatsapp_message(db, self.paid_phone, "Jean Paul Niyonkuru")
            handle_incoming_whatsapp_message(db, self.paid_phone, self.paid_email)

            otp_doc = db.password_resets.find_one(
                {"email": self.paid_email, "purpose": "email_verification"},
                sort=[("created_at", -1)],
            )
            handle_incoming_whatsapp_message(db, self.paid_phone, otp_doc["code"])
            handle_incoming_whatsapp_message(db, self.paid_phone, "BakeryPass99")
            # Architecture 1 = Make & Sell
            handle_incoming_whatsapp_message(db, self.paid_phone, "1")
            handle_incoming_whatsapp_message(db, self.paid_phone, "Musanze Fresh Bakery")
            handle_incoming_whatsapp_message(db, self.paid_phone, "Musanze")
            handle_incoming_whatsapp_message(db, self.paid_phone, "Bakery")

            # Choose Plan 3 (Silver) -> prompts for payment proof
            r_plan = handle_incoming_whatsapp_message(db, self.paid_phone, "3")
            self.assertEqual(r_plan["action"], "reg_payment_proof")
            self.assertIn("0781 963 981", r_plan["reply"])

            # Send WhatsApp Payment Screenshot via real Meta Webhook POST!
            webhook_payload = {
                "entry": [
                    {
                        "changes": [
                            {
                                "value": {
                                    "messages": [
                                        {
                                            "from": self.paid_phone.lstrip("+"),
                                            "type": "image",
                                            "image": {
                                                "id": "media-silver-001",
                                                "mime_type": "image/jpeg",
                                                "caption": "TXN 88991122 paid 20,000 RWF",
                                            },
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
            resp = self.client.post("/api/v1/whatsapp/webhook", json=webhook_payload)
            self.assertEqual(resp.status_code, 200)
            body = resp.get_json()
            self.assertEqual(body["data"]["processed"][0]["action"], "confirm_registration")
            mock_download.assert_called_once_with("media-silver-001")

            # Confirm with Kinyarwanda "YEGO"
            r_yes = handle_incoming_whatsapp_message(db, self.paid_phone, "YEGO")
            self.assertEqual(r_yes["action"], "registration_completed")
            self.assertIn("KONTI YA EXBOS YAFUNGUWE NEZA", r_yes["reply"])

            # Verify payment screenshot & SMS copy persisted on both users and subscription_requests
            user = db.users.find_one({"email": self.paid_email})
            self.assertEqual(user["planTier"], "Silver")
            self.assertEqual(user["billingType"], "Paid")
            self.assertEqual(user["whatsappLanguage"], "rw")
            self.assertEqual(user["paymentScreenshot"], "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==")
            self.assertIn("TXN 88991122", user["paymentMessageCopy"])

            sub_req = db.subscription_requests.find_one({"email": self.paid_email})
            self.assertIsNotNone(sub_req)
            self.assertEqual(sub_req["requestedPlan"], "Silver")
            self.assertEqual(sub_req["paymentScreenshot"], "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==")
            mock_notify.assert_called_once()
            self.assertEqual(mock_notify.call_args.kwargs.get("alert_type"), "paymentProofSubmitted")

    @patch("app.services.whatsapp_onboarding.send_gmail_email", return_value=True)
    def test_3_link_existing_account_via_email_otp(self, mock_mail):
        with self.app.app_context():
            db = get_db()
            db.users.insert_one(
                {
                    "id": "USR-LINK-1",
                    "name": "Existing Owner",
                    "email": self.link_email,
                    "phone": "",
                    "businessName": "Existing Kigali Depot",
                    "architectureId": "buy-and-sell",
                    "role": "BUSINESS_OWNER",
                    "plan": "Bronze",
                }
            )

            r0 = handle_incoming_whatsapp_message(db, self.link_phone, "Hello")
            self.assertEqual(r0["action"], "onboard_menu")

            r1 = handle_incoming_whatsapp_message(db, self.link_phone, "2")
            self.assertEqual(r1["action"], "link_enter_email")

            r2 = handle_incoming_whatsapp_message(db, self.link_phone, self.link_email)
            self.assertEqual(r2["action"], "link_otp_sent")

            otp_doc = db.password_resets.find_one(
                {"email": self.link_email, "purpose": "whatsapp_link"},
                sort=[("created_at", -1)],
            )
            self.assertIsNotNone(otp_doc)

            r3 = handle_incoming_whatsapp_message(db, self.link_phone, otp_doc["code"])
            self.assertEqual(r3["action"], "account_linked")
            self.assertIn("Existing Kigali Depot", r3["reply"])

            updated = db.users.find_one({"email": self.link_email})
            self.assertEqual(updated["phone"], self.link_phone)
            integ = db.integrations.find_one({"userEmail": self.link_email})
            self.assertTrue(integ["whatsapp"]["connected"])


if __name__ == "__main__":
    unittest.main()

