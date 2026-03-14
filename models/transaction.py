from uuid import UUID, uuid4
from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal
from datetime import datetime, timezone

from models.user import User
from models.account import Account
from models.category import Category


class Transaction(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})

    amount: Decimal = Field(sa_column=Column(Numeric(18, 2), nullable=False))
    description: str = Field(nullable=False)
    type: bool = Field(nullable=False)
    external_expense: bool = Field(default=False, nullable=False)
    transaction_date: datetime


    user_id: UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    account_id: UUID = Field(foreign_key="account.id", nullable=False)
    category_id: UUID = Field(foreign_key="category.id", nullable=False)

    user: "User" = Relationship(back_populates="transactions")
    account: "Account" = Relationship(back_populates="transactions")
    category: "Category" = Relationship(back_populates="transactions")