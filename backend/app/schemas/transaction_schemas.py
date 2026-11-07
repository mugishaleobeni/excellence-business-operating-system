from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class TransactionCreateSchema(BaseModel):
    """Pydantic v2 schema for recording a new financial ledger transaction."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    id: Optional[str] = None
    architectureId: str = Field(default="make-and-sell")
    type: Optional[str] = Field(default="INFLOW")
    category: str = Field(default="Sales", min_length=1, max_length=100)
    title: str = Field(default="Financial Transaction", max_length=250)
    amountRWF: float = Field(default=0, ge=0)
    paymentMethod: Optional[str] = Field(default="MTN MoMo")
    account: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default="Completed")
    customerOrSupplier: Optional[str] = Field(default="")
    notes: Optional[str] = Field(default="")
    timestamp: Optional[str] = None
    date: Optional[str] = None
    editHistory: list[dict[str, Any]] = Field(default_factory=list)


class TransactionAuditEditSchema(BaseModel):
    """
    Pydantic v2 schema for editing a financial transaction with an immutable audit entry.
    Matches editTransactionWithAudit(txId, updates, editorName) in ExbosContext.jsx.
    """

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    amountRWF: Optional[float] = Field(default=None, ge=0)
    title: Optional[str] = Field(default=None, min_length=1, max_length=250)
    category: Optional[str] = Field(default=None)
    paymentMethod: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default=None)
    reason: str = Field(default="Manual correction via ledger audit", min_length=1)
    editor: str = Field(default="Business Owner")

