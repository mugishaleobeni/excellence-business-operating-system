from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.database import get_db
from app.routes.super_admin import require_super_admin
from app.utils.entitlements import get_effective_plan, get_plan_limits
from app.utils.responses import error_response, serialize_doc, success_response

training_bp = Blueprint("training", __name__, url_prefix="/api/v1/training")


DEFAULT_TRAINING_CONFIG: dict = {
    "_id": "global",
    "freePromoActive": True,
    "freePromoLabel": "Free Launch Offer",
    "freePromoEndsAt": "",
    "paymentInstructions": {
        "momoCode": "*182*8*1*100999#",
        "momoName": "PYLARIX / ExBOS Training",
        "airtelNumber": "+250 792 946 680",
        "supportWhatsapp": "+250 792 946 680",
    },
    "packages": [
        {
            "id": "starter-kickoff",
            "name": "Starter Kickoff Session",
            "nameRw": "Amahugurwa yo Gutangira (Starter)",
            "description": "1-on-1 guided setup for business owners: add products, record cash/MoMo sales, and read Where Is My Money.",
            "descriptionRw": "Gufasha nyir'ubucuruzi gushyiramo ibicuruzwa, kwandika ibyagurishijwe (Cash/MoMo) no gusoma aho amafaranga ari.",
            "durationLabel": "45 mins",
            "maxStaff": 2,
            "onlinePriceRWF": 15000,
            "onsitePriceRWF": 25000,
            "allowOnsite": True,
            "isFirstSessionFree": True,
            "enabled": True,
            "highlights": [
                "Workspace & branch setup",
                "POS sales, receipts & stock deduction",
                "Where Is My Money cash & MoMo check",
            ],
        },
        {
            "id": "staff-cashier-training",
            "name": "Staff & Cashier Hands-On Training",
            "nameRw": "Amahugurwa y'Abakozi n'Abacuruza (Staff)",
            "description": "Practical training for cashiers, storekeepers, and branch managers on daily POS, WhatsApp POS, credit control, and daily closing.",
            "descriptionRw": "Amahugurwa ngiro ku bakozi n'abayobozi b'amashami ku gucuruza buri munsi, WhatsApp POS, imyenda n'ifunga ry'umunsi.",
            "durationLabel": "2 hours",
            "maxStaff": 5,
            "onlinePriceRWF": 35000,
            "onsitePriceRWF": 50000,
            "allowOnsite": True,
            "isFirstSessionFree": False,
            "enabled": True,
            "highlights": [
                "Role-based staff logins & anti-theft audit",
                "Offline POS & automatic MongoDB sync",
                "WhatsApp Business POS & customer reminders",
            ],
        },
        {
            "id": "multi-branch-rra-mastery",
            "name": "Multi-Branch & RRA Tax Mastery",
            "nameRw": "Amashami Menshi n'Imisoro ya RRA",
            "description": "Executive & accounting workshop covering inter-branch stock transfers, Branch Freeze, RRA VAT 18% / 3% Turnover & EBM exports, and P&L analysis.",
            "descriptionRw": "Amahugurwa yimbitse ku kwimura ibicuruzwa hagati y'amashami, imisoro ya RRA (VAT 18% / 3% & EBM) n'isesengura ry'inyungu.",
            "durationLabel": "Half-Day (3.5 hrs)",
            "maxStaff": 15,
            "onlinePriceRWF": 75000,
            "onsitePriceRWF": 100000,
            "allowOnsite": True,
            "isFirstSessionFree": False,
            "enabled": True,
            "highlights": [
                "Inter-branch transfers & Main HQ heatmap",
                "RRA VAT 18% / 3% Turnover & EBM Annex CSV",
                "True landed cost & profit leakage audit",
            ],
        },
        {
            "id": "certified-operator-track",
            "name": "Certified ExBOS Operator Coaching",
            "nameRw": "Icyemezo cy'Umukozi wa ExBOS (Certified)",
            "description": "Fast-track staff certification with live Q&A assessment and verifiable ExBOS Operator Certificate for new hires.",
            "descriptionRw": "Guhugura abakozi bashya no kubaha icyemezo cya ExBOS cyemeza ko bazi gukoresha sisitemu neza.",
            "durationLabel": "1 hour",
            "maxStaff": 1,
            "onlinePriceRWF": 10000,
            "onsitePriceRWF": 15000,
            "allowOnsite": False,
            "isFirstSessionFree": False,
            "enabled": True,
            "highlights": [
                "Live practical skills verification",
                "Verifiable ExBOS Operator Certificate",
                "Ideal when onboarding new cashiers",
            ],
        },
    ],
}


DEFAULT_TRAINING_COURSES: list[dict] = [
    {
        "id": "core-01-setup",
        "architectureId": "all",
        "roleTarget": "owner",
        "order": 1,
        "durationMinutes": 4,
        "titleEn": "1. Configure Your Business, Branches & Staff Logins",
        "titleRw": "1. Gushyiraho Ubucuruzi, Amashami n'Abakozi",
        "summaryEn": "Set up your business profile, currency (RWF), Main HQ, and isolated Branch Manager accounts in under 4 minutes.",
        "summaryRw": "Tegura umwirondoro w'ubucuruzi, ifaranga (RWF), icyicaro gikuru n'abakozi b'amashami mu minota 4.",
        "videoUrl": "",
        "stepsEn": [
            "Open Settings -> Business Profile to verify your business name, phone, and currency.",
            "If you have more than one location, open Settings -> Branches to create each branch and invite a Branch Manager.",
            "Set branch permissions (expense limits, stock visibility) so Main HQ stays in full control.",
        ],
        "stepsRw": [
            "Fungura Settings -> Business Profile ugenzure izina ry'ubucuruzi na telefone.",
            "Niba ufite amashami menshi, fungura Settings -> Branches ushyireho ishami n'umuyobozi waryo.",
            "Gena ububasha bw'ishami kugira ngo icyicaro gikuru gikomeze kugenzura byose.",
        ],
        "isProOnly": False,
    },
    {
        "id": "core-02-inventory-pos",
        "architectureId": "all",
        "roleTarget": "all",
        "order": 2,
        "durationMinutes": 5,
        "titleEn": "2. Add Products & Record Your First Cash / MTN MoMo Sale",
        "titleRw": "2. Kwandika Ibicuruzwa no Gucuruza (Cash / MTN MoMo)",
        "summaryEn": "Learn how to add stock with cost & selling prices, record a sale (even offline), and share a digital receipt.",
        "summaryRw": "Menya uko wandika ibicuruzwa, igiciro cyo kurangura n'icyo kugurisha, ugacuruza (n'iyo nta internet) ukanatanga inyemezabuguzi.",
        "videoUrl": "",
        "stepsEn": [
            "Go to Inventory / Products -> click Add Product and enter Name, Cost Price, Selling Price, and Opening Stock.",
            "Go to Sales -> Record Sale, pick the product, choose Cash, MTN MoMo, Airtel Money, Bank, or Credit.",
            "Save the sale: ExBOS automatically deducts stock, calculates your true profit, and generates a printable or WhatsApp receipt.",
        ],
        "stepsRw": [
            "Jya muri Inventory / Products -> kanda Add Product wandike izina, igiciro cyo kurangura, icyo kugurisha n'ingano.",
            "Jya muri Sales -> Record Sale, hitamo igicuruzwa n'uburyo bwo kwishyura (Cash, MTN MoMo, Bank cyangwa Umwenda).",
            "Bika: ExBOS ihita ikura mu bubiko, ikabara inyungu nyayo ikanakora inyemezabuguzi.",
        ],
        "isProOnly": False,
    },
    {
        "id": "core-03-money-buckets",
        "architectureId": "all",
        "roleTarget": "owner",
        "order": 3,
        "durationMinutes": 4,
        "titleEn": "3. Master 'Where Is My Money' & Unpaid Customers",
        "titleRw": "3. Gusoma 'Aho Amafaranga Yanjye Ari' n'Imyenda y'Abakiriya",
        "summaryEn": "Stop guessing where daily sales went. Reconcile Cash in Hand, MTN MoMo, Bank, Supplier Debts, and Customer Credit.",
        "summaryRw": "Hagarika gukeka aho amafaranga yagiye. Genzura Cash, MTN MoMo, Banki n'imyenda abakiriya bakurimo.",
        "videoUrl": "",
        "stepsEn": [
            "Open the Dashboard Overview -> inspect the 'Where Is My Money' panel to see Cash vs MTN MoMo vs Bank separately.",
            "Open Customers -> filter Unpaid / Credit balances to follow up on overdue payments.",
            "Record partial or full customer repayments so your Spendable Cash updates immediately.",
        ],
        "stepsRw": [
            "Fungura Dashboard Overview -> reba 'Where Is My Money' umenye Cash, MTN MoMo na Banki ukwabyo.",
            "Fungura Customers -> reba abakiriya batarishyura kugira ngo ubishyuze ku gihe.",
            "Andika igihe umukiriya yishyuye kugira ngo amafaranga ufite ahite yiyongera.",
        ],
        "isProOnly": False,
    },
    {
        "id": "core-04-offline-whatsapp",
        "architectureId": "all",
        "roleTarget": "all",
        "order": 4,
        "durationMinutes": 5,
        "titleEn": "4. Work Offline & Use Official WhatsApp Business POS",
        "titleRw": "4. Gukora Nta Internet (Offline) no Gukoresha WhatsApp POS",
        "summaryEn": "Keep selling when internet drops with automatic MongoDB sync, and record sales directly via WhatsApp chat.",
        "summaryRw": "Komeza ucuruze n'iyo internet igiye (bizihuta bijya kuri database igarutse), unacuruze ukoresheje WhatsApp.",
        "videoUrl": "",
        "stepsEn": [
            "Install ExBOS as an app on your phone or PC using the Install App button.",
            "When offline, continue adding sales and products normally — tap the top-bar Sync badge anytime to view queued items.",
            "On Bronze+ plans, message the ExBOS WhatsApp number to record sales, check stock, or send unpaid customer reminders.",
        ],
        "stepsRw": [
            "Shyira ExBOS kuri telefoni cyangwa mudasobwa ukoresheje Install App.",
            "Igihe nta internet ihari, komeza wandike ibyagurishijwe — internet igarutse byose byoherezwa kuri database.",
            "Ku bafite Bronze kuzamura, andikira ExBOS kuri WhatsApp wandike ibyagurishijwe cyangwa urebe ububiko.",
        ],
        "isProOnly": False,
    },
    {
        "id": "core-05-rra-reports",
        "architectureId": "all",
        "roleTarget": "owner",
        "order": 5,
        "durationMinutes": 5,
        "titleEn": "5. RRA Tax-Ready Center (VAT 18% / 3% Turnover) & Profit Reports",
        "titleRw": "5. Imisoro ya RRA (VAT 18% / 3%) na Raporo z'Inyungu",
        "summaryEn": "Activate optional RRA TIN & EBM tracking when ready, export RRA-formatted CSV Annexes, and review Profit & Loss.",
        "summaryRw": "Fungura RRA Tracking igihe witeguye, ukuremo amafishi ya RRA CSV unarebe raporo y'inyungu n'igihombo.",
        "videoUrl": "",
        "stepsEn": [
            "Open Settings -> RRA Tax & EBM Profile and click the toggle to enable RRA Tracking.",
            "Enter your 9-digit TIN, select Small Taxpayer (3% Turnover) or VAT Registered (18%), and save.",
            "Open Reports -> RRA Tax Center to inspect deadlines, readiness warnings, and export Sales/Purchases Annex CSVs.",
        ],
        "stepsRw": [
            "Fungura Settings -> RRA Tax & EBM Profile ukande aho bafungura RRA Tracking.",
            "Shyiramo TIN yawe y'imibare 9, uhitemo 3% Turnover cyangwa 18% VAT ubike.",
            "Fungura Reports -> RRA Tax Center urebe amatariki ntarengwa unakuremo raporo ya CSV.",
        ],
        "isProOnly": False,
    },
    {
        "id": "arch-make-sell",
        "architectureId": "make-and-sell",
        "roleTarget": "all",
        "order": 6,
        "durationMinutes": 4,
        "titleEn": "Make & Sell: Raw Materials, Production Batches & True Unit Cost",
        "titleRw": "Gukora no Kugurisha: Ibikoresho fatizo n'Igiciro cy'Umwimerere",
        "summaryEn": "Convert raw materials into finished goods batches and catch products priced below true production cost.",
        "summaryRw": "Hindura ibikoresho fatizo mo ibicuruzwa birangiye umenye igiciro nyacyo cyo kubikora.",
        "videoUrl": "",
        "stepsEn": [
            "Record raw material purchases in Raw Materials / Purchases.",
            "Log each production run in Production to deduct raw inputs and add finished stock automatically.",
            "Check unit margin warnings before setting wholesale or retail prices.",
        ],
        "stepsRw": [
            "Andika ibikoresho fatizo waranguye muri Raw Materials / Purchases.",
            "Andika ibyakozwe muri Production kugira ngo ibikoresho fatizo bigabanuke kandi ibirangiye byiyongere.",
            "Genzura inyungu kuri buri gicuruzwa mbere yo gushyiraho igiciro.",
        ],
        "isProOnly": False,
    },
    {
        "id": "arch-agriculture",
        "architectureId": "agriculture",
        "roleTarget": "all",
        "order": 6,
        "durationMinutes": 4,
        "titleEn": "Agriculture & Livestock: Herd Registry, Feed & Daily Yield Profit",
        "titleRw": "Ubuhinzi n'Ubworozi: Amatungo, Ibikoresho n'Umusaruro wa Buri Munsi",
        "summaryEn": "Register animals or crop plots, log daily milk/egg/harvest yields, and track feed & veterinary ROI.",
        "summaryRw": "Andika amatungo cyangwa imirima, wandike umusaruro wa buri munsi (amata, amagi, imyaka) n'ibiguzi by'ibiryo n'imiti.",
        "videoUrl": "",
        "stepsEn": [
            "Register individual animals or crop plots in Farm Production / Livestock.",
            "Log daily feeding, vet care, and harvest/milk yields.",
            "Compare input costs against farm sales to see true seasonal profit.",
        ],
        "stepsRw": [
            "Andika amatungo cyangwa imirima muri Farm Production / Livestock.",
            "Andika ibiryo, imiti n'umusaruro wa buri munsi.",
            "Gereranya ibyakoreshejwe n'ibyagurishijwe umenye inyungu nyayo.",
        ],
        "isProOnly": False,
    },
]


def _resolve_optional_user(db):
    email = ""
    try:
        verify_jwt_in_request(optional=True)
        ident = get_jwt_identity()
        if ident:
            email = str(ident).strip().lower()
    except Exception:
        pass
    if not email:
        return "", None, None
    user_doc = db.users.find_one({"email": email})
    if not user_doc:
        return email, None, None
    scope_key = str(user_doc.get("ownerScopeKey") or user_doc.get("email") or email).strip().lower()
    owner_doc = user_doc
    if scope_key != email:
        parent = db.users.find_one({"email": scope_key})
        if parent:
            owner_doc = parent
    return scope_key, user_doc, owner_doc


def _get_or_init_config(db) -> dict:
    doc = db.training_config.find_one({"_id": "global"})
    if not doc:
        seed = dict(DEFAULT_TRAINING_CONFIG)
        seed["updatedAt"] = datetime.now(timezone.utc).isoformat()
        db.training_config.update_one({"_id": "global"}, {"$set": seed}, upsert=True)
        doc = seed
    out = dict(DEFAULT_TRAINING_CONFIG)
    out.update(doc)
    out.pop("_id", None)
    if not isinstance(out.get("packages"), list) or len(out["packages"]) == 0:
        out["packages"] = list(DEFAULT_TRAINING_CONFIG["packages"])
    if not isinstance(out.get("paymentInstructions"), dict):
        out["paymentInstructions"] = dict(DEFAULT_TRAINING_CONFIG["paymentInstructions"])
    return out


def _get_or_init_courses(db) -> list[dict]:
    existing = list(db.training_courses.find({}))
    if not existing:
        now_iso = datetime.now(timezone.utc).isoformat()
        for c in DEFAULT_TRAINING_COURSES:
            db.training_courses.update_one(
                {"id": c["id"]},
                {"$set": {**c, "createdAt": now_iso, "updatedAt": now_iso}},
                upsert=True,
            )
        existing = list(db.training_courses.find({}))
    cleaned = [serialize_doc(c) for c in existing]
    for c in cleaned:
        c.pop("_id", None)
    cleaned.sort(key=lambda x: (int(x.get("order") or 99), str(x.get("id") or "")))
    return cleaned


def _compute_tenant_training_allowance(db, scope_key: str, owner_doc: dict | None, config: dict) -> dict:
    if not scope_key or not owner_doc:
        return {
            "effectivePlan": "Free",
            "freeSessionsTotal": 0,
            "freeSessionsUsed": 0,
            "freeSessionsRemaining": 0,
            "trainingDiscountPercent": 0,
            "freePromoActive": bool(config.get("freePromoActive", True)),
        }

    eff_plan, _ = get_effective_plan(owner_doc)
    limits = get_plan_limits(eff_plan, db)
    plan_free_total = limits.get("freeTrainingSessions", 0)
    discount_pct = int(limits.get("trainingDiscountPercent") or 0)

    used_count = db.training_bookings.count_documents(
        {
            "scopeKey": scope_key,
            "isFreeEntitlement": True,
            "bookingStatus": {"$ne": "cancelled"},
        }
    )

    if plan_free_total is None:
        remaining = None  # Unlimited
    else:
        remaining = max(0, int(plan_free_total) - int(used_count))

    return {
        "effectivePlan": eff_plan.title(),
        "freeSessionsTotal": plan_free_total,
        "freeSessionsUsed": int(used_count),
        "freeSessionsRemaining": remaining,
        "trainingDiscountPercent": discount_pct,
        "freePromoActive": bool(config.get("freePromoActive", True)),
    }


def _calculate_booking_quote(package: dict, delivery_mode: str, allowance: dict, config: dict) -> dict:
    is_onsite = delivery_mode == "onsite" and bool(package.get("allowOnsite", True))
    base_price = float(package.get("onsitePriceRWF" if is_onsite else "onlinePriceRWF") or 0)
    discount_pct = int(allowance.get("trainingDiscountPercent") or 0)

    # Check if global Free Launch Promo is active (and not expired)
    promo_active = bool(config.get("freePromoActive", False))
    promo_end = str(config.get("freePromoEndsAt") or "").strip()[:10]
    if promo_active and promo_end:
        today_iso = datetime.now(timezone.utc).date().isoformat()
        if today_iso > promo_end:
            promo_active = False

    if base_price <= 0:
        return {
            "originalPriceRWF": 0.0,
            "discountPercent": 0,
            "finalAmountRWF": 0.0,
            "isFreeEntitlement": True,
            "freeReason": "free_package",
        }

    if promo_active:
        return {
            "originalPriceRWF": base_price,
            "discountPercent": 100,
            "finalAmountRWF": 0.0,
            "isFreeEntitlement": True,
            "freeReason": "launch_promo",
        }

    # First Starter Kickoff session free for new accounts
    if bool(package.get("isFirstSessionFree")) and int(allowance.get("freeSessionsUsed") or 0) == 0:
        return {
            "originalPriceRWF": base_price,
            "discountPercent": 100,
            "finalAmountRWF": 0.0,
            "isFreeEntitlement": True,
            "freeReason": "starter_welcome_free",
        }

    # Subscription plan free training allowance
    rem = allowance.get("freeSessionsRemaining")
    if rem is None or (isinstance(rem, int) and rem > 0):
        return {
            "originalPriceRWF": base_price,
            "discountPercent": 100,
            "finalAmountRWF": 0.0,
            "isFreeEntitlement": True,
            "freeReason": "plan_allowance",
        }

    discounted = round(base_price * (100 - discount_pct) / 100.0)
    return {
        "originalPriceRWF": base_price,
        "discountPercent": discount_pct,
        "finalAmountRWF": float(max(0, discounted)),
        "isFreeEntitlement": False,
        "freeReason": "",
    }


def _notify_training_whatsapp(phone: str, text: str) -> None:
    if not phone or not text:
        return
    try:
        from app.services.whatsapp_client import send_whatsapp_message
        send_whatsapp_message(phone, text)
    except Exception:
        pass


@training_bp.route("/catalog", methods=["GET"])
def get_training_catalog():
    db = get_db()
    config = _get_or_init_config(db)
    scope_key, _, owner_doc = _resolve_optional_user(db)
    allowance = _compute_tenant_training_allowance(db, scope_key, owner_doc, config)

    enriched_packages = []
    for pkg in config.get("packages") or []:
        if not pkg.get("enabled", True):
            continue
        online_q = _calculate_booking_quote(pkg, "online", allowance, config)
        onsite_q = _calculate_booking_quote(pkg, "onsite", allowance, config)
        enriched_packages.append(
            {
                **pkg,
                "onlineQuote": online_q,
                "onsiteQuote": onsite_q,
            }
        )

    return success_response(
        data={
            "freePromoActive": bool(config.get("freePromoActive", False)),
            "freePromoLabel": config.get("freePromoLabel") or "Free Launch Offer",
            "freePromoEndsAt": config.get("freePromoEndsAt") or "",
            "paymentInstructions": config.get("paymentInstructions") or {},
            "allowance": allowance,
            "packages": enriched_packages,
        }
    )


@training_bp.route("/courses", methods=["GET"])
def get_training_courses():
    db = get_db()
    scope_key, user_doc, _ = _resolve_optional_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    arch_id = (request.args.get("archId") or user_doc.get("architectureId") or "buy-and-sell").strip().lower()
    all_courses = _get_or_init_courses(db)
    courses = [
        c for c in all_courses
        if str(c.get("architectureId") or "all").lower() in ("all", arch_id)
    ]

    user_email = str(user_doc.get("email") or scope_key).strip().lower()
    prog_doc = db.training_progress.find_one({"scopeKey": scope_key, "userEmail": user_email}) or {}
    completed_ids = list(prog_doc.get("completedLessonIds") or [])
    course_ids = {c["id"] for c in courses}
    completed_in_track = [cid for cid in completed_ids if cid in course_ids]
    pct = round((len(completed_in_track) / len(courses)) * 100) if courses else 0

    return success_response(
        data={
            "architectureId": arch_id,
            "courses": courses,
            "completedLessonIds": completed_ids,
            "progressPercent": pct,
            "certificateId": prog_doc.get("certificateId") or "",
            "certifiedAt": prog_doc.get("certifiedAt") or "",
        }
    )


@training_bp.route("/progress", methods=["POST"])
def update_training_progress():
    db = get_db()
    scope_key, user_doc, _ = _resolve_optional_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    payload = request.get_json(silent=True) or {}
    lesson_id = str(payload.get("lessonId") or "").strip()
    completed = bool(payload.get("completed", True))
    arch_id = (payload.get("archId") or user_doc.get("architectureId") or "buy-and-sell").strip().lower()
    if not lesson_id:
        return error_response("lessonId is required.", status_code=400)

    user_email = str(user_doc.get("email") or scope_key).strip().lower()
    prog_doc = db.training_progress.find_one({"scopeKey": scope_key, "userEmail": user_email}) or {}
    completed_set = set(prog_doc.get("completedLessonIds") or [])
    if completed:
        completed_set.add(lesson_id)
    else:
        completed_set.discard(lesson_id)

    all_courses = _get_or_init_courses(db)
    track_courses = [
        c for c in all_courses
        if str(c.get("architectureId") or "all").lower() in ("all", arch_id)
    ]
    track_ids = {c["id"] for c in track_courses}
    completed_in_track = [cid for cid in completed_set if cid in track_ids]
    pct = round((len(completed_in_track) / len(track_courses)) * 100) if track_courses else 0

    now_iso = datetime.now(timezone.utc).isoformat()
    cert_id = prog_doc.get("certificateId") or ""
    cert_at = prog_doc.get("certifiedAt") or ""
    if pct >= 100 and not cert_id:
        cert_id = f"EXBOS-CERT-{int(datetime.now(timezone.utc).timestamp())}"
        cert_at = now_iso

    db.training_progress.update_one(
        {"scopeKey": scope_key, "userEmail": user_email},
        {
            "$set": {
                "scopeKey": scope_key,
                "userEmail": user_email,
                "userName": user_doc.get("name") or user_email,
                "businessName": user_doc.get("businessName") or "ExBOS Business",
                "completedLessonIds": sorted(completed_set),
                "progressPercent": pct,
                "certificateId": cert_id,
                "certifiedAt": cert_at,
                "updatedAt": now_iso,
            }
        },
        upsert=True,
    )

    return success_response(
        data={
            "completedLessonIds": sorted(completed_set),
            "progressPercent": pct,
            "certificateId": cert_id,
            "certifiedAt": cert_at,
        },
        message="Training progress updated.",
    )


@training_bp.route("/bookings", methods=["GET"])
def list_my_training_bookings():
    db = get_db()
    scope_key, user_doc, _ = _resolve_optional_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    docs = list(db.training_bookings.find({"scopeKey": scope_key}))
    cleaned = [serialize_doc(d) for d in docs]
    for d in cleaned:
        d.pop("_id", None)
    cleaned.sort(key=lambda x: str(x.get("createdAt") or ""), reverse=True)
    return success_response(data={"bookings": cleaned})


@training_bp.route("/bookings", methods=["POST"])
def create_training_booking():
    db = get_db()
    scope_key, user_doc, owner_doc = _resolve_optional_user(db)
    if not scope_key or not user_doc:
        return error_response("Authentication required.", status_code=401)

    payload = request.get_json(silent=True) or {}
    package_id = str(payload.get("packageId") or "").strip()
    delivery_mode = str(payload.get("deliveryMode") or "online").strip().lower()
    if delivery_mode not in ("online", "onsite", "whatsapp"):
        delivery_mode = "online"

    preferred_date = str(payload.get("preferredDate") or "").strip()[:10]
    preferred_time = str(payload.get("preferredTimeSlot") or "10:00 AM").strip()[:40]
    language = "rw" if str(payload.get("language") or "en").strip().lower() == "rw" else "en"
    staff_count = max(1, min(100, int(payload.get("staffCount") or 1)))
    phone = str(payload.get("phone") or user_doc.get("phone") or "").strip()
    notes = str(payload.get("notes") or "").strip()[:400]

    config = _get_or_init_config(db)
    pkg = next(
        (p for p in (config.get("packages") or []) if p.get("id") == package_id and p.get("enabled", True)),
        None,
    )
    if not pkg:
        return error_response("Selected training package is unavailable.", status_code=400)
    if not preferred_date:
        return error_response("Please select a preferred training date.", status_code=400)

    allowance = _compute_tenant_training_allowance(db, scope_key, owner_doc, config)
    quote = _calculate_booking_quote(pkg, delivery_mode, allowance, config)

    final_amount = float(quote["finalAmountRWF"])
    payment_method = str(payload.get("paymentMethod") or ("Free" if final_amount <= 0 else "MTN MoMo")).strip()
    payment_ref = str(payload.get("paymentReference") or "").strip()[:80]

    if final_amount > 0 and not payment_ref:
        return error_response(
            "Payment reference (MTN MoMo / Airtel Money transaction ID) is required for paid training.",
            status_code=400,
        )

    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    booking_id = f"TRN-{now.strftime('%Y%m%d')}-{int(now.timestamp() * 1000) % 10000:04d}"

    booking_doc = {
        "id": booking_id,
        "scopeKey": scope_key,
        "businessName": (owner_doc or user_doc).get("businessName") or "ExBOS Business",
        "requesterEmail": str(user_doc.get("email") or scope_key).strip().lower(),
        "requesterName": user_doc.get("name") or "Business Owner",
        "requesterPhone": phone,
        "architectureId": str(payload.get("archId") or user_doc.get("architectureId") or "buy-and-sell"),
        "packageId": pkg["id"],
        "packageName": pkg["name"],
        "deliveryMode": delivery_mode,
        "staffCount": staff_count,
        "preferredDate": preferred_date,
        "preferredTimeSlot": preferred_time,
        "language": language,
        "notes": notes,
        "originalPriceRWF": quote["originalPriceRWF"],
        "discountPercent": quote["discountPercent"],
        "finalAmountRWF": final_amount,
        "isFreeEntitlement": bool(quote["isFreeEntitlement"]),
        "freeReason": quote["freeReason"],
        "paymentMethod": "Free" if final_amount <= 0 else payment_method,
        "paymentReference": payment_ref,
        "paymentStatus": "free" if final_amount <= 0 else "pending_verification",
        "bookingStatus": "requested",
        "assignedTrainer": "",
        "meetingLink": "",
        "adminNotes": "",
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    db.training_bookings.insert_one(booking_doc)
    clean_booking = serialize_doc(booking_doc)
    clean_booking.pop("_id", None)

    # Notify Super Admin on WhatsApp (non-blocking best-effort)
    admin_phone = os.getenv("SUPER_ADMIN_WHATSAPP_PHONE", "").strip()
    if admin_phone:
        _notify_training_whatsapp(
            admin_phone,
            (
                f"NEW EXBOS TRAINING BOOKING ({booking_id})\n"
                f"Business: {booking_doc['businessName']} ({booking_doc['requesterName']})\n"
                f"Package: {booking_doc['packageName']} ({delivery_mode.upper()})\n"
                f"Staff: {staff_count} | Date: {preferred_date} {preferred_time}\n"
                f"Amount: {int(final_amount):,} RWF ({booking_doc['paymentStatus']})\n"
                f"{'Ref: ' + payment_ref if payment_ref else 'Free Promo / Plan Allowance'}"
            ),
        )

    return success_response(
        data={"booking": clean_booking},
        message="Training booking submitted successfully.",
        status_code=201,
    )


# ---------------------------------------------------------------------------
# SUPER ADMIN ENDPOINTS (Live Pricing, Free-to-Paid Switch, Payment Approval)
# ---------------------------------------------------------------------------


@training_bp.route("/admin/overview", methods=["GET"])
@require_super_admin
def admin_training_overview():
    db = get_db()
    config = _get_or_init_config(db)
    courses = _get_or_init_courses(db)
    raw_bookings = list(db.training_bookings.find({}))
    bookings = [serialize_doc(b) for b in raw_bookings]
    for b in bookings:
        b.pop("_id", None)
    bookings.sort(key=lambda x: str(x.get("createdAt") or ""), reverse=True)

    paid_rev = sum(float(b.get("finalAmountRWF") or 0) for b in bookings if b.get("paymentStatus") == "paid")
    pending_rev = sum(
        float(b.get("finalAmountRWF") or 0) for b in bookings if b.get("paymentStatus") == "pending_verification"
    )
    free_sessions = sum(1 for b in bookings if b.get("isFreeEntitlement") and b.get("bookingStatus") != "cancelled")
    completed_sessions = sum(1 for b in bookings if b.get("bookingStatus") == "completed")
    pending_approvals = sum(
        1 for b in bookings if b.get("bookingStatus") == "requested" or b.get("paymentStatus") == "pending_verification"
    )

    return success_response(
        data={
            "config": config,
            "courses": courses,
            "bookings": bookings,
            "kpis": {
                "totalRevenueRWF": round(paid_rev),
                "pendingRevenueRWF": round(pending_rev),
                "totalBookings": len(bookings),
                "freeSessionsCount": free_sessions,
                "completedSessionsCount": completed_sessions,
                "pendingApprovalsCount": pending_approvals,
            },
        }
    )


@training_bp.route("/admin/config", methods=["PUT"])
@require_super_admin
def admin_update_training_config():
    db = get_db()
    current = _get_or_init_config(db)
    payload = request.get_json(silent=True) or {}

    updated = dict(current)
    if "freePromoActive" in payload:
        updated["freePromoActive"] = bool(payload["freePromoActive"])
    if "freePromoLabel" in payload:
        updated["freePromoLabel"] = str(payload.get("freePromoLabel") or "Free Launch Offer").strip()[:80]
    if "freePromoEndsAt" in payload:
        updated["freePromoEndsAt"] = str(payload.get("freePromoEndsAt") or "").strip()[:10]
    if isinstance(payload.get("paymentInstructions"), dict):
        pi = dict(updated.get("paymentInstructions") or {})
        for k in ("momoCode", "momoName", "airtelNumber", "supportWhatsapp"):
            if k in payload["paymentInstructions"]:
                pi[k] = str(payload["paymentInstructions"][k] or "").strip()[:120]
        updated["paymentInstructions"] = pi

    if isinstance(payload.get("packages"), list) and len(payload["packages"]) > 0:
        clean_pkgs = []
        for idx, raw in enumerate(payload["packages"]):
            if not isinstance(raw, dict):
                continue
            pkg_id = re.sub(r"[^a-z0-9\-_]", "", str(raw.get("id") or f"pkg-{idx + 1}").lower()) or f"pkg-{idx + 1}"
            clean_pkgs.append(
                {
                    "id": pkg_id,
                    "name": str(raw.get("name") or "Training Package").strip()[:100],
                    "nameRw": str(raw.get("nameRw") or raw.get("name") or "Amahugurwa").strip()[:100],
                    "description": str(raw.get("description") or "").strip()[:350],
                    "descriptionRw": str(raw.get("descriptionRw") or raw.get("description") or "").strip()[:350],
                    "durationLabel": str(raw.get("durationLabel") or "1 hour").strip()[:40],
                    "maxStaff": max(1, int(raw.get("maxStaff") or 1)),
                    "onlinePriceRWF": max(0, int(float(raw.get("onlinePriceRWF") or 0))),
                    "onsitePriceRWF": max(0, int(float(raw.get("onsitePriceRWF") or 0))),
                    "allowOnsite": bool(raw.get("allowOnsite", True)),
                    "isFirstSessionFree": bool(raw.get("isFirstSessionFree", False)),
                    "enabled": bool(raw.get("enabled", True)),
                    "highlights": [
                        str(h).strip()[:120] for h in (raw.get("highlights") or []) if str(h).strip()
                    ][:6],
                }
            )
        if clean_pkgs:
            updated["packages"] = clean_pkgs

    updated["updatedAt"] = datetime.now(timezone.utc).isoformat()
    db.training_config.update_one({"_id": "global"}, {"$set": {**updated, "_id": "global"}}, upsert=True)
    return success_response(data={"config": updated}, message="Training pricing and configuration saved.")


@training_bp.route("/admin/bookings/<string:booking_id>", methods=["PUT"])
@require_super_admin
def admin_update_training_booking(booking_id: str):
    db = get_db()
    existing = db.training_bookings.find_one({"id": booking_id})
    if not existing:
        return error_response("Training booking not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    updates: dict = {"updatedAt": datetime.now(timezone.utc).isoformat()}

    if payload.get("paymentStatus") in ("free", "pending_verification", "paid", "rejected"):
        updates["paymentStatus"] = payload["paymentStatus"]
    if payload.get("bookingStatus") in ("requested", "confirmed", "completed", "cancelled"):
        updates["bookingStatus"] = payload["bookingStatus"]
    if "assignedTrainer" in payload:
        updates["assignedTrainer"] = str(payload.get("assignedTrainer") or "").strip()[:80]
    if "meetingLink" in payload:
        updates["meetingLink"] = str(payload.get("meetingLink") or "").strip()[:300]
    if "adminNotes" in payload:
        updates["adminNotes"] = str(payload.get("adminNotes") or "").strip()[:400]
    if "preferredDate" in payload and str(payload.get("preferredDate") or "").strip():
        updates["preferredDate"] = str(payload["preferredDate"]).strip()[:10]
    if "preferredTimeSlot" in payload and str(payload.get("preferredTimeSlot") or "").strip():
        updates["preferredTimeSlot"] = str(payload["preferredTimeSlot"]).strip()[:40]

    db.training_bookings.update_one({"id": booking_id}, {"$set": updates})
    merged = {**existing, **updates}
    clean = serialize_doc(merged)
    clean.pop("_id", None)

    # Auto-notify Business Owner on WhatsApp when booking is confirmed
    if updates.get("bookingStatus") == "confirmed" and merged.get("requesterPhone"):
        is_rw = merged.get("language") == "rw"
        link_line = f"\nLink: {merged.get('meetingLink')}" if merged.get("meetingLink") else ""
        trainer_line = f"\nTrainer: {merged.get('assignedTrainer')}" if merged.get("assignedTrainer") else ""
        msg = (
            (
                f"EXBOS AMAHUGURWA YEMEJWE ({booking_id})\n"
                f"Porogaramu: {merged.get('packageName')}\n"
                f"Itariki: {merged.get('preferredDate')} saa {merged.get('preferredTimeSlot')}"
                f"{trainer_line}{link_line}\n"
                f"Murakoze gukorana na ExBOS!"
            )
            if is_rw
            else (
                f"EXBOS TRAINING CONFIRMED ({booking_id})\n"
                f"Package: {merged.get('packageName')}\n"
                f"Date: {merged.get('preferredDate')} at {merged.get('preferredTimeSlot')}"
                f"{trainer_line}{link_line}\n"
                f"We look forward to training your team!"
            )
        )
        _notify_training_whatsapp(merged.get("requesterPhone"), msg)

    return success_response(data={"booking": clean}, message="Training booking updated.")


@training_bp.route("/admin/courses", methods=["POST"])
@require_super_admin
def admin_upsert_training_course():
    db = get_db()
    payload = request.get_json(silent=True) or {}
    title_en = str(payload.get("titleEn") or "").strip()
    if not title_en:
        return error_response("titleEn is required.", status_code=400)

    now_iso = datetime.now(timezone.utc).isoformat()
    course_id = str(payload.get("id") or f"course-{int(datetime.now(timezone.utc).timestamp() * 1000)}").strip()
    doc = {
        "id": course_id,
        "architectureId": str(payload.get("architectureId") or "all").strip().lower(),
        "roleTarget": str(payload.get("roleTarget") or "all").strip().lower(),
        "order": int(payload.get("order") or 10),
        "durationMinutes": max(1, int(payload.get("durationMinutes") or 5)),
        "titleEn": title_en[:140],
        "titleRw": str(payload.get("titleRw") or title_en).strip()[:140],
        "summaryEn": str(payload.get("summaryEn") or "").strip()[:400],
        "summaryRw": str(payload.get("summaryRw") or payload.get("summaryEn") or "").strip()[:400],
        "videoUrl": str(payload.get("videoUrl") or "").strip()[:300],
        "stepsEn": [str(s).strip()[:240] for s in (payload.get("stepsEn") or []) if str(s).strip()][:10],
        "stepsRw": [str(s).strip()[:240] for s in (payload.get("stepsRw") or payload.get("stepsEn") or []) if str(s).strip()][:10],
        "isProOnly": bool(payload.get("isProOnly", False)),
        "updatedAt": now_iso,
    }
    db.training_courses.update_one({"id": course_id}, {"$set": doc}, upsert=True)
    return success_response(data={"course": doc}, message="Training lesson saved.")


@training_bp.route("/admin/courses/<string:course_id>", methods=["DELETE"])
@require_super_admin
def admin_delete_training_course(course_id: str):
    db = get_db()
    db.training_courses.delete_one({"id": course_id})
    return success_response(data={"deletedId": course_id}, message="Training lesson deleted.")
