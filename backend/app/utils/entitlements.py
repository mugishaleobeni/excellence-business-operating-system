from datetime import datetime, timezone
from flask import current_app

PLAN_ORDER = ("free", "bronze", "silver", "gold", "platinum")

PLAN_LIMITS: dict[str, dict] = {
    "free": {
        "name": "Forever Free",
        "priceRWF": 0,
        "maxBranches": 1,
        "maxStaff": 0,
        "maxProducts": 100,
        "maxMonthlySales": 150,
        "allowHybrid": False,
        "allowWhatsappAutomation": False,
        "allowGoogleDrive": False,
        "allowGmailReports": False,
        "allowMultiBranchTransfer": False,
        "allowBranchFreeze": False,
        "allowPublicDocLinks": False,
        "allowAdvancedReports": False,
    },
    "bronze": {
        "name": "Bronze Growth",
        "priceRWF": 10000,
        "maxBranches": 1,
        "maxStaff": 2,
        "maxProducts": 1000,
        "maxMonthlySales": None,
        "allowHybrid": False,
        "allowWhatsappAutomation": True,
        "allowGoogleDrive": False,
        "allowGmailReports": True,
        "allowMultiBranchTransfer": False,
        "allowBranchFreeze": False,
        "allowPublicDocLinks": True,
        "allowAdvancedReports": True,
    },
    "silver": {
        "name": "Silver Enterprise",
        "priceRWF": 20000,
        "maxBranches": 5,
        "maxStaff": 10,
        "maxProducts": None,
        "maxMonthlySales": None,
        "allowHybrid": True,
        "allowWhatsappAutomation": True,
        "allowGoogleDrive": True,
        "allowGmailReports": True,
        "allowMultiBranchTransfer": True,
        "allowBranchFreeze": True,
        "allowPublicDocLinks": True,
        "allowAdvancedReports": True,
    },
    "gold": {
        "name": "Gold Corporate",
        "priceRWF": 35000,
        "maxBranches": None,
        "maxStaff": None,
        "maxProducts": None,
        "maxMonthlySales": None,
        "allowHybrid": True,
        "allowWhatsappAutomation": True,
        "allowGoogleDrive": True,
        "allowGmailReports": True,
        "allowMultiBranchTransfer": True,
        "allowBranchFreeze": True,
        "allowPublicDocLinks": True,
        "allowAdvancedReports": True,
    },
    "platinum": {
        "name": "Platinum Partner",
        "priceRWF": 0,
        "maxBranches": None,
        "maxStaff": None,
        "maxProducts": None,
        "maxMonthlySales": None,
        "allowHybrid": True,
        "allowWhatsappAutomation": True,
        "allowGoogleDrive": True,
        "allowGmailReports": True,
        "allowMultiBranchTransfer": True,
        "allowBranchFreeze": True,
        "allowPublicDocLinks": True,
        "allowAdvancedReports": True,
    },
}

REQUIRED_TIER_FOR_FEATURE: dict[str, str] = {
    "maxBranches": "Silver",
    "maxStaff": "Bronze",
    "maxProducts": "Bronze",
    "maxMonthlySales": "Bronze",
    "allowHybrid": "Silver",
    "allowWhatsappAutomation": "Bronze",
    "allowGoogleDrive": "Silver",
    "allowGmailReports": "Bronze",
    "allowMultiBranchTransfer": "Silver",
    "allowBranchFreeze": "Silver",
    "allowPublicDocLinks": "Bronze",
    "allowAdvancedReports": "Bronze",
}


def _is_super_admin(user_doc: dict | None) -> bool:
    if not user_doc:
        return False
    if bool(user_doc.get("isSuperAdmin")):
        return True
    email = (user_doc.get("email") or "").strip().lower()
    if not email:
        return False
    try:
        configured = current_app.config.get("SUPER_ADMIN_EMAILS") or [
            "mugishaleobeni0@gmail.com"
        ]
    except Exception:
        configured = ["mugishaleobeni0@gmail.com"]
    return email in {str(e).strip().lower() for e in configured}


def normalize_plan_name(raw: str | None) -> str:
    val = str(raw or "free").strip().lower()
    for key in PLAN_ORDER:
        if key in val:
            return key
    return "free"


def get_effective_plan(user_doc: dict | None) -> tuple[str, bool]:
    """
    Returns (effective_plan_key, is_expired).
    - Super Admins always resolve to 'gold' (unlimited).
    - If subscriptionExpiry is in the past and plan != 'free', gracefully falls back to 'free'
      without deleting any user data, and sets is_expired=True.
    """
    if not user_doc:
        return "free", False
    if _is_super_admin(user_doc):
        return "gold", False

    raw_plan = user_doc.get("plan") or user_doc.get("planTier") or "Free"
    plan_key = normalize_plan_name(raw_plan)
    if plan_key == "free":
        return "free", False

    expiry_str = str(user_doc.get("subscriptionExpiry") or "").strip()
    if expiry_str:
        try:
            exp_date = datetime.fromisoformat(expiry_str.replace("Z", "+00:00"))
            if exp_date.tzinfo is None:
                # Treat YYYY-MM-DD as end of that day UTC
                exp_date = exp_date.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > exp_date:
                return "free", True
        except Exception:
            pass

    return plan_key, False


def get_plan_limits(plan_key: str) -> dict:
    return dict(PLAN_LIMITS.get(normalize_plan_name(plan_key), PLAN_LIMITS["free"]))


def get_tenant_usage(db, owner_scope: str) -> dict:
    """Compute live usage counts for a business tenant."""
    scope = (owner_scope or "").strip().lower()
    if not scope or scope == "default":
        return {
            "branchesUsed": 1,
            "staffUsed": 0,
            "productsUsed": 0,
            "monthlySalesUsed": 0,
        }

    branches_used = max(1, db.branches.count_documents({"scopeKey": scope}))
    staff_used = db.users.count_documents({"ownerScopeKey": scope})

    product_buckets = ["Products", "Inventory", "FinishedGoods", "MenuItems", "Services", "HybridItems"]
    products_used = db.module_records.count_documents(
        {"scopeKey": scope, "bucket": {"$in": product_buckets}}
    )

    month_prefix = datetime.now(timezone.utc).strftime("%Y-%m")
    sale_buckets = ["Sales", "Jobs", "KitchenOrders", "MixedSales"]
    monthly_sales_used = db.module_records.count_documents(
        {
            "scopeKey": scope,
            "bucket": {"$in": sale_buckets},
            "$or": [
                {"date": {"$regex": f"^{month_prefix}"}},
                {"created_at": {"$regex": f"^{month_prefix}"}},
            ],
        }
    )

    return {
        "branchesUsed": branches_used,
        "staffUsed": staff_used,
        "productsUsed": products_used,
        "monthlySalesUsed": monthly_sales_used,
    }


def check_entitlement(
    db,
    owner_scope: str,
    feature_key: str,
    user_doc: dict | None = None,
) -> tuple[bool, dict | None]:
    """
    Check whether a tenant can use a boolean feature or create another resource
    under a numeric quota. Returns (True, None) if allowed, or (False, error_payload)
    ready to be returned with HTTP 402 Payment Required.
    """
    scope = (owner_scope or "").strip().lower()
    owner_doc = user_doc
    if not owner_doc and scope and "@" in scope:
        owner_doc = db.users.find_one({"email": scope})
    # If caller is a staff account, check their business owner's plan
    if owner_doc and owner_doc.get("ownerScopeKey"):
        parent = db.users.find_one({"email": str(owner_doc["ownerScopeKey"]).strip().lower()})
        if parent:
            owner_doc = parent
            scope = str(parent.get("email") or scope).strip().lower()

    if _is_super_admin(owner_doc):
        return True, None

    eff_plan, is_expired = get_effective_plan(owner_doc)
    limits = get_plan_limits(eff_plan)
    req_tier = REQUIRED_TIER_FOR_FEATURE.get(feature_key, "Silver")

    # Boolean feature check
    if feature_key.startswith("allow"):
        if limits.get(feature_key, False):
            return True, None
        return False, {
            "code": "PLAN_LIMIT_REACHED",
            "feature": feature_key,
            "currentPlan": eff_plan.title(),
            "requiredPlan": req_tier,
            "subscriptionExpired": is_expired,
            "message": f"Upgrade to {req_tier} to unlock this feature (current plan: {eff_plan.title()}).",
        }

    # Numeric quota check
    limit_val = limits.get(feature_key)
    if limit_val is None:
        return True, None

    usage = get_tenant_usage(db, scope)
    used_map = {
        "maxBranches": usage["branchesUsed"],
        "maxStaff": usage["staffUsed"],
        "maxProducts": usage["productsUsed"],
        "maxMonthlySales": usage["monthlySalesUsed"],
    }
    used = used_map.get(feature_key, 0)
    if used < int(limit_val):
        return True, None

    # Determine next tier that raises this specific limit
    next_tier = req_tier
    if feature_key == "maxBranches" and eff_plan == "silver":
        next_tier = "Gold"
    elif feature_key == "maxStaff" and eff_plan == "bronze":
        next_tier = "Silver"
    elif feature_key == "maxStaff" and eff_plan == "silver":
        next_tier = "Gold"
    elif feature_key == "maxProducts" and eff_plan == "bronze":
        next_tier = "Silver"

    labels = {
        "maxBranches": "branches",
        "maxStaff": "staff logins",
        "maxProducts": "catalog items",
        "maxMonthlySales": "monthly sales",
    }
    label = labels.get(feature_key, "items")
    return False, {
        "code": "PLAN_LIMIT_REACHED",
        "feature": feature_key,
        "currentPlan": eff_plan.title(),
        "requiredPlan": next_tier,
        "limit": int(limit_val),
        "used": int(used),
        "subscriptionExpired": is_expired,
        "message": f"You reached your {eff_plan.title()} plan limit of {limit_val} {label}. Upgrade to {next_tier} to continue.",
    }

