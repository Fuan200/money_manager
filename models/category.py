from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime, timezone

from models.user import User
from models.icon import Icon
from models.transaction import Transaction


class Category(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})

    name: str = Field(nullable=False)
    type: bool = Field(nullable=False)

    user_id: UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    icon_id: Optional[UUID] = Field(default=None, foreign_key="icon.id")

    user: "User" = Relationship(back_populates="categories")
    icon: Optional["Icon"] = Relationship(back_populates="categories")
    transactions: List["Transaction"] = Relationship(back_populates="category")