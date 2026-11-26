from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


def resolve_scope_key(db=None, fallback_user: dict | None = None) -> str:
    """
    Resolve the authoritative tenant/user scopeKey for workspace and ledger data.
    Priority:
    1. Verified JWT identity email (prevents cross-user or forged ?scopeKey= access)
    2. Explicit internal fallback_user dict (only when invoked internally without a request)
    Never trusts unauthenticated ?scopeKey= query parameters.
    """
    try:
        verify_jwt_in_request(optional=True)
        jwt_email = get_jwt_identity()
        if isinstance(jwt_email, str) and jwt_email.strip():
            norm_email = jwt_email.strip().lower()
            if db is not None:
                user_doc = db.users.find_one({"email": norm_email}, {"ownerScopeKey": 1})
                if user_doc and user_doc.get("ownerScopeKey"):
                    return str(user_doc["ownerScopeKey"]).strip().lower()
            return norm_email
    except Exception:
        pass

    if isinstance(fallback_user, dict):
        u_scope = (fallback_user.get("ownerScopeKey") or fallback_user.get("email") or "").strip().lower()
        if u_scope:
            return u_scope

    return "default"

