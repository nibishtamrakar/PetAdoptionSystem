# app/routers/pets.py
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

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
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            models.Pet,
            models.Shelter.name.label("shelterName"),
            models.Shelter.address.label("shelterAddress"),
        )
        .join(models.Shelter, models.Pet.shelterID == models.Shelter.shelterID)
        .filter(models.Pet.status.in_(["AVAILABLE", "HOLD"]))  # only adoptable
    )

    # ---- location search: shelter name OR address (which includes city text) ----
    if q_location:
        like_loc = f"%{q_location}%"
        query = query.filter(
            or_(
                models.Shelter.name.ilike(like_loc),
                models.Shelter.address.ilike(like_loc),
            )
        )

    # ---- animal search: species OR breed ----
    if q_animal:
        like_animal = f"%{q_animal}%"
        query = query.filter(
            or_(
                models.Pet.species.ilike(like_animal),
                models.Pet.breed.ilike(like_animal),
            )
        )

    rows = query.all()

    pets_out: List[PetOut] = []
    for pet_obj, shelterName, shelterAddress in rows:
        pets_out.append(
            PetOut(
                petID=pet_obj.petID,
                name=pet_obj.name,
                species=pet_obj.species,
                breed=pet_obj.breed,
                sex=pet_obj.sex,
                dob=pet_obj.dob,
                status=pet_obj.status,
                intakeDate=pet_obj.intakeDate,
                shelterName=shelterName,
                shelterAddress=shelterAddress,  
            )
        )

    return pets_out




@router.get("/pets/{pet_id}", response_model=PetDetailOut)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(models.Pet, models.Shelter)
        .join(models.Shelter, models.Pet.shelterID == models.Shelter.shelterID)
        .filter(models.Pet.petID == pet_id)
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Pet not found")

    pet, shelter = row

    ageYears = None
    if pet.dob:
        ageYears = round((date.today() - pet.dob).days / 365, 1)

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
                detail="Invalid sex value. Must be 'Male', 'Female', 'M', or 'F'"
            )
    
    # Update pet fields
    for field, value in pet_data.items():
        if hasattr(pet, field) and field != "petID":
            setattr(pet, field, value)
    
    db.commit()
    db.refresh(pet)
    
    # Get shelter info for response
    shelter = db.query(models.Shelter).filter(models.Shelter.shelterID == pet.shelterID).first()
    
    ageYears = None
    if pet.dob:
        ageYears = round((date.today() - pet.dob).days / 365, 1)
    
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
    )
