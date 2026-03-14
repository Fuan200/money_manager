from typing import List

from fastapi import APIRouter, Depends

from schema.user import AuthResponse, CreateUser, LoginDto, UpdateUser, UserPublic, SuccessResponse
from services.users import UserService, get_user_service


users = APIRouter(prefix="/users", tags=["users"])


@users.get("/get-all", response_model=SuccessResponse[List[UserPublic]])
def get_users(service: UserService = Depends(get_user_service)):
    users_data = service.get_users()
    return {"success": True, "data": users_data}


@users.get("/get-by-id/{id}", response_model=SuccessResponse[UserPublic])
def get_user(id: str, service: UserService = Depends(get_user_service)):
    user = service.get_user_by_id(id)
    return {"success": True, "data": user}


@users.post("/create-user", response_model=SuccessResponse[UserPublic])
def post_user(post_user: CreateUser, service: UserService = Depends(get_user_service)):
    user = service.create_user(post_user)
    return {"success": True, "data": user}


@users.put("/update-user/{id}", response_model=SuccessResponse[UserPublic])
def put_user(id: str, user_data: UpdateUser, service: UserService = Depends(get_user_service)):
    user = service.update_user(id, user_data)
    return {"success": True, "data": user}


@users.delete("/delete-user/{id}", response_model=SuccessResponse[UserPublic])
def delete_user(id: str, service: UserService = Depends(get_user_service)):
    user = service.delete_user(id)
    return {"success": True, "data": user}


@users.post("/login", response_model=SuccessResponse[AuthResponse])
def login(login_dto: LoginDto, service: UserService = Depends(get_user_service)):
    auth_data = service.login(login_dto)
    return {"success": True, "data": auth_data}
