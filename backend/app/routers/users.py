# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import hashlib
import hmac
import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

from app.database import SessionLocal
from app import models
from app.schemas import (
    UserSignupIn,
    UserOut,
    LoginIn,
    LoginOut,
    AdoptionOut,
    AppointmentOut,
)

load_dotenv()  # load .env file

router = APIRouter(prefix="/api", tags=["users"])

# Load pepper from environment
SECRET_PEPPER = os.getenv("SECRET_PEPPER", "fallback-dev-pepper")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

def hash_password(password: str) -> str:
    pw_bytes = (password + SECRET_PEPPER).encode("utf-8")
    return hashlib.sha256(pw_bytes).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(plain), str(hashed))

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> models.UserAccount:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = auth_header.split(" ")[1]
    user_id = verify_token(token)
    
    user = db.query(models.UserAccount).filter(
        models.UserAccount.userID == user_id
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
        
    return user


# ========== EXISTING ENDPOINTS ==========

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignupIn, db: Session = Depends(get_db)):
    existing = db.query(models.UserAccount).filter(
        models.UserAccount.email == payload.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = models.UserAccount(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        role="ADOPTER",
        passwordHash=hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    print(f"DEBUG: Login attempt for email: {payload.email}")
    user = db.query(models.UserAccount).filter(
        models.UserAccount.email == payload.email
    ).first()
    
    print(f"DEBUG: Found user: {user}")
    if user:
        print(f"DEBUG: User role: {user.role}")

    if not user or not verify_password(payload.password, user.passwordHash):  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            )

    # Create JWT token
    access_token = create_access_token(data={"sub": str(user.userID)})
    
    print(f"DEBUG: Created token for user_id: {user.userID}")
    
    # Return user data with token
    return {
        "userID": user.userID,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "access_token": access_token
    }


@router.post("/logout")
def logout(response: Response):
    # Clear the session cookie
    response.delete_cookie("user_id")
    return {"message": "Successfully logged out"}
