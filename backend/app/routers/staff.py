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

def get_staff_shelter_id(user, db):
    """Get shelter ID for staff user by looking up staff record"""
    if user.role == "ADMIN":
        return None  # Admin doesn't have a specific shelter
    
    staff_record = db.query(models.Staff).filter(models.Staff.userID == user.userID).first()
    if not staff_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff record not found"
        )
    return staff_record.shelterID

@router.post("/staff-care-logs", response_model=CareLogOut, status_code=status.HTTP_201_CREATED)
def create_care_log(
    care_log: CareLogCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create care logs"
        )
    
    # For staff users, verify pet belongs to staff's shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        pet = db.query(models.Pet).filter(
            models.Pet.petID == care_log.petID,
            models.Pet.shelterID == staff_shelter_id
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found in your shelter"
            )
    else:
        # For admin users, just verify pet exists
        pet = db.query(models.Pet).filter(models.Pet.petID == care_log.petID).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )
    
    db_care_log = models.CareLog(
        **care_log.dict(),
        staffID=user.userID,
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
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view care logs"
        )
    
    query = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    )
    
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        query = query.filter(models.Pet.shelterID == staff_shelter_id)
    
    # Filter by specific pet if requested
    if pet_id:
        query = query.filter(models.CareLog.petID == pet_id)
    
    care_logs = query.order_by(
        models.CareLog.careDate.desc()
    ).offset(offset).limit(limit).all()

    return care_logs

@router.delete("/staff-care-logs/{care_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_care_log(
    care_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete care logs"
        )
    
    care_log = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    ).filter(models.CareLog.careLogID == care_id)
    
    # For staff users, ensure they can only delete care logs for pets in their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        care_log = care_log.filter(models.Pet.shelterID == staff_shelter_id)
    
    care_log = care_log.first()
    
    if not care_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Care log not found"
        )
    
    db.delete(care_log)
    db.commit()
    return None

@router.get("/users", response_model=List[UserOut])
def get_users(request: Request, db: Session = Depends(get_db)):
    """Get all users (for staff dashboard to show adopter names)"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view users"
        )
    
    users = db.query(models.UserAccount).all()
    return users

# Homepage endpoints
@router.get("/recent-care-logs", response_model=List[CareLogOut])
def get_recent_care_logs(request: Request, limit: int = 10, db: Session = Depends(get_db)):
    """Get recent care logs for homepage"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view care logs"
        )
    
    care_logs = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    )
    
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        care_logs = care_logs.filter(models.Pet.shelterID == staff_shelter_id)
    
    care_logs = care_logs.order_by(models.CareLog.careDate.desc()).limit(limit).all()
    
    return care_logs

@router.get("/upcoming-appointments", response_model=List[AppointmentOut])
def get_upcoming_appointments(request: Request, db: Session = Depends(get_db)):
    """Get upcoming appointments for homepage"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    from datetime import datetime
        
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view appointments"
        )
        
    appointments = db.query(models.Appointment).filter(
        models.Appointment.appointmentTime > datetime.now()
    )
        
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        appointments = appointments.filter(models.Appointment.shelterID == staff_shelter_id)
        
    appointments = appointments.order_by(models.Appointment.appointmentTime).all()
        
    return appointments

# History endpoints
@router.get("/all-care-logs", response_model=List[CareLogOut])
def get_all_care_logs(request: Request, db: Session = Depends(get_db)):
    """Get all care logs for history"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view care logs"
        )
    
    care_logs = db.query(models.CareLog).join(
        models.Pet,
        models.CareLog.petID == models.Pet.petID
    )
    
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        care_logs = care_logs.filter(models.Pet.shelterID == staff_shelter_id)
    
    care_logs = care_logs.order_by(models.CareLog.careDate.desc()).all()
    
    return care_logs

@router.get("/past-appointments", response_model=List[AppointmentOut])
def get_past_appointments(request: Request, db: Session = Depends(get_db)):
    """Get past appointments for history"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    from datetime import datetime
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view appointments"
        )
    
    appointments = db.query(models.Appointment).filter(
        models.Appointment.appointmentTime <= datetime.now()
    )
    
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        appointments = appointments.filter(models.Appointment.shelterID == staff_shelter_id)
    
    appointments = appointments.order_by(models.Appointment.appointmentTime.desc()).all()
    
    return appointments

# Adoption requests endpoints
@router.get("/adoption-requests", response_model=List[AdoptionOut])
def get_adoption_requests(request: Request, db: Session = Depends(get_db)):
    """Get adoption requests for pets in this shelter"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view adoption requests"
        )
    
    # Get adoptions for pets in this shelter (for staff) or all shelters (for admin)
    adoptions = db.query(models.Adoption).join(
        models.Pet,
        models.Adoption.petID == models.Pet.petID
    )
    
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        # Get staff record to find shelterID
        staff_record = db.query(models.Staff).filter(models.Staff.userID == user.userID).first()
        if not staff_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff record not found"
            )
        adoptions = adoptions.filter(models.Pet.shelterID == staff_record.shelterID)
    
    adoptions = adoptions.order_by(models.Adoption.applicationDate.desc()).all()
    
    return adoptions

@router.put("/adoption-requests/{adoption_id}/accept")
def accept_adoption_request(adoption_id: int, request: Request, db: Session = Depends(get_db)):
    """Accept an adoption request"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to accept adoption requests"
        )
    
    adoption = db.query(models.Adoption).filter(
        models.Adoption.adoptionID == adoption_id
    ).join(models.Pet, models.Adoption.petID == models.Pet.petID)
    
    # For staff users, ensure pet belongs to their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        adoption = adoption.filter(models.Pet.shelterID == staff_shelter_id)
    
    adoption = adoption.first()
    
    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adoption request not found"
        )
    
    # Update pet status to ADOPTED
    pet = db.query(models.Pet).filter(models.Pet.petID == adoption.petID).first()
    if pet:
        pet.status = "ADOPTED"
    
    # Update adoption status and approval date
    adoption.status = "APPROVED"
    adoption.approvalDate = datetime.now()
    
    db.commit()
    return {"message": "Adoption request accepted"}

@router.put("/adoption-requests/{adoption_id}/reject")
def reject_adoption_request(adoption_id: int, request: Request, db: Session = Depends(get_db)):
    """Reject an adoption request"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reject adoption requests"
        )
    
    adoption = db.query(models.Adoption).filter(
        models.Adoption.adoptionID == adoption_id
    ).join(models.Pet, models.Adoption.petID == models.Pet.petID)
    
    # For staff users, ensure pet belongs to their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        adoption = adoption.filter(models.Pet.shelterID == staff_shelter_id)
    
    adoption = adoption.first()
    
    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adoption request not found"
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
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view pets"
        )
    
    query = db.query(
        models.Pet,
        models.Shelter.name.label("shelterName"),
        models.Shelter.address.label("shelterAddress"),
    ).join(
        models.Shelter,
        models.Pet.shelterID == models.Shelter.shelterID
    )
    
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        query = query.filter(models.Pet.shelterID == staff_shelter_id)
    
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

@router.post("/staff-pets", response_model=PetOut)
def create_pet(pet_data: dict, request: Request, db: Session = Depends(get_db)):
    """Create a new pet for staff's shelter"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create pets"
        )
    
    # Convert sex values
    if pet_data["sex"] in ["Male", "M"]:
        pet_data["sex"] = "M"
    elif pet_data["sex"] in ["Female", "F"]:
        pet_data["sex"] = "F"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sex value. Must be 'Male', 'Female', 'M', or 'F'"
        )
    
    # Determine shelter ID based on user role
    shelter_id = pet_data.get("shelterID")
    if user.role == "STAFF":
        shelter_id = get_staff_shelter_id(user, db)
    elif user.role == "ADMIN" and not shelter_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shelter ID required for admin pet creation"
        )
    
    db_pet = models.Pet(
        name=pet_data["name"],
        species=pet_data["species"],
        breed=pet_data.get("breed"),
        sex=pet_data["sex"],
        dob=pet_data.get("dob"),
        status=pet_data.get("status", "AVAILABLE"),
        intakeDate=pet_data.get("intakeDate") or datetime.now().date(),
        shelterID=shelter_id
    )
    
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    
    # Get shelter info for response
    shelter = db.query(models.Shelter).filter(models.Shelter.shelterID == shelter_id).first()
    
    return {
        "petID": db_pet.petID,
        "name": db_pet.name,
        "species": db_pet.species,
        "breed": db_pet.breed,
        "sex": db_pet.sex,
        "dob": db_pet.dob,
        "status": db_pet.status,
        "intakeDate": db_pet.intakeDate,
        "shelterID": db_pet.shelterID,
        "shelterName": shelter.name if shelter else None,
        "shelterAddress": shelter.address if shelter else None
    }

@router.get("/staff-appointments", response_model=List[AppointmentOut])
def get_shelter_appointments(
    request: Request,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view appointments"
        )
    
    query = db.query(models.Appointment)
    
    # For staff users, filter by their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        query = query.filter(models.Appointment.shelterID == staff_shelter_id)
    
    if start_date:
        query = query.filter(models.Appointment.appointmentTime >= start_date)
    if end_date:
        query = query.filter(models.Appointment.appointmentTime <= end_date)
    
    appointments = query.order_by(
        models.Appointment.appointmentTime
    ).offset(offset).limit(limit).all()
    
    return appointments

@router.post("/staff-appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment: ScheduleAppointmentIn,
    request: Request,
    db: Session = Depends(get_db)
):
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create appointments"
        )
    
    pet = db.query(models.Pet).filter(models.Pet.petID == appointment.petID).first()
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found"
        )
    
    # For staff users, verify pet belongs to their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        if pet.shelterID != staff_shelter_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Pet not in your shelter"
            )
        shelter_id = staff_shelter_id
    else:
        shelter_id = pet.shelterID
    
    if appointment.shelterID != shelter_id:
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
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update appointments"
        )
    
    db_appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id
    )
    
    # For staff users, ensure they can only update appointments in their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        db_appointment = db_appointment.filter(models.Appointment.shelterID == staff_shelter_id)
    
    db_appointment = db_appointment.first()
    
    if not db_appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Update appointment fields
    for field, value in appointment.dict().items():
        if hasattr(db_appointment, field):
            setattr(db_appointment, field, value)
    
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.delete("/staff-appointments/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete appointments"
        )
    
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id
    )
    
    # For staff users, ensure they can only delete appointments in their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        appointment = appointment.filter(models.Appointment.shelterID == staff_shelter_id)
    
    appointment = appointment.first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    db.delete(appointment)
    db.commit()
    return None

# Vaccine endpoints
@router.get("/vaccines", response_model=List[VaccineOut])
def get_vaccines(request: Request, db: Session = Depends(get_db)):
    """Get all available vaccines"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users to access vaccines
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access vaccines"
        )
    
    vaccines = db.query(models.Vaccine).all()
    return vaccines

@router.get("/pets/{pet_id}/vaccines", response_model=List[PetVaccineOut])
def get_pet_vaccines(pet_id: int, request: Request, db: Session = Depends(get_db)):
    """Get vaccines for a specific pet"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users to access pet vaccines
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access pet vaccines"
        )
    
    # For staff users, verify pet belongs to staff's shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        pet = db.query(models.Pet).filter(
            models.Pet.petID == pet_id,
            models.Pet.shelterID == staff_shelter_id
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Pet not in your shelter"
            )
    else:
        # For admin users, just verify pet exists
        pet = db.query(models.Pet).filter(models.Pet.petID == pet_id).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )
    
    pet_vaccines = db.query(models.PetVaccine).filter(
        models.PetVaccine.petID == pet_id
    ).all()
    
    return pet_vaccines

@router.post("/pets/{pet_id}/vaccines", response_model=PetVaccineOut)
def add_pet_vaccine(pet_id: int, vaccine_data: dict, request: Request, db: Session = Depends(get_db)):
    """Add a vaccine to a pet"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users to add pet vaccines
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add pet vaccines"
        )
    
    # For staff users, verify pet belongs to staff's shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        pet = db.query(models.Pet).filter(
            models.Pet.petID == pet_id,
            models.Pet.shelterID == staff_shelter_id
        ).first()
        
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found in your shelter"
            )
    else:
        # For admin users, just verify pet exists
        pet = db.query(models.Pet).filter(models.Pet.petID == pet_id).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
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
        vaccineDate=datetime.now().date(),
        lotNo=vaccine_data.get("lotNo", "DEFAULT")
    )
    
    db.add(pet_vaccine)
    db.commit()
    db.refresh(pet_vaccine)
    
    return pet_vaccine

@router.delete("/pets/{pet_id}/vaccines/{pet_vaccine_id}")
def delete_pet_vaccine(pet_id: int, pet_vaccine_id: int, request: Request, db: Session = Depends(get_db)):
    """Remove a vaccine from a pet"""
    from app.routers.users import get_current_user
    user = get_current_user(request, db)
    
    # Allow both admin and staff users
    if user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete pet vaccines"
        )
    
    # Verify pet belongs to staff's shelter (for staff users)
    pet = db.query(models.Pet).filter(models.Pet.petID == pet_id)
    
    # For staff users, verify pet belongs to their shelter
    if user.role == "STAFF":
        staff_shelter_id = get_staff_shelter_id(user, db)
        pet = pet.filter(models.Pet.shelterID == staff_shelter_id)
    
    pet = pet.first()
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found"
        )
    
    # Find and delete the pet vaccine
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
    return {"message": "Pet vaccine removed successfully"}