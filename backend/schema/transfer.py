from datetime import datetime
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, EmailStr
from decimal import Decimal
from uuid import UUID

T = TypeVar("T")


class TransferPublic(BaseModel):
    id: UUID

    created_at: datetime
    updated_at: datetime

    amount: Decimal
    description: str
    transfer_at: datetime

    user_id: UUID
    outcome_account_id: UUID
    income_account_id: UUID

    model_config = ConfigDict(from_attributes=True)


class CreateTransfer(BaseModel):
    amount: Decimal
    description: str
    transfer_at: datetime

    outcome_account_id: UUID
    income_account_id: UUID


class UpdateTransfer(BaseModel):
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    transfer_at: Optional[datetime] = None

    outcome_account_id: Optional[UUID] = None
    income_account_id: Optional[UUID] = None


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
