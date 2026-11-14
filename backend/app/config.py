import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    """Base configuration shared across all environments."""

    SECRET_KEY: str = os.getenv("SECRET_KEY", "exbos-default-secret-key-2026")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "exbos-default-jwt-secret-key-2026")
    JWT_TOKEN_LOCATION: list[str] = ["headers"]
    JWT_HEADER_NAME: str = "Authorization"
    JWT_HEADER_TYPE: str = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "1440"))
    )
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30"))
    )

    MONGO_URI: str = (
        os.getenv("MONGODB_URI")
        or os.getenv("MONGO_URI")
        or "mongodb+srv://username:password@cluster0.mongodb.net/exbos_db?retryWrites=true&w=majority"
    )
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "exbos_db")
    MONGO_MAX_POOL_SIZE: int = int(os.getenv("MONGO_MAX_POOL_SIZE", "50"))
    MONGO_MIN_POOL_SIZE: int = int(os.getenv("MONGO_MIN_POOL_SIZE", "1"))
    MONGO_SERVER_SELECTION_TIMEOUT_MS: int = int(
        os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "15000")
    )
    MONGO_CONNECT_TIMEOUT_MS: int = int(
        os.getenv("MONGO_CONNECT_TIMEOUT_MS", "15000")
    )
    MONGO_SOCKET_TIMEOUT_MS: int = int(
        os.getenv("MONGO_SOCKET_TIMEOUT_MS", "20000")
    )

    GMAIL_ADDRESS: str = os.getenv("GMAIL_ADDRESS", "")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")

    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://127.0.0.1:5173/dashboard?module=Documents"
    )

    WHATSAPP_ACCESS_TOKEN: str = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "exbos-whatsapp-verify-2026")
    WHATSAPP_OFFICIAL_NUMBER: str = os.getenv("WHATSAPP_OFFICIAL_NUMBER", "+250 781 963 981")
    META_APP_SECRET: str = os.getenv("META_APP_SECRET", "")

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://192.168.1.163:5173,https://exbos.pages.dev",
        ).split(",")
        if origin.strip()
    ]

    JSON_SORT_KEYS: bool = False


class DevelopmentConfig(BaseConfig):
    """Development environment configuration."""

    DEBUG: bool = True
    TESTING: bool = False


class ProductionConfig(BaseConfig):
    """Production environment configuration."""

    DEBUG: bool = False
    TESTING: bool = False


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config() -> type[BaseConfig]:
    env = os.getenv("FLASK_ENV", "development").lower()
    return CONFIG_MAP.get(env, DevelopmentConfig)

