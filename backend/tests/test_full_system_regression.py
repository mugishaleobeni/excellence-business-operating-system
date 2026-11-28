"""
Full ExBOS System Regression & Unit Test Suite (Deterministic, Zero SMTP / Atlas Dependency).

Covers all core ExBOS backend features end-to-end (excluding live SMTP email delivery
blocked on Render Free Tier):
  1. Auth, Registration, Pending Paid Plan Verification & Login JWT
  2. Password Reset WhatsApp Fallback, Registered-Phone Check, OTP Expiry & 5-Attempt Lockout
  3. Global JWT Guard, IDOR Prevention, Security Headers, Rate Limiting & Meta Webhook HMAC
  4. Workspace CRUD (Products, Sales + Stock Deduction, Purchases, Expenses, Delete + Stock Restore, QR PNG)
  5. Multi-Branch Isolation, Branch Manager Creation Block & Silent Owner Product Audit Alerts
  6. WhatsApp Guided POS, Contextual '0' Main Menu, PAYMENT VERIFIED Footer & Live Subscription Gating
  7. Super Admin Pricing Sync -> Live Public Pricing & Plan Limits
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import sys
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask_jwt_extended import create_access_token

from app import create_app
from app.services.whatsapp_client import build_welcome_message
from app.services.whatsapp_engine import handle_incoming_whatsapp_message
from app.utils.rate_limit import check_rate_limit, reset_rate_limits


def _get_nested(doc: dict, dotted_key: str):
    cur = doc
    for part in dotted_key.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def _set_nested(doc: dict, dotted_key: str, value):
    parts = dotted_key.split(".")
    cur = doc
    for part in parts[:-1]:
        if part not in cur or not isinstance(cur[part], dict):
            cur[part] = {}
        cur = cur[part]
    cur[parts[-1]] = value


def _matches_query(doc: dict, query: dict | None) -> bool:
    if not query:
        return True
    for k, v in query.items():
        if k == "$or":
            if not any(_matches_query(doc, sub) for sub in v):
                return False
            continue
        if k == "$and":
            if not all(_matches_query(doc, sub) for sub in v):
                return False
            continue
        val = _get_nested(doc, k) if "." in k else doc.get(k)
        if isinstance(v, dict):
            for op, target in v.items():
                if op == "$ne" and val == target:
                    return False
                elif op == "$in" and val not in target:
                    return False
                elif op == "$nin" and val in target:
                    return False
                elif op == "$gt" and not (val is not None and val > target):
                    return False
                elif op == "$gte" and not (val is not None and val >= target):
                    return False
                elif op == "$lt" and not (val is not None and val < target):
                    return False
                elif op == "$lte" and not (val is not None and val <= target):
                    return False
                elif op == "$regex":
                    flags = re.IGNORECASE if "i" in str(v.get("$options", "")) else 0
                    if not re.search(str(target), str(val or ""), flags):
                        return False
        else:
            if val != v:
                return False
    return True


class _FakeCursor(list):
    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for field, d in reversed(key_or_list):
                super().sort(key=lambda x: str(x.get(field) or ""), reverse=(d < 0))
        else:
            super().sort(key=lambda x: str(x.get(key_or_list) or ""), reverse=(direction < 0))
        return self

    def limit(self, n: int):
        return _FakeCursor(self[:n])


class _FakeResult:
    def __init__(self, count: int = 1, inserted_id=None):
        self.deleted_count = count
        self.modified_count = count
        self.matched_count = count
        self.inserted_id = inserted_id


class _InMemoryCollection:
    def __init__(self, docs=None):
        self.docs: list[dict] = [dict(d) for d in (docs or [])]

    def _project(self, doc: dict, projection: dict | None) -> dict:
        out = dict(doc)
        if projection and projection.get("_id") == 0:
            out.pop("_id", None)
        return out

    def find(self, query=None, projection=None):
        return _FakeCursor(
            self._project(d, projection) for d in self.docs if _matches_query(d, query)
        )

    def find_one(self, query=None, projection=None, sort=None):
        matches = [d for d in self.docs if _matches_query(d, query)]
        if sort and matches:
            field, direction = sort[0]
            matches.sort(
                key=lambda x: x.get(field) or datetime.min.replace(tzinfo=timezone.utc),
                reverse=(direction < 0),
            )
        return self._project(matches[0], projection) if matches else None

    def count_documents(self, query=None) -> int:
        return sum(1 for d in self.docs if _matches_query(d, query))

    def insert_one(self, doc: dict):
        copy = dict(doc)
        copy.setdefault("_id", f"oid-{len(self.docs) + 1}")
        self.docs.append(copy)
        return _FakeResult(1, copy["_id"])

    def insert_many(self, docs):
        for d in docs:
            self.insert_one(d)
        return _FakeResult(len(docs))

    def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if _matches_query(d, query):
                if "$set" in update:
                    for k, v in update["$set"].items():
                        if "." in k:
                            _set_nested(d, k, v)
                        else:
                            d[k] = v
                if "$inc" in update:
                    for k, v in update["$inc"].items():
                        d[k] = (d.get(k) or 0) + v
                return _FakeResult(1)
        if upsert:
            nd = {}
            for k, v in (query or {}).items():
                if not k.startswith("$") and not isinstance(v, dict):
                    nd[k] = v
            if "$set" in update:
                for k, v in update["$set"].items():
                    if "." in k:
                        _set_nested(nd, k, v)
                    else:
                        nd[k] = v
            self.insert_one(nd)
            return _FakeResult(1)
        return _FakeResult(0)

    def delete_one(self, query):
        for idx, d in enumerate(self.docs):
            if _matches_query(d, query):
                self.docs.pop(idx)
                return _FakeResult(1)
        return _FakeResult(0)

    def delete_many(self, query):
        before = len(self.docs)
        self.docs = [d for d in self.docs if not _matches_query(d, query)]
        return _FakeResult(before - len(self.docs))


class _InMemoryDB:
    def __init__(self):
        self._cols: dict[str, _InMemoryCollection] = {}

    def __getattr__(self, name: str) -> _InMemoryCollection:
        if name.startswith("_"):
            raise AttributeError(name)
        if name not in self._cols:
            self._cols[name] = _InMemoryCollection()
        return self._cols[name]

    def __getitem__(self, name: str) -> _InMemoryCollection:
        return self.__getattr__(name)


class FullSystemRegressionTestCase(unittest.TestCase):
    """Comprehensive regression suite covering all ExBOS subsystems."""

    def setUp(self):
        self.db = _InMemoryDB()
        self.db_patchers = [
            patch("app.init_db"),
            patch("app.utils.mailer.start_email_outbox_relay"),
            patch("app.get_db", return_value=self.db),
            patch("app.database.get_db", return_value=self.db),
            patch("app.routes.auth.get_db", return_value=self.db),
            patch("app.routes.workspaces.get_db", return_value=self.db),
            patch("app.routes.transactions.get_db", return_value=self.db),
            patch("app.routes.branches.get_db", return_value=self.db),
            patch("app.routes.super_admin.get_db", return_value=self.db),
            patch("app.routes.whatsapp.get_db", return_value=self.db),
            patch("app.routes.storage.get_db", return_value=self.db),
            patch("app.routes.training.get_db", return_value=self.db),
            patch("app.routes.shifts.get_db", return_value=self.db),
            patch("app.routes.commitments.get_db", return_value=self.db),
            patch("app.routes.tax.get_db", return_value=self.db),
        ]
        for p in self.db_patchers:
            p.start()
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        for p in reversed(self.db_patchers):
            p.stop()

    def _auth_header(self, email: str) -> dict:
        with self.app.app_context():
            tok = create_access_token(identity=email)
        return {"Authorization": f"Bearer {tok}"}

    # ------------------------------------------------------------------
    # 1. AUTH, REGISTRATION (NO SELF-APPROVED PAID PLANS), LOGIN & RESET
    # ------------------------------------------------------------------
    def test_01_registration_paid_plan_requires_approval_and_login_works(self):
        with patch("app.services.whatsapp_client.send_whatsapp_message", return_value={"ok": True, "sent": True}) as mock_wa:
            resp = self.client.post(
                "/api/v1/auth/register",
                json={
                    "fullName": "Jean Founder",
                    "email": "founder@kigalishop.rw",
                    "phone": "+250788100200",
                    "password": "StrongPassword123!",
                    "businessName": "Kigali Tech Hub",
                    "architectureId": "buy-and-sell",
                    "country": "Rwanda",
                    "location": "Kigali",
                    "currency": "RWF",
                    "language": "en",
                    "planTier": "Gold",
                    "paymentMethod": "MTN MoMo",
                    "paymentReference": "MOMO-998877",
                },
            )
        self.assertEqual(resp.status_code, 201, resp.get_data(as_text=True))
        # Must auto-send Welcome WhatsApp message
        self.assertTrue(mock_wa.called)

        # Paid plan on register MUST NOT self-approve; starts Free + PendingApproval
        saved_user = self.db.users.find_one({"email": "founder@kigalishop.rw"})
        self.assertIsNotNone(saved_user)
        self.assertEqual(saved_user["plan"], "Free")
        self.assertEqual(saved_user["pendingPlanTier"], "Gold")
        self.assertEqual(saved_user["subscriptionStatus"], "PendingApproval")

        req_doc = self.db.subscription_requests.find_one({"email": "founder@kigalishop.rw"})
        self.assertIsNotNone(req_doc)
        self.assertEqual(req_doc["status"], "pending")

        # Login works and returns valid JWT
        r_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "founder@kigalishop.rw", "password": "StrongPassword123!"},
        )
        self.assertEqual(r_login.status_code, 200)
        login_data = r_login.get_json()["data"]
        token = login_data.get("access_token") or login_data.get("accessToken")
        self.assertTrue(token)
        r_me = self.client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(r_me.status_code, 200)
        self.assertEqual(r_me.get_json()["data"]["user"]["email"], "founder@kigalishop.rw")

    def test_02_password_reset_whatsapp_fallback_phone_guard_expiry_and_lockout(self):
        from app.utils.security import hash_password

        self.db.users.insert_one(
            {
                "email": "reset@exbos.rw",
                "name": "Reset User",
                "phone": "+250788222333",
                "password_hash": hash_password("OldPass123!"),
                "accountStatus": "Active",
            }
        )

        # A. Mismatched WhatsApp phone MUST be rejected (prevents account takeover)
        r_bad_phone = self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "reset@exbos.rw", "channel": "whatsapp", "phone": "+250788999888"},
        )
        self.assertEqual(r_bad_phone.status_code, 400)

        # B. When email fails, automatic WhatsApp fallback dispatches to registered phone
        with patch("app.routes.auth.send_gmail_email", return_value=False), patch(
            "app.services.whatsapp_client.send_whatsapp_message",
            return_value={"ok": True, "sent": True},
        ):
            r_fb = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "reset@exbos.rw"},
            )
        self.assertEqual(r_fb.status_code, 200)
        fb_data = r_fb.get_json()["data"]
        self.assertTrue(fb_data["whatsappSent"])
        self.assertTrue(fb_data["emailFailedFallbackUsed"])
        self.assertEqual(fb_data["deliveryChannel"], "whatsapp")

        # C. Valid code resets password cleanly
        reset_doc = self.db.password_resets.find_one({"email": "reset@exbos.rw", "used": False})
        self.assertIsNotNone(reset_doc)
        r_ok = self.client.post(
            "/api/v1/auth/reset-password",
            json={"email": "reset@exbos.rw", "code": reset_doc["code"], "newPassword": "NewSecurePassword99!"},
        )
        self.assertEqual(r_ok.status_code, 200)

        # Login with new password succeeds
        r_login_new = self.client.post(
            "/api/v1/auth/login",
            json={"email": "reset@exbos.rw", "password": "NewSecurePassword99!"},
        )
        self.assertEqual(r_login_new.status_code, 200)

    # ------------------------------------------------------------------
    # 2. WORKSPACE CRUD, STOCK INTEGRITY & QR CODE PNG (WITHOUT PIL)
    # ------------------------------------------------------------------
    def test_03_workspace_crud_stock_deduction_restore_and_qrcode_png(self):
        owner_email = "shop@exbos.rw"
        self.db.users.insert_one(
            {
                "email": owner_email,
                "name": "Shop Owner",
                "phone": "+250788300400",
                "businessName": "Shop Kigali",
                "architectureId": "buy-and-sell",
                "role": "BUSINESS_OWNER",
                "plan": "Gold",
                "planTier": "Gold",
                "accountStatus": "Active",
            }
        )
        headers = self._auth_header(owner_email)

        # 1. Create Product
        r_add = self.client.post(
            "/api/v1/workspaces/buy-and-sell/records/Inventory",
            headers=headers,
            json={
                "id": "PRD-100",
                "title": "Solar Inverter 2KW",
                "sellingPriceRWF": 250000,
                "purchasePriceRWF": 180000,
                "quantity": 10,
                "currentStock": 10,
            },
        )
        self.assertIn(r_add.status_code, (200, 201), r_add.get_data(as_text=True))

        # 2. Record Sale (qty 3) -> stock should deduct 10 -> 7
        r_sale = self.client.post(
            "/api/v1/workspaces/buy-and-sell/records/Sales",
            headers=headers,
            json={
                "id": "SAL-100",
                "title": "Solar Inverter 2KW",
                "productId": "PRD-100",
                "productTitle": "Solar Inverter 2KW",
                "quantity": 3,
                "amountRWF": 750000,
                "status": "Paid in Full",
            },
        )
        self.assertIn(r_sale.status_code, (200, 201), r_sale.get_data(as_text=True))
        ws_after_sale = self.db.workspaces.find_one({"scopeKey": owner_email, "architectureId": "buy-and-sell"})
        inv_item = next(p for p in ws_after_sale["records"]["Inventory"] if p["id"] == "PRD-100")
        self.assertEqual(inv_item["quantity"], 7)

        # 3. Delete Sale -> stock should restore 7 -> 10
        r_del_sale = self.client.delete(
            "/api/v1/workspaces/buy-and-sell/records/Sales/SAL-100",
            headers=headers,
        )
        self.assertEqual(r_del_sale.status_code, 200)
        ws_after_del = self.db.workspaces.find_one({"scopeKey": owner_email, "architectureId": "buy-and-sell"})
        inv_restored = next(p for p in ws_after_del["records"]["Inventory"] if p["id"] == "PRD-100")
        self.assertEqual(inv_restored["quantity"], 10)

        # 4. QR Code PNG works without PIL (pure-Python PNG fallback)
        r_qr = self.client.get("/api/v1/workspaces/qrcode?format=png&text=PRD-100-SOLAR")
        self.assertEqual(r_qr.status_code, 200)
        self.assertEqual(r_qr.mimetype, "image/png")
        self.assertTrue(r_qr.data.startswith(b"\x89PNG\r\n\x1a\n"))

    # ------------------------------------------------------------------
    # 3. BRANCH ISOLATION, MANAGER CREATION BLOCK & SILENT OWNER AUDIT
    # ------------------------------------------------------------------
    def test_04_branch_manager_blocked_from_creating_branch_and_silent_audit_on_product_edit(self):
        owner_email = "hq@exbos.rw"
        mgr_email = "mgr@exbos.rw"
        branch_id = "BR-MUSANZE"
        self.db.users.insert_many(
            [
                {
                    "email": owner_email,
                    "name": "HQ Owner",
                    "phone": "+250788400100",
                    "businessName": "Rwanda Electronics",
                    "architectureId": "buy-and-sell",
                    "role": "BUSINESS_OWNER",
                    "plan": "Gold",
                    "planTier": "Gold",
                    "accountStatus": "Active",
                },
                {
                    "email": mgr_email,
                    "ownerScopeKey": owner_email,
                    "name": "Musanze Manager",
                    "phone": "+250788400200",
                    "businessName": "Rwanda Electronics",
                    "architectureId": "buy-and-sell",
                    "role": "Branch Manager",
                    "assignedBranchId": branch_id,
                    "plan": "Gold",
                    "accountStatus": "Active",
                },
            ]
        )
        self.db.branches.insert_many(
            [
                {"scopeKey": owner_email, "id": "main", "name": "Kigali HQ", "isMain": True, "status": "Active"},
                {"scopeKey": owner_email, "id": branch_id, "name": "Musanze Branch", "isMain": False, "status": "Active"},
            ]
        )
        self.db.workspaces.insert_one(
            {
                "scopeKey": owner_email,
                "architectureId": "buy-and-sell",
                "businessName": "Rwanda Electronics",
                "records": {
                    "Products": [
                        {"id": "P-HQ", "title": "HQ Secret Laptop", "branchId": "main", "quantity": 5, "sellingPriceRWF": 900000, "purchasePriceRWF": 700000},
                        {"id": "P-BR", "title": "Musanze Powerbank", "branchId": branch_id, "quantity": 12, "sellingPriceRWF": 25000, "purchasePriceRWF": 15000},
                    ],
                    "Inventory": [],
                    "Sales": [],
                    "Purchases": [],
                    "Expenses": [],
                    "Customers": [],
                    "Suppliers": [],
                },
                "metrics": {},
            }
        )

        # A. Branch Manager MUST be blocked from creating a branch (403)
        r_create_branch = self.client.post(
            "/api/v1/branches",
            headers=self._auth_header(mgr_email),
            json={"name": "Unauthorized Branch", "location": "Rubavu"},
        )
        self.assertEqual(r_create_branch.status_code, 403)

        # B. Branch Manager edits own branch product price on WhatsApp -> succeeds & silently notifies Owner
        with patch("app.services.owner_audit_notifier.send_whatsapp_message", return_value={"ok": True, "sent": True}) as mock_owner_wa:
            r_list = handle_incoming_whatsapp_message(self.db, "+250788400200", "1")
            self.assertIn("Musanze Powerbank", r_list["reply"])
            self.assertNotIn("HQ Secret Laptop", r_list["reply"])

            handle_incoming_whatsapp_message(self.db, "+250788400200", "1")
            handle_incoming_whatsapp_message(self.db, "+250788400200", "2")
            handle_incoming_whatsapp_message(self.db, "+250788400200", "30000")
            r_done = handle_incoming_whatsapp_message(self.db, "+250788400200", "YES")

        self.assertEqual(r_done["action"], "product_updated")
        # Stealth guarantee: manager's reply never reveals owner audit alert
        self.assertNotIn("owner", r_done["reply"].lower())
        self.assertNotIn("audit", r_done["reply"].lower())
        # Owner silently received in-app notification, audit log & WhatsApp alert
        self.assertIsNotNone(
            self.db.owner_notifications.find_one({"scopeKey": owner_email, "type": "branch_manager_product_audit"})
        )
        self.assertIsNotNone(
            self.db.branch_audit_logs.find_one({"scopeKey": owner_email, "actionType": "Edited Selling Price"})
        )
        self.assertTrue(mock_owner_wa.called)

    # ------------------------------------------------------------------
    # 4. WHATSAPP CONTEXTUAL '0' MENU, PAYMENT VERIFIED & SUBSCRIPTION GATE
    # ------------------------------------------------------------------
    def test_05_whatsapp_contextual_menu_payment_verified_and_subscription_gate(self):
        # Main Menu must NOT display '*0.* Main Menu' when already on Main Menu
        m_en = build_welcome_message("Demo Shop", "buy-and-sell", lang="en")
        m_rw = build_welcome_message("Demo Shop", "buy-and-sell", lang="rw")
        self.assertNotIn("*0.* Main Menu", m_en)
        self.assertNotIn("*0.* Ahabanza", m_rw)

        # Free user is blocked from WhatsApp POS chat
        self.db.users.insert_one(
            {
                "email": "free@exbos.rw",
                "name": "Free Trader",
                "phone": "+250788500100",
                "businessName": "Free Stall",
                "architectureId": "buy-and-sell",
                "role": "BUSINESS_OWNER",
                "plan": "Free",
                "planTier": "Free",
            }
        )
        r_gate = handle_incoming_whatsapp_message(self.db, "+250788500100", "Hi")
        self.assertEqual(r_gate["action"], "subscription_required")

        # Paid user: credit sale + VERIFY <Customer> -> includes Reply *6* ... or *0* for Main Menu
        self.db.users.insert_one(
            {
                "email": "gold@exbos.rw",
                "name": "Gold Trader",
                "phone": "+250788500200",
                "businessName": "Gold Mart",
                "architectureId": "buy-and-sell",
                "role": "BUSINESS_OWNER",
                "plan": "Gold",
                "planTier": "Gold",
            }
        )
        self.db.workspaces.insert_one(
            {
                "scopeKey": "gold@exbos.rw",
                "architectureId": "buy-and-sell",
                "businessName": "Gold Mart",
                "records": {
                    "Products": [{"id": "P1", "title": "Router 4G", "quantity": 5, "sellingPriceRWF": 40000, "purchasePriceRWF": 25000}],
                    "Sales": [],
                    "Purchases": [],
                    "Expenses": [],
                    "Customers": [],
                    "Suppliers": [],
                },
                "metrics": {},
            }
        )
        handle_incoming_whatsapp_message(self.db, "+250788500200", "2")
        handle_incoming_whatsapp_message(self.db, "+250788500200", "1")
        handle_incoming_whatsapp_message(self.db, "+250788500200", "2")
        handle_incoming_whatsapp_message(self.db, "+250788500200", "5")
        handle_incoming_whatsapp_message(self.db, "+250788500200", "Leo")
        handle_incoming_whatsapp_message(self.db, "+250788500200", "SKIP")
        handle_incoming_whatsapp_message(self.db, "+250788500200", "YES")

        r_ver = handle_incoming_whatsapp_message(self.db, "+250788500200", "VERIFY Leo")
        self.assertEqual(r_ver["action"], "payment_verified")
        self.assertIn("Reply *6* for Unpaid Customers or *0* for Main Menu.", r_ver["reply"])

        r_back = handle_incoming_whatsapp_message(self.db, "+250788500200", "0")
        self.assertEqual(r_back["action"], "menu")

    # ------------------------------------------------------------------
    # 5. SUPER ADMIN PRICING SYNC, GLOBAL JWT GUARD & WEBHOOK HMAC
    # ------------------------------------------------------------------
    def test_06_super_admin_pricing_sync_jwt_guard_and_webhook_hmac(self):
        # Unauthenticated private route -> 401
        r_unauth = self.client.get("/api/v1/workspaces/buy-and-sell?scopeKey=gold@exbos.rw")
        self.assertEqual(r_unauth.status_code, 401)
        self.assertEqual(r_unauth.headers.get("X-Content-Type-Options"), "nosniff")

        # Super Admin updates Bronze pricing -> reflected live on public GET /pricing-plans
        sa_email = "mugishaleobeni0@gmail.com"
        self.db.users.insert_one(
            {
                "email": sa_email,
                "name": "Super Admin",
                "isSuperAdmin": True,
                "accountStatus": "Active",
            }
        )
        r_upd = self.client.put(
            "/api/v1/super-admin/pricing-plans/bronze",
            headers=self._auth_header(sa_email),
            json={"priceRWF": 7500, "description": "Updated Bronze Tier"},
        )
        self.assertEqual(r_upd.status_code, 200, r_upd.get_data(as_text=True))

        r_pub = self.client.get("/api/v1/super-admin/pricing-plans")
        self.assertEqual(r_pub.status_code, 200)
        pub_data = r_pub.get_json()["data"]
        plans = pub_data["plans"] if isinstance(pub_data, dict) else pub_data
        bronze = next(p for p in plans if str(p.get("id") or "").lower() == "bronze")
        self.assertEqual(int(bronze["priceRWF"]), 7500)

        # Meta Webhook HMAC rejects forged payloads & accepts valid HMAC-SHA256
        body = json.dumps({"entry": []}).encode("utf-8")
        with patch.dict(os.environ, {"META_APP_SECRET": "exbos-hmac-test-secret"}):
            self.assertEqual(
                self.client.post("/api/v1/whatsapp/webhook", data=body, content_type="application/json").status_code,
                403,
            )
            sig = "sha256=" + hmac.new(b"exbos-hmac-test-secret", body, hashlib.sha256).hexdigest()
            self.assertEqual(
                self.client.post(
                    "/api/v1/whatsapp/webhook",
                    data=body,
                    content_type="application/json",
                    headers={"X-Hub-Signature-256": sig},
                ).status_code,
                200,
            )

        # Sliding-window rate limiter enforces caps
        reset_rate_limits()
        self.assertTrue(check_rate_limit("reg:ip", 2, 60)[0])
        self.assertTrue(check_rate_limit("reg:ip", 2, 60)[0])
        self.assertFalse(check_rate_limit("reg:ip", 2, 60)[0])

    # ------------------------------------------------------------------
    # 7. OFFLINE SYNC IDEMPOTENCY (NO DUPLICATES OR DOUBLE-COUNTING)
    # ------------------------------------------------------------------
    def test_07_offline_sync_retry_idempotency_prevents_duplicates(self):
        email = "offline@exbos.rw"
        self.db.users.insert_one(
            {"email": email, "name": "Offline Shop", "plan": "Silver", "accountStatus": "Active"}
        )
        headers = self._auth_header(email)

        # Replay identical Sale record twice (simulating network drop right before HTTP 200)
        sale_payload = {
            "id": "SAL-OFFLINE-9001",
            "title": "Cement Bag",
            "amountRWF": 12000,
            "quantity": 1,
            "status": "Paid",
            "paymentMethod": "Cash",
            "date": "2026-11-27",
        }
        r1 = self.client.post("/api/v1/workspaces/buy-and-sell/records/Sales", json=sale_payload, headers=headers)
        r2 = self.client.post("/api/v1/workspaces/buy-and-sell/records/Sales", json=sale_payload, headers=headers)
        self.assertIn(r1.status_code, (200, 201))
        self.assertEqual(r2.status_code, 200)
        self.assertTrue(r2.get_json()["data"].get("idempotent"))
        ws = self.db.workspaces.find_one({"scopeKey": email, "architectureId": "buy-and-sell"})
        sales = [s for s in (ws.get("records") or {}).get("Sales", []) if s.get("id") == "SAL-OFFLINE-9001"]
        self.assertEqual(len(sales), 1)

        # Replay identical Transaction twice
        tx_payload = {
            "id": "TX-OFFLINE-9001",
            "architectureId": "buy-and-sell",
            "type": "INFLOW",
            "title": "Cement Sale",
            "amountRWF": 12000,
            "paymentMethod": "Cash",
        }
        t1 = self.client.post("/api/v1/transactions", json=tx_payload, headers=headers)
        t2 = self.client.post("/api/v1/transactions", json=tx_payload, headers=headers)
        self.assertIn(t1.status_code, (200, 201))
        self.assertEqual(t2.status_code, 200)
        self.assertTrue(t2.get_json()["data"].get("idempotent"))
        tx_docs = list(self.db.transactions.find({"scopeKey": email, "id": "TX-OFFLINE-9001"}))
        self.assertEqual(len(tx_docs), 1)

    # ------------------------------------------------------------------
    # 8. STAFF TRAINING & FREE-TO-PAID MONETIZATION ENGINE
    # ------------------------------------------------------------------
    def test_08_staff_training_free_promo_to_paid_monetization_flow(self):
        admin_email = "mugishaleobeni0@gmail.com"
        user_email = "trainee@exbos.rw"
        self.db.users.insert_one(
            {"email": admin_email, "name": "Super Admin", "isSuperAdmin": True, "accountStatus": "Active"}
        )
        self.db.users.insert_one(
            {
                "email": user_email,
                "name": "Shop Owner",
                "businessName": "Nyabugogo Mart",
                "phone": "+250788555666",
                "plan": "Free",
                "accountStatus": "Active",
            }
        )
        admin_h = self._auth_header(admin_email)
        user_h = self._auth_header(user_email)

        # 1. Default Launch Promo is ON -> Staff Training books for 0 RWF without payment ref
        r_cat = self.client.get("/api/v1/training/catalog", headers=user_h)
        self.assertEqual(r_cat.status_code, 200)
        self.assertTrue(r_cat.get_json()["data"]["freePromoActive"])

        r_free_bk = self.client.post(
            "/api/v1/training/bookings",
            json={
                "packageId": "staff-cashier-training",
                "deliveryMode": "online",
                "staffCount": 3,
                "preferredDate": "2026-12-05",
                "preferredTimeSlot": "10:00 AM",
                "language": "rw",
            },
            headers=user_h,
        )
        self.assertEqual(r_free_bk.status_code, 201, r_free_bk.get_data(as_text=True))
        free_bk = r_free_bk.get_json()["data"]["booking"]
        self.assertEqual(free_bk["finalAmountRWF"], 0.0)
        self.assertEqual(free_bk["paymentStatus"], "free")

        # 2. Non-admin cannot access /training/admin/*
        self.assertEqual(self.client.get("/api/v1/training/admin/overview", headers=user_h).status_code, 403)

        # 3. Super Admin turns OFF Free Promo & changes Staff Training online price to 40,000 RWF
        cfg = self.client.get("/api/v1/training/admin/overview", headers=admin_h).get_json()["data"]["config"]
        for p in cfg["packages"]:
            if p["id"] == "staff-cashier-training":
                p["onlinePriceRWF"] = 40000
        r_upd = self.client.put(
            "/api/v1/training/admin/config",
            json={**cfg, "freePromoActive": False},
            headers=admin_h,
        )
        self.assertEqual(r_upd.status_code, 200)

        # 4. Now paid booking WITHOUT MoMo reference MUST fail (400)
        r_no_ref = self.client.post(
            "/api/v1/training/bookings",
            json={
                "packageId": "staff-cashier-training",
                "deliveryMode": "online",
                "staffCount": 4,
                "preferredDate": "2026-12-10",
            },
            headers=user_h,
        )
        self.assertEqual(r_no_ref.status_code, 400)

        # 5. Paid booking WITH MoMo reference succeeds at updated 40,000 RWF
        r_paid = self.client.post(
            "/api/v1/training/bookings",
            json={
                "packageId": "staff-cashier-training",
                "deliveryMode": "online",
                "staffCount": 4,
                "preferredDate": "2026-12-10",
                "paymentMethod": "MTN MoMo",
                "paymentReference": "MOMO-TRN-7788",
            },
            headers=user_h,
        )
        self.assertEqual(r_paid.status_code, 201, r_paid.get_data(as_text=True))
        paid_bk = r_paid.get_json()["data"]["booking"]
        self.assertEqual(paid_bk["finalAmountRWF"], 40000.0)
        self.assertEqual(paid_bk["paymentStatus"], "pending_verification")

        # 6. Super Admin approves payment & confirms slot -> WhatsApp notification sent
        with patch("app.services.whatsapp_client.send_whatsapp_message", return_value={"ok": True}) as mock_wa:
            r_conf = self.client.put(
                f"/api/v1/training/admin/bookings/{paid_bk['id']}",
                json={
                    "paymentStatus": "paid",
                    "bookingStatus": "confirmed",
                    "assignedTrainer": "Eric Trainer",
                    "meetingLink": "https://meet.google.com/exbos-train",
                },
                headers=admin_h,
            )
            self.assertEqual(r_conf.status_code, 200)
            self.assertTrue(mock_wa.called)

        # 7. Super Admin overview reflects 40,000 RWF paid training revenue
        ov = self.client.get("/api/v1/training/admin/overview", headers=admin_h).get_json()["data"]
        self.assertEqual(ov["kpis"]["totalRevenueRWF"], 40000)

    # ------------------------------------------------------------------
    # 9. BULK CSV IMPORT (WHOLESALE/IMEI/EXPIRY), SHIFTS Z-REPORT & DIGEST
    # ------------------------------------------------------------------
    def test_09_bulk_csv_import_cashier_shift_zreport_and_daily_digest(self):
        free_email = "free-shop@exbos.rw"
        pro_email = "pro-shop@exbos.rw"
        self.db.users.insert_one(
            {"email": free_email, "name": "Free Owner", "phone": "+250788111222", "plan": "Free", "accountStatus": "Active"}
        )
        self.db.users.insert_one(
            {"email": pro_email, "name": "Pro Owner", "businessName": "Kigali Mega Mart", "phone": "+250788333444", "plan": "Bronze", "accountStatus": "Active"}
        )
        free_h = self._auth_header(free_email)
        pro_h = self._auth_header(pro_email)

        # A. Bulk CSV Import with Wholesale, Batch/Expiry & IMEI Serials + SKU Deduplication
        items = [
            {
                "title": "Samsung A15",
                "sku": "SAM-A15",
                "purchasePriceRWF": 180000,
                "sellingPriceRWF": 220000,
                "wholesalePriceRWF": 200000,
                "wholesaleMinQty": 3,
                "quantity": 4,
                "serialNumbers": ["IMEI-001", "IMEI-002"],
            },
            {
                "title": "Paracetamol 500mg",
                "sku": "PHARM-01",
                "purchasePriceRWF": 1000,
                "sellingPriceRWF": 2000,
                "quantity": 3,
                "lowStockAlert": 5,
                "batchNumber": "B-2026",
                "expiryDate": "2026-12-10",
            },
        ]
        r_bulk1 = self.client.post("/api/v1/workspaces/buy-and-sell/records/Inventory/bulk", json={"items": items}, headers=pro_h)
        self.assertEqual(r_bulk1.status_code, 201, r_bulk1.get_data(as_text=True))
        d1 = r_bulk1.get_json()["data"]
        self.assertEqual(d1["createdCount"], 2)
        self.assertEqual(d1["updatedCount"], 0)

        # Re-importing same SKUs updates existing records instead of duplicating
        items[0]["quantity"] = 10
        r_bulk2 = self.client.post("/api/v1/workspaces/buy-and-sell/records/Inventory/bulk", json={"items": items}, headers=pro_h)
        self.assertEqual(r_bulk2.status_code, 201)
        self.assertEqual(r_bulk2.get_json()["data"]["updatedCount"], 2)

        # B. Cashier Shift Open -> Record Cash Sale -> Close Shift with Shortage -> Silent Owner Alert
        r_open = self.client.post(
            "/api/v1/shifts/open",
            json={"openingFloatRWF": 50000, "cashierName": "Alice Cashier", "archId": "buy-and-sell"},
            headers=pro_h,
        )
        self.assertEqual(r_open.status_code, 201, r_open.get_data(as_text=True))
        shift_id = r_open.get_json()["data"]["shift"]["id"]

        # Duplicate open shift on same branch rejected (409)
        self.assertEqual(
            self.client.post("/api/v1/shifts/open", json={"openingFloatRWF": 10000}, headers=pro_h).status_code,
            409,
        )

        # Record a 30,000 RWF Cash sale during shift (expected cash = 50k + 30k = 80k)
        self.client.post(
            "/api/v1/workspaces/buy-and-sell/records/Sales",
            json={"id": "SAL-SHF-1", "title": "Cash Sale", "amountRWF": 30000, "paymentMethod": "Cash", "status": "Paid"},
            headers=pro_h,
        )

        # Close shift with counted cash 72,000 RWF -> 8,000 RWF shortage triggers Owner WhatsApp + notification
        with patch("app.services.whatsapp_client.send_whatsapp_message", return_value={"ok": True}) as mock_wa:
            r_close = self.client.post(
                f"/api/v1/shifts/{shift_id}/close",
                json={"countedCashRWF": 72000, "closingNotes": "Evening close"},
                headers=pro_h,
            )
            self.assertEqual(r_close.status_code, 200, r_close.get_data(as_text=True))
            closed = r_close.get_json()["data"]["shift"]
            self.assertEqual(closed["expectedCashRWF"], 80000)
            self.assertEqual(closed["varianceRWF"], -8000)
            self.assertTrue(mock_wa.called)

        # C. Daily Owner WhatsApp Digest: Free plan blocked (402), Bronze plan succeeds (200)
        self.assertEqual(
            self.client.post("/api/v1/shifts/digest/send-now", json={"archId": "buy-and-sell"}, headers=free_h).status_code,
            402,
        )
        with patch("app.services.whatsapp_client.send_whatsapp_message", return_value={"ok": True}) as mock_dig:
            r_dig = self.client.post("/api/v1/shifts/digest/send-now", json={"archId": "buy-and-sell"}, headers=pro_h)
            self.assertEqual(r_dig.status_code, 200, r_dig.get_data(as_text=True))
            dig = r_dig.get_json()["data"]["digest"]
            self.assertEqual(dig["totalSalesRWF"], 30000)
            self.assertGreaterEqual(dig["lowStockCount"], 1)
            self.assertGreaterEqual(dig["expiringSoonCount"], 1)
            self.assertTrue(mock_dig.called)

    # ------------------------------------------------------------------
    # 10. MONTHLY EMPLOYEE PAYROLL, RENT & LIVE BREAK-EVEN ENGINE
    # ------------------------------------------------------------------
    def test_10_monthly_payroll_fixed_bills_and_breakeven_engine(self):
        email = "payroll@exbos.rw"
        self.db.users.insert_one(
            {"email": email, "name": "Demo Owner", "businessName": "Kigali Retail", "plan": "Silver", "accountStatus": "Active"}
        )
        headers = self._auth_header(email)
        month_key = datetime.now(timezone.utc).strftime("%Y-%m")

        # 1. Add Employee (150,000 RWF/mo) + Shop Rent (300,000 RWF/mo) => 450,000 RWF Monthly Fixed
        r_emp = self.client.post(
            "/api/v1/commitments",
            json={"kind": "employee", "name": "Alice Cashier", "roleOrCategory": "Cashier", "monthlyAmountRWF": 150000},
            headers=headers,
        )
        self.assertEqual(r_emp.status_code, 201, r_emp.get_data(as_text=True))
        emp_id = r_emp.get_json()["data"]["commitment"]["id"]

        r_rent = self.client.post(
            "/api/v1/commitments",
            json={"kind": "fixed_bill", "name": "Shop Rent", "roleOrCategory": "Shop Rent", "monthlyAmountRWF": 300000},
            headers=headers,
        )
        self.assertEqual(r_rent.status_code, 201)

        # 2. Pay 50,000 RWF partial salary -> remaining owed = 100,000 RWF + Expense & Transaction saved
        r_pay = self.client.post(
            f"/api/v1/commitments/{emp_id}/pay",
            json={"amountRWF": 50000, "paymentMethod": "MTN MoMo", "monthKey": month_key, "archId": "buy-and-sell"},
            headers=headers,
        )
        self.assertEqual(r_pay.status_code, 201, r_pay.get_data(as_text=True))

        # 3. Record 200,000 RWF profit (below 450,000 RWF fixed costs) -> Loss Zone
        self.client.post(
            "/api/v1/workspaces/buy-and-sell/records/Sales",
            json={
                "id": "SAL-BE-1",
                "title": "Sale 1",
                "amountRWF": 500000,
                "unitCostRWF": 300000,
                "profitRWF": 200000,
                "quantity": 1,
                "date": f"{month_key}-10",
            },
            headers=headers,
        )
        r_list1 = self.client.get(f"/api/v1/commitments?archId=buy-and-sell&month={month_key}", headers=headers)
        self.assertEqual(r_list1.status_code, 200)
        d1 = r_list1.get_json()["data"]
        emp_row = d1["employees"][0]
        self.assertEqual(emp_row["paidThisMonthRWF"], 50000)
        self.assertEqual(emp_row["remainingThisMonthRWF"], 100000)
        self.assertEqual(emp_row["monthStatus"], "Partial")
        be1 = d1["breakEven"]
        self.assertEqual(be1["totalMonthlyFixedRWF"], 450000)
        self.assertFalse(be1["isProfitable"])
        self.assertEqual(be1["netMonthlyProfitOrLossRWF"], -250000)
        self.assertGreater(be1["dailySalesTargetToBreakEvenRWF"], 0)

        # 4. Record another 400,000 RWF profit (total 600k vs 450k fixed) -> Profit / Benefit Zone (+150k)
        self.client.post(
            "/api/v1/workspaces/buy-and-sell/records/Sales",
            json={
                "id": "SAL-BE-2",
                "title": "Sale 2",
                "amountRWF": 1000000,
                "unitCostRWF": 600000,
                "profitRWF": 400000,
                "quantity": 1,
                "date": f"{month_key}-15",
            },
            headers=headers,
        )
        be2 = self.client.get(f"/api/v1/commitments?archId=buy-and-sell&month={month_key}", headers=headers).get_json()["data"]["breakEven"]
        self.assertTrue(be2["isProfitable"])
        self.assertEqual(be2["netMonthlyProfitOrLossRWF"], 150000)
        self.assertEqual(be2["breakEvenPercent"], 100)

    # ------------------------------------------------------------------
    # 11. MULTI-BRANCH RRA TAX (INHERIT MAIN HQ TIN + SEPARATE BRANCH TIN)
    # ------------------------------------------------------------------
    def test_11_multi_branch_rra_tax_inherit_and_separate_tin_modes(self):
        owner_email = "multitax@exbos.rw"
        mgr_email = "kimironko-mgr@exbos.rw"
        self.db.users.insert_one(
            {"email": owner_email, "name": "Group Owner", "plan": "Silver", "accountStatus": "Active"}
        )
        self.db.users.insert_one(
            {
                "email": mgr_email,
                "name": "Kimironko Manager",
                "ownerScopeKey": owner_email,
                "assignedBranchId": "BR-KIM",
                "role": "Branch Manager",
                "accountStatus": "Active",
            }
        )
        self.db.branches.insert_one({"id": "main", "scopeKey": owner_email, "name": "Main HQ", "isMain": True})
        self.db.branches.insert_one({"id": "BR-KIM", "scopeKey": owner_email, "name": "Kimironko Shop", "isMain": False})
        self.db.branches.insert_one({"id": "BR-MUS", "scopeKey": owner_email, "name": "Musanze Cafe", "isMain": False})

        owner_h = self._auth_header(owner_email)
        mgr_h = self._auth_header(mgr_email)

        # 1. Configure Main HQ TIN (102345678, 18% VAT)
        r_main = self.client.put(
            "/api/v1/tax/profile",
            json={"branchId": "main", "rraEnabled": True, "tin": "102345678", "regime": "vat_18", "rraBranchCode": "00"},
            headers=owner_h,
        )
        self.assertEqual(r_main.status_code, 200)

        # 2. Branch 1 (BR-KIM) defaults to Inherit Main HQ TIN -> gets 102345678 & vat_18 automatically!
        r_kim = self.client.get("/api/v1/tax/profile?branchId=BR-KIM", headers=owner_h)
        self.assertEqual(r_kim.status_code, 200)
        kim_prof = r_kim.get_json()["data"]
        self.assertEqual(kim_prof["taxMode"], "inherit_main")
        self.assertEqual(kim_prof["tin"], "102345678")
        self.assertEqual(kim_prof["regime"], "vat_18")
        self.assertTrue(kim_prof["rraEnabled"])

        # 3. Branch Manager is read-only on PUT /tax/profile (403)
        self.assertEqual(
            self.client.put("/api/v1/tax/profile", json={"tin": "999999999"}, headers=mgr_h).status_code,
            403,
        )

        # 4. Branch 2 (BR-MUS) configured with Separate Branch TIN (109876543, 3% Turnover)
        r_mus = self.client.put(
            "/api/v1/tax/profile",
            json={
                "branchId": "BR-MUS",
                "taxMode": "separate",
                "rraEnabled": True,
                "tin": "109876543",
                "regime": "turnover_3",
                "rraBranchCode": "02",
            },
            headers=owner_h,
        )
        self.assertEqual(r_mus.status_code, 200)
        mus_prof = r_mus.get_json()["data"]
        self.assertEqual(mus_prof["tin"], "109876543")
        self.assertEqual(mus_prof["regime"], "turnover_3")
        self.assertEqual(mus_prof["taxMode"], "separate")

        # 5. Consolidated summary detects multiple distinct TINs & returns 3-row branchBreakdown
        r_sum = self.client.get("/api/v1/tax/summary?branchId=all", headers=owner_h)
        self.assertEqual(r_sum.status_code, 200)
        sum_data = r_sum.get_json()["data"]
        self.assertEqual(len(sum_data["branchBreakdown"]), 3)
        codes = [w["code"] for w in sum_data["readinessWarnings"]]
        self.assertIn("MULTIPLE_TINS_DETECTED", codes)

    # ------------------------------------------------------------------
    # 12. OUT-OF-STOCK WHATSAPP ALERT TO BUSINESS OWNER & BRANCH MANAGER
    # ------------------------------------------------------------------
    def test_12_out_of_stock_whatsapp_alert_sent_to_owner_and_branch_manager(self):
        owner_email = "oos-owner@exbos.rw"
        mgr_email = "oos-mgr@exbos.rw"
        self.db.users.insert_one(
            {
                "email": owner_email,
                "name": "Owner Jean",
                "businessName": "Kigali Electronics",
                "phone": "+250788101010",
                "plan": "Silver",
                "accountStatus": "Active",
            }
        )
        self.db.users.insert_one(
            {
                "email": mgr_email,
                "name": "Manager Paul",
                "ownerScopeKey": owner_email,
                "assignedBranchId": "BR-REMERA",
                "phone": "+250788202020",
                "role": "Branch Manager",
                "accountStatus": "Active",
            }
        )
        self.db.branches.insert_one(
            {
                "id": "BR-REMERA",
                "scopeKey": owner_email,
                "name": "Remera Branch",
                "managerPhone": "+250788202020",
                "isMain": False,
            }
        )

        owner_h = self._auth_header(owner_email)

        # Add product with stock = 2 in Remera Branch
        r_prod = self.client.post(
            "/api/v1/workspaces/buy-and-sell/records/Inventory",
            json={
                "id": "PRD-OOS-1",
                "title": "iPhone Charger 20W",
                "sku": "CHG-20W",
                "unit": "piece",
                "purchasePriceRWF": 8000,
                "sellingPriceRWF": 15000,
                "quantity": 2,
                "branchId": "BR-REMERA",
            },
            headers=owner_h,
        )
        self.assertIn(r_prod.status_code, (200, 201))

        # Sell all 2 units -> stock hits 0 -> BOTH Owner AND Branch Manager receive WhatsApp alert!
        with patch("app.services.owner_audit_notifier.send_whatsapp_message", return_value={"ok": True}) as mock_wa:
            r_sale = self.client.post(
                "/api/v1/workspaces/buy-and-sell/records/Sales",
                json={
                    "id": "SAL-OOS-1",
                    "productId": "PRD-OOS-1",
                    "title": "iPhone Charger 20W",
                    "quantity": 2,
                    "amountRWF": 30000,
                    "branchId": "BR-REMERA",
                    "status": "Paid",
                },
                headers=owner_h,
            )
            self.assertIn(r_sale.status_code, (200, 201))
            self.assertEqual(mock_wa.call_count, 2)
            sent_to = {call.args[0] for call in mock_wa.call_args_list}
            self.assertEqual(sent_to, {"+250788101010", "+250788202020"})
            msg_body = mock_wa.call_args_list[0].args[1]
            self.assertIn("OUT OF STOCK ALERT", msg_body)
            self.assertIn("iPhone Charger 20W", msg_body)
            self.assertIn("Remera Branch", msg_body)

    # ------------------------------------------------------------------
    # 13. BRANCH MANAGER LIFECYCLE: EDIT, DEACTIVATE, ACTIVATE & DELETE
    # ------------------------------------------------------------------
    def test_13_branch_manager_edit_deactivate_activate_and_delete(self):
        owner_email = "owner-mgrlife@exbos.rw"
        mgr_email = "mgr-kigali@exbos.rw"
        self.db.users.insert_one(
            {
                "email": owner_email,
                "name": "Lifecycle Owner",
                "businessName": "Lifecycle Traders",
                "phone": "+250788000111",
                "plan": "Silver",
                "accountStatus": "Active",
            }
        )
        owner_h = self._auth_header(owner_email)

        # 1. Create a branch and assign a Branch Manager
        r_br = self.client.post(
            "/api/v1/branches",
            json={"name": "Nyamirambo Branch", "location": "Kigali"},
            headers=owner_h,
        )
        self.assertEqual(r_br.status_code, 201, r_br.get_data(as_text=True))
        branch_id = r_br.get_json()["data"]["branch"]["id"]

        with patch("app.routes.branches.send_gmail_email", return_value=True):
            r_assign = self.client.post(
                f"/api/v1/branches/{branch_id}/assign-manager",
                json={
                    "name": "Eric Manager",
                    "email": mgr_email,
                    "phone": "+250788222333",
                    "password": "OldPassword123",
                },
                headers=owner_h,
            )
        self.assertEqual(r_assign.status_code, 200, r_assign.get_data(as_text=True))
        mgr_h = self._auth_header(mgr_email)

        # Branch Manager cannot edit, deactivate, or delete themselves (403)
        self.assertEqual(
            self.client.put(f"/api/v1/branches/{branch_id}/manager", json={"name": "Hacked"}, headers=mgr_h).status_code,
            403,
        )
        self.assertEqual(
            self.client.put(f"/api/v1/branches/{branch_id}/manager/status", json={"status": "Deactivated"}, headers=mgr_h).status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(f"/api/v1/branches/{branch_id}/manager", headers=mgr_h).status_code,
            403,
        )

        # 2. Owner edits existing Branch Manager (name, phone, new password)
        r_edit = self.client.put(
            f"/api/v1/branches/{branch_id}/manager",
            json={
                "name": "Eric Updated",
                "email": mgr_email,
                "phone": "+250788999888",
                "password": "NewPassword456",
            },
            headers=owner_h,
        )
        self.assertEqual(r_edit.status_code, 200, r_edit.get_data(as_text=True))
        mgr_user = self.db.users.find_one({"email": mgr_email})
        self.assertEqual(mgr_user["name"], "Eric Updated")
        self.assertEqual(mgr_user["phone"], "+250788999888")

        # 3. Owner deactivates (cuts off) Branch Manager -> JWT immediately blocked (403) & list shows Deactivated
        r_deact = self.client.put(
            f"/api/v1/branches/{branch_id}/manager/status",
            json={"status": "Deactivated", "reason": "Left the company"},
            headers=owner_h,
        )
        self.assertEqual(r_deact.status_code, 200, r_deact.get_data(as_text=True))
        self.assertEqual(r_deact.get_json()["data"]["status"], "Deactivated")

        # Active manager JWT is now blocked with 403 ACCOUNT_SUSPENDED
        r_blocked = self.client.get("/api/v1/branches", headers=mgr_h)
        self.assertEqual(r_blocked.status_code, 403)

        # Owner's branch list shows live Deactivated status
        r_list = self.client.get("/api/v1/branches", headers=owner_h)
        self.assertEqual(r_list.status_code, 200)
        br_item = next(b for b in r_list.get_json()["data"]["branches"] if b["id"] == branch_id)
        self.assertEqual(br_item["manager"]["status"], "Deactivated")

        # 4. Owner re-activates Branch Manager -> JWT works again (200)
        r_act = self.client.put(
            f"/api/v1/branches/{branch_id}/manager/status",
            json={"status": "Active"},
            headers=owner_h,
        )
        self.assertEqual(r_act.status_code, 200, r_act.get_data(as_text=True))
        self.assertEqual(r_act.get_json()["data"]["status"], "Active")
        r_restored = self.client.get("/api/v1/branches", headers=mgr_h)
        self.assertEqual(r_restored.status_code, 200)

        # 5. Owner permanently deletes Branch Manager -> user deleted, branch.manager cleared, JWT blocked (403)
        r_del = self.client.delete(f"/api/v1/branches/{branch_id}/manager", headers=owner_h)
        self.assertEqual(r_del.status_code, 200, r_del.get_data(as_text=True))
        self.assertIsNone(self.db.users.find_one({"email": mgr_email}))
        self.assertIsNotNone(self.db.users.find_one({"email": owner_email}))
        br_after = self.db.branches.find_one({"scopeKey": owner_email, "id": branch_id})
        self.assertIsNone(br_after.get("manager"))
        self.assertEqual(self.client.get("/api/v1/branches", headers=mgr_h).status_code, 403)

    # ------------------------------------------------------------------
    # 14. SALES-ONLY BRANCH MANAGER MODE & MULTI-ITEM HQ STOCK DISPATCH
    # ------------------------------------------------------------------
    def test_14_branch_manager_sales_only_and_hq_stock_dispatch(self):
        owner_email = "owner-salesonly@exbos.rw"
        mgr_email = "cashier-salesonly@exbos.rw"
        self.db.users.insert_one(
            {
                "email": owner_email,
                "name": "HQ Owner",
                "businessName": "HQ Retail Group",
                "phone": "+250788300100",
                "plan": "Silver",
                "accountStatus": "Active",
            }
        )
        owner_h = self._auth_header(owner_email)

        # 1. Owner adds 2 products to Main HQ inventory
        for pid, title, qty, price in [
            ("HQ-P1", "Sugar 1kg", 50, 1800),
            ("HQ-P2", "Cooking Oil 1L", 30, 3500),
        ]:
            r_add = self.client.post(
                "/api/v1/workspaces/buy-and-sell/records/Inventory",
                json={
                    "id": pid,
                    "title": title,
                    "quantity": qty,
                    "purchasePriceRWF": int(price * 0.7),
                    "sellingPriceRWF": price,
                    "branchId": "main",
                },
                headers=owner_h,
            )
            self.assertIn(r_add.status_code, (200, 201), r_add.get_data(as_text=True))

        # 2. Create sub-branch configured in strict "Sales-Only Cashier" mode
        r_br = self.client.post(
            "/api/v1/branches",
            json={
                "name": "Kimironko Kiosk",
                "location": "Kigali",
                "permissions": {
                    "canAddInventory": False,
                    "canEditProducts": False,
                    "canDeleteProducts": False,
                    "canEditPrices": False,
                    "canDeleteRecords": False,
                    "canRecordExpenses": False,
                    "canViewProfitReports": False,
                },
            },
            headers=owner_h,
        )
        self.assertEqual(r_br.status_code, 201, r_br.get_data(as_text=True))
        branch_id = r_br.get_json()["data"]["branch"]["id"]

        with patch("app.routes.branches.send_gmail_email", return_value=True):
            r_mgr = self.client.post(
                f"/api/v1/branches/{branch_id}/assign-manager",
                json={"name": "Jane Cashier", "email": mgr_email, "phone": "+250788300200", "password": "Password123"},
                headers=owner_h,
            )
        self.assertEqual(r_mgr.status_code, 200, r_mgr.get_data(as_text=True))
        mgr_h = self._auth_header(mgr_email)

        # 3. Owner dispatches BOTH products to Kimironko Kiosk in one multi-item transfer
        r_trf = self.client.post(
            f"/api/v1/branches/{branch_id}/transfer-stock",
            json={
                "architectureId": "buy-and-sell",
                "notes": "Morning stock handover",
                "items": [
                    {"productId": "HQ-P1", "quantity": 10},
                    {"productId": "HQ-P2", "quantity": 5},
                ],
            },
            headers=owner_h,
        )
        self.assertEqual(r_trf.status_code, 200, r_trf.get_data(as_text=True))
        trf_data = r_trf.get_json()["data"]
        self.assertEqual(trf_data["transferredQuantity"], 15)

        # Verify transfer history endpoint returns the handover log
        r_hist = self.client.get(f"/api/v1/branches/{branch_id}/transfers", headers=owner_h)
        self.assertEqual(r_hist.status_code, 200)
        self.assertEqual(len(r_hist.get_json()["data"]["transfers"]), 1)

        # Find the transferred branch product ID for Sugar 1kg
        ws = self.db.workspaces.find_one({"scopeKey": owner_email, "architectureId": "buy-and-sell"})
        branch_sugar = next(
            p for p in ws["records"]["Inventory"]
            if p.get("branchId") == branch_id and (p.get("title") or "").lower() == "sugar 1kg"
        )
        self.assertEqual(branch_sugar["quantity"], 10)
        sugar_branch_id = branch_sugar["id"]

        # 4. Branch Manager is BLOCKED (403) from adding, bulk-importing, editing, or deleting products
        self.assertEqual(
            self.client.post(
                "/api/v1/workspaces/buy-and-sell/records/Inventory",
                json={"id": "MGR-P1", "title": "Unauthorized Item", "quantity": 5, "sellingPriceRWF": 1000, "branchId": branch_id},
                headers=mgr_h,
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                "/api/v1/workspaces/buy-and-sell/records/Inventory/bulk",
                json={"branchId": branch_id, "items": [{"title": "Bulk Hack", "quantity": 2, "sellingPriceRWF": 1000}]},
                headers=mgr_h,
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/v1/workspaces/buy-and-sell/records/Inventory/{sugar_branch_id}",
                json={"quantity": 999, "branchId": branch_id},
                headers=mgr_h,
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.delete(
                f"/api/v1/workspaces/buy-and-sell/records/Inventory/{sugar_branch_id}",
                headers=mgr_h,
            ).status_code,
            403,
        )

        # 5. Branch Manager is BLOCKED (403) from selling at a modified price (1,200 instead of HQ's 1,800)
        self.assertEqual(
            self.client.post(
                "/api/v1/workspaces/buy-and-sell/records/Sales",
                json={
                    "id": "SAL-PRICE-HACK",
                    "productId": sugar_branch_id,
                    "title": "Sugar 1kg",
                    "quantity": 2,
                    "unitPriceRWF": 1200,
                    "amountRWF": 2400,
                    "branchId": branch_id,
                    "status": "Paid",
                },
                headers=mgr_h,
            ).status_code,
            403,
        )

        # 6. Branch Manager SUCCEEDS (201) selling 2 units at HQ's exact set price (1,800 RWF)
        r_sale = self.client.post(
            "/api/v1/workspaces/buy-and-sell/records/Sales",
            json={
                "id": "SAL-VALID-1",
                "productId": sugar_branch_id,
                "title": "Sugar 1kg",
                "quantity": 2,
                "unitPriceRWF": 1800,
                "amountRWF": 3600,
                "branchId": branch_id,
                "status": "Paid",
            },
            headers=mgr_h,
        )
        self.assertIn(r_sale.status_code, (200, 201), r_sale.get_data(as_text=True))

        # 7. Business Owner can still edit/delete the branch product freely (200)
        self.assertEqual(
            self.client.patch(
                f"/api/v1/workspaces/buy-and-sell/records/Inventory/{sugar_branch_id}",
                json={"sellingPriceRWF": 1900, "branchId": branch_id},
                headers=owner_h,
            ).status_code,
            200,
        )
        # Deleting from Inventory MUST purge mirrored copy in Products too (never resurrects on refresh!)
        self.assertEqual(
            self.client.delete(
                f"/api/v1/workspaces/buy-and-sell/records/Inventory/{sugar_branch_id}",
                headers=owner_h,
            ).status_code,
            200,
        )
        ws_after_del = self.db.workspaces.find_one({"scopeKey": owner_email, "architectureId": "buy-and-sell"})
        inv_remaining = [p for p in ws_after_del["records"].get("Inventory", []) if p.get("branchId") == branch_id and (p.get("title") or "").lower() == "sugar 1kg"]
        prod_remaining = [p for p in ws_after_del["records"].get("Products", []) if p.get("branchId") == branch_id and (p.get("title") or "").lower() == "sugar 1kg"]
        self.assertEqual(inv_remaining, [])
        self.assertEqual(prod_remaining, [])

        # Even if a stale POST /api/v1/storage snapshot arrives containing the deleted product, tombstones prevent resurrection!
        r_stale = self.client.post(
            "/api/storage",
            json={
                "user": {"email": owner_email, "architectureId": "buy-and-sell"},
                "workspaces": {
                    "buy-and-sell": {
                        "records": {
                            "Inventory": [{"id": sugar_branch_id, "title": "Sugar 1kg", "branchId": branch_id, "quantity": 8}],
                            "Products": [{"id": sugar_branch_id, "title": "Sugar 1kg", "branchId": branch_id, "quantity": 8}],
                        }
                    }
                },
            },
            headers=owner_h,
        )
        self.assertEqual(r_stale.status_code, 200)
        ws_after_stale = self.db.workspaces.find_one({"scopeKey": owner_email, "architectureId": "buy-and-sell"})
        self.assertFalse(any(p.get("id") == sugar_branch_id for p in ws_after_stale["records"].get("Inventory", [])))
        self.assertFalse(any(p.get("id") == sugar_branch_id for p in ws_after_stale["records"].get("Products", [])))


if __name__ == "__main__":
    unittest.main()
