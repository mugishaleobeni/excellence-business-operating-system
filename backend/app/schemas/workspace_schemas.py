from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class WorkspacePatchSchema(BaseModel):
    """Pydantic v2 schema for patching workspace KPIs, headlines, or active presets."""

    model_config = ConfigDict(extra="allow")

    businessName: Optional[str] = None
    spendableRWF: Optional[float] = None
    monthlyRevenueRWF: Optional[float] = None
    netProfitRWF: Optional[float] = None
    stockValueRWF: Optional[float] = None
    todayProfitRWF: Optional[float] = None
    todayMoneyInRWF: Optional[float] = None
    todayCostsRWF: Optional[float] = None
    owedToMeRWF: Optional[float] = None
    iOweSuppliersRWF: Optional[float] = None
    attentionHeadline: Optional[str] = None
    survivalMonths: Optional[float] = None
    primaryItem: Optional[str] = None
    activeTradePresetId: Optional[str] = None
    activeServicePresetId: Optional[str] = None
    activeAgriPresetId: Optional[str] = None
    activeFoodPresetId: Optional[str] = None
    activeHybridPresetId: Optional[str] = None
    enabledActivities: Optional[list[str]] = None
    records: Optional[dict[str, list[dict[str, Any]]]] = None


class ApplyPresetSchema(BaseModel):
    """Pydantic v2 schema for applying a specialized industry/trade preset to an architecture."""

    model_config = ConfigDict(extra="allow")

    presetId: str = Field(..., min_length=1, max_length=100)
    businessName: Optional[str] = None
    primaryItem: Optional[str] = None
    attentionHeadline: Optional[str] = None
    enabledActivities: Optional[list[str]] = None
    seedRecords: Optional[dict[str, list[dict[str, Any]]]] = None


class ModuleRecordCreateSchema(BaseModel):
    """
    Pydantic v2 schema for creating a record inside any of the 27 module record buckets
    (Sales, Purchases, Inventory, Production, Animals, MenuItems, HybridItems, MixedSales, etc.).
    Allows dynamic domain fields via extra='allow'.
    """

    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    title: Optional[str] = Field(default="Untitled Record", max_length=250)
    name: Optional[str] = Field(default=None, max_length=250)
    subtitle: Optional[str] = Field(default="")
    amountRWF: float = Field(default=0)
    status: str = Field(default="Completed")
    paymentMethod: Optional[str] = Field(default="Cash / MoMo")
    date: Optional[str] = None


class ModuleRecordUpdateSchema(BaseModel):
    """Pydantic v2 schema for updating an existing module record."""

    model_config = ConfigDict(extra="allow")

    title: Optional[str] = None
    name: Optional[str] = None
    subtitle: Optional[str] = None
    amountRWF: Optional[float] = None
    status: Optional[str] = None
    paymentMethod: Optional[str] = None


class StorageSnapshotSchema(BaseModel):
    """Pydantic v2 schema for the /api/storage full state sync payload."""

    model_config = ConfigDict(extra="allow")

    workspaces: Optional[dict[str, Any]] = None
    transactions: Optional[list[dict[str, Any]]] = None
    user: Optional[dict[str, Any]] = None
    businesses: Optional[list[dict[str, Any]]] = None
    pricingPlans: Optional[list[dict[str, Any]]] = None
    platinumProgram: Optional[dict[str, Any]] = None
    superAdminBroadcast: Optional[dict[str, Any]] = None
    savedAnalyses: Optional[list[dict[str, Any]]] = None
    integrations: Optional[dict[str, Any]] = None
    exportHistory: Optional[list[dict[str, Any]]] = None
    savedAt: Optional[int] = None

