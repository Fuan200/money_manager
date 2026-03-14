from uuid import UUID, uuid4
from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal
from datetime import datetime, timezone

from models.user import User
from models.account import Account


class Transfer(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)})

    amount: Decimal = Field(sa_column=Column(Numeric(18, 2), nullable=False))
    description: str = Field(nullable=False)
    transfer_at: datetime # *
    
    user_id: UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    outcome_account_id: UUID = Field(foreign_key="account.id", ondelete="RESTRICT")
    income_account_id: UUID = Field(foreign_key="account.id", ondelete="RESTRICT")

    user: "User" = Relationship(back_populates="transfers")
    outcome_account: "Account" = Relationship(back_populates="outcome_transfers",sa_relationship_kwargs={"foreign_keys": "Transfer.outcome_account_id"},)
    income_account: "Account" = Relationship(back_populates="income_transfers",sa_relationship_kwargs={"foreign_keys": "Transfer.income_account_id"},)