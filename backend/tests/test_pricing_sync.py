"""Regression test verifying Super Admin pricing saves sync to BOTH pricing-plans and plan-limits (Landing Page & WhatsApp)."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from flask_jwt_extended import create_access_token

from app import create_app
from app.database import get_db
from app.utils.entitlements import invalidate_plan_limits_cache


class PricingSyncRegressionTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.sa_email = "test_pricing_sync_sa@exbos.test"

    def setUp(self):
        with self.app.app_context():
            db = get_db()
            self._orig_pricing = db.platform_config.find_one({"key": "pricing_plans"})
            self._orig_limits = db.platform_config.find_one({"key": "plan_limits"})
            db.users.delete_many({"email": self.sa_email})
            db.users.insert_one({
                "id": "USR-PRC-SA",
                "name": "Pricing SA",
                "email": self.sa_email,
                "role": "SUPER_ADMIN",
                "isSuperAdmin": True,
                "accountStatus": "Active",
            })

    def tearDown(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": self.sa_email})
            db.super_admin_audit_logs.delete_many({"actorEmail": self.sa_email})
            if self._orig_pricing is not None:
                db.platform_config.replace_one({"key": "pricing_plans"}, self._orig_pricing, upsert=True)
            else:
                db.platform_config.delete_many({"key": "pricing_plans"})
            if self._orig_limits is not None:
                db.platform_config.replace_one({"key": "plan_limits"}, self._orig_limits, upsert=True)
            else:
                db.platform_config.delete_many({"key": "plan_limits"})
            invalidate_plan_limits_cache()

    def test_super_admin_save_pricing_tier_syncs_landing_page_plan_limits_immediately(self):
        with self.app.app_context():
            sa_token = create_access_token(identity=self.sa_email)

            # Update Bronze tier to 5,000 RWF
            res = self.client.put(
                "/api/v1/super-admin/pricing-plans/bronze",
                headers={"Authorization": f"Bearer {sa_token}"},
                json={
                    "name": "Bronze",
                    "tier": "Bronze",
                    "monthlyPriceRWF": 5000,
                    "priceRWF": 5000,
                    "description": "Updated Bronze tier for active shops.",
                },
            )
            self.assertEqual(res.status_code, 200)

            # 1. Public GET /pricing-plans returns 5,000 RWF
            r_plans = self.client.get("/api/v1/super-admin/pricing-plans")
            self.assertEqual(r_plans.status_code, 200)
            plans = r_plans.get_json()["data"]
            bronze = next(p for p in plans if str(p.get("tier") or p.get("id")).lower() == "bronze")
            self.assertEqual(float(bronze["priceRWF"]), 5000.0)

            # 2. Public GET /plan-limits (used by Landing Page PricingSection.jsx) ALSO returns 5,000 RWF!
            r_limits = self.client.get("/api/v1/super-admin/plan-limits")
            self.assertEqual(r_limits.status_code, 200)
            limits = r_limits.get_json()["data"]
            self.assertEqual(float(limits["bronze"]["priceRWF"]), 5000.0)


if __name__ == "__main__":
    unittest.main()

