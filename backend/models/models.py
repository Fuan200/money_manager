from uuid import UUID, uuid4
from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timezone


class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    email: str = Field(unique=True, index=True)
    password_hash: str

    accounts: List["Account"] = Relationship(back_populates="user")
    categories: List["Category"] = Relationship(back_populates="user")
    transactions: List["Transaction"] = Relationship(back_populates="user")
    transfers: List["Transfer"] = Relationship(back_populates="user")


class Icon(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    label: str = Field(nullable=False)
    url: str = Field(nullable=False)

    accounts: List["Account"] = Relationship(back_populates="icon")
    categories: List["Category"] = Relationship(back_populates="icon")


class Account(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    name: str = Field(nullable=False)
    balance: Decimal = Field(sa_column=Column(Numeric(18, 2), nullable=False))
    balance_include: bool = Field(default=True, nullable=False)
    saving: bool = Field(default=False, nullable=False)
    is_debit: bool = Field(nullable=False)  # 0 False (is_not_debit) / 1 True (is_debit)

    user_id: UUID = Field(foreign_key="user.id")
    icon_id: Optional[UUID] = Field(default=None, foreign_key="icon.id")

    user: "User" = Relationship(back_populates="accounts")
    icon: Optional["Icon"] = Relationship(back_populates="accounts")
    transactions: List["Transaction"] = Relationship(back_populates="account")
    outcome_transfers: List["Transfer"] = Relationship(
        back_populates="outcome_account",
        sa_relationship_kwargs={"foreign_keys": "[Transfer.outcome_account_id]"},
    )
    income_transfers: List["Transfer"] = Relationship(
        back_populates="income_account",
        sa_relationship_kwargs={"foreign_keys": "[Transfer.income_account_id]"},
    )


class Category(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    name: str = Field(nullable=False)
    type: bool = Field(nullable=False)

    user_id: UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    icon_id: Optional[UUID] = Field(default=None, foreign_key="icon.id")

    user: "User" = Relationship(back_populates="categories")
    icon: Optional["Icon"] = Relationship(back_populates="categories")
    transactions: List["Transaction"] = Relationship(back_populates="category")


class Transfer(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    amount: Decimal = Field(sa_column=Column(Numeric(18, 2), nullable=False))
    description: str = Field(nullable=False)
    transfer_at: datetime  # *

    user_id: UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    outcome_account_id: UUID = Field(foreign_key="account.id", ondelete="RESTRICT")
    income_account_id: UUID = Field(foreign_key="account.id", ondelete="RESTRICT")

    user: "User" = Relationship(back_populates="transfers")
    outcome_account: "Account" = Relationship(
        back_populates="outcome_transfers",
        sa_relationship_kwargs={"foreign_keys": "Transfer.outcome_account_id"},
    )
    income_account: "Account" = Relationship(
        back_populates="income_transfers",
        sa_relationship_kwargs={"foreign_keys": "Transfer.income_account_id"},
    )


class Transaction(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

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
