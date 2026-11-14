import logging
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo.errors import PyMongoError
from werkzeug.exceptions import HTTPException

from app.config import BaseConfig, get_config
from app.database import init_db
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

    # 4. Register all modular Blueprints
    register_blueprints(app)

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

    return app

