import logging
from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, get_jwt_identity, verify_jwt_in_request
from pymongo.errors import PyMongoError
from werkzeug.exceptions import HTTPException

from app.config import BaseConfig, get_config
from app.database import get_db, init_db
from app.routes import register_blueprints
from app.utils.responses import error_response


def create_app(config_class: type[BaseConfig] | None = None) -> Flask:
    """
    Flask Application Factory (`create_app`).
    Configures CORS, JWT security, MongoDB Atlas connection pooling & indexes,
    Blueprint registration, and standardized JSON error handlers.
    """
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    app = Flask(__name__)
    app.url_map.strict_slashes = False

    selected_config = config_class or get_config()
    app.config.from_object(selected_config)

    # Warn or fail-fast if default dev secrets are still active in production
    _default_secrets = {"exbos-default-secret-key-2026", "exbos-default-jwt-secret-key-2026", ""}
    _sec = str(app.config.get("SECRET_KEY") or "")
    _jwt_sec = str(app.config.get("JWT_SECRET_KEY") or "")
    if _sec in _default_secrets or _jwt_sec in _default_secrets or len(_jwt_sec) < 24:
        app.logger.warning(
            "SECURITY WARNING: Weak or default SECRET_KEY/JWT_SECRET_KEY detected. "
            "Set strong 32+ char random SECRET_KEY and JWT_SECRET_KEY environment variables in production."
        )
        if app.config.get("ENFORCE_STRONG_SECRETS"):
            raise RuntimeError("ENFORCE_STRONG_SECRETS is enabled and SECRET_KEY/JWT_SECRET_KEY is weak or default.")

    # 1. Configure CORS from CORS_ORIGINS env var
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        },
    )

    # 2. Initialize Flask-JWT-Extended with custom JSON error callbacks
    jwt = JWTManager(app)

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return error_response(
            error="Authentication token has expired. Please refresh or sign in again.",
            status_code=401,
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string: str):
        return error_response(
            error=f"Invalid authentication token: {error_string}",
            status_code=401,
        )

    @jwt.unauthorized_loader
    def missing_token_callback(error_string: str):
        return error_response(
            error=f"Authorization header is required: {error_string}",
            status_code=401,
        )

    # 3. Initialize MongoDB Atlas connection pool & indexes
    init_db(app)

    # 3b. Start MongoDB Email Outbox Relay on SMTP-capable hosts
    from app.utils.mailer import start_email_outbox_relay
    start_email_outbox_relay(app)

    # 4. Register all modular Blueprints
    register_blueprints(app)

    # 4b. Global Security Guard: Rate Limiting + Strict JWT Auth on Private Routes + Live Suspension Check
    @app.before_request
    def enforce_global_security_and_account_status():
        if request.method == "OPTIONS":
            return None
        path = request.path or ""
        if not path.startswith("/api/"):
            return None

        # A. Rate-limit sensitive public endpoints against brute-force & spam abuse
        if not app.config.get("TESTING"):
            from app.utils.rate_limit import check_rate_limit

            client_ip = (
                (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
                or request.remote_addr
                or "unknown"
            )
            rate_rules = [
                ("POST", "/api/v1/auth/login", 12, 60),
                ("POST", "/api/v1/auth/forgot-password", 5, 900),
                ("POST", "/api/v1/auth/send-verification", 5, 900),
                ("POST", "/api/v1/auth/reset-password", 8, 900),
                ("POST", "/api/v1/auth/verify-email", 8, 900),
                ("POST", "/api/v1/health/report-error", 15, 60),
            ]
            for r_method, r_path, r_limit, r_win in rate_rules:
                if request.method == r_method and path.rstrip("/") == r_path:
                    allowed, retry_after = check_rate_limit(f"{r_path}:{client_ip}", r_limit, r_win)
                    if not allowed:
                        resp = error_response(
                            error="Too many requests. Please wait a moment and try again.",
                            status_code=429,
                        )
                        resp[0].headers["Retry-After"] = str(retry_after)
                        return resp
                    break

        # B. Explicit Public Allowlist (every other /api/v1/* endpoint strictly requires a valid JWT!)
        is_public_route = (
            path.startswith("/api/v1/health")
            or path.startswith("/api/v1/auth/login")
            or path.startswith("/api/v1/auth/register")
            or path.startswith("/api/v1/auth/refresh")
            or path.startswith("/api/v1/auth/send-verification")
            or path.startswith("/api/v1/auth/verify-email")
            or path.startswith("/api/v1/auth/verification-status")
            or path.startswith("/api/v1/auth/forgot-password")
            or path.startswith("/api/v1/auth/reset-password")
            or path.startswith("/api/v1/documents/public/")
            or path.startswith("/api/v1/branches/invite/")
            or path.startswith("/api/v1/whatsapp/webhook")
            or path.startswith("/api/v1/workspaces/public-document/")
            or path.rstrip("/") == "/api/v1/workspaces/qrcode"
            or (
                request.method == "GET"
                and path.rstrip("/")
                in (
                    "/api/v1/super-admin/pricing-plans",
                    "/api/v1/super-admin/plan-limits",
                    "/api/v1/super-admin/platinum-program",
                    "/api/v1/super-admin/broadcast",
                )
            )
        )
        if is_public_route:
            return None

        # C. Require valid JWT on ALL private endpoints (closes unauthenticated ?scopeKey= IDOR)
        try:
            verify_jwt_in_request()
            ident = get_jwt_identity()
            email_to_check = ident.strip().lower() if isinstance(ident, str) else ""
        except Exception:
            return error_response(
                error="Authentication required. Please sign in to access ExBOS.",
                status_code=401,
            )

        if not email_to_check:
            return error_response(
                error="Valid authentication token is required.",
                status_code=401,
            )

        try:
            db = get_db()
            user_doc = db.users.find_one(
                {"email": email_to_check},
                {"accountStatus": 1, "suspensionReason": 1, "ownerScopeKey": 1, "isSuperAdmin": 1},
            )
            if user_doc is None:
                return error_response(
                    error="This account has been deleted by the ExBOS administrator.",
                    details={"code": "ACCOUNT_DELETED"},
                    status_code=403,
                )
            if str(user_doc.get("accountStatus") or "Active").lower() == "suspended":
                reason = user_doc.get("suspensionReason") or "Suspended by ExBOS Super Administrator."
                return error_response(
                    error=f"Your account has been suspended: {reason}",
                    details={"code": "ACCOUNT_SUSPENDED", "reason": reason},
                    status_code=403,
                )
            # Also enforce if the parent owner of a staff account was suspended
            owner_key = str(user_doc.get("ownerScopeKey") or "").strip().lower()
            if owner_key and owner_key != email_to_check:
                owner_doc = db.users.find_one(
                    {"email": owner_key},
                    {"accountStatus": 1, "suspensionReason": 1},
                )
                if owner_doc is None:
                    return error_response(
                        error="Your workspace account has been removed by the administrator.",
                        details={"code": "ACCOUNT_DELETED"},
                        status_code=403,
                    )
                if str(owner_doc.get("accountStatus") or "Active").lower() == "suspended":
                    reason = owner_doc.get("suspensionReason") or "Workspace suspended by ExBOS Super Administrator."
                    return error_response(
                        error=f"Your workspace has been suspended: {reason}",
                        details={"code": "ACCOUNT_SUSPENDED", "reason": reason},
                        status_code=403,
                    )
        except Exception:
            pass
        return None

    # 5. Global JSON error handlers
    @app.errorhandler(400)
    def handle_bad_request(err):
        description = getattr(err, "description", "Bad request.")
        return error_response(error=str(description), status_code=400)

    @app.errorhandler(404)
    def handle_not_found(err):
        return error_response(
            error="Requested API endpoint or resource was not found.",
            status_code=404,
        )

    @app.errorhandler(405)
    def handle_method_not_allowed(err):
        return error_response(
            error="HTTP method not allowed for this endpoint.",
            status_code=405,
        )

    @app.errorhandler(PyMongoError)
    def handle_pymongo_error(err: PyMongoError):
        app.logger.error("MongoDB operation failed: %s", err)
        return error_response(
            error="Database unavailable: data could not be saved to MongoDB. Please verify database connectivity.",
            details=[{"message": str(err)}] if app.config.get("DEBUG") else None,
            status_code=503,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_exception(err: Exception):
        if isinstance(err, HTTPException):
            return error_response(
                error=str(err.description),
                status_code=err.code or 500,
            )
        app.logger.exception("Unhandled server exception: %s", err)
        return error_response(
            error="Internal server error.",
            details=[{"message": str(err)}] if app.config.get("DEBUG") else None,
            status_code=500,
        )

    # 5b. Guarantee CORS headers on ALL responses (including 4xx/5xx error handlers)
    @app.after_request
    def ensure_cors_headers(response):
        origin = (request.headers.get("Origin") or "").strip()
        if origin and not response.headers.get("Access-Control-Allow-Origin"):
            allowed = app.config.get("CORS_ORIGINS") or []
            origin_low = origin.lower()
            is_allowed = (
                "*" in allowed
                or origin in allowed
                or origin_low.endswith(".exbos.pages.dev")
                or origin_low == "https://exbos.pages.dev"
                or origin_low.startswith("http://localhost:")
                or origin_low.startswith("http://127.0.0.1:")
            )
            if is_allowed:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Vary"] = "Origin"
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"

        # Defense-in-depth HTTP security headers
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "geolocation=(), microphone=()")
        if request.is_secure or request.headers.get("X-Forwarded-Proto", "").lower() == "https":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

    return app

