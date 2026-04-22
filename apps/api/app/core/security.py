import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from fastapi_users.password import PasswordHelper

from app.config import settings

_password_helper = PasswordHelper()


def hash_password(password: str) -> str:
    return _password_helper.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    verified, _ = _password_helper.verify_and_update(plain, hashed)
    return verified


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_signed_token(payload: dict[str, object], expires_in_minutes: int, token_type: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=expires_in_minutes)
    token_payload = {**payload, "exp": expire, "type": token_type}
    return jwt.encode(token_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_signed_token(token: str, expected_type: str) -> dict[str, object]:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Invalid token type")
    return payload


def create_refresh_token_value() -> str:
    return secrets.token_urlsafe(64)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def decode_access_token(token: str) -> dict[str, object]:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def refresh_token_expiry() -> datetime:
    return (datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)).replace(tzinfo=None)
