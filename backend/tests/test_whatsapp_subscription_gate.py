"""Unit tests for WhatsApp registration welcome message and live subscription gating."""

import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.services.whatsapp_engine import handle_incoming_whatsapp_message


class _FakeCollection:
    def __init__(self, docs=None):
        self.docs = list(docs or [])

    def find(self, query=None, projection=None):
        q = query or {}
        out = []
        for d in self.docs:
            if all(d.get(k) == v for k, v in q.items()):
                out.append(dict(d))
        return out

    def find_one(self, query=None, projection=None):
        matches = self.find(query, projection)
        return matches[0] if matches else None

    def update_one(self, query, update, upsert=False):
        for d in self.docs:
            if all(d.get(k) == v for k, v in (query or {}).items()):
                if "$set" in update:
                    d.update(update["$set"])
                return
        if upsert:
            new_doc = dict(query or {})
            if "$set" in update:
                new_doc.update(update["$set"])
            self.docs.append(new_doc)

    def delete_one(self, query):
        for idx, d in enumerate(self.docs):
            if all(d.get(k) == v for k, v in (query or {}).items()):
                self.docs.pop(idx)
                return

    def delete_many(self, query):
        self.docs = [
            d for d in self.docs if not all(d.get(k) == v for k, v in (query or {}).items())
        ]

    def insert_one(self, doc):
        self.docs.append(dict(doc))


class _FakeDB:
    def __init__(self, users=None, branches=None, workspaces=None, platform_config=None):
        self.users = _FakeCollection(users)
        self.branches = _FakeCollection(branches)
        self.workspaces = _FakeCollection(workspaces)
        self.platform_config = _FakeCollection(platform_config)
        self.whatsapp_sessions = _FakeCollection([])
        self.integrations = _FakeCollection([])
        self.businesses = _FakeCollection([])
        self.transactions = _FakeCollection([])


class WhatsAppSubscriptionGateTestCase(unittest.TestCase):
    def test_free_plan_owner_blocked_with_upgrade_notice(self):
        free_user = {
            "name": "Alice Free",
            "email": "alice@free.test",
            "phone": "+250788111001",
            "businessName": "Alice Mini Shop",
            "architectureId": "buy-and-sell",
            "role": "BUSINESS_OWNER",
            "plan": "Free",
            "planTier": "Free",
            "subscriptionStatus": "Active",
        }
        db = _FakeDB(users=[free_user])

        res = handle_incoming_whatsapp_message(db, "+250788111001", "Hi")
        self.assertEqual(res["action"], "subscription_required")
        self.assertEqual(res["effectivePlan"], "free")
        self.assertIn("SUBSCRIPTION REQUIRED", res["reply"])
        self.assertIn("Bronze", res["reply"])

        # Language switch to Kinyarwanda works even while gated
        res_rw = handle_incoming_whatsapp_message(db, "+250788111001", "RW")
        self.assertEqual(res_rw["action"], "subscription_required")
        self.assertEqual(res_rw["language"], "rw")
        self.assertIn("BISABA KUZAMURA GAHUNDA", res_rw["reply"])

    def test_expired_paid_plan_owner_blocked_automatically(self):
        expired_iso = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        expired_user = {
            "name": "Bob Expired",
            "email": "bob@expired.test",
            "phone": "+250788111002",
            "businessName": "Bob Hardware",
            "architectureId": "buy-and-sell",
            "role": "BUSINESS_OWNER",
            "plan": "Gold",
            "planTier": "Gold",
            "subscriptionStatus": "Active",
            "subscriptionExpiry": expired_iso,
        }
        db = _FakeDB(users=[expired_user])

        res = handle_incoming_whatsapp_message(db, "+250788111002", "1")
        self.assertEqual(res["action"], "subscription_required")
        self.assertIn("Expired", res["reply"])

    def test_active_bronze_owner_allowed_full_menu(self):
        future_iso = (datetime.now(timezone.utc) + timedelta(days=25)).isoformat()
        bronze_user = {
            "name": "Claire Bronze",
            "email": "claire@bronze.test",
            "phone": "+250788111003",
            "businessName": "Claire Boutique",
            "architectureId": "buy-and-sell",
            "role": "BUSINESS_OWNER",
            "plan": "Bronze",
            "planTier": "Bronze",
            "subscriptionStatus": "Active",
            "subscriptionExpiry": future_iso,
        }
        db = _FakeDB(users=[bronze_user])

        res = handle_incoming_whatsapp_message(db, "+250788111003", "Hi")
        self.assertEqual(res["action"], "menu")
        self.assertIn("Official Business Console", res["reply"])

    def test_branch_manager_inherits_owner_subscription(self):
        free_owner = {
            "name": "Owner Free",
            "email": "owner@freebranch.test",
            "phone": "+250788111004",
            "businessName": "Free HQ",
            "architectureId": "buy-and-sell",
            "role": "BUSINESS_OWNER",
            "plan": "Free",
            "planTier": "Free",
        }
        mgr = {
            "name": "Manager One",
            "email": "mgr@freebranch.test",
            "ownerScopeKey": "owner@freebranch.test",
            "phone": "+250788111005",
            "businessName": "Free HQ",
            "architectureId": "buy-and-sell",
            "role": "Branch Manager",
            "assignedBranchId": "BR-1",
            "plan": "Free",
        }
        db = _FakeDB(
            users=[free_owner, mgr],
            branches=[{"scopeKey": "owner@freebranch.test", "id": "BR-1", "name": "Remera Branch", "status": "Active"}],
        )

        # Blocked under Free owner
        r_blocked = handle_incoming_whatsapp_message(db, "+250788111005", "Hi")
        self.assertEqual(r_blocked["action"], "subscription_required")
        self.assertIn("Business Owner", r_blocked["reply"])

        # Upgrade owner to Silver -> Branch Manager immediately unlocked!
        db.users.update_one(
            {"email": "owner@freebranch.test"},
            {"$set": {"plan": "Silver", "planTier": "Silver", "subscriptionStatus": "Active"}},
        )
        r_ok = handle_incoming_whatsapp_message(db, "+250788111005", "Hi")
        self.assertEqual(r_ok["action"], "menu")

    def test_super_admin_bypasses_subscription_gate(self):
        sa_user = {
            "name": "Super Admin",
            "email": "mugishaleobeni0@gmail.com",
            "phone": "+250781963981",
            "businessName": "ExBOS HQ",
            "architectureId": "buy-and-sell",
            "role": "BUSINESS_OWNER",
            "isSuperAdmin": True,
            "plan": "Free",
            "planTier": "Free",
        }
        db = _FakeDB(users=[sa_user])

        res = handle_incoming_whatsapp_message(db, "+250781963981", "Hi")
        self.assertEqual(res["action"], "menu")
        self.assertIn("Super Admin Command Center", res["reply"])


if __name__ == "__main__":
    unittest.main()
