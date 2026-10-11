import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError


# =========================================================
# ENVIRONMENT CONFIGURATION
# =========================================================

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is missing. Add it to your .env file."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# PASSWORD HASHING
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    try:
        return pwd_context.verify(
            plain_password,
            hashed_password
        )
    except (ValueError, TypeError):
        return False


# =========================================================
# CREATE JWT ACCESS TOKEN
# =========================================================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================================================
# VERIFY / DECODE JWT ACCESS TOKEN
# =========================================================

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        if not payload.get("user_id"):
            raise ValueError("Token has no user_id")

        if not payload.get("role"):
            raise ValueError("Token has no role")

        return payload

    except (JWTError, ValueError, TypeError) as exc:
        raise ValueError(
            "Invalid or expired access token"
        ) from exc
