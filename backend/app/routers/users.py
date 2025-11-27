from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import hashlib
import hmac
import os
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
    user = db.query(models.UserAccount).filter(
        models.UserAccount.email == payload.email
    ).first()

    if not user or not verify_password(payload.password, user.passwordHash):  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return user


# ========== NEW PROFILE ENDPOINTS ==========

@router.get("/users/{user_id}", response_model=UserOut)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Get a user's profile information (name, email, phone, role)
    """
    user = db.query(models.UserAccount).filter(
        models.UserAccount.userID == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user_profile(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db)
):
    """
    Update user profile (name, email, phone)
    
    Expected payload:
    {
        "name": "new_name",
        "email": "new_email@example.com",
        "phone": "123456789"
    }
    """
    user = db.query(models.UserAccount).filter(
        models.UserAccount.userID == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Update only provided fields
    if "name" in payload:
        user.name = payload["name"]
    if "email" in payload:
        # Check if email already exists
        existing_email = db.query(models.UserAccount).filter(
            models.UserAccount.email == payload["email"],
            models.UserAccount.userID != user_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use",
            )
        user.email = payload["email"]
    if "phone" in payload:
        user.phone = payload["phone"]

    db.commit()
    db.refresh(user)

    return user


@router.get("/users/{user_id}/adoptions", response_model=List[dict])
def get_user_adoptions(user_id: int, db: Session = Depends(get_db)):
    """
    Get all adoption applications for a user, including pet details
    
    Returns list of adoptions with pet info (name, species, breed, etc.)
    """
    user = db.query(models.UserAccount).filter(
        models.UserAccount.userID == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Query adoptions with pet details
    adoptions = db.query(models.Adoption, models.Pet).join(
        models.Pet, models.Adoption.petID == models.Pet.petID
    ).filter(
        models.Adoption.adopterID == user_id
    ).all()

    result = []
    for adoption, pet in adoptions:
        result.append({
            "adoptionID": adoption.adoptionID,
            "petID": pet.petID,
            "petName": pet.name,
            "petSpecies": pet.species,
            "petBreed": pet.breed,
            "status": adoption.status,
            "applicationDate": adoption.applicationDate,
            "approvalDate": adoption.approvalDate,
            "finalizationDate": adoption.finalizationDate,
        })

    return result


@router.get("/users/{user_id}/appointments", response_model=List[dict])
def get_user_appointments(user_id: int, db: Session = Depends(get_db)):
    """
    Get all appointments for a user, including pet and shelter details
    
    Returns list of appointments with pet and shelter info
    """
    user = db.query(models.UserAccount).filter(
        models.UserAccount.userID == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Query appointments with pet and shelter details
    appointments = db.query(
        models.Appointment,
        models.Pet,
        models.Shelter
    ).join(
        models.Pet, models.Appointment.petID == models.Pet.petID
    ).join(
        models.Shelter, models.Appointment.shelterID == models.Shelter.shelterID
    ).filter(
        models.Appointment.adopterID == user_id
    ).all()

    result = []
    for appointment, pet, shelter in appointments:
        result.append({
            "appointmentID": appointment.appointmentID,
            "petID": pet.petID,
            "petName": pet.name,
            "petSpecies": pet.species,
            "appointmentTime": appointment.appointmentTime,
            "appointmentType": appointment.appointmentType,
            "shelterName": shelter.name,
            "shelterAddress": shelter.address,
        })

    return result