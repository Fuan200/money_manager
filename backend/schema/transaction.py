from datetime import datetime
from decimal import Decimal
from typing import Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class TransactionPublic(BaseModel):
    id: UUID

    created_at: datetime
    updated_at: datetime

    amount: Decimal
    description: str
    type: bool
    external_expense: bool
    transaction_date: datetime

    account_id: UUID
    category_id: UUID
    category: "TransactionCategoryPublic"

    model_config = ConfigDict(from_attributes=True)


class TransactionCategoryIconPublic(BaseModel):
    id: UUID
    label: str
    url: str

    model_config = ConfigDict(from_attributes=True)


class TransactionCategoryPublic(BaseModel):
    id: UUID
    name: str
    type: bool
    icon: Optional[TransactionCategoryIconPublic] = None

    model_config = ConfigDict(from_attributes=True)


class CreateTransaction(BaseModel):
    amount: Decimal
    description: str
    type: bool
    transaction_date: datetime
    account_id: UUID
    category_id: UUID
    external_expense: Optional[bool] = False


class UpdateTransaction(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    type: Optional[bool] = None
    transaction_date: Optional[datetime] = None
    account_id: Optional[UUID] = None
    category_id: Optional[UUID] = None
    external_expense: Optional[bool] = None


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
