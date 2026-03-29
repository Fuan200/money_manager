from datetime import datetime
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, EmailStr
from decimal import Decimal
from uuid import UUID

T = TypeVar("T")


class AccountPublic(BaseModel):
    id: UUID

    created_at: datetime
    updated_at: datetime

    name: str
    balance: Decimal
    balance_include: bool
    saving: bool
    is_debit: bool

    model_config = ConfigDict(from_attributes=True)


class CreateAccount(BaseModel):
    name: str
    balance: Decimal
    balance_include: Optional[bool] = None
    saving: Optional[bool] = None
    is_debit: bool
    icon_id: Optional[UUID] = None


class UpdateAccount(BaseModel):
    name: Optional[str] = None
    balance: Optional[Decimal] = None
    balance_include: Optional[bool] = None
    saving: Optional[bool] = None
    is_debit: Optional[bool] = None
    icon_id: Optional[UUID] = None


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
