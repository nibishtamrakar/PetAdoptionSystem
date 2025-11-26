# app/routers/pets.py
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
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
    q_location: Optional[str] = None,
    q_animal: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Pet, models.Shelter.name.label("shelterName"))
        .join(models.Shelter, models.Pet.shelterID == models.Shelter.shelterID)
        .filter(models.Pet.status.in_(["AVAILABLE", "HOLD"]))
    )

    if q_location:
        like = f"%{q_location}%"
        query = query.filter(
            or_(
                models.Shelter.name.ilike(like),
                models.Shelter.address.ilike(like),
            )
        )

    if q_animal:
        like = f"%{q_animal}%"
        query = query.filter(
            or_(
                models.Pet.species.ilike(like),
                models.Pet.breed.ilike(like),
            )
        )

    rows = query.all()

    return [
        PetOut(
            petID=p.petID,
            name=p.name,
            species=p.species,
            breed=p.breed,
            sex=p.sex,
            dob=p.dob,
            status=p.status,
            intakeDate=p.intakeDate,
            shelterName=sname,
        )
        for p, sname in rows
    ]



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
        shelterName=shelter.name,
        shelterAddress=shelter.address,  # keep this if you add it to schema
        ageYears=ageYears,
    )
