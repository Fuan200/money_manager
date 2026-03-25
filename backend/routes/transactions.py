from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from core.database import get_session
from models import Account, Category, Transaction, User
from routes.users import get_current_user
from schema.transaction import CreateTransaction, SuccessResponse, TransactionPublic

transactions = APIRouter(prefix="/transactions", tags=["transactions"])


@transactions.get("/get-all-transactions-by-user", response_model=SuccessResponse[List[TransactionPublic]])
def get_transactions(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = (
        select(Transaction)
        .options(selectinload(Transaction.category).selectinload(Category.icon))
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
    )
    transactions = session.exec(statement).all()
    return {"success": True, "data": transactions}


@transactions.post("/create-transaction", response_model=SuccessResponse[TransactionPublic])
def create_transaction(
    transaction_data: CreateTransaction,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        if transaction_data.amount <= 0:
            raise HTTPException(status_code=400, detail="INVALID AMOUNT")

        if not transaction_data.description.strip():
            raise HTTPException(status_code=400, detail="DESCRIPTION REQUIRED")

        account = session.get(Account, transaction_data.account_id)
        category = session.get(Category, transaction_data.category_id)

        if not account:
            raise HTTPException(status_code=404, detail="ACCOUNT NOT FOUND")

        if account.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="ACCOUNT NOT FOUND")

        if not category:
            raise HTTPException(status_code=404, detail="CATEGORY NOT FOUND")

        if category.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="CATEGORY NOT FOUND")

        if category.type != transaction_data.type:
            raise HTTPException(status_code=400, detail="CATEGORY TYPE MISMATCH")

        if not transaction_data.type and not transaction_data.external_expense:
            if account.balance < transaction_data.amount:
                raise HTTPException(status_code=400, detail="INSUFFICIENT BALANCE")
            account.balance -= transaction_data.amount
        elif transaction_data.type:
            account.balance += transaction_data.amount

        transaction = Transaction(
            amount=transaction_data.amount,
            description=transaction_data.description.strip(),
            type=transaction_data.type,
            external_expense=transaction_data.external_expense or False,
            transaction_date=transaction_data.transaction_date,
            user_id=current_user.id,
            account_id=transaction_data.account_id,
            category_id=transaction_data.category_id,
        )

        session.add(transaction)
        session.commit()
        statement = (
            select(Transaction)
            .options(selectinload(Transaction.category).selectinload(Category.icon))
            .where(Transaction.id == transaction.id)
        )
        created_transaction = session.exec(statement).first()

        return {"success": True, "data": created_transaction}
    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=500, detail="ERROR PROCESSING TRANSACTION") from None
