from datetime import datetime, timezone
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.database import get_db, serialize_doc
from app.schemas.transaction_schemas import (
    TransactionAuditEditSchema,
    TransactionCreateSchema,
)
from app.utils.responses import error_response, success_response, validate_json

transactions_bp = Blueprint(
    "transactions", __name__, url_prefix="/api/v1/transactions"
)


@transactions_bp.route("", methods=["GET"])
@transactions_bp.route("/", methods=["GET"])
@jwt_required(optional=True)
def list_transactions():
    """
    List financial ledger transactions with optional filtering by architectureId and type.
    """
    db = get_db()
    arch_id = request.args.get("architectureId")
    tx_type = request.args.get("type")
    limit = min(int(request.args.get("limit", "200")), 1000)

    query: dict = {}
    if arch_id:
        query["architectureId"] = arch_id
    if tx_type:
        query["type"] = tx_type.upper()

    cursor = db.transactions.find(query).sort("timestamp", -1).limit(limit)
    items = []
    for doc in cursor:
        clean = serialize_doc(doc)
        clean.pop("_id", None)
        items.append(clean)
    return success_response(data=items)


@transactions_bp.route("", methods=["POST"])
@transactions_bp.route("/", methods=["POST"])
@jwt_required(optional=True)
@validate_json(TransactionCreateSchema)
def create_transaction(validated_data: TransactionCreateSchema):
    """
    Record a new financial ledger transaction (INFLOW or OUTFLOW) and synchronize
    workspace financial metrics.
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    now_ms = int(now.timestamp() * 1000)
    scope_key = request.args.get("scopeKey", "default")

    raw_dump = validated_data.model_dump(exclude_none=True)
    tx_id = str(raw_dump.get("id") or f"TX-{now_ms}")
    arch_id = raw_dump.get("architectureId", "make-and-sell")
    amount = float(raw_dump.get("amountRWF", 0))
    tx_type = raw_dump.get("type", "INFLOW")

    tx_doc = {
        **raw_dump,
        "id": tx_id,
        "architectureId": arch_id,
        "type": tx_type,
        "amountRWF": amount,
        "timestamp": raw_dump.get("timestamp") or now_iso,
        "editHistory": raw_dump.get("editHistory") or [],
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    db.transactions.insert_one(tx_doc)

    # Synchronize workspace cashflow metrics
    ws_doc = db.workspaces.find_one(
        {"scopeKey": scope_key, "architectureId": arch_id}
    )
    if ws_doc and amount > 0:
        spendable = float(ws_doc.get("spendableRWF", 0))
        monthly_rev = float(ws_doc.get("monthlyRevenueRWF", 0))
        net_profit = float(ws_doc.get("netProfitRWF", 0))
        today_in = float(ws_doc.get("todayMoneyInRWF", 0))
        today_costs = float(ws_doc.get("todayCostsRWF", 0))
        today_profit = float(ws_doc.get("todayProfitRWF", 0))

        if tx_type == "INFLOW":
            spendable += amount
            monthly_rev += amount
            today_in += amount
            est_profit = round(amount * 0.32)
            net_profit += est_profit
            today_profit += est_profit
        else:
            spendable = max(0.0, spendable - amount)
            today_costs += amount
            net_profit -= amount
            today_profit -= amount

        db.workspaces.update_one(
            {"_id": ws_doc["_id"]},
            {
                "$set": {
                    "spendableRWF": spendable,
                    "monthlyRevenueRWF": monthly_rev,
                    "netProfitRWF": net_profit,
                    "todayMoneyInRWF": today_in,
                    "todayCostsRWF": today_costs,
                    "todayProfitRWF": today_profit,
                    "updated_at": now_iso,
                }
            },
        )

    clean_tx = serialize_doc(tx_doc)
    clean_tx.pop("_id", None)
    return success_response(
        data=clean_tx,
        message="Transaction recorded in financial ledger.",
        status_code=201,
    )


@transactions_bp.route("/<string:tx_id>", methods=["PATCH"])
@jwt_required(optional=True)
@validate_json(TransactionAuditEditSchema)
def edit_transaction_with_audit(
    tx_id: str, validated_data: TransactionAuditEditSchema
):
    """
    Edit an existing transaction while appending an immutable audit entry to `editHistory`
    and adjusting the corresponding architecture workspace cashflow delta.
    Matches editTransactionWithAudit() in ExbosContext.jsx.
    """
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    scope_key = request.args.get("scopeKey", "default")

    tx_doc = db.transactions.find_one({"id": tx_id})
    if not tx_doc:
        return error_response(
            error=f"Transaction '{tx_id}' not found.", status_code=404
        )

    prev_amount = float(tx_doc.get("amountRWF", 0))
    new_amount = (
        float(validated_data.amountRWF)
        if validated_data.amountRWF is not None
        else prev_amount
    )
    prev_title = str(tx_doc.get("title", ""))
    new_title = (
        validated_data.title if validated_data.title is not None else prev_title
    )

    audit_entry = {
        "timestamp": now_iso,
        "editor": validated_data.editor,
        "previousAmountRWF": prev_amount,
        "newAmountRWF": new_amount,
        "previousTitle": prev_title,
        "newTitle": new_title,
        "reason": validated_data.reason,
    }

    edit_history = list(tx_doc.get("editHistory") or [])
    edit_history.append(audit_entry)

    updates: dict = {
        "amountRWF": new_amount,
        "title": new_title,
        "editHistory": edit_history,
        "lastEditedAt": now_iso,
        "updated_at": now_iso,
    }
    if validated_data.category is not None:
        updates["category"] = validated_data.category
    if validated_data.paymentMethod is not None:
        updates["paymentMethod"] = validated_data.paymentMethod
    if validated_data.status is not None:
        updates["status"] = validated_data.status

    db.transactions.update_one({"_id": tx_doc["_id"]}, {"$set": updates})

    # Apply cashflow delta to workspace if amount changed
    delta = new_amount - prev_amount
    arch_id = tx_doc.get("architectureId", "make-and-sell")
    tx_type = tx_doc.get("type", "INFLOW")
    if delta != 0:
        ws_doc = db.workspaces.find_one(
            {"scopeKey": scope_key, "architectureId": arch_id}
        )
        if ws_doc:
            spendable = float(ws_doc.get("spendableRWF", 0))
            monthly_rev = float(ws_doc.get("monthlyRevenueRWF", 0))
            net_profit = float(ws_doc.get("netProfitRWF", 0))
            if tx_type == "INFLOW":
                spendable = max(0.0, spendable + delta)
                monthly_rev = max(0.0, monthly_rev + delta)
                net_profit += delta
            else:
                spendable = max(0.0, spendable - delta)
                net_profit -= delta
            db.workspaces.update_one(
                {"_id": ws_doc["_id"]},
                {
                    "$set": {
                        "spendableRWF": spendable,
                        "monthlyRevenueRWF": monthly_rev,
                        "netProfitRWF": net_profit,
                        "updated_at": now_iso,
                    }
                },
            )

    tx_doc.update(updates)
    clean_tx = serialize_doc(tx_doc)
    clean_tx.pop("_id", None)
    return success_response(
        data=clean_tx,
        message="Transaction updated and immutable audit entry recorded.",
    )

