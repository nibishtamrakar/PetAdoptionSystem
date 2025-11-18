# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import hashlib
import hmac
import fastapi

from app.database import SessionLocal
from app import models
from app.schemas import UserSignupIn, UserOut, LoginIn, LoginOut

router = APIRouter(prefix="/api", tags=["users"])

# Simple secret "pepper" for hashing 
SECRET_PEPPER = "dev-secret-change-me"  # in real apps, load from env


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    """
    Simple SHA-256 hash with a pepper for this project.
    DO NOT use this as-is in real production systems.
    """
    pw_bytes = (password + SECRET_PEPPER).encode("utf-8")
    return hashlib.sha256(pw_bytes).hexdigest()


def verify_password(plain: str, hashed) -> bool:
    # normalize to string in case SQLAlchemy does something weird
    hashed_str = str(hashed)
    return hmac.compare_digest(hash_password(plain), hashed_str)


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

    if not user or not verify_password(payload.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Pydantic orm_mode on LoginOut will shape this automatically
    return user
