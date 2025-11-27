from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import SessionLocal
from app import models
from app.schemas import (
    CareLogCreate, CareLogOut,
    ScheduleAppointmentIn, AppointmentOut,
    PetOut, PetDetailOut
)
from app.routers.users import get_db

router = APIRouter(prefix="/api", tags=["staff"])

def get_current_staff(request: Request, db: Session = Depends(get_db)):
    """Get the current staff member and their shelter ID"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    token = auth_header.split(" ")[1]
    
    # Import verify_token from users module
    from app.routers.users import verify_token
    user_id = verify_token(token)
    
    try:
        user = db.query(models.UserAccount).filter(
            models.UserAccount.userID == user_id
        ).first()
        
        if not user or user.role not in ["STAFF", "ADMIN"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff access only",
            )
        
        staff = db.query(models.Staff).filter(
            models.Staff.userID == user_id
        ).first()
        
        if not staff:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff profile not found",
            )
        return staff
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )

@router.post("/care-logs", response_model=CareLogOut, status_code=status.HTTP_201_CREATED)
def create_care_log(
    care_log: CareLogCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    # Verify pet belongs to staff's shelter
    pet = db.query(models.Pet).filter(
        models.Pet.petID == care_log.petID,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter",
        )
    
    db_care_log = models.CareLog(
        **care_log.dict(),
        staffID=staff.staffID,
        careDate=datetime.utcnow()
    )
    
    db.add(db_care_log)
    db.commit()
    db.refresh(db_care_log)
    return db_care_log

@router.get("/care-logs", response_model=List[CareLogOut])
def get_care_logs(
    request: Request,
    pet_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    query = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    ).filter(
        models.Pet.shelterID == staff.shelterID
    )
    
    if pet_id:
        query = query.filter(models.CareLog.petID == pet_id)
    
    return query.order_by(
        models.CareLog.careDate.desc()
    ).offset(offset).limit(limit).all()

@router.delete("/care-logs/{care_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_care_log(
    care_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    care_log = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    ).filter(
        models.CareLog.careID == care_id,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not care_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Care log not found or access denied",
        )
    
    db.delete(care_log)
    db.commit()
    return None

@router.get("/pets", response_model=List[PetOut])
def get_shelter_pets(
    request: Request,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    query = db.query(
        models.Pet,
        models.Shelter.name.label("shelterName"),
        models.Shelter.address.label("shelterAddress"),
    ).join(
        models.Shelter,
        models.Pet.shelterID == models.Shelter.shelterID
    ).filter(
        models.Pet.shelterID == staff.shelterID
    )
    
    if status:
        query = query.filter(models.Pet.status == status)
    
    return query.offset(offset).limit(limit).all()

@router.get("/appointments", response_model=List[AppointmentOut])
def get_shelter_appointments(
    request: Request,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    query = db.query(models.Appointment).filter(
        models.Appointment.shelterID == staff.shelterID
    )
    
    if start_date:
        query = query.filter(models.Appointment.appointmentTime >= start_date)
    if end_date:
        next_day = datetime.combine(end_date, datetime.min.time()) + timedelta(days=1)
        query = query.filter(models.Appointment.appointmentTime < next_day)
    
    return query.order_by(
        models.Appointment.appointmentTime
    ).offset(offset).limit(limit).all()

@router.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment: ScheduleAppointmentIn,
    request: Request,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    pet = db.query(models.Pet).filter(
        models.Pet.petID == appointment.petID,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter",
        )
    
    if appointment.shelterID != staff.shelterID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create appointment for another shelter",
        )
    
    db_appointment = models.Appointment(**appointment.dict())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.put("/appointments/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int,
    appointment: ScheduleAppointmentIn,
    request: Request,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    db_appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id,
        models.Appointment.shelterID == staff.shelterID
    ).first()
    
    if not db_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found or access denied",
        )
    
    pet = db.query(models.Pet).filter(
        models.Pet.petID == appointment.petID,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter",
        )
    
    for key, value in appointment.dict().items():
        setattr(db_appointment, key, value)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    staff = get_current_staff(request, db)
    
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id,
        models.Appointment.shelterID == staff.shelterID
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found or access denied",
        )
    
    db.delete(appointment)
    db.commit()
    return None