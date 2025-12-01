# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
import hashlib
import hmac
import os
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.database import SessionLocal
from app import models
from app.schemas import (
    UserSignupIn,
    UserOut,
    LoginIn,
    LoginOut,
    AdoptionCreate,
    AdoptionOut,
    ScheduleAppointmentIn,
    AppointmentOut,
)

load_dotenv()  # load .env file

router = APIRouter(prefix="/api", tags=["users"])

# ---- Environment variables ----
_pepper = os.getenv("SECRET_PEPPER")
_jwt_key = os.getenv("JWT_SECRET_KEY")

if _pepper is None or _jwt_key is None:
    raise RuntimeError("Missing required environment variables: SECRET_PEPPER and/or JWT_SECRET_KEY")

SECRET_PEPPER: str = _pepper
JWT_SECRET_KEY: str = _jwt_key

JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))


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
        user_id: int | None = payload.get("sub")
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
    # ✅ pepper is guaranteed non-None here
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
@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a user profile by ID"""
    if current_user.userID != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    user = db.query(models.UserAccount).filter(models.UserAccount.userID == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: dict, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update a user profile"""
    if current_user.userID != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    user = db.query(models.UserAccount).filter(models.UserAccount.userID == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "name" in payload:
        user.name = payload["name"]
    if "email" in payload:
        user.email = payload["email"]
    if "phone" in payload:
        user.phone = payload["phone"]
    
    db.commit()
    db.refresh(user)
    
    return user
@router.get("/users/{user_id}/adoptions")
async def get_user_adoptions(user_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.userID != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # ✅ EAGER LOAD pet relationship - Only APPLIED status
    adoptions = db.query(models.Adoption).options(
        joinedload(models.Adoption.pet)
    ).filter(models.Adoption.adopterID == user_id).filter(models.Adoption.status == "APPLIED").all()
    
    adoption_list = []
    for adoption in adoptions:
        adoption_list.append({
            "adoptionID": adoption.adoptionID,
            "petName": adoption.pet.name if adoption.pet else "Unknown Pet",
            "petSpecies": adoption.pet.species if adoption.pet else "Unknown",
            "applicationDate": adoption.applicationDate,
            "status": adoption.status,
        })
    
    return adoption_list if adoption_list else []


@router.get("/users/{user_id}/approved-adoptions")
async def get_user_approved_adoptions(user_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.userID != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # ✅ EAGER LOAD pet relationship - Only APPROVED status
    adoptions = db.query(models.Adoption).options(
        joinedload(models.Adoption.pet)
    ).filter(models.Adoption.adopterID == user_id).filter(models.Adoption.status == "APPROVED").all()
    
    adoption_list = []
    for adoption in adoptions:
        adoption_list.append({
            "adoptionID": adoption.adoptionID,
            "petName": adoption.pet.name if adoption.pet else "Unknown Pet",
            "petSpecies": adoption.pet.species if adoption.pet else "Unknown",
            "petID": adoption.pet.petID if adoption.pet else None,
            "applicationDate": adoption.applicationDate,
            "approvalDate": adoption.approvalDate,
            "status": adoption.status,
        })
    
    return adoption_list if adoption_list else []




@router.get("/users/{user_id}/appointments")
async def get_user_appointments(user_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all appointments for a user"""
    if current_user.userID != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        appointments = db.query(models.Appointment).options(
            joinedload(models.Appointment.pet),
            joinedload(models.Appointment.shelter)
        ).filter(models.Appointment.adopterID == user_id).all()
        
        appointment_list = []
        for apt in appointments:
            appointment_list.append({
                "appointmentID": apt.appointmentID,
                "petID": apt.petID,
                "petName": apt.pet.name if apt.pet else "Unknown Pet",
                "petSpecies": apt.pet.species if apt.pet else "Unknown",
                "appointmentTime": apt.appointmentTime,
                "appointmentType": apt.appointmentType,
                "shelterName": apt.shelter.name if apt.shelter else "Unknown Shelter",
                "shelterAddress": apt.shelter.address if apt.shelter else "N/A"
            })
        
        return appointment_list if appointment_list else []
    
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))




@router.post("/appointments")
async def create_appointment(
    appointment_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new appointment request (from modal)"""
    # Validate user is an adopter
    if current_user.role != "ADOPTER":
        raise HTTPException(status_code=403, detail="Only adopters can request appointments")
    
    try:
        # Parse appointment time
        appt_time = datetime.fromisoformat(appointment_data.get("appointmentTime"))
        
        # Create appointment with PENDING status
        new_appointment = models.Appointment(
            adopterID=current_user.userID,
            petID=appointment_data.get("petID"),
            shelterID=appointment_data.get("shelterID"),
            appointmentTime=appt_time,
            appointmentType=appointment_data.get("appointmentType", "VIEWING"),
            status="PENDING",
            requestedAt=datetime.utcnow()
        )
        
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)
        
        return {
            "appointmentID": new_appointment.appointmentID,
            "status": new_appointment.status,
            "requestedAt": new_appointment.requestedAt,
            "message": "Appointment request created successfully"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid appointment data: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating appointment: {str(e)}")


@router.put("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    appointment_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an appointment (reschedule or cancel)"""
    appointment = db.query(models.Appointment).filter(models.Appointment.appointmentID == appointment_id).first()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only the requester or staff can update
    if current_user.userID != appointment.adopterID and current_user.role != "STAFF":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        # Update appointmentTime if provided
        if "appointmentTime" in appointment_data and appointment_data["appointmentTime"]:
            appointment.appointmentTime = datetime.fromisoformat(appointment_data["appointmentTime"])
        
        # Update status if provided (for cancelling, etc)
        if "status" in appointment_data:
            appointment.status = appointment_data["status"]
        
        db.commit()
        db.refresh(appointment)
        
        return {
            "appointmentID": appointment.appointmentID,
            "status": appointment.status,
            "appointmentTime": appointment.appointmentTime,
            "message": "Appointment updated successfully"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid appointment data: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating appointment: {str(e)}")

@router.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def schedule_appointment(payload: ScheduleAppointmentIn, db: Session = Depends(get_db), current_user: models.UserAccount = Depends(get_current_user)):
    """
    Schedule an appointment using the stores procedure 'sp_schedule_appointment'.
    Procedure prevents double-booking a pet at the same time.
    petID, shelterID are passed from frontend. adopterID derived from logged-in user.
    """

    try:
        db.execute(
            text(
                """
                CALL sp_schedule_appointment(
                    :p_petID,
                    :p_adopterID,
                    :p_shelterID,
                    :p_time,
                    :p_type
                )
                """
            ),
            {
                "p_petID": payload.petID,
                "p_adopterID": current_user.userID,
                "p_shelterID": payload.shelterID,
                "p_time": payload.appointmentTime,
                "p_type": payload.appointmentType,
            },
        )
        db.commit()
    except DBAPIError as e:
        db.rollback()
        msg = str(getattr(e, "orig", e))
        raise HTTPException(status_code=400, detail=msg)

    appt = (
        db.query(models.Appointment)
        .filter_by(
            petID=payload.petID,
            adopterID=current_user.userID,
            shelterID=payload.shelterID,
            appointmentTime=payload.appointmentTime,
            appointmentType=payload.appointmentType,
        )
        .order_by(models.Appointment.appointmentID.desc())
        .first()
    )

    if not appt:
    # Should not really happen if the procedure worked
        raise HTTPException(
            status_code=500,
            detail="Appointment created but not found when reading back",
        )

    return appt

    # old code
    # appt = models.Appointment(
    #     petID=payload.petID,
    #     adopterID=current_user.userID,      # from token
    #     shelterID=payload.shelterID,
    #     appointmentTime=payload.appointmentTime,
    #     appointmentType=payload.appointmentType,
    # )

    # db.add(appt)
    # db.commit()
    # db.refresh(appt)

    # return appt

@router.post("/adoptions", response_model=AdoptionOut, status_code=status.HTTP_201_CREATED)
def new_adoption(
    payload: AdoptionCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user),
):
    adoption = models.Adoption(
        petID=payload.petID,
        adopterID=current_user.userID,
        status="APPLIED",
        applicationDate=datetime.now(),
    )

    db.add(adoption)
    try:
        db.commit()  # trigger fires here
        db.refresh(adoption)
    except DBAPIError as e:
        db.rollback()
        msg = str(getattr(e, "orig", e))
        raise HTTPException(status_code=400, detail=msg)

    return adoption
