"""End-to-end tests for Branch Manager self-setup invite link & owner notification flow."""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.database import get_db


class BranchManagerInviteTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()
        cls.owner_email = "test_owner_branch_invite@exbos.test"
        cls.manager_email = "test_mgr_branch_invite@exbos.test"
        cls.branch_id = "br-test-invite-001"

    def setUp(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": {"$in": [self.owner_email, self.manager_email]}})
            db.branches.delete_many({"scopeKey": self.owner_email})
            db.branch_invites.delete_many({"scopeKey": self.owner_email})
            db.owner_notifications.delete_many({"scopeKey": self.owner_email})

            db.users.insert_one({
                "name": "Test Owner",
                "email": self.owner_email,
                "businessName": "Test Kigali Store",
                "architectureId": "buy-and-sell",
                "role": "Owner",
                "plan": "Gold",
                "accountStatus": "Active",
                "emailVerified": True,
            })
            db.branches.insert_one({
                "id": self.branch_id,
                "scopeKey": self.owner_email,
                "name": "Nyamirambo Branch",
                "location": "Kigali, Nyamirambo",
                "architectureId": "buy-and-sell",
                "isMain": False,
                "status": "Active",
            })

    def tearDown(self):
        with self.app.app_context():
            db = get_db()
            db.users.delete_many({"email": {"$in": [self.owner_email, self.manager_email]}})
            db.branches.delete_many({"scopeKey": self.owner_email})
            db.branch_invites.delete_many({"scopeKey": self.owner_email})
            db.owner_notifications.delete_many({"scopeKey": self.owner_email})

    @patch("app.routes.branches.send_gmail_email", return_value=True)
    def test_full_invite_setup_and_owner_notification_lifecycle(self, mock_send_email):
        from flask_jwt_extended import create_access_token

        with self.app.app_context():
            owner_token = create_access_token(identity=self.owner_email)

        owner_headers = {"Authorization": f"Bearer {owner_token}"}

        # 1. Owner generates a single-use invite link without needing to invent a password
        res_create = self.client.post(
            f"/api/v1/branches/{self.branch_id}/manager-invite",
            json={"name": "Alice Manager", "frontendOrigin": "https://exbos.pages.dev"},
            headers=owner_headers,
        )
        self.assertEqual(res_create.status_code, 201, res_create.get_data(as_text=True))
        create_data = res_create.get_json()["data"]
        token = create_data["token"]
        self.assertTrue(create_data["inviteLink"].endswith(f"/branch-invite/{token}"))

        # 2. Manager opens the public link (no auth header) -> receives branch details
        res_get = self.client.get(f"/api/v1/branches/invite/{token}")
        self.assertEqual(res_get.status_code, 200)
        info = res_get.get_json()["data"]
        self.assertEqual(info["branchName"], "Nyamirambo Branch")
        self.assertEqual(info["businessName"], "Test Kigali Store")

        # 3. Manager submits their own email & chosen password
        res_complete = self.client.post(
            f"/api/v1/branches/invite/{token}/complete",
            json={
                "fullName": "Alice Uwimana",
                "email": self.manager_email,
                "phone": "+250788000111",
                "password": "MySecretPassword123",
                "confirmPassword": "MySecretPassword123",
                "frontendOrigin": "https://exbos.pages.dev",
            },
        )
        self.assertEqual(res_complete.status_code, 201, res_complete.get_data(as_text=True))
        comp_data = res_complete.get_json()["data"]
        self.assertTrue(comp_data["access_token"])
        self.assertEqual(comp_data["user"]["email"], self.manager_email)
        self.assertEqual(comp_data["user"]["assignedBranchId"], self.branch_id)
        self.assertEqual(comp_data["user"]["role"], "Branch Manager")
        self.assertTrue(comp_data["ownerNotified"])

        # 4. Reusing the same invite link must be rejected (410 Gone)
        res_reuse = self.client.get(f"/api/v1/branches/invite/{token}")
        self.assertEqual(res_reuse.status_code, 410)

        # 5. Business Owner receives in-app notification & branded email confirmation
        self.assertTrue(mock_send_email.called)
        res_notifs = self.client.get("/api/v1/branches/notifications", headers=owner_headers)
        self.assertEqual(res_notifs.status_code, 200)
        notifs = res_notifs.get_json()["data"]["notifications"]
        self.assertEqual(len(notifs), 1)
        self.assertEqual(notifs[0]["type"], "branch_manager_activated")
        self.assertIn(self.manager_email, notifs[0]["message"])

        # 6. Owner marks notification as read -> disappears from unread list
        notif_id = notifs[0]["id"]
        res_read = self.client.patch(
            f"/api/v1/branches/notifications/{notif_id}/read",
            headers=owner_headers,
        )
        self.assertEqual(res_read.status_code, 200)
        res_notifs_after = self.client.get("/api/v1/branches/notifications", headers=owner_headers)
        self.assertEqual(len(res_notifs_after.get_json()["data"]["notifications"]), 0)

        # 7. Manager's JWT only sees their assigned branch (Main HQ blocked)
        mgr_headers = {"Authorization": f"Bearer {comp_data['access_token']}"}
        res_mgr_branches = self.client.get("/api/v1/branches", headers=mgr_headers)
        self.assertEqual(res_mgr_branches.status_code, 200)
        mgr_branches = res_mgr_branches.get_json()["data"]["branches"]
        self.assertEqual(len(mgr_branches), 1)
        self.assertEqual(mgr_branches[0]["id"], self.branch_id)


if __name__ == "__main__":
    unittest.main()

