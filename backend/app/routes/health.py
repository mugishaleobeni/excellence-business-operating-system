from datetime import datetime, timezone
import hashlib
import time
from flask import Blueprint, request
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


@health_bp.route("/report-error", methods=["POST"])
def report_client_error():
    """
    Lightweight automatic error telemetry endpoint.
    Captures frontend runtime errors, React boundary crashes, and API 5xx errors
    into db.system_error_reports so Super Admin can monitor full system health.
    Deduplicates identical errors within 60 seconds to prevent flooding.
    """
    payload = request.get_json(silent=True) or {}
    source = str(payload.get("source") or "frontend")[:60]
    message = str(payload.get("message") or "").strip()[:500]
    if not message:
        return error_response("Error message is required.", status_code=400)

    stack = str(payload.get("stack") or "")[:2000]
    url = str(payload.get("url") or "")[:400]
    endpoint = str(payload.get("endpoint") or "")[:300]
    user_email = str(payload.get("userEmail") or "anonymous").strip().lower()[:160]
    arch_id = str(payload.get("architectureId") or "")[:60]
    status_code = int(payload.get("statusCode") or 0)
    user_agent = str(payload.get("userAgent") or request.headers.get("User-Agent") or "")[:240]

    now_ts = time.time()
    now_iso = datetime.now(timezone.utc).isoformat()
    fp_raw = f"{source}|{message}|{endpoint}|{status_code}"
    fingerprint = hashlib.sha256(fp_raw.encode("utf-8")).hexdigest()[:16]

    try:
        db = get_db()
        existing = db.system_error_reports.find_one(
            {
                "fingerprint": fingerprint,
                "status": "open",
                "lastSeenTs": {"$gte": now_ts - 3600},
            }
        )
        if existing:
            db.system_error_reports.update_one(
                {"_id": existing["_id"]},
                {
                    "$inc": {"occurrences": 1},
                    "$set": {
                        "lastSeenAt": now_iso,
                        "lastSeenTs": now_ts,
                        "userEmail": user_email,
                        "url": url,
                    },
                },
            )
            return success_response(
                data={"id": existing.get("id"), "deduplicated": True},
                message="Error occurrence incremented.",
            )

        report_id = f"ERR-{int(now_ts * 1000)}"
        db.system_error_reports.insert_one(
            {
                "id": report_id,
                "fingerprint": fingerprint,
                "source": source,
                "message": message,
                "stack": stack,
                "url": url,
                "endpoint": endpoint,
                "statusCode": status_code,
                "userEmail": user_email,
                "architectureId": arch_id,
                "userAgent": user_agent,
                "status": "open",
                "occurrences": 1,
                "createdAt": now_iso,
                "lastSeenAt": now_iso,
                "lastSeenTs": now_ts,
            }
        )
        return success_response(
            data={"id": report_id, "deduplicated": False},
            message="Error reported to Super Admin.",
            status_code=201,
        )
    except Exception as exc:
        return error_response(f"Could not store error report: {exc}", status_code=500)


