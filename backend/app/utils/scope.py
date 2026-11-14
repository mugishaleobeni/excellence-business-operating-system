from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request


def resolve_scope_key(db=None, fallback_user: dict | None = None) -> str:
    """
    Resolve the authoritative tenant/user scopeKey for workspace and ledger data.
    Priority:
    1. Verified JWT identity email (prevents cross-user or stale ?scopeKey= mismatches)
    2. Explicit fallback_user email (e.g. during storage snapshot sync)
    3. Explicit ?scopeKey= query parameter (when unauthenticated)
    4. 'default'
    Never falls back to arbitrary latest users in db.users.
    """
    try:
        verify_jwt_in_request(optional=True)
        jwt_email = get_jwt_identity()
        if isinstance(jwt_email, str) and jwt_email.strip():
            return jwt_email.strip().lower()
    except Exception:
        pass

    if isinstance(fallback_user, dict):
        u_email = (fallback_user.get("email") or "").strip().lower()
        if u_email:
            return u_email

    arg_scope = (request.args.get("scopeKey") or "").strip().lower()
    if arg_scope and arg_scope != "default":
        return arg_scope

    return "default"

