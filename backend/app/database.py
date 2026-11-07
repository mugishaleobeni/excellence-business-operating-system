import logging
from datetime import datetime, timezone
from typing import Any
from bson import ObjectId
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.errors import PyMongoError

from app.seed_defaults import (
    DEFAULT_BUSINESSES,
    DEFAULT_INTEGRATIONS,
    DEFAULT_PLATINUM_PROGRAM,
    DEFAULT_PRICING_PLANS,
    DEFAULT_USER,
    get_default_workspaces,
)

logger = logging.getLogger(__name__)

_mongo_client: MongoClient | None = None
_mongo_db: Database | None = None


def serialize_doc(doc: Any) -> Any:
    """Recursively convert BSON ObjectId and datetime instances into JSON-safe primitives."""
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                result["_id"] = str(value)
                if "id" not in doc:
                    result["id"] = str(value)
            else:
                result[key] = serialize_doc(value)
        return result
    return doc


def init_db(app) -> Database:
    """
    Initialize the PyMongo client with Atlas connection pooling parameters:
    maxPoolSize=50, minPoolSize=10, serverSelectionTimeoutMS=5000.
    Automatically enables TLS when connecting to a mongodb+srv:// Atlas URI.
    """
    global _mongo_client, _mongo_db

    mongo_uri: str = app.config["MONGO_URI"]
    db_name: str = app.config["MONGO_DB_NAME"]
    is_srv = mongo_uri.startswith("mongodb+srv://")

    client_kwargs: dict[str, Any] = {
        "maxPoolSize": app.config.get("MONGO_MAX_POOL_SIZE", 50),
        "minPoolSize": app.config.get("MONGO_MIN_POOL_SIZE", 1),
        "serverSelectionTimeoutMS": app.config.get("MONGO_SERVER_SELECTION_TIMEOUT_MS", 15000),
        "connectTimeoutMS": app.config.get("MONGO_CONNECT_TIMEOUT_MS", 15000),
        "socketTimeoutMS": app.config.get("MONGO_SOCKET_TIMEOUT_MS", 20000),
        "retryWrites": True,
        "retryReads": True,
    }
    if is_srv:
        client_kwargs["tls"] = True

    _mongo_client = MongoClient(mongo_uri, **client_kwargs)
    _mongo_db = _mongo_client[db_name]

    try:
        ensure_indexes(_mongo_db)
        seed_initial_collections(_mongo_db)
        logger.info("MongoDB connected and indexes verified on database '%s'.", db_name)
    except PyMongoError as exc:
        logger.warning(
            "MongoDB startup index/seed warning (will retry on first request): %s", exc
        )

    return _mongo_db


def get_db() -> Database:
    """Return the active MongoDB database instance."""
    if _mongo_db is None:
        raise RuntimeError("Database has not been initialized. Call init_db(app) first.")
    return _mongo_db


def ensure_indexes(db: Database) -> None:
    """Create collection indexes for high-throughput queries and uniqueness constraints."""
    db.users.create_index([("email", ASCENDING)], unique=True, name="idx_users_email_unique")
    db.users.create_index([("architectureId", ASCENDING)], name="idx_users_architecture")

    db.businesses.create_index([("id", ASCENDING)], unique=True, name="idx_businesses_id_unique")
    db.businesses.create_index([("architectureId", ASCENDING)], name="idx_businesses_arch")
    db.businesses.create_index([("billingType", ASCENDING)], name="idx_businesses_billing")

    db.workspaces.create_index(
        [("scopeKey", ASCENDING), ("architectureId", ASCENDING)],
        unique=True,
        name="idx_workspaces_scope_arch_unique",
    )

    db.transactions.create_index(
        [("id", ASCENDING)], unique=True, name="idx_transactions_id_unique"
    )
    db.transactions.create_index(
        [("architectureId", ASCENDING), ("timestamp", DESCENDING)],
        name="idx_transactions_arch_time",
    )

    db.platform_config.create_index(
        [("key", ASCENDING)], unique=True, name="idx_platform_config_key_unique"
    )

    db.password_resets.create_index(
        [("email", ASCENDING)], name="idx_password_resets_email"
    )
    db.password_resets.create_index(
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        name="idx_password_resets_ttl",
    )


def seed_initial_collections(db: Database) -> None:
    """Ensure baseline zero-base workspaces, default user, and platform configs exist."""
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Seed default workspaces for global scope ("default")
    default_workspaces = get_default_workspaces()
    for arch_id, ws_payload in default_workspaces.items():
        existing = db.workspaces.find_one(
            {"scopeKey": "default", "architectureId": arch_id}
        )
        if not existing:
            doc = {
                **ws_payload,
                "scopeKey": "default",
                "architectureId": arch_id,
                "created_at": now_iso,
                "updated_at": now_iso,
            }
            db.workspaces.insert_one(doc)

    # 2. Seed default admin user if users collection is empty
    if db.users.count_documents({}) == 0:
        from app.utils.security import hash_password

        admin_doc = {
            **DEFAULT_USER,
            "email": DEFAULT_USER["email"].lower(),
            "password_hash": hash_password("ExbosAdmin2026!"),
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        db.users.insert_one(admin_doc)

    # 3. Seed default businesses if businesses collection is empty
    if db.businesses.count_documents({}) == 0:
        for biz in DEFAULT_BUSINESSES:
            db.businesses.insert_one(
                {
                    **biz,
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
            )

    # 4. Seed platform_config keys
    config_seeds = {
        "pricing_plans": DEFAULT_PRICING_PLANS,
        "platinum_program": DEFAULT_PLATINUM_PROGRAM,
        "super_admin_broadcast": None,
        "integrations": DEFAULT_INTEGRATIONS,
        "saved_analyses": [],
        "export_history": [],
        "active_user_snapshot": DEFAULT_USER,
    }
    for key, value in config_seeds.items():
        if not db.platform_config.find_one({"key": key}):
            db.platform_config.insert_one(
                {
                    "key": key,
                    "value": value,
                    "updated_at": now_iso,
                }
            )

