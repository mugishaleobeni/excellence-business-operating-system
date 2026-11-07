from flask import Flask
from app.routes.auth import auth_bp
from app.routes.health import health_bp
from app.routes.storage import storage_bp
from app.routes.super_admin import super_admin_bp
from app.routes.tools import tools_bp
from app.routes.transactions import transactions_bp
from app.routes.workspaces import workspaces_bp


def register_blueprints(app: Flask) -> None:
    """Register all modular Flask Blueprints on the application instance."""
    app.register_blueprint(health_bp)
    app.register_blueprint(storage_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(workspaces_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(super_admin_bp)
    app.register_blueprint(tools_bp)


__all__ = [
    "auth_bp",
    "health_bp",
    "register_blueprints",
    "storage_bp",
    "super_admin_bp",
    "tools_bp",
    "transactions_bp",
    "workspaces_bp",
]

