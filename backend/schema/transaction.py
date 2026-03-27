from datetime import datetime
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from uuid import UUID

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

    user_id: UUID
    account_id: UUID
    category_id: UUID
    model_config = ConfigDict(from_attributes=True)


class CreateTransaction(BaseModel):
    amount: Decimal
    description: str
    type: bool
    external_expense: bool = False
    transaction_date: datetime
    account_id: UUID
    category_id: UUID


class UpdateTransaction(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    type: Optional[bool] = None
    external_expense: Optional[bool] = None
    transaction_date: Optional[datetime] = None
    account_id: Optional[UUID] = None
    category_id: Optional[UUID] = None

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
