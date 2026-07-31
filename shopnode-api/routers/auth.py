"""
shopnode-api auth router (T010)
Single responsibility: POST /auth/login — JWT generation, 401 on bad creds.
"""
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
from jose import jwt

from models import LoginRequest, TokenResponse
from main import USERS

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "shopnode-dev-secret-do-not-use-in-prod")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 1


def create_access_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = USERS.get(body.email)
    if not user or user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(body.email)
    return TokenResponse(access_token=token)
