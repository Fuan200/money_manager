from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlmodel import Session, select
from uuid import UUID
from decimal import Decimal
from typing import List

from core.database import get_session
from routes.users import get_current_user
from models import Account, Icon, User

from schema.account import AccountPublic, CreateAccount, UpdateAccount, AccountsTotal, SuccessResponse

accounts = APIRouter(prefix="/accounts", tags=["accounts"])


@accounts.get("/get-all-accounts-by-user", response_model=SuccessResponse[List[AccountPublic]])
def get_accounts(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(Account).where(Account.user_id == current_user.id).order_by(Account.created_at.desc())
    accounts = session.exec(statement).all()
    return {"success": True, "data": accounts}


@accounts.get("/get-account-by-id/{id}", response_model=SuccessResponse[AccountPublic])
def get_account(id: UUID, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    account = session.get(Account, id)

    if not account or account.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="ACCOUNT NOT FOUND")

    return {"success": True, "data": account}


@accounts.get("/get-accounts-total", response_model=SuccessResponse[AccountsTotal])
def get_accounts_total(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement_debit = select(func.sum(Account.balance)).where(
        Account.user_id == current_user.id, Account.balance_include == True, Account.is_debit == True
    )
    statement_credit = select(func.sum(Account.balance)).where(
        Account.user_id == current_user.id, Account.balance_include == True, Account.is_debit == False
    )

    total_debit = session.exec(statement_debit).one() or Decimal(0)
    total_credit = session.exec(statement_credit).one() or Decimal(0)
    return {"success": True, "data": {"total_debit": total_debit, "total_credit": total_credit}}


@accounts.post("/create-account", response_model=SuccessResponse[AccountPublic])
def create_account(account_data: CreateAccount, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if account_data.icon_id:
        icon = session.get(Icon, account_data.icon_id)
        if not icon:
            raise HTTPException(status_code=404, detail="ICON NOT FOUND")

    account = Account(
        name=account_data.name,
        balance=account_data.balance,
        balance_include=account_data.balance_include if account_data.balance_include is not None else True,
        saving=account_data.saving if account_data.saving is not None else False,
        is_debit=account_data.is_debit,
        user_id=current_user.id,
        icon_id=account_data.icon_id,
    )

    session.add(account)
    session.commit()
    session.refresh(account)

    return {"success": True, "data": account}


@accounts.patch("/update-account/{id}", response_model=SuccessResponse[AccountPublic])
def update_account(id: UUID, account_data: UpdateAccount, session=Depends(get_session)):
    account = session.get(Account, id)

    if not account:
        raise HTTPException(status_code=404, detail="ACCOUNT NOT FOUND")

    if account_data.icon_id:
        icon = session.get(Icon, account_data.icon_id)
        if not icon:
            raise HTTPException(status_code=404, detail="ICON NOT FOUND")

    update_data = account_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(account, key, value)

    session.add(account)
    session.commit()
    session.refresh(account)

    return {"success": True, "data": account}


@accounts.delete("/delete-account/{id}", response_model=SuccessResponse[AccountPublic])
def delete_user(id: UUID, session: Session = Depends(get_session)):
    account = session.get(Account, id)

    if not account:
        raise HTTPException(status_code=404, detail="ACCOUNT NOT FOUND")

    session.delete(account)
    session.commit()

    return {"success": True, "data": account}
