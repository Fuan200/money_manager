from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from typing import List
from datetime import datetime, timezone

from models.account import Account
from models.category import Category


class Icon(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})

    label: str = Field(nullable=False)
    url: str = Field(nullable=False)

    accounts: List["Account"] = Relationship(back_populates="icon")
    categories: List["Category"] = Relationship(back_populates="icon")
