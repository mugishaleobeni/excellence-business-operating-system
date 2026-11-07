#!/usr/bin/env python3
"""
Automated End-to-End Integration Verification Suite for ExBOS Backend & Frontend.
Tests Flask Blueprints, Pydantic v2 validation, OTP Email Verification, Strict Auth,
JWT security, and per-user MongoDB workspace persistence.
"""

import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app


def run_automated_checks() -> int:
    print("=" * 74)
    print(" ExBOS PRODUCTION AUTH + END-TO-END INTEGRATION VERIFICATION SUITE ")
    print("=" * 74)

    app = create_app()
    client = app.test_client()
    failures = 0

    def check(label: str, condition: bool, detail: str = "") -> None:
        nonlocal failures
        status = "PASS" if condition else "FAIL"
        symbol = "[✓]" if condition else "[✗]"
        print(f"{symbol} {status:4s} | {label}")
        if detail:
            print(f"           └─ {detail}")
        if not condition:
            failures += 1

    # 1. Health Endpoint
    res = client.get("/api/v1/health")
    body = res.get_json() or {}
    check(
        "GET /api/v1/health",
        res.status_code in (200, 503) and ("status" in body.get("data", {}) or "error" in body),
        f"HTTP {res.status_code} -> {json.dumps(body)[:140]}",
    )

    # 2. Strict Login Rejects Unregistered User (401 Unauthorized)
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@business.rw", "password": "WrongPassword123!"},
    )
    unauth_body = res.get_json() or {}
    check(
        "POST /api/v1/auth/login (Rejects Unregistered User -> 401)",
        res.status_code == 401 and unauth_body.get("success") is False,
        f"HTTP {res.status_code} -> {unauth_body.get('error')}",
    )

    # 3. Step 1 Registration: Send 6-Digit Email Verification Code
    test_email = "founder@kigalitech.rw"
    res = client.post(
        "/api/v1/auth/send-verification",
        json={"email": test_email, "fullName": "Leobeni Mugisha"},
    )
    otp_body = res.get_json() or {}
    otp_code = (otp_body.get("data") or {}).get("verificationCode", "")
    check(
        "POST /api/v1/auth/send-verification (Step 1 -> Step 2 OTP Issued)",
        res.status_code == 200 and len(otp_code) == 6,
        f"HTTP {res.status_code} | 6-Digit OTP generated: {otp_code}",
    )

    # 4. Step 2 Registration: Verify Invalid OTP Fails (400), Valid OTP Succeeds (200)
    bad_verify = client.post(
        "/api/v1/auth/verify-email",
        json={"email": test_email, "code": "000000"},
    )
    good_verify = client.post(
        "/api/v1/auth/verify-email",
        json={"email": test_email, "code": otp_code},
    )
    check(
        "POST /api/v1/auth/verify-email (Blocks Wrong OTP & Verifies True OTP)",
        bad_verify.status_code == 400 and good_verify.status_code == 200,
        f"Wrong OTP -> HTTP {bad_verify.status_code}, Valid OTP -> HTTP {good_verify.status_code}",
    )

    # 5. Step 7 Registration: Complete Business & Workspace Creation in MongoDB
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Leobeni Mugisha",
            "email": test_email,
            "phone": "+250 788 111 222",
            "password": "StrongPassword2026!",
            "architectureId": "hybrid",
            "businessName": "Kigali Tech & Repair Hub",
            "businessCategory": "Electronics & Technical Services",
            "country": "Rwanda",
            "location": "Kigali, Gasabo",
            "currency": "RWF",
            "language": "en",
            "planTier": "Growth Plan",
            "startingSpendableRWF": 1200000,
            "startingMonthlyRevenueRWF": 850000,
            "primaryItem": "MacBook Pro Screen Assembly",
        },
    )
    reg_body = reg_res.get_json() or {}
    reg_data = reg_body.get("data") or {}
    check(
        "POST /api/v1/auth/register (Creates User, Business & Scoped Workspace)",
        reg_res.status_code == 201 and bool(reg_data.get("access_token")),
        f"HTTP {reg_res.status_code} | Business: {reg_data.get('user', {}).get('businessName')}",
    )

    # 6. Strict Password Check on Login (Wrong Password -> 401, Correct Password -> 200)
    wrong_pw = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "WrongPassword999"},
    )
    valid_login = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "StrongPassword2026!"},
    )
    login_data = (valid_login.get_json() or {}).get("data") or {}
    token = login_data.get("access_token", "")
    check(
        "POST /api/v1/auth/login (Bcrypt Password Verification)",
        wrong_pw.status_code == 401 and valid_login.status_code == 200 and bool(token),
        f"Wrong PW -> HTTP {wrong_pw.status_code}, Correct PW -> HTTP {valid_login.status_code}",
    )

    auth_headers = {"Authorization": f"Bearer {token}"}

    # 7. Scoped Workspace Hydration (/api/storage)
    res = client.get(f"/api/storage?scopeKey={test_email}", headers=auth_headers)
    storage_body = res.get_json() or {}
    hybrid_ws = (storage_body.get("workspaces") or {}).get("hybrid") or {}
    check(
        "GET /api/storage (Hydrates User's Scoped Workspace & Opening Balance)",
        res.status_code == 200 and hybrid_ws.get("spendableRWF") == 1200000,
        f"HTTP {res.status_code} | Business: {hybrid_ws.get('businessName')} | Spendable: {hybrid_ws.get('spendableRWF')} RWF",
    )

    # 8. Dashboard Record Persistence (/api/v1/workspaces/hybrid/records/MixedSales)
    res = client.post(
        "/api/v1/workspaces/hybrid/records/MixedSales",
        headers=auth_headers,
        json={
            "title": "Walk-in Repair + Parts Checkout",
            "amountRWF": 45000,
            "status": "Completed",
            "paymentMethod": "MTN MoMo",
        },
    )
    rec_body = res.get_json() or {}
    new_spendable = (rec_body.get("data") or {}).get("workspaceMetrics", {}).get("spendableRWF")
    check(
        "POST /api/v1/workspaces/hybrid/records/MixedSales (Updates Scoped Balance)",
        res.status_code == 201 and new_spendable == 1245000.0,
        f"HTTP {res.status_code} | Updated Spendable RWF: {new_spendable}",
    )

    # 9. Verify Frontend Source Has Zero Demo Login Profiles & Locked Stepper
    login_src = (BACKEND_DIR.parent / "frontend" / "src" / "pages" / "LoginPage.jsx").read_text(encoding="utf-8")
    reg_src = (BACKEND_DIR.parent / "frontend" / "src" / "pages" / "RegisterPage.jsx").read_text(encoding="utf-8")
    no_demo_login = "SIX_DEMO_PROFILES" not in login_src and "1-Click Demo Workspaces" not in login_src
    step_locked = "handleStepBarClick" in reg_src and "maxCompletedStep" in reg_src
    check(
        "Frontend Audit: Demo Login Profiles Removed & 7-Step Stepper Locked",
        no_demo_login and step_locked,
        f"no_demo_login={no_demo_login}, step_locked={step_locked}",
    )

    # 10. Clean Reset after Test
    res = client.post("/api/storage/reset")
    check(
        "POST /api/storage/reset",
        res.status_code == 200,
        f"HTTP {res.status_code}",
    )

    print("=" * 74)
    if failures == 0:
        print(" RESULT: ALL 10 PRODUCTION AUTH & INTEGRATION CHECKS PASSED (10/10) ")
    else:
        print(f" RESULT: {failures} CHECK(S) FAILED ")
    print("=" * 74)
    return failures


if __name__ == "__main__":
    sys.exit(run_automated_checks())
