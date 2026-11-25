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

    # 4b. Live Enforcement: immediately block any API call from a Suspended or Deleted user
    @app.before_request
    def enforce_live_account_status():
        if request.method == "OPTIONS":
            return None
        path = request.path or ""
        if not path.startswith("/api/"):
            return None
        # Allow public/auth/health endpoints to pass without active-session suspension block
        if (
            path.startswith("/api/v1/health")
            or path.startswith("/api/v1/auth/login")
            or path.startswith("/api/v1/auth/register")
            or path.startswith("/api/v1/auth/send-verification")
            or path.startswith("/api/v1/auth/verify-email")
            or path.startswith("/api/v1/auth/verification-status")
            or path.startswith("/api/v1/auth/forgot-password")
            or path.startswith("/api/v1/auth/reset-password")
            or path.startswith("/api/v1/documents/public/")
            or path.startswith("/api/v1/branches/invite/")
        ):
            return None

        email_to_check = ""
        try:
            verify_jwt_in_request(optional=True)
            ident = get_jwt_identity()
            if isinstance(ident, str) and ident.strip():
                email_to_check = ident.strip().lower()
        except Exception:
            pass

        if not email_to_check:
            return None

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
        return response

    return app

