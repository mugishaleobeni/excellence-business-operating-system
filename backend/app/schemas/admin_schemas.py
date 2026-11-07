from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class SubscriptionUpdateSchema(BaseModel):
    """
    Pydantic v2 schema for Super Admin tenant subscription management.
    Enforces Section 8.2 separation between Paid MRR and Complimentary access grants.
    """

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    plan: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default=None)
    billingType: Optional[Literal["Paid", "Complimentary"]] = Field(default=None)
    mrrRWF: Optional[float] = Field(default=None, ge=0)
    complimentaryReason: Optional[str] = Field(default=None)
    complimentaryMonths: Optional[int] = Field(default=None, ge=0)
    complimentaryExpiresAt: Optional[str] = Field(default=None)
    grantedBy: Optional[str] = Field(default=None)


class PricingPlanUpdateSchema(BaseModel):
    """Pydantic v2 schema for updating a platform pricing tier."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    name: Optional[str] = None
    tagline: Optional[str] = None
    monthlyPriceRWF: Optional[float] = Field(default=None, ge=0)
    annualPriceRWF: Optional[float] = Field(default=None, ge=0)
    badge: Optional[str] = None
    highlighted: Optional[bool] = None
    maxUsers: Optional[int] = Field(default=None, ge=1)
    features: Optional[list[str]] = None


class PlatinumProgramSchema(BaseModel):
    """Pydantic v2 schema for updating the Platinum Partner Program configuration."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    name: Optional[str] = None
    headline: Optional[str] = None
    monthlyRetainerRWF: Optional[float] = Field(default=None, ge=0)
    annualRetainerRWF: Optional[float] = Field(default=None, ge=0)
    spotsTotal: Optional[int] = Field(default=None, ge=1)
    spotsRemaining: Optional[int] = Field(default=None, ge=0)
    enrollmentOpen: Optional[bool] = None
    perks: Optional[list[str]] = None


class BroadcastSchema(BaseModel):
    """Pydantic v2 schema for Super Admin global or architecture-targeted broadcasts."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    title: str = Field(..., min_length=1, max_length=160)
    message: str = Field(..., min_length=1, max_length=1000)
    type: Literal["info", "warning", "urgent", "success"] = Field(default="info")
    targetArchitecture: str = Field(default="all")
    active: bool = Field(default=True)


class FinancialAnalysisSchema(BaseModel):
    """Pydantic v2 schema for saving financial calculator scenarios."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    title: str = Field(default="Financial Scenario Analysis", min_length=1, max_length=200)
    toolId: str = Field(default="break-even")
    architectureId: str = Field(default="make-and-sell")
    inputs: dict[str, Any] = Field(default_factory=dict)
    results: dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = Field(default="")


class IntegrationToggleSchema(BaseModel):
    """Pydantic v2 schema for toggling external integrations (Gmail, Google Drive, WhatsApp)."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    connected: Optional[bool] = None
    accountEmail: Optional[str] = None
    phone: Optional[str] = None
    folderName: Optional[str] = None
    autoSendReceipts: Optional[bool] = None
    autoBackupDaily: Optional[bool] = None
    sendDebtReminders: Optional[bool] = None


class ExportRecordSchema(BaseModel):
    """Pydantic v2 schema for logging document/report exports."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    title: str = Field(..., min_length=1, max_length=200)
    format: str = Field(default="CSV")
    module: str = Field(default="Overview")
    architectureId: str = Field(default="make-and-sell")
    rowCount: int = Field(default=0, ge=0)

