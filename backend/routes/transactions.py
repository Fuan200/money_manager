from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from uuid import UUID
from typing import List

from core.database import get_session
from routes.users import get_current_user
from models import Account, User, Transaction,Category

from schema.transaction import CreateTransaction, UpdateTransaction, TransactionPublic, SuccessResponse

transactions = APIRouter(prefix="/transactions", tags=["transactions"])

@transactions.get("/get-all-transactions-by-user", response_model=SuccessResponse[List[TransactionPublic]])
def get_transactions(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(Transaction).where(Transaction.user_id == current_user.id).order_by(Transaction.transaction_date.desc())
    transactions = session.exec(statement).all()
    return {"success": True, "data": transactions}


@transactions.post("/create-transaction", response_model=SuccessResponse[TransactionPublic])
def create_transaction(transaction_data: CreateTransaction, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    account = session.get(Account, transaction_data.account_id)

    if not account:
        raise HTTPException(status_code=404, detail="ACCOUNT_NOT_FOUND")
    
    category = session.get(Category, transaction_data.category_id)
    if not category:
        raise HTTPException(status_code=404, detail="CATEGORY_NOT_FOUND")
    
    transaction = Transaction(
        amount=transaction_data.amount,
        description=transaction_data.description,
        type=transaction_data.type if transaction_data.type is not None else False,
        external_expense=transaction_data.external_expense if transaction_data.external_expense is not None else False,
        transaction_date=transaction_data.transaction_date,
        account_id=transaction_data.account_id,
        category_id=transaction_data.category_id,
        user_id=current_user.id,
    )
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    
    return {"success": True, "data": transaction}

@transactions.patch("/update-transactions/{id}", response_model=SuccessResponse[TransactionPublic])
def update_transaction(id: UUID, transaction_data: UpdateTransaction, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    transaction = session.get(Transaction, id)

    if not transaction or transaction.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="TRANSACTION_NOT_FOUND")
    
    if transaction_data.account_id:
        account = session.get(Account, transaction_data.account_id)
        if not account:
            raise HTTPException(status_code=404, detail="ACCOUNT_NOT_FOUND")
        
    if transaction_data.category_id:
        category = session.get(Category, transaction_data.category_id)
        if not category:
            raise HTTPException(status_code=404, detail="CATEGORY_NOT_FOUND")
        
    update_data = transaction_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transaction, key, value)

    session.add(transaction)
    session.commit()
    session.refresh(transaction)

    return {"success": True, "data": transaction}


@transactions.delete("/delete-transactions/{id}", response_model=SuccessResponse[TransactionPublic])
def delete_transaction(id: UUID, session: Session = Depends(get_session),current_user: User = Depends(get_current_user)):
    transaction = session.get(Transaction, id)

    if not transaction or transaction.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="TRANSACTION NOT FOUND")
    
    session.delete(transaction)
    session.commit()

    return {"success": True, "data": transaction}
