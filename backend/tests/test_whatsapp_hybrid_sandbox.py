"""End-to-end tests for Meta WhatsApp Hybrid Sandbox Mode, 24h Session Window, and Live Alerts."""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.database import get_db


class WhatsAppHybridSandboxTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()
        cls.owner_email = "test_wa_hybrid_owner@exbos.test"
        cls.registered_phone = "+250788111222"
        cls.unregistered_phone = "+250788999888"

    def setUp(self):
        with self.app.app_context():
            db = get_db()
            self._saved_cfg = db.platform_config.find_one({"key": "whatsapp_delivery_config"})
            db.users.delete_many({"email": self.owner_email})
            db.whatsapp_window_sessions.delete_many({"phone": {"$in": [self.registered_phone, self.unregistered_phone]}})
            db.platform_config.delete_many({"key": "whatsapp_delivery_config"})
            db.users.insert_one({
                "name": "WA Test Owner",
                "email": self.owner_email,
                "phone": self.registered_phone,
                "businessName": "Kigali WA Test Shop",
                "architectureId": "buy-and-sell",
                "role": "Owner",
                "plan": "Gold",
                "accountStatus": "Active",
                "emailVerified": True,
            })

    def tearDown(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": self.owner_email})
            db.whatsapp_window_sessions.delete_many({"phone": {"$in": [self.registered_phone, self.unregistered_phone]}})
            db.platform_config.delete_many({"key": "whatsapp_delivery_config"})
            if self._saved_cfg:
                restored = dict(self._saved_cfg)
                restored.pop("_id", None)
                db.platform_config.insert_one(restored)

    def test_sandbox_recipients_24h_window_and_fallback(self):
        from flask_jwt_extended import create_access_token

        with self.app.app_context():
            token = create_access_token(identity=self.owner_email)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Register a Meta verified recipient
        res_add = self.client.post(
            "/api/v1/whatsapp/recipients",
            json={"phone": "0788111222", "label": "Owner Phone", "role": "owner"},
            headers=headers,
        )
        self.assertEqual(res_add.status_code, 201, res_add.get_data(as_text=True))
        rec = res_add.get_json()["data"]["recipient"]
        self.assertEqual(rec["phone"], self.registered_phone)
        self.assertFalse(rec["sessionWindowOpen"])

        # 2. Simulate Meta inbound webhook from registered number -> opens 24h session window!
        res_wh = self.client.post(
            "/api/v1/whatsapp/webhook",
            json={
                "entry": [{
                    "changes": [{
                        "value": {
                            "messages": [{
                                "from": "250788111222",
                                "type": "text",
                                "text": {"body": "0"},
                            }]
                        }
                    }]
                }]
            },
        )
        self.assertEqual(res_wh.status_code, 200)

        # 3. Verify GET /config reports 24h window OPEN for registered recipient
        res_cfg = self.client.get("/api/v1/whatsapp/config", headers=headers)
        self.assertEqual(res_cfg.status_code, 200)
        cfg_data = res_cfg.get_json()["data"]
        self.assertEqual(cfg_data["mode"], "sandbox")
        self.assertTrue(cfg_data["registeredRecipients"][0]["sessionWindowOpen"])
        self.assertGreater(cfg_data["registeredRecipients"][0]["windowHoursLeft"], 23.0)

        # 4. Sending to an UNREGISTERED number in Sandbox mode cleanly returns wa.me fallback (no Meta error)
        res_unreg = self.client.post(
            "/api/v1/whatsapp/test-send",
            json={"phone": self.unregistered_phone, "message": "Hello customer"},
            headers=headers,
        )
        self.assertEqual(res_unreg.status_code, 200)
        unreg_data = res_unreg.get_json()["data"]
        self.assertEqual(unreg_data["status"], "sandbox_fallback_wa_me")
        self.assertIn("https://wa.me/250788999888", unreg_data["waMeLink"])

        # 5. Sending live daily summary to registered recipient dispatches cleanly
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.status_code = 200
        mock_resp.content = b'{"messages":[{"id":"wamid.test123"}]}'
        mock_resp.json.return_value = {"messages": [{"id": "wamid.test123"}]}
        with patch.dict(os.environ, {"WHATSAPP_ACCESS_TOKEN": "test_tok", "WHATSAPP_PHONE_NUMBER_ID": "123456"}):
            with patch("app.services.whatsapp_client.requests.post", return_value=mock_resp):
                res_sum = self.client.post(
                    "/api/v1/whatsapp/daily-summary",
                    json={"architectureId": "buy-and-sell"},
                    headers=headers,
                )
        self.assertEqual(res_sum.status_code, 200)
        sum_data = res_sum.get_json()["data"]
        self.assertEqual(len(sum_data["deliveries"]), 1)
        self.assertTrue(sum_data["deliveries"][0]["sent"])
        self.assertEqual(sum_data["deliveries"][0]["status"], "sent")


if __name__ == "__main__":
    unittest.main()

