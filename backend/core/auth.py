import os
import jwt

from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from passlib.context import CryptContext
from fastapi import HTTPException

load_dotenv()

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    """Verifies if the password matches the hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def create_jwt_token(payload: dict):
    """Creates a JWT token with the given payload."""
    payload["exp"] = datetime.now(timezone.utc) + timedelta(hours=24)
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def decode_jwt_token(token: str):
    """Decodes the JWT token and returns the payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token has expired") from exc

    except jwt.DecodeError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
