"""Security hardening regression tests covering P0/P1/P2 fixes."""

import hashlib
import hmac
import json
import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.utils.rate_limit import check_rate_limit, reset_rate_limits


class _MockCollection:
    def __init__(self, docs=None):
        self.docs = list(docs or [])

    def find_one(self, query=None, projection=None, sort=None):
        q = query or {}
        matches = [d for d in self.docs if all(d.get(k) == v for k, v in q.items())]
        if sort and matches:
            field, direction = sort[0]
            matches.sort(key=lambda x: x.get(field) or datetime.min.replace(tzinfo=timezone.utc), reverse=(direction < 0))
        return dict(matches[0]) if matches else None

    def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if all(d.get(k) == v for k, v in (query or {}).items()):
                if "$set" in update:
                    d.update(update["$set"])
                return
        if upsert:
            nd = dict(query or {})
            if "$set" in update:
                nd.update(update["$set"])
            self.docs.append(nd)

    def insert_one(self, doc):
        d = dict(doc)
        d.setdefault("_id", f"id-{len(self.docs)+1}")
        self.docs.append(d)


class _MockDB:
    def __init__(self, users=None, password_resets=None):
        self.users = _MockCollection(users)
        self.password_resets = _MockCollection(password_resets)
        self.integrations = _MockCollection([])


class SecurityHardeningTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch("app.init_db"), patch("app.utils.mailer.start_email_outbox_relay"):
            cls.app = create_app()
            cls.app.config["TESTING"] = True
            cls.client = cls.app.test_client()

    def test_1_unauthenticated_private_routes_return_401(self):
        # Private tenant endpoints MUST reject unauthenticated requests even with ?scopeKey=
        for path in (
            "/api/v1/workspaces/buy-and-sell?scopeKey=victim@business.rw",
            "/api/v1/transactions?scopeKey=victim@business.rw",
            "/api/v1/storage?scopeKey=victim@business.rw",
            "/api/v1/branches?scopeKey=victim@business.rw",
            "/api/v1/whatsapp/config",
            "/api/v1/integrations/status?scopeKey=victim@business.rw",
        ):
            resp = self.client.get(path)
            self.assertEqual(resp.status_code, 401, f"Expected 401 for {path}, got {resp.status_code}")

        # Verify HTTP security headers are attached
        self.assertEqual(resp.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(resp.headers.get("X-Frame-Options"), "DENY")

    def test_2_public_qrcode_and_health_remain_accessible(self):
        r_qr = self.client.get("/api/v1/workspaces/qrcode?format=png&text=EXBOS-TEST")
        self.assertEqual(r_qr.status_code, 200)
        self.assertTrue(r_qr.data.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_3_meta_webhook_rejects_invalid_hmac_signature(self):
        payload = json.dumps({"entry": []}).encode("utf-8")
        with patch.dict(os.environ, {"META_APP_SECRET": "super-secret-meta-key"}):
            # Missing signature -> 403
            r_missing = self.client.post(
                "/api/v1/whatsapp/webhook",
                data=payload,
                content_type="application/json",
            )
            self.assertEqual(r_missing.status_code, 403)

            # Wrong signature -> 403
            r_wrong = self.client.post(
                "/api/v1/whatsapp/webhook",
                data=payload,
                content_type="application/json",
                headers={"X-Hub-Signature-256": "sha256=deadbeef"},
            )
            self.assertEqual(r_wrong.status_code, 403)

            # Valid HMAC-SHA256 signature -> 200
            valid_sig = "sha256=" + hmac.new(
                b"super-secret-meta-key", payload, hashlib.sha256
            ).hexdigest()
            with patch("app.routes.whatsapp.get_db", return_value=_MockDB()):
                r_ok = self.client.post(
                    "/api/v1/whatsapp/webhook",
                    data=payload,
                    content_type="application/json",
                    headers={"X-Hub-Signature-256": valid_sig},
                )
            self.assertEqual(r_ok.status_code, 200)

    def test_4_forgot_password_rejects_mismatched_phone_number(self):
        mock_db = _MockDB(
            users=[
                {
                    "email": "founder@shop.rw",
                    "name": "Founder",
                    "phone": "+250788111222",
                }
            ]
        )
        with patch("app.routes.auth.get_db", return_value=mock_db):
            resp = self.client.post(
                "/api/v1/auth/forgot-password",
                json={
                    "email": "founder@shop.rw",
                    "channel": "whatsapp",
                    "phone": "+250788999000",
                },
            )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("does not match", (resp.get_json() or {}).get("error", "").lower())

    def test_5_reset_password_enforces_expiry_and_5_attempt_lockout(self):
        # A. Expired OTP rejected explicitly
        expired_db = _MockDB(
            users=[{"email": "u@shop.rw", "password_hash": "old"}],
            password_resets=[
                {
                    "_id": "r1",
                    "email": "u@shop.rw",
                    "code": "123456",
                    "used": False,
                    "created_at": datetime.now(timezone.utc) - timedelta(minutes=20),
                    "expires_at": datetime.now(timezone.utc) - timedelta(minutes=5),
                }
            ],
        )
        with patch("app.routes.auth.get_db", return_value=expired_db):
            r_exp = self.client.post(
                "/api/v1/auth/reset-password",
                json={"email": "u@shop.rw", "code": "123456", "newPassword": "newpassword123"},
            )
        self.assertEqual(r_exp.status_code, 400)
        self.assertIn("expired", (r_exp.get_json() or {}).get("error", "").lower())

        # B. 5 wrong attempts lock out the OTP even if 6th attempt uses the real code
        lock_db = _MockDB(
            users=[{"email": "u2@shop.rw", "password_hash": "old"}],
            password_resets=[
                {
                    "_id": "r2",
                    "email": "u2@shop.rw",
                    "code": "654321",
                    "used": False,
                    "created_at": datetime.now(timezone.utc),
                    "expires_at": datetime.now(timezone.utc) + timedelta(minutes=15),
                }
            ],
        )
        with patch("app.routes.auth.get_db", return_value=lock_db):
            for _ in range(5):
                r_bad = self.client.post(
                    "/api/v1/auth/reset-password",
                    json={"email": "u2@shop.rw", "code": "000000", "newPassword": "newpassword123"},
                )
                self.assertEqual(r_bad.status_code, 400)
            # Now even the real code is rejected because the OTP was locked/invalidated
            r_after = self.client.post(
                "/api/v1/auth/reset-password",
                json={"email": "u2@shop.rw", "code": "654321", "newPassword": "newpassword123"},
            )
            self.assertEqual(r_after.status_code, 400)

    def test_6_sliding_window_rate_limiter_enforces_limit(self):
        reset_rate_limits()
        for _ in range(3):
            ok, retry = check_rate_limit("test:ip1", 3, 60)
            self.assertTrue(ok)
            self.assertEqual(retry, 0)
        ok, retry = check_rate_limit("test:ip1", 3, 60)
        self.assertFalse(ok)
        self.assertGreaterEqual(retry, 1)


if __name__ == "__main__":
    unittest.main()
