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

    try:
        _mongo_client = MongoClient(mongo_uri, **client_kwargs)
        _mongo_db = _mongo_client[db_name]
        ensure_indexes(_mongo_db)
        seed_initial_collections(_mongo_db)
        logger.info("MongoDB connected and indexes verified on database '%s'.", db_name)
    except PyMongoError as exc:
        logger.warning(
            "MongoDB Atlas unreachable (%s). Falling back to resilient in-memory store.",
            exc,
        )
        from app.memory_db import InMemoryDatabase

        _mongo_db = InMemoryDatabase(db_name)
        seed_initial_collections(_mongo_db)

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
        [("scopeKey", ASCENDING), ("architectureId", ASCENDING), ("timestamp", DESCENDING)],
        name="idx_transactions_scope_arch_time",
    )
    db.transactions.create_index(
        [("architectureId", ASCENDING), ("timestamp", DESCENDING)],
        name="idx_transactions_arch_time",
    )

    db.module_records.create_index(
        [
            ("scopeKey", ASCENDING),
            ("architectureId", ASCENDING),
            ("bucket", ASCENDING),
            ("id", ASCENDING),
        ],
        unique=True,
        name="idx_module_records_lookup",
    )
    db.module_records.create_index(
        [("architectureId", ASCENDING), ("bucket", ASCENDING)],
        name="idx_module_records_arch_bucket",
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
    """
    Ensure clean platform config keys exist in MongoDB, and purge any legacy
    or demo business records, demo transactions, and unused default workspaces.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Permanently purge any legacy or demo tenant businesses if present
    db.businesses.delete_many(
        {
            "$or": [
                {"id": {"$regex": "^BIZ-10[0-9]{2}$"}},
                {"status": {"$regex": "Demo", "$options": "i"}},
                {
                    "auditNote": {
                        "$regex": "Demo|Guided 7-Step Setup|14-day Gold|Forever Free|Annual enterprise",
                        "$options": "i",
                    }
                },
                {
                    "email": {
                        "$in": [
                            "founder@exbosbusiness.rw",
                            "jp@kigaliprime.rw",
                            "patrick@millebistro.rw",
                            "diane@luminastudio.rw",
                            "pacifique@techpulse.rw",
                        ]
                    }
                },
            ]
        }
    )

    # 2. Purge any legacy demo transactions and unused 'default' scope workspaces
    db.transactions.delete_many(
        {
            "$or": [
                {"createdBy": {"$regex": "Demo", "$options": "i"}},
                {
                    "id": {
                        "$in": [
                            "TX-2148",
                            "TX-3823",
                            "TX-9004",
                            "TX-9003",
                            "TX-9002",
                            "TX-9001",
                        ]
                    }
                },
            ]
        }
    )
    db.workspaces.delete_many({"scopeKey": "default"})
    db.module_records.delete_many({"scopeKey": "default"})

    # 3. Seed platform_config keys with clean empty arrays/states
    config_seeds = {
        "pricing_plans": DEFAULT_PRICING_PLANS,
        "platinum_program": DEFAULT_PLATINUM_PROGRAM,
        "super_admin_broadcast": None,
        "integrations": DEFAULT_INTEGRATIONS,
        "saved_analyses": [],
        "export_history": [],
        "active_user_snapshot": None,
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

