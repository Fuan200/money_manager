from uuid import UUID, uuid4
from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timezone

from models.user import User
from models.icon import Icon
from models.transfer import Transfer
from models.transaction import Transaction


class Account(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})

    name: str = Field(nullable=False)
    balance: Decimal = Field(sa_column=Column(Numeric(18, 2), nullable=False))
    balance_include: bool = Field(default=True, nullable=False)
    saving: bool = Field(default=False, nullable=False)

    user_id: UUID = Field(foreign_key="user.id")
    icon_id: Optional[UUID] = Field(default=None, foreign_key="icon.id")

    user: "User" = Relationship(back_populates="accounts")
    icon: Optional["Icon"] = Relationship(back_populates="accounts")
    transactions: List["Transaction"] = Relationship(back_populates="account")
    outcome_transfers: List["Transfer"] = Relationship(back_populates="outcome_account", sa_relationship_kwargs={"foreign_keys": "[Transfer.outcome_account_id]"},)
    income_transfers: List["Transfer"] = Relationship(back_populates="income_account", sa_relationship_kwargs={"foreign_keys": "[Transfer.income_account_id]"},)
