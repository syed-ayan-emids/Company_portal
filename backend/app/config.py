import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
DB_BACKEND = (
    "postgres" if DATABASE_URL.lower().startswith(("postgres://", "postgresql://")) else "mysql"
)

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "chatbot_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "chatbot")
DB_SSL_CA = os.getenv("DB_SSL_CA", "") or None

JWT_SECRET = os.getenv("JWT_SECRET", "emids-portal-secret")
JWT_ALG = "HS256"
TOKEN_TTL_DAYS = 7
COOKIE_NAME = "portal_token"

APP_PORT = int(os.getenv("APP_PORT", "8010"))
