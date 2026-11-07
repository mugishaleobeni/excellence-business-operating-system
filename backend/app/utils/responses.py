from functools import wraps
from typing import Any, Callable, Type
from flask import jsonify, request
from pydantic import BaseModel, ValidationError
from app.database import serialize_doc


def success_response(
    data: Any = None,
    message: str | None = None,
    status_code: int = 200,
    extra: dict[str, Any] | None = None,
):
    """Standardized JSON success envelope aligned with frontend expectations."""
    payload: dict[str, Any] = {"success": True}
    if message is not None:
        payload["message"] = message
    if data is not None:
        payload["data"] = serialize_doc(data)
    if extra:
        for k, v in extra.items():
            payload[k] = serialize_doc(v)
    return jsonify(payload), status_code


def error_response(
    error: str,
    status_code: int = 400,
    details: list[dict[str, Any]] | None = None,
):
    """Standardized JSON error envelope."""
    payload: dict[str, Any] = {
        "success": False,
        "error": error,
    }
    if details is not None:
        payload["details"] = details
    return jsonify(payload), status_code


def validate_json(schema_cls: Type[BaseModel]) -> Callable:
    """
    Decorator for mutating routes (POST, PUT, PATCH) that validates incoming
    JSON payloads against a Pydantic v2 model and returns a 400 Bad Request
    before any database operation if validation fails.
    """

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            raw_json = request.get_json(silent=True)
            if raw_json is None:
                return error_response(
                    "Invalid or missing JSON request body.", status_code=400
                )
            try:
                validated_model = schema_cls.model_validate(raw_json)
            except ValidationError as exc:
                formatted_errors = []
                for err in exc.errors():
                    loc_str = ".".join(str(part) for part in err.get("loc", []))
                    formatted_errors.append(
                        {
                            "field": loc_str,
                            "message": err.get("msg", "Invalid value"),
                            "type": err.get("type", "validation_error"),
                        }
                    )
                return error_response(
                    error="Validation failed for request payload.",
                    status_code=400,
                    details=formatted_errors,
                )
            kwargs["validated_data"] = validated_model
            return fn(*args, **kwargs)

        return wrapper

    return decorator

