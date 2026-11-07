from datetime import datetime, timezone
from flask import Blueprint
from pymongo.errors import PyMongoError
from app.database import get_db
from app.utils.responses import error_response, success_response

health_bp = Blueprint("health", __name__, url_prefix="/api/v1/health")


@health_bp.route("", methods=["GET"])
@health_bp.route("/", methods=["GET"])
def health_check():
    """Health check endpoint verifying Flask runtime and MongoDB Atlas connectivity."""
    try:
        db = get_db()
        db.command("ping")
        return success_response(
            data={
                "status": "ok",
                "database": "connected",
                "service": "exbos-flask-mongodb-backend",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
            message="ExBOS backend and MongoDB are healthy.",
            status_code=200,
        )
    except PyMongoError as exc:
        return error_response(
            error=f"Database connectivity check failed: {str(exc)}",
            status_code=503,
        )

