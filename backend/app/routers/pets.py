# app/routers/pets.py
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, text

from app.database import SessionLocal
from app import models
from app.schemas import PetOut, PetDetailOut

router = APIRouter(prefix="/api", tags=["pets"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/pets", response_model=List[PetOut])
def list_pets(
    q_location: Optional[str] = None,   # search by shelter/address/city
    q_animal: Optional[str] = None,     # search by species/breed
    available_only:bool = True,
    db: Session = Depends(get_db),
):
    """
    List available pets from vw_available_pets view.
    Supports filtering by location (shelterName/address) and animal (species/breed).
    """
    if available_only:
        sql = "SELECT * FROM vw_available_pets WHERE 1=1"
    else:
        sql = """
            SELECT 
                p.petID,
                p.name,
                p.species,
                p.breed,
                p.sex,
                p.dob,
                p.status,
                p.intakeDate,
                p.shelterID,
                s.name AS shelterName,
                s.address AS shelterAddress
            FROM Pet p
            INNER JOIN Shelter s ON p.shelterID = s.shelterID
            WHERE 1=1
        """
    params = {}

    # ---- location search: shelter name OR address ----
    if q_location:
        if available_only:
            sql += " AND (shelterName LIKE :loc OR shelterAddress LIKE :loc)"
        else:
             sql += " AND (s.name LIKE :loc OR s.address LIKE :loc)"
        params["loc"] = f"%{q_location}%"

    # ---- animal search: species OR breed ----
    if q_animal:
        if available_only:
            sql += " AND (species LIKE :ani OR breed LIKE :ani)"
        else:
            sql += " AND (p.species LIKE :ani OR p.breed LIKE :ani)"
        params["ani"] = f"%{q_animal}%"

    rows = db.execute(text(sql), params).mappings().all()

    pets_out: List[PetOut] = []
    for row in rows:
        pets_out.append(
            PetOut(
                petID=row["petID"],
                name=row["name"],
                species=row["species"],
                breed=row["breed"],
                sex=row["sex"],
                dob=row["dob"],
                status=row["status"],
                intakeDate=row["intakeDate"],
                shelterID=row["shelterID"],
                shelterName=row["shelterName"],
                shelterAddress=row["shelterAddress"],
            )
        )

    return pets_out

@router.get("/pets/{pet_id}", response_model=PetDetailOut)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    # SQL-level computed fields (MySQL):
    # ageYears  = TIMESTAMPDIFF(YEAR, dob, CURDATE())
    # daysInCare = GREATEST(0, DATEDIFF(CURDATE(), intakeDate))
    age_expr = func.timestampdiff(text("YEAR"), models.Pet.dob, func.curdate())
    days_expr = func.greatest(
        0,
        func.datediff(func.curdate(), models.Pet.intakeDate),
    )

    row = (
        db.query(
            models.Pet,
            models.Shelter,
            age_expr.label("ageYears"),
            days_expr.label("daysInCare"),
        )
        .join(models.Shelter, models.Pet.shelterID == models.Shelter.shelterID)
        .filter(models.Pet.petID == pet_id)
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Pet not found")

    pet, shelter, ageYears, daysInCare = row

    return PetDetailOut(
        petID=pet.petID,
        name=pet.name,
        species=pet.species,
        breed=pet.breed,
        sex=pet.sex,
        dob=pet.dob,
        status=pet.status,
        intakeDate=pet.intakeDate,
        shelterID=shelter.shelterID,
        shelterName=shelter.name,
        shelterAddress=shelter.address,
        ageYears=ageYears,
        daysInCare=daysInCare,
    )


@router.put("/pets/{pet_id}", response_model=PetDetailOut)
def update_pet(pet_id: int, pet_data: dict, db: Session = Depends(get_db)):
    """Update a pet's details"""
    pet = db.query(models.Pet).filter(models.Pet.petID == pet_id).first()

    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Convert sex values
    if "sex" in pet_data:
        if pet_data["sex"] in ["Male", "M"]:
            pet_data["sex"] = "M"
        elif pet_data["sex"] in ["Female", "F"]:
            pet_data["sex"] = "F"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sex value. Must be 'Male', 'Female', 'M', or 'F'",
            )

    # Update pet fields
    for field, value in pet_data.items():
        if hasattr(pet, field) and field != "petID":
            setattr(pet, field, value)

    db.commit()
    db.refresh(pet)

    # Re-query with shelter + SQL-computed ageYears and daysInCare
    age_expr = func.timestampdiff(text("YEAR"), models.Pet.dob, func.curdate())
    days_expr = func.greatest(
        0,
        func.datediff(func.curdate(), models.Pet.intakeDate),
    )

    row = (
        db.query(
            models.Pet,
            models.Shelter,
            age_expr.label("ageYears"),
            days_expr.label("daysInCare"),
        )
        .join(models.Shelter, models.Pet.shelterID == models.Shelter.shelterID)
        .filter(models.Pet.petID == pet_id)
        .first()
    )

    if not row:
        # Very unlikely after update, but just in case
        raise HTTPException(status_code=404, detail="Pet not found after update")

    pet, shelter, ageYears, daysInCare = row

    return PetDetailOut(
        petID=pet.petID,
        name=pet.name,
        species=pet.species,
        breed=pet.breed,
        sex=pet.sex,
        dob=pet.dob,
        status=pet.status,
        intakeDate=pet.intakeDate,
        shelterName=shelter.name,
        shelterAddress=shelter.address,
        ageYears=ageYears,
        daysInCare=daysInCare,
    )