from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select
from uuid import UUID
from typing import List

from core.database import get_session
from routes.users import get_current_user
from models import Transfer, Icon, User, Account

from schema.transfer import TransferPublic, CreateTransfer, UpdateTransfer, SuccessResponse

transfers = APIRouter(prefix="/transfers", tags=["transfers"])


@transfers.get("/get-all-transfers-by-user", response_model=SuccessResponse[List[TransferPublic]])
def get_transfers(session: Session = Depends(get_session), curren_user: User = Depends(get_current_user)):
    statement = select(Transfer).where(Transfer.user_id == curren_user.id).order_by(Transfer.created_at.desc())
    transfers = session.exec(statement).all()
    return {"success": True, "data": transfers}


@transfers.get("/get-transfer-by-id/{id}", response_model=SuccessResponse[TransferPublic])
def get_transfer(id: UUID, session: Session = Depends(get_session), curren_user: User = Depends(get_current_user)):
    transfer = session.get(Transfer, id)
    # TO DO: CHECK IF ACCOUNTS EXIST ????
    return {"success": True, "data": transfer}


@transfers.post("/create-transfer", response_model=SuccessResponse[TransferPublic])
def create_transfer(transfer_data: CreateTransfer, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    try:
        outcome_account = session.get(Account, transfer_data.outcome_account_id)
        income_account = session.get(Account, transfer_data.income_account_id)

        if not outcome_account or not income_account:
            raise HTTPException(status_code=404, detail="Outcome or Income account not found")

        if outcome_account.user_id != current_user.id or income_account.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Outcome or Income account does not belong to user")

        if outcome_account.balance < transfer_data.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        outcome_account.balance -= transfer_data.amount
        income_account.balance += transfer_data.amount

        transfer = Transfer(
            amount=transfer_data.amount,
            description=transfer_data.description,
            transfer_at=transfer_data.transfer_at,
            user_id=current_user.id,
            outcome_account_id=transfer_data.outcome_account_id,
            income_account_id=transfer_data.income_account_id,
        )

        session.add(transfer)
        session.commit()
        session.refresh(transfer)

        return {"success": True, "data": transfer}

    except SQLAlchemyError:
        session.rollback()
        raise HTTPException(status_code=500, detail="Error processing transfer")


@transfers.patch("/update-transfer/{id}", response_model=SuccessResponse[TransferPublic])
def update_transfer(id: UUID, transfer_data: UpdateTransfer, session=Depends(get_session)):
    pass


@transfers.delete("/delete-transfer/{id}", response_model=SuccessResponse[TransferPublic])
def delete_transfer(id: UUID, session: Session = Depends(get_session)):
    transfer = session.get(Transfer, id)

    if not transfer:
        raise HTTPException(status_code=4040, detail="TRANSFER NOT FOUND")

    session.delete(transfer)
    session.commit()

    return {"success": True, "data": transfer}
