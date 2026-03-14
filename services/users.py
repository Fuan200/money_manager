from typing import List

from fastapi import Depends, HTTPException
from sqlmodel import Session, select
from email_validator import validate_email, EmailNotValidError

from core.auth import create_jwt_token, verify_password
from core.database import get_session
from models import User
from core.security import hash_password
from schema.user import AuthResponse, CreateUser, LoginDto, UpdateUser, UserPublic


class UserService:
    def __init__(self, session: Session):
        self.session = session

    def get_users(self) -> List[UserPublic]:
        statement = select(User).order_by(User.created_at.desc())
        return list(self.session.exec(statement).all())

    def get_user_by_id(self, user_id: str) -> UserPublic:
        user = self.session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="USER NOT FOUND")
        return user

    def create_user(self, user_data: CreateUser) -> UserPublic:
        try:
            email_info = validate_email(user_data.email, check_deliverability=False)
            user_data.email = email_info.normalized
        except EmailNotValidError as e:
            raise HTTPException(status_code=400, detail=str(e))

        existing_user = self.session.exec(select(User).where(User.email == user_data.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = User(email=user_data.email,password_hash=hash_password(user_data.password),)
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update_user(self, user_id: str, user_data: UpdateUser) -> UserPublic:
        user = self.session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user_data.email is not None and user_data.email != user.email:
            existing_user = self.session.exec(select(User).where(User.email == user_data.email)).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            user.email = user_data.email

        if user_data.password is not None:
            user.password_hash = hash_password(user_data.password)

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def delete_user(self, user_id: str) -> UserPublic:
        user = self.session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        self.session.delete(user)
        self.session.commit()
        return user

    def login(self, login_data: LoginDto) -> AuthResponse:
        user = self.session.exec(select(User).where(User.email == login_data.email)).first()
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(status_code=400, detail="INVALID_CREDENTIALS")

        payload = {"sub": str(user.id), "email": user.email}
        token = create_jwt_token(payload)
        return {"email": user.email, "token": token}


def get_user_service(session: Session = Depends(get_session)) -> UserService:
    return UserService(session)
