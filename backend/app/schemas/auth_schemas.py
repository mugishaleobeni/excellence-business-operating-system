from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.seed_defaults import ARCHITECTURE_IDS


class RegisterBusinessSchema(BaseModel):
    """Pydantic v2 schema for the 7-step guided business registration flow."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    fullName: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(default="+250 788 000 000", max_length=40)
    password: str = Field(default="ExbosPass2026!", min_length=4, max_length=128)
    architectureId: str = Field(default="make-and-sell")
    businessName: str = Field(..., min_length=2, max_length=150)
    businessCategory: Optional[str] = Field(default="General SME")
    country: str = Field(default="Rwanda")
    location: str = Field(default="Kigali")
    currency: str = Field(default="RWF")
    language: str = Field(default="en")
    planTier: str = Field(default="Growth Plan")
    enabledActivities: list[str] = Field(
        default_factory=lambda: ["buy-and-sell", "services"]
    )
    demoSpendableRWF: float = Field(default=0, ge=0)
    demoMonthlyRevenueRWF: float = Field(default=0, ge=0)
    demoPrimaryItem: Optional[str] = Field(default=None)

    @field_validator("architectureId")
    @classmethod
    def validate_architecture(cls, v: str) -> str:
        if v not in ARCHITECTURE_IDS:
            raise ValueError(f"architectureId must be one of {ARCHITECTURE_IDS}")
        return v


class LoginSchema(BaseModel):
    """Pydantic v2 schema for user authentication."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    email: EmailStr
    password: Optional[str] = Field(default="")
    architectureId: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    businessName: Optional[str] = Field(default=None)
    role: Optional[str] = Field(default=None)


class UpdateProfileSchema(BaseModel):
    """Pydantic v2 schema for updating current user profile and business settings."""

    model_config = ConfigDict(extra="allow", str_strip_whitespace=True)

    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    email: Optional[EmailStr] = Field(default=None)
    phone: Optional[str] = Field(default=None, max_length=40)
    businessName: Optional[str] = Field(default=None, min_length=1, max_length=150)
    architectureId: Optional[str] = Field(default=None)
    country: Optional[str] = Field(default=None)
    location: Optional[str] = Field(default=None)
    currency: Optional[str] = Field(default=None)
    language: Optional[str] = Field(default=None)
    plan: Optional[str] = Field(default=None)
    enabledActivities: Optional[list[str]] = Field(default=None)


class ForgotPasswordSchema(BaseModel):
    """Pydantic v2 schema for initiating a password reset code."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr


class ResetPasswordSchema(BaseModel):
    """Pydantic v2 schema for completing a password reset."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    code: str = Field(..., min_length=4, max_length=10)
    newPassword: str = Field(..., min_length=6, max_length=128)

