from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.database import SessionLocal
from app import models
from app.routers.users import get_current_user

router = APIRouter(prefix="/api", tags=["adoptions"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== CREATE ADOPTION REQUEST ==========
@router.post("/adoptions", status_code=status.HTTP_201_CREATED)
async def create_adoption(
    adoption_data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create adoption request (APPLIED status)"""
    current_user = get_current_user(request, db)
    if current_user.role != "ADOPTER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only adopters can create adoption requests"
        )

    try:
        pet = db.query(models.Pet).filter(
            models.Pet.petID == adoption_data.get("petID")
        ).first()
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found"
            )

        new_adoption = models.Adoption(
            petID=adoption_data.get("petID"),
            adopterID=current_user.userID,
            status="APPLIED",
            applicationDate=datetime.utcnow()
        )

        db.add(new_adoption)
        db.commit()
        db.refresh(new_adoption)

        return {
            "adoptionID": new_adoption.adoptionID,
            "petID": new_adoption.petID,
            "adopterID": new_adoption.adopterID,
            "status": new_adoption.status,
            "applicationDate": new_adoption.applicationDate,
            "message": "Adoption application created successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating adoption: {str(e)}"
        )

# ========== GET ADOPTIONS FOR USER ==========
@router.get("/users/{user_id}/adoptions")
async def get_user_adoptions(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all adoptions for a user"""
    if current_user.userID != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        adoptions = db.query(models.Adoption).options(
            joinedload(models.Adoption.pet)
        ).filter(
            models.Adoption.adopterID == user_id
        ).all()

        adoption_list = []
        for adoption in adoptions:
            adoption_list.append({
                "adoptionID": adoption.adoptionID,
                "petID": adoption.petID,
                "petName": adoption.pet.name if adoption.pet else "Unknown",
                "petSpecies": adoption.pet.species if adoption.pet else "Unknown",
                "applicationDate": adoption.applicationDate,
                "status": adoption.status,
                "approvalDate": adoption.approvalDate
            })

        return adoption_list if adoption_list else []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== GET ALL ADOPTIONS FOR STAFF ==========
@router.get("/adoptions")
async def get_all_adoptions(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all adoptions (staff/admin only)"""
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

            adoptions = db.query(models.Adoption).options(
                joinedload(models.Adoption.pet),
                joinedload(models.Adoption.adopter)
            ).join(models.Pet).filter(
                models.Pet.shelterID == staff.shelterID
            ).all()
        else:
            adoptions = db.query(models.Adoption).options(
                joinedload(models.Adoption.pet),
                joinedload(models.Adoption.adopter)
            ).all()

        adoption_list = []
        for adoption in adoptions:
            adoption_list.append({
                "adoptionID": adoption.adoptionID,
                "petID": adoption.petID,
                "petName": adoption.pet.name if adoption.pet else "Unknown",
                "petSpecies": adoption.pet.species if adoption.pet else "Unknown",
                "adopterName": adoption.adopter.name if adoption.adopter else "Unknown",
                "adopterEmail": adoption.adopter.email if adoption.adopter else "Unknown",
                "adopterPhone": adoption.adopter.phone if adoption.adopter else "N/A",
                "applicationDate": adoption.applicationDate,
                "status": adoption.status,
                "approvalDate": adoption.approvalDate
            })

        return adoption_list if adoption_list else []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ACCEPT ADOPTION ==========
@router.put("/adoptions/{adoption_id}/accept")
async def accept_adoption(
    adoption_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Staff accepts adoption (changes to APPROVED)"""
    current_user = get_current_user(request, db)
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )

    adoption = db.query(models.Adoption).filter(
        models.Adoption.adoptionID == adoption_id
    ).first()

    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adoption not found"
        )

    if adoption.status != "APPLIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept adoption with status {adoption.status}"
        )

    if current_user.role == "STAFF":
        staff = db.query(models.Staff).filter(
            models.Staff.userID == current_user.userID
        ).first()

        pet = db.query(models.Pet).filter(
            models.Pet.petID == adoption.petID
        ).first()

        if not staff or not pet or pet.shelterID != staff.shelterID:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this adoption"
            )

    try:
        adoption.status = "APPROVED"
        adoption.approvalDate = datetime.utcnow()
        db.commit()
        db.refresh(adoption)

        existing_appointment = db.query(models.Appointment).filter(
            models.Appointment.adopterID == adoption.adopterID,
            models.Appointment.petID == adoption.petID,
            models.Appointment.status.in_(["PENDING", "UPCOMING"])
        ).first()

        return {
            "adoptionID": adoption.adoptionID,
            "status": adoption.status,
            "approvalDate": adoption.approvalDate,
            "appointmentExists": existing_appointment is not None,
            "message": "Adoption approved successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ========== REJECT ADOPTION ==========
@router.put("/adoptions/{adoption_id}/reject")
async def reject_adoption(
    adoption_id: int,
    reject_data: dict,
    request: Request,
    db: Session = Depends(get_db)
):
    """Staff rejects adoption"""
    current_user = get_current_user(request, db)
    if current_user.role not in ["ADMIN", "STAFF"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )

    adoption = db.query(models.Adoption).filter(
        models.Adoption.adoptionID == adoption_id
    ).first()

    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adoption not found"
        )

    if current_user.role == "STAFF":
        staff = db.query(models.Staff).filter(
            models.Staff.userID == current_user.userID
        ).first()

        pet = db.query(models.Pet).filter(
            models.Pet.petID == adoption.petID
        ).first()

        if not staff or not pet or pet.shelterID != staff.shelterID:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this adoption"
            )

    if adoption.status != "APPLIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject adoption with status {adoption.status}"
        )

    try:
        adoption.status = "REJECTED"
        db.commit()
        db.refresh(adoption)

        return {
            "adoptionID": adoption.adoptionID,
            "status": adoption.status,
            "message": "Adoption rejected"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ========== DELETE ADOPTION ==========
@router.delete("/adoptions/{adoption_id}")
async def delete_adoption(
    adoption_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """User deletes their adoption application"""
    current_user = get_current_user(request, db)

    adoption = db.query(models.Adoption).filter(
        models.Adoption.adoptionID == adoption_id
    ).first()

    if not adoption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adoption not found"
        )

    if adoption.adopterID != current_user.userID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized"
        )

    if adoption.status not in ["APPLIED", "APPROVED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete adoption with status {adoption.status}"
        )

    try:
        db.delete(adoption)
        db.commit()
        return {"message": "Adoption application deleted"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))