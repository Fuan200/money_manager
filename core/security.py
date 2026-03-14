from bcrypt import checkpw
from passlib.context import CryptContext

UTF8: str = "utf-8"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashes the password using bcrypt."""
    return pwd_context.hash(password)


def verify_password_hashed(stored_hash: str, password: str) -> bool:
    return checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
