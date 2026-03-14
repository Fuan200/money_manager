from datetime import datetime
from typing import Generic, Optional, TypeVar
from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID

T = TypeVar("T")


class LoginDto(BaseModel):
    email: EmailStr
    password: str


class CreateUser(BaseModel):
    email: EmailStr
    password: str


class UpdateUser(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T


class AuthResponse(BaseModel):
    email: EmailStr
    token: str
