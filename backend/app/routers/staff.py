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
    VaccineOut, PetVaccineOut
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

@router.post("/staff-care-logs", response_model=CareLogOut, status_code=status.HTTP_201_CREATED)
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
        staffID=staff.userID,
        careDate=datetime.utcnow()
    )
    
    db.add(db_care_log)
    db.commit()
    db.refresh(db_care_log)
    return db_care_log

@router.get("/staff-care-logs", response_model=List[CareLogOut])
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

@router.delete("/staff-care-logs/{care_id}", status_code=status.HTTP_204_NO_CONTENT)
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

@router.get("/users", response_model=List[UserOut])
def get_users(request: Request, db: Session = Depends(get_db)):
    """Get all users (for staff dashboard to show adopter names)"""
    staff = get_current_staff(request, db)
    
    users = db.query(models.UserAccount).all()
    return users

# Homepage endpoints
@router.get("/recent-care-logs", response_model=List[CareLogOut])
def get_recent_care_logs(request: Request, limit: int = 10, db: Session = Depends(get_db)):
    """Get recent care logs for homepage"""
    staff = get_current_staff(request, db)
    
    care_logs = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    ).filter(
        models.Pet.shelterID == staff.shelterID
    ).order_by(
        models.CareLog.careDate.desc()
    ).limit(limit).all()
    
    return care_logs

@router.get("/upcoming-appointments", response_model=List[AppointmentOut])
def get_upcoming_appointments(request: Request, db: Session = Depends(get_db)):
    """Get upcoming appointments for homepage"""
    staff = get_current_staff(request, db)
    from datetime import datetime
    
    appointments = db.query(models.Appointment).filter(
        models.Appointment.shelterID == staff.shelterID,
        models.Appointment.appointmentTime > datetime.utcnow()
    ).order_by(
        models.Appointment.appointmentTime.asc()
    ).all()
    
    return appointments

# History endpoints
@router.get("/all-care-logs", response_model=List[CareLogOut])
def get_all_care_logs(request: Request, db: Session = Depends(get_db)):
    """Get all care logs for history"""
    staff = get_current_staff(request, db)
    
    care_logs = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    ).filter(
        models.Pet.shelterID == staff.shelterID
    ).order_by(
        models.CareLog.careDate.desc()
    ).all()
    
    return care_logs

@router.get("/past-appointments", response_model=List[AppointmentOut])
def get_past_appointments(request: Request, db: Session = Depends(get_db)):
    """Get past appointments for history"""
    staff = get_current_staff(request, db)
    from datetime import datetime
    
    appointments = db.query(models.Appointment).filter(
        models.Appointment.shelterID == staff.shelterID,
        models.Appointment.appointmentTime <= datetime.utcnow()
    ).order_by(
        models.Appointment.appointmentTime.desc()
    ).all()
    
    return appointments

# Adoption requests endpoints
@router.get("/adoption-requests", response_model=List[AdoptionOut])
def get_adoption_requests(request: Request, db: Session = Depends(get_db)):
    """Get adoption requests for pets in this shelter"""
    staff = get_current_staff(request, db)
    
    # Get adoptions for pets in this shelter
    adoptions = db.query(models.Adoption).join(
        models.Pet,
        models.Adoption.petID == models.Pet.petID
    ).filter(
        models.Pet.shelterID == staff.shelterID,
        models.Adoption.status == "APPLIED"
    ).all()
    
    return adoptions

@router.put("/adoption-requests/{adoption_id}/accept")
def accept_adoption_request(adoption_id: int, request: Request, db: Session = Depends(get_db)):
    """Accept an adoption request"""
    staff = get_current_staff(request, db)
    
    adoption = db.query(models.Adoption).filter(
        models.Adoption.adoptionID == adoption_id
    ).first()
    
    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adoption request not found"
        )
    
    # Verify pet belongs to staff's shelter
    pet = db.query(models.Pet).filter(
        models.Pet.petID == adoption.petID,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pet not in your shelter"
        )
    
    # Update adoption status
    adoption.status = "ACCEPTED"
    
    # Update pet status
    pet.status = "ADOPTED"
    
    db.commit()
    return {"message": "Adoption request accepted"}

@router.put("/adoption-requests/{adoption_id}/reject")
def reject_adoption_request(adoption_id: int, request: Request, db: Session = Depends(get_db)):
    """Reject an adoption request"""
    staff = get_current_staff(request, db)
    
    adoption = db.query(models.Adoption).filter(
        models.Adoption.adoptionID == adoption_id
    ).first()
    
    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adoption request not found"
        )
    
    # Verify pet belongs to staff's shelter
    pet = db.query(models.Pet).filter(
        models.Pet.petID == adoption.petID,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pet not in your shelter"
        )
    
    # Update adoption status
    adoption.status = "REJECTED"
    
    db.commit()
    return {"message": "Adoption request rejected"}

@router.get("/staff-pets", response_model=List[PetOut])
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
    
    rows = query.offset(offset).limit(limit).all()
    
    # Format the response to match PetOut schema
    pets_out = []
    for pet_obj, shelterName, shelterAddress in rows:
        pets_out.append({
            "petID": pet_obj.petID,
            "name": pet_obj.name,
            "species": pet_obj.species,
            "breed": pet_obj.breed,
            "sex": pet_obj.sex,
            "dob": pet_obj.dob,
            "status": pet_obj.status,
            "intakeDate": pet_obj.intakeDate,
            "shelterName": shelterName,
            "shelterAddress": shelterAddress
        })
    
    return pets_out

@router.get("/staff-appointments", response_model=List[AppointmentOut])
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

@router.post("/staff-appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
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

@router.put("/staff-appointments/{appointment_id}", response_model=AppointmentOut)
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

@router.delete("/staff-appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
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

# Vaccine endpoints
@router.get("/vaccines", response_model=List[VaccineOut])
def get_vaccines(request: Request, db: Session = Depends(get_db)):
    """Get all available vaccines"""
    staff = get_current_staff(request, db)
    
    vaccines = db.query(models.Vaccine).all()
    return vaccines

@router.get("/pets/{pet_id}/vaccines", response_model=List[PetVaccineOut])
def get_pet_vaccines(pet_id: int, request: Request, db: Session = Depends(get_db)):
    """Get vaccines for a specific pet"""
    staff = get_current_staff(request, db)
    
    # Verify pet belongs to staff's shelter
    pet = db.query(models.Pet).filter(
        models.Pet.petID == pet_id,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter"
        )
    
    pet_vaccines = db.query(models.PetVaccine).filter(
        models.PetVaccine.petID == pet_id
    ).all()
    
    return pet_vaccines

@router.post("/pets/{pet_id}/vaccines", response_model=PetVaccineOut)
def add_pet_vaccine(pet_id: int, vaccine_data: dict, request: Request, db: Session = Depends(get_db)):
    """Add a vaccine to a pet"""
    staff = get_current_staff(request, db)
    
    # Verify pet belongs to staff's shelter
    pet = db.query(models.Pet).filter(
        models.Pet.petID == pet_id,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter"
        )
    
    # Verify vaccine exists
    vaccine = db.query(models.Vaccine).filter(
        models.Vaccine.vaccineID == vaccine_data["vaccineID"]
    ).first()
    
    if not vaccine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vaccine not found"
        )
    
    # Check if pet already has this vaccine
    existing = db.query(models.PetVaccine).filter(
        models.PetVaccine.petID == pet_id,
        models.PetVaccine.vaccineID == vaccine_data["vaccineID"]
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pet already has this vaccine"
        )
    
    pet_vaccine = models.PetVaccine(
        petID=pet_id,
        vaccineID=vaccine_data["vaccineID"],
        dateAdministered=datetime.utcnow()
    )
    
    db.add(pet_vaccine)
    db.commit()
    db.refresh(pet_vaccine)
    
    return pet_vaccine

@router.delete("/pets/{pet_id}/vaccines/{pet_vaccine_id}")
def delete_pet_vaccine(pet_id: int, pet_vaccine_id: int, request: Request, db: Session = Depends(get_db)):
    """Remove a vaccine from a pet"""
    staff = get_current_staff(request, db)
    
    # Verify pet belongs to staff's shelter
    pet = db.query(models.Pet).filter(
        models.Pet.petID == pet_id,
        models.Pet.shelterID == staff.shelterID
    ).first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found in your shelter"
        )
    
    pet_vaccine = db.query(models.PetVaccine).filter(
        models.PetVaccine.petVaccineID == pet_vaccine_id,
        models.PetVaccine.petID == pet_id
    ).first()
    
    if not pet_vaccine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet vaccine not found"
        )
    
    db.delete(pet_vaccine)
    db.commit()
    
    return None