# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import SessionLocal
from app import models
from app.schemas import UserSignupIn, UserOut, LoginIn, LoginOut
from typing import Any

router = APIRouter(prefix="/api", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


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
        role="ADOPTER",  # default
        passwordHash=hash_password(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.UserAccount).filter(
        models.UserAccount.email == payload.email
    ).first()

    if not user or not verify_password(payload.password, str(user.passwordHash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return user
