from datetime import datetime
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, ConfigDict
from uuid import UUID

T = TypeVar("T")


class CategoryPublic(BaseModel):
    id: UUID

    created_at: datetime
    updated_at: datetime

    name: str
    type: bool
    icon: Optional["CategoryIconPublic"] = None

    model_config = ConfigDict(from_attributes=True)


class CategoryIconPublic(BaseModel):
    id: UUID
    label: str
    url: str

    model_config = ConfigDict(from_attributes=True)


class CreateCategory(BaseModel):
    name: str
    type: bool
    icon_id: Optional[UUID] = None


class UpdateCategory(BaseModel):
    name: Optional[str] = None
    type: Optional[bool] = None
    icon_id: Optional[UUID] = None


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
