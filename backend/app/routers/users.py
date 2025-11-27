# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
import hashlib
import hmac
import os
from dotenv import load_dotenv

from app.database import SessionLocal
from app import models
from app.schemas import UserSignupIn, UserOut, LoginIn, LoginOut
load_dotenv()  # load .env file

router = APIRouter(prefix="/api", tags=["users"])

# Load pepper from environment
SECRET_PEPPER = os.getenv("SECRET_PEPPER", "fallback-dev-pepper")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    pw_bytes = (password + SECRET_PEPPER).encode("utf-8")
    return hashlib.sha256(pw_bytes).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hmac.compare_digest(hash_password(plain), str(hashed))

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> models.UserAccount:
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    try:
        user = db.query(models.UserAccount).filter(
            models.UserAccount.userID == int(user_id)
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
            
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
        )


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
    user = db.query(models.UserAccount).filter(
        models.UserAccount.email == payload.email
    ).first()

    if not user or not verify_password(payload.password, user.passwordHash): # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            )

    return user


@router.post("/logout")
def logout(response: Response):
    # Clear the session cookie
    response.delete_cookie("user_id")
    return {"message": "Successfully logged out"}
