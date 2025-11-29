from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import SessionLocal
from app import models
from app.schemas import (
    CareLogCreate, CareLogOut,
    ScheduleAppointmentIn, AppointmentOut,
    PetOut, PetDetailOut, UserOut, AdoptionOut,
    VaccineOut, PetVaccineOut, ShelterCreate, ShelterOut
)
from app.routers.users import get_db

router = APIRouter(prefix="/api", tags=["admin"])

def get_current_admin(request: Request, db: Session = Depends(get_db)):
    """Get the current admin user"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    
    token = auth_header.split(" ")[1]
    
    # Import verify_token from users module
    from app.routers.users import verify_token
    user_id = verify_token(token)
    
    user = db.query(models.UserAccount).filter(models.UserAccount.userID == user_id).first()
    if not user or user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user

# Shelter endpoints
@router.get("/admin/shelters", response_model=List[ShelterOut])
def get_all_shelters(request: Request, db: Session = Depends(get_db)):
    """Get all shelters"""
    admin = get_current_admin(request, db)
    
    shelters = db.query(models.Shelter).all()
    return shelters

@router.get("/admin/shelters/{shelter_id}")
def get_shelter(shelter_id: int, request: Request, db: Session = Depends(get_db)):
    """Get a specific shelter"""
    admin = get_current_admin(request, db)
    
    shelter = db.query(models.Shelter).filter(models.Shelter.shelterID == shelter_id).first()
    if not shelter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found"
        )
    return shelter

@router.get("/admin/shelters/{shelter_id}/pets")
def get_shelter_pets(shelter_id: int, request: Request, db: Session = Depends(get_db)):
    """Get all pets for a specific shelter"""
    admin = get_current_admin(request, db)
    
    pets = db.query(models.Pet).filter(models.Pet.shelterID == shelter_id).all()
    return pets

@router.post("/admin/shelters", response_model=ShelterOut)
def create_shelter(shelter: ShelterCreate, request: Request, db: Session = Depends(get_db)):
    """Create a new shelter"""
    admin = get_current_admin(request, db)
    
    db_shelter = models.Shelter(
        name=shelter.name,
        address=shelter.address,
        phone=shelter.phone
    )
    
    db.add(db_shelter)
    db.commit()
    db.refresh(db_shelter)
    
    return db_shelter

@router.delete("/admin/shelters/{shelter_id}")
def delete_shelter(shelter_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete a shelter"""
    admin = get_current_admin(request, db)
    
    shelter = db.query(models.Shelter).filter(models.Shelter.shelterID == shelter_id).first()
    if not shelter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found"
        )
    
    db.delete(shelter)
    db.commit()
    
    return None

# Pet endpoints (all pets across all shelters)
@router.get("/admin/pets", response_model=List[PetOut])
def get_all_pets(request: Request, db: Session = Depends(get_db)):
    """Get all pets across all shelters"""
    admin = get_current_admin(request, db)
    
    pets = db.query(models.Pet, models.Shelter).join(models.Shelter).all()
    
    # Manually construct the response with shelter info
    result = []
    for pet, shelter in pets:
        pet_data = {
            "petID": pet.petID,
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "sex": pet.sex,
            "dob": pet.dob,
            "status": pet.status,
            "intakeDate": pet.intakeDate,
            "shelterName": shelter.name,
            "shelterAddress": shelter.address
        }
        result.append(pet_data)
    
    return result

@router.post("/admin/pets", response_model=PetOut)
def create_pet(pet_data: dict, request: Request, db: Session = Depends(get_db)):
    """Create a new pet"""
    admin = get_current_admin(request, db)
    
    # Verify shelter exists
    shelter = db.query(models.Shelter).filter(models.Shelter.shelterID == pet_data["shelterID"]).first()
    if not shelter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shelter not found"
        )
    
    db_pet = models.Pet(
        name=pet_data["name"],
        species=pet_data["species"],
        breed=pet_data.get("breed"),
        sex=pet_data["sex"],
        dob=pet_data.get("dob"),
        status="AVAILABLE",
        intakeDate=pet_data["intakeDate"],
        shelterID=pet_data["shelterID"]
    )
    
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    
    # Return with shelter info
    return {
        "petID": db_pet.petID,
        "name": db_pet.name,
        "species": db_pet.species,
        "breed": db_pet.breed,
        "sex": db_pet.sex,
        "dob": db_pet.dob,
        "status": db_pet.status,
        "intakeDate": db_pet.intakeDate,
        "shelterName": shelter.name,
        "shelterAddress": shelter.address
    }

@router.delete("/admin/pets/{pet_id}")
def delete_pet(pet_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete a pet"""
    admin = get_current_admin(request, db)
    
    pet = db.query(models.Pet).filter(models.Pet.petID == pet_id).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found"
        )
    
    db.delete(pet)
    db.commit()
    
    return None

# User endpoints
@router.get("/admin/users", response_model=List[UserOut])
def get_all_users(request: Request, db: Session = Depends(get_db)):
    """Get all users"""
    admin = get_current_admin(request, db)
    
    users = db.query(models.UserAccount).all()
    return users

@router.delete("/admin/users/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete a user"""
    admin = get_current_admin(request, db)
    
    user = db.query(models.UserAccount).filter(models.UserAccount.userID == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin user"
        )
    
    # Remove staff record if exists
    staff = db.query(models.Staff).filter(models.Staff.userID == user_id).first()
    if staff:
        db.delete(staff)
    
    db.delete(user)
    db.commit()
    
    return None

@router.post("/admin/users/{user_id}/make-staff")
def make_user_staff(user_id: int, staff_data: dict, request: Request, db: Session = Depends(get_db)):
    """Convert a user to staff member"""
    admin = get_current_admin(request, db)
    
    user = db.query(models.UserAccount).filter(models.UserAccount.userID == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change admin role"
        )
    
    # Update user role
    user.role = "STAFF"
    
    # Create staff record
    staff = models.Staff(
        userID=user_id,
        shelterID=staff_data["shelterID"]
    )
    
    db.add(staff)
    db.commit()
    
    return {"message": "User successfully made staff"}

@router.delete("/admin/staff/{user_id}")
def remove_staff_role(user_id: int, request: Request, db: Session = Depends(get_db)):
    """Remove staff role from user"""
    admin = get_current_admin(request, db)
    
    user = db.query(models.UserAccount).filter(models.UserAccount.userID == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != "STAFF":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a staff member"
        )
    
    # Update user role back to ADOPTER
    user.role = "ADOPTER"
    
    # Remove staff record
    staff = db.query(models.Staff).filter(models.Staff.userID == user_id).first()
    if staff:
        db.delete(staff)
    
    db.commit()
    
    return {"message": "Staff role removed"}

@router.get("/admin/staff", response_model=List[UserOut])
def get_all_staff(request: Request, db: Session = Depends(get_db)):
    """Get all staff members"""
    admin = get_current_admin(request, db)
    
    staff_users = db.query(models.UserAccount).filter(models.UserAccount.role == "STAFF").all()
    return staff_users

# Appointment endpoints (all appointments across all shelters)
@router.get("/admin/appointments", response_model=List[AppointmentOut])
def get_all_appointments(request: Request, db: Session = Depends(get_db)):
    """Get all appointments across all shelters"""
    admin = get_current_admin(request, db)
    
    appointments = db.query(models.Appointment).join(models.Pet).join(models.Shelter).all()
    return appointments

@router.get("/admin/upcoming-appointments", response_model=List[AppointmentOut])
def get_upcoming_appointments(request: Request, db: Session = Depends(get_db)):
    """Get upcoming appointments across all shelters"""
    admin = get_current_admin(request, db)
    
    appointments = db.query(models.Appointment).join(models.Pet).join(models.Shelter).filter(
        models.Appointment.appointmentTime > datetime.utcnow()
    ).order_by(models.Appointment.appointmentTime.asc()).all()
    
    return appointments

@router.get("/admin/past-appointments", response_model=List[AppointmentOut])
def get_past_appointments(request: Request, db: Session = Depends(get_db)):
    """Get past appointments across all shelters"""
    admin = get_current_admin(request, db)
    
    appointments = db.query(models.Appointment).join(models.Pet).join(models.Shelter).filter(
        models.Appointment.appointmentTime <= datetime.utcnow()
    ).order_by(models.Appointment.appointmentTime.desc()).all()
    
    return appointments

# Care log endpoints (all care logs across all shelters)
@router.get("/admin/recent-care-logs", response_model=List[CareLogOut])
def get_recent_care_logs(request: Request, db: Session = Depends(get_db), limit: int = 10):
    """Get recent care logs across all shelters"""
    admin = get_current_admin(request, db)
    
    care_logs = db.query(models.CareLog).join(models.Pet).join(models.Shelter).order_by(
        models.CareLog.careDate.desc()
    ).limit(limit).all()
    
    return care_logs

@router.get("/admin/all-care-logs")
def get_all_care_logs(request: Request, db: Session = Depends(get_db)):
    """Get all care logs across all shelters"""
    admin = get_current_admin(request, db)
    
    care_logs = db.query(models.CareLog, models.Pet, models.Shelter)\
        .join(models.Pet, models.CareLog.petID == models.Pet.petID)\
        .join(models.Shelter, models.Pet.shelterID == models.Shelter.shelterID)\
        .order_by(models.CareLog.careDate.desc())\
        .all()
    
    # Manually construct the response with pet and shelter info
    result = []
    for care_log, pet, shelter in care_logs:
        care_data = {
            "careLogID": care_log.careID,
            "petID": care_log.petID,
            "staffID": care_log.staffID,
            "careDate": care_log.careDate,
            "careType": care_log.careType,
            "notes": care_log.notes,
            "petName": pet.name,
            "shelterName": shelter.name
        }
        result.append(care_data)
    
    return result

# Vaccine endpoints
@router.get("/admin/vaccines", response_model=List[VaccineOut])
def get_all_vaccines(request: Request, db: Session = Depends(get_db)):
    """Get all vaccines"""
    admin = get_current_admin(request, db)
    
    vaccines = db.query(models.Vaccine).all()
    return vaccines

@router.post("/admin/vaccines", response_model=VaccineOut)
def create_vaccine(vaccine: dict, request: Request, db: Session = Depends(get_db)):
    """Create a new vaccine"""
    admin = get_current_admin(request, db)
    
    db_vaccine = models.Vaccine(
        name=vaccine["name"],
        description=vaccine.get("description", ""),
        duration=vaccine.get("duration", "")
    )
    
    db.add(db_vaccine)
    db.commit()
    db.refresh(db_vaccine)
    
    return db_vaccine

@router.delete("/admin/vaccines/{vaccine_id}")
def delete_vaccine(vaccine_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete a vaccine"""
    admin = get_current_admin(request, db)
    
    vaccine = db.query(models.Vaccine).filter(models.Vaccine.vaccineID == vaccine_id).first()
    if not vaccine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vaccine not found"
        )
    
    db.delete(vaccine)
    db.commit()
    
    return None

@router.post("/admin/users/{user_id}/make-admin")
def make_user_admin(user_id: int, request: Request, db: Session = Depends(get_db)):
    """Convert a user to admin (super admin only)"""
    admin = get_current_admin(request, db)
    
    user = db.query(models.UserAccount).filter(models.UserAccount.userID == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user role
    user.role = "ADMIN"
    
    # Remove staff record if exists
    staff = db.query(models.Staff).filter(models.Staff.userID == user_id).first()
    if staff:
        db.delete(staff)
    
    db.commit()
    
    return {"message": "User successfully made admin"}

# Adoption request endpoints (all requests across all shelters)
@router.get("/admin/adoption-requests", response_model=List[AdoptionOut])
def get_all_adoption_requests(request: Request, db: Session = Depends(get_db)):
    """Get all adoption requests across all shelters"""
    admin = get_current_admin(request, db)
    
    adoptions = db.query(models.Adoption).join(models.Pet).join(models.Shelter).all()
    return adoptions
