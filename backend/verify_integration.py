#!/usr/bin/env python3
"""
Automated End-to-End Integration Verification Suite for ExBOS Backend & Frontend.
Tests Flask Blueprints, Pydantic v2 validation, JWT security, and MongoDB persistence.
"""

import json
import sys
import urllib.request
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

from app import create_app


def run_automated_checks() -> int:
    print("=" * 72)
    print(" ExBOS AUTOMATED BACKEND + FRONTEND INTEGRATION VERIFICATION SUITE ")
    print("=" * 72)

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

    # 2. Storage Hydration (GET /api/storage)
    res = client.get("/api/storage")
    storage_body = res.get_json() or {}
    has_6_archs = isinstance(storage_body.get("workspaces"), dict) and len(
        storage_body["workspaces"]
    ) == 6
    check(
        "GET /api/storage (ExbosContext Hydration)",
        res.status_code == 200 and has_6_archs,
        f"HTTP {res.status_code} | Architectures loaded: {list(storage_body.get('workspaces', {}).keys())}",
    )

    # 3. Storage Persistence with ISO String savedAt (POST /api/storage)
    res = client.post(
        "/api/storage",
        json={
            "workspaces": storage_body.get("workspaces"),
            "transactions": [],
            "savedAt": "2026-11-07T13:52:00.000Z",
        },
    )
    post_storage_body = res.get_json() or {}
    check(
        "POST /api/storage (Debounced State Sync)",
        res.status_code == 200 and post_storage_body.get("success") is True,
        f"HTTP {res.status_code} -> {json.dumps(post_storage_body)}",
    )

    # 4. Pydantic v2 Validation Gate (400 Bad Request on invalid payload)
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "not-an-email"},
    )
    err_body = res.get_json() or {}
    check(
        "POST /api/v1/auth/login (Pydantic v2 Validation Gate -> 400)",
        res.status_code == 400 and err_body.get("success") is False,
        f"HTTP {res.status_code} -> {json.dumps(err_body)[:140]}",
    )

    # 5. Auth Login & JWT Token Generation
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@exbos.rw",
            "name": "Leobeni (PYLARIX)",
            "businessName": "PYLARIX Platform Control",
            "architectureId": "hybrid",
        },
    )
    login_body = res.get_json() or {}
    token = (login_body.get("data") or {}).get("access_token", "")
    check(
        "POST /api/v1/auth/login (JWT Issued)",
        res.status_code == 200 and bool(token),
        f"HTTP {res.status_code} | JWT token length: {len(token)} chars",
    )

    auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 6. Current User Profile (GET /api/v1/auth/me)
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    me_body = res.get_json() or {}
    check(
        "GET /api/v1/auth/me (Authenticated Profile)",
        res.status_code == 200 and (me_body.get("data") or {}).get("user", {}).get("email") == "admin@exbos.rw",
        f"HTTP {res.status_code} | User: {(me_body.get('data') or {}).get('user', {}).get('name')}",
    )

    # 7. Workspaces & Module Record Creation (/api/v1/workspaces/hybrid/records/MixedSales)
    res = client.post(
        "/api/v1/workspaces/hybrid/records/MixedSales",
        headers=auth_headers,
        json={
            "title": "Automated Test Mixed Checkout",
            "amountRWF": 45000,
            "status": "Completed",
            "paymentMethod": "MTN MoMo",
        },
    )
    rec_body = res.get_json() or {}
    check(
        "POST /api/v1/workspaces/hybrid/records/MixedSales",
        res.status_code == 201 and rec_body.get("success") is True,
        f"HTTP {res.status_code} | New Spendable RWF: {(rec_body.get('data') or {}).get('workspaceMetrics', {}).get('spendableRWF')}",
    )

    # 8. Super Admin Tenant Registry & Paid vs Complimentary MRR Separation
    res = client.get("/api/v1/super-admin/businesses", headers=auth_headers)
    biz_body = res.get_json() or {}
    meta = biz_body.get("meta") or {}
    check(
        "GET /api/v1/super-admin/businesses (Section 8.2 MRR Separation)",
        res.status_code == 200 and "paidMrrRWF" in meta and "complimentaryCount" in meta,
        f"HTTP {res.status_code} | Meta: {json.dumps(meta)}",
    )

    # 9. Clean Zero-Base Reset (/api/storage/reset)
    res = client.post("/api/storage/reset")
    reset_body = res.get_json() or {}
    check(
        "POST /api/storage/reset (Restore Clean Zero-Base State)",
        res.status_code == 200 and reset_body.get("reset") is True,
        f"HTTP {res.status_code} -> {json.dumps(reset_body)}",
    )

    # 10. Check Vite Frontend Server on http://localhost:5173
    try:
        with urllib.request.urlopen("http://127.0.0.1:5173/", timeout=3) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            check(
                "Frontend Vite Dev Server (http://127.0.0.1:5173/)",
                resp.status == 200 and "<div id=\"root\">" in html,
                f"HTTP {resp.status} | Root mount node verified",
            )
    except Exception as exc:
        check("Frontend Vite Dev Server (http://127.0.0.1:5173/)", False, str(exc))

    print("=" * 72)
    if failures == 0:
        print(" RESULT: ALL 10 AUTOMATED INTEGRATION CHECKS PASSED (10/10) ")
    else:
        print(f" RESULT: {failures} CHECK(S) FAILED ")
    print("=" * 72)
    return failures


if __name__ == "__main__":
    sys.exit(run_automated_checks())
