from fastapi import Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from core.auth import decode_jwt_token
from core.database import engine
from models import User

EXCLUDED_PATHS = {"/users/login"}
UNAUTHORIZED = JSONResponse(
    status_code=401,
    content={"success": False, "error": "UNAUTHORIZED"},
)


async def jwt_auth_middleware(request: Request, call_next):
    path = request.url.path

    if request.method == "OPTIONS" or path in EXCLUDED_PATHS:
        return await call_next(request)

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return UNAUTHORIZED

    scheme, _, token = auth_header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return UNAUTHORIZED

    try:
        payload = decode_jwt_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return UNAUTHORIZED

        with Session(engine) as session:
            user = session.exec(select(User).where(User.id == user_id)).first()

        if not user:
            return UNAUTHORIZED

        request.state.user = user
    except Exception:
        return UNAUTHORIZED

    return await call_next(request)
