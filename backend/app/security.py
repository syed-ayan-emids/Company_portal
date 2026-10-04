import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt

from . import config


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"pbkdf2${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: Optional[str]) -> bool:
    if not stored or not stored.startswith("pbkdf2$"):
        return False
    try:
        _, salt_hex, dk_hex = stored.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 200_000)
        return secrets.compare_digest(dk.hex(), dk_hex)
    except (ValueError, TypeError):
        return False


def create_token(employee_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(employee_id),
        "iat": now,
        "exp": now + timedelta(days=config.TOKEN_TTL_DAYS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALG)


def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALG])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
