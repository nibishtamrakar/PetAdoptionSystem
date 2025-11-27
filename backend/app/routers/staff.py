from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app import models, schemas
from app.routers.users import get_db, get_current_user

router = APIRouter(prefix="/staff", tags=["staff"])

def getStaffShelter(db: Session, user_id: int):
    staff = db.query(models.Staff).filter(models.Staff.userID == user_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a staff member"
        )
    return staff

@router.get("/profile", response_model=schemas.StaffProfile)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    return db.query(
        models.UserAccount, models.Staff, models.Shelter
    ).join(
        models.Staff,
        models.UserAccount.userID == models.Staff.userID
    ).join(
        models.Shelter,
        models.Staff.shelterID == models.Shelter.shelterID
    ).filter(
        models.UserAccount.userID == current_user.userID
    ).first()

@router.get("/pets/", response_model=List[schemas.Pet])
def get_shelter_pets(
    status: Optional[str] = None,
    species: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    query = db.query(models.Pet).filter(
        models.Pet.shelterID == staff.shelterID
    )
    
    if status:
        query = query.filter(models.Pet.status == status)
    if species:
        query = query.filter(models.Pet.species == species)
    
    return query.offset(skip).limit(limit).all()

@router.post("/pets/", response_model=schemas.Pet, status_code=status.HTTP_201_CREATED)
def create_pet(
    pet: schemas.PetCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    db_pet = models.Pet(
        **pet.dict(),
        shelterID=staff.shelterID,
        status="AVAILABLE"
    )
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return db_pet

@router.patch("/pets/{pet_id}", response_model=schemas.Pet)
def update_pet(
    pet_id: int,
    pet_update: schemas.PetUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    db_pet = db.query(models.Pet).filter(
        models.Pet.petID == pet_id,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not db_pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter"
        )
    
    update_data = pet_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_pet, field, value)
    
    db.commit()
    db.refresh(db_pet)
    return db_pet

@router.get("/care-logs/", response_model=List[schemas.CareLog])
def get_care_logs(
    pet_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    query = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    ).filter(
        models.Pet.shelterID == staff.shelterID
    )
    
    if pet_id:
        query = query.filter(models.CareLog.petID == pet_id)
    if start_date:
        query = query.filter(models.CareLog.careDate >= start_date)
    if end_date:
        query = query.filter(models.CareLog.careDate <= end_date)
    
    return query.offset(skip).limit(limit).all()

@router.post("/care-logs/", response_model=schemas.CareLog, status_code=status.HTTP_201_CREATED)
def create_care_log(
    care_log: schemas.CareLogCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    pet = db.query(models.Pet).filter(
        models.Pet.petID == care_log.petID,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter"
        )
    
    db_care_log = models.CareLog(
        **care_log.dict(),
        staffID=staff.userID,
        careDate=datetime.utcnow()
    )
    
    db.add(db_care_log)
    db.commit()
    db.refresh(db_care_log)
    return db_care_log

@router.delete("/care-logs/{care_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_care_log(
    care_log_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    care_log = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    ).filter(
        models.CareLog.careID == care_log_id,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not care_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Care log not found or not in your shelter"
        )
    
    db.delete(care_log)
    db.commit()
    return None

@router.get("/appointments/", response_model=List[schemas.Appointment])
def get_appointments(
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    query = db.query(models.Appointment).filter(
        models.Appointment.shelterID == staff.shelterID
    )
    
    if status:
        query = query.filter(models.Appointment.status == status)
    if start_date:
        query = query.filter(models.Appointment.appointmentTime >= start_date)
    if end_date:
        query = query.filter(models.Appointment.appointmentTime <= end_date)
    
    return query.order_by(models.Appointment.appointmentTime).offset(skip).limit(limit).all()

@router.post("/appointments/", response_model=schemas.Appointment, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    
    # Verify pet is in staff's shelter
    pet = db.query(models.Pet).filter(
        models.Pet.petID == appointment.petID,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter"
        )
    
    db_appointment = models.Appointment(
        **appointment.dict(),
        shelterID=staff.shelterID,
        status="SCHEDULED"
    )
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.patch("/appointments/{appointment_id}", response_model=schemas.Appointment)
def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    db_appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id,
        models.Appointment.shelterID == staff.shelterID
    ).first()
    
    if not db_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found in your shelter"
        )
    
    update_data = appointment_update.dict(exclude_unset=True)
    
    # If updating petID, verify the new pet is in the same shelter
    if 'petID' in update_data:
        pet = db.query(models.Pet).filter(
            models.Pet.petID == update_data['petID'],
            models.Pet.shelterID == staff.shelterID
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pet not found in your shelter"
            )
    
    for field, value in update_data.items():
        setattr(db_appointment, field, value)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.delete("/appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserAccount = Depends(get_current_user)
):
    staff = getStaffShelter(db, current_user.userID)
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id,
        models.Appointment.shelterID == staff.shelterID
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found or not in your shelter"
        )
    
    db.delete(appointment)
    db.commit()
    return None