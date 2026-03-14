from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from email_validator import validate_email, EmailNotValidError
from uuid import UUID
from typing import List

from core.auth import create_jwt_token, verify_password
from core.database import get_session
from core.security import hash_password

from models import User
from schema.user import AuthResponse, CreateUser, LoginDto, UpdateUser, UserPublic, SuccessResponse

users = APIRouter(prefix="/users", tags=["users"])

@users.get("/get-all", response_model=SuccessResponse[List[UserPublic]])
def get_users(session: Session = Depends(get_session)):
    statement = select(User).order_by(User.created_at.desc())
    users = session.exec(statement).all()
    return {"success": True, "data": users}

@users.get("/get-by-id/{id}", response_model=SuccessResponse[UserPublic])
def get_user(id: UUID, session: Session = Depends(get_session)):
    user = session.get(User, id)

    if not user:
        raise HTTPException(status_code=404, detail="USER NOT FOUND")

    return {"success": True, "data": user}

@users.post("/create-user", response_model=SuccessResponse[UserPublic])
def create_user(user_data: CreateUser, session: Session = Depends(get_session)):
    try:
        email_info = validate_email(user_data.email, check_deliverability=False)
        user_data.email = email_info.normalized
    except EmailNotValidError as e:
        raise HTTPException(status_code=400, detail=str(e))

    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=user_data.email, password_hash=hash_password(user_data.password),)

    session.add(user)
    session.commit()
    session.refresh(user)

    return {"success": True, "data": user}

@users.put("/update-user/{id}", response_model=SuccessResponse[UserPublic])
def update_user(id: UUID, user_data: UpdateUser, session: Session = Depends(get_session)):
    user = session.get(User, id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_data.email and user_data.email != user.email:
        existing_user = session.exec(select(User).where(User.email == user_data.email)).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        user.email = user_data.email

    if user_data.password:
        user.password_hash = hash_password(user_data.password)

    session.add(user)
    session.commit()
    session.refresh(user)

    return {"success": True, "data": user}

@users.delete("/delete-user/{id}", response_model=SuccessResponse[UserPublic])
def delete_user(id: UUID, session: Session = Depends(get_session)):
    user = session.get(User, id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session.delete(user)
    session.commit()

    return {"success": True, "data": user}

@users.post("/login", response_model=SuccessResponse[AuthResponse])
def login(login_dto: LoginDto, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == login_dto.email)).first()

    if not user or not verify_password(login_dto.password, user.password_hash):
        raise HTTPException(status_code=400, detail="INVALID_CREDENTIALS")

    payload = {"sub": str(user.id), "email": user.email}
    token = create_jwt_token(payload)

    return {"success": True, "data": {"email": user.email, "token": token}}
