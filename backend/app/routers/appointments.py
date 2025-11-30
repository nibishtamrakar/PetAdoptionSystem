from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.database import SessionLocal
from app import models
from app.routers.users import get_current_user

router = APIRouter(prefix="/api", tags=["appointments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== CREATE APPOINTMENT (USER FROM PROFILE) ==========
@router.post("/appointments", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create appointment request (PENDING status)"""
    current_user = get_current_user(request, db)
    if current_user.role != "ADOPTER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only adopters can request appointments"
        )

    try:
        pet = db.query(models.Pet).filter(
            models.Pet.petID == appointment_data.get("petID")
        ).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )

        appt_time_str = appointment_data.get("appointmentTime")
        appt_time = datetime.fromisoformat(appt_time_str) if appt_time_str else None
        if not appt_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Valid appointmentTime is required"
            )

        if appt_time <= datetime.now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Appointment time must be in the future"
            )

        new_appointment = models.Appointment(
            petID=appointment_data.get("petID"),
            adopterID=current_user.userID,
            shelterID=pet.shelterID,
            appointmentTime=appt_time,
            appointmentType=appointment_data.get("appointmentType", "VISIT"),
            status="PENDING",
            requestedAt=datetime.utcnow(),
            notes=appointment_data.get("notes", "")
        )

        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)

        return {
            "appointmentID": new_appointment.appointmentID,
            "petID": new_appointment.petID,
            "shelterID": new_appointment.shelterID,
            "appointmentTime": new_appointment.appointmentTime,
            "appointmentType": new_appointment.appointmentType,
            "status": new_appointment.status,
            "requestedAt": new_appointment.requestedAt,
            "message": "Appointment request created successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid appointment data: {str(e)}"
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating appointment: {str(e)}"
        )

# ========== GET USER APPOINTMENTS ==========
@router.get("/users/{user_id}/appointments")
async def get_user_appointments(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all appointments for a user"""
    if current_user.userID != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        appointments = db.query(models.Appointment).options(
            joinedload(models.Appointment.pet),
            joinedload(models.Appointment.shelter)
        ).filter(
            models.Appointment.adopterID == user_id
        ).all()

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
                "shelterAddress": apt.shelter.address if apt.shelter else "N/A",
                "status": apt.status,
                "requestedAt": apt.requestedAt,
                "notes": apt.notes
            })

        return appointment_list if appointment_list else []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== GET ALL APPOINTMENTS FOR STAFF ==========
@router.get("/appointments")
async def get_all_appointments(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all appointments (staff/admin only)"""
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )

    try:
        if current_user.role == "STAFF":
            staff = db.query(models.Staff).filter(
                models.Staff.userID == current_user.userID
            ).first()
            if not staff:
                raise HTTPException(status_code=403, detail="Staff record not found")

            appointments = db.query(models.Appointment).options(
                joinedload(models.Appointment.pet),
                joinedload(models.Appointment.adopter),
                joinedload(models.Appointment.shelter)
            ).filter(
                models.Appointment.shelterID == staff.shelterID
            ).all()
        else:
            appointments = db.query(models.Appointment).options(
                joinedload(models.Appointment.pet),
                joinedload(models.Appointment.adopter),
                joinedload(models.Appointment.shelter)
            ).all()

        appointment_list = []
        for apt in appointments:
            appointment_list.append({
                "appointmentID": apt.appointmentID,
                "petID": apt.petID,
                "petName": apt.pet.name if apt.pet else "Unknown",
                "adopterID": apt.adopterID,
                "adopterName": apt.adopter.name if apt.adopter else "Unknown",
                "adopterEmail": apt.adopter.email if apt.adopter else "Unknown",
                "appointmentTime": apt.appointmentTime,
                "appointmentType": apt.appointmentType,
                "status": apt.status,
                "requestedAt": apt.requestedAt,
                "notes": apt.notes,
                "shelterName": apt.shelter.name if apt.shelter else "Unknown"
            })

        return appointment_list if appointment_list else []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== UPDATE APPOINTMENT (RESCHEDULE) ==========
@router.put("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: int,
    appointment_data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update appointment (user can edit UPCOMING, staff can edit any)"""
    current_user = get_current_user(request, db)

    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if current_user.userID != appointment.adopterID and current_user.role != "STAFF":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    if current_user.role == "ADOPTER" and appointment.status != "UPCOMING":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only edit UPCOMING appointments"
        )

    try:
        if "appointmentTime" in appointment_data and appointment_data["appointmentTime"]:
            new_time = datetime.fromisoformat(appointment_data["appointmentTime"])
            if new_time <= datetime.now():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Appointment time must be in the future"
                )

            appointment.appointmentTime = new_time

        if "appointmentType" in appointment_data:
            appointment.appointmentType = appointment_data["appointmentType"]

        if "notes" in appointment_data:
            appointment.notes = appointment_data["notes"]

        if current_user.role == "ADOPTER":
            appointment.status = "PENDING_EDIT"

        appointment.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(appointment)

        return {
            "appointmentID": appointment.appointmentID,
            "status": appointment.status,
            "appointmentTime": appointment.appointmentTime,
            "appointmentType": appointment.appointmentType,
            "updatedAt": appointment.updatedAt,
            "message": "Appointment updated successfully"
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid appointment data: {str(e)}"
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating appointment: {str(e)}"
        )

# ========== ACCEPT APPOINTMENT (STAFF) ==========
@router.put("/appointments/{appointment_id}/accept")
async def accept_appointment(
    appointment_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Staff accepts pending appointment (PENDING → UPCOMING)"""
    current_user = get_current_user(request, db)
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )

    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if appointment.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept appointment with status {appointment.status}"
        )

    if current_user.role == "STAFF":
        staff = db.query(models.Staff).filter(
            models.Staff.userID == current_user.userID
        ).first()

        if not staff or appointment.shelterID != staff.shelterID:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this appointment"
            )

    try:
        appointment.status = "UPCOMING"
        appointment.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(appointment)

        return {
            "appointmentID": appointment.appointmentID,
            "status": appointment.status,
            "appointmentTime": appointment.appointmentTime,
            "updatedAt": appointment.updatedAt,
            "message": "Appointment accepted successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ========== RESCHEDULE APPOINTMENT (STAFF) ==========
@router.put("/appointments/{appointment_id}/reschedule")
async def reschedule_appointment(
    appointment_id: int,
    reschedule_data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """Staff reschedules appointment"""
    current_user = get_current_user(request, db)
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )

    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if current_user.role == "STAFF":
        staff = db.query(models.Staff).filter(
            models.Staff.userID == current_user.userID
        ).first()

        if not staff or appointment.shelterID != staff.shelterID:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this appointment"
            )

    try:
        if "appointmentTime" in reschedule_data:
            new_time = datetime.fromisoformat(reschedule_data["appointmentTime"])
            if new_time <= datetime.now():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Appointment time must be in the future"
                )

            appointment.appointmentTime = new_time

        appointment.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(appointment)

        return {
            "appointmentID": appointment.appointmentID,
            "appointmentTime": appointment.appointmentTime,
            "updatedAt": appointment.updatedAt,
            "message": "Appointment rescheduled successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ========== CANCEL APPOINTMENT ==========
@router.delete("/appointments/{appointment_id}")
async def delete_appointment(
    appointment_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete appointment (user or staff)"""
    current_user = get_current_user(request, db)

    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointmentID == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    if current_user.role == "ADOPTER":
        if appointment.adopterID != current_user.userID:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized"
            )

    elif current_user.role == "STAFF":
        staff = db.query(models.Staff).filter(
            models.Staff.userID == current_user.userID
        ).first()

        if not staff or appointment.shelterID != staff.shelterID:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )

    try:
        db.delete(appointment)
        db.commit()
        return {"message": "Appointment cancelled successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))