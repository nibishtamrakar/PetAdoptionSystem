# app/routers/pets.py
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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
def list_pets(db: Session = Depends(get_db)):
    """
    Return all pets that are AVAILABLE or HOLD,
    along with their shelter name.
    """
    # join Pet -> Shelter, filter by status
    pets = (
        db.query(models.Pet)
        .join(models.Shelter)
        .filter(models.Pet.status.in_(["AVAILABLE", "HOLD"]))
        .all()
    )

    # build list of PetOut including shelterName
    result: List[PetOut] = []
    for p in pets:
        result.append(
            PetOut(
                petID=p.petID, # type: ignore
                name=p.name, # type: ignore
                species=p.species, # type: ignore
                breed=p.breed, # type: ignore
                sex=p.sex,  # type: ignore
                dob=p.dob, # type: ignore
                status=p.status, # type: ignore
                intakeDate=p.intakeDate, # type: ignore
                shelterName=p.shelter.name,  # from relationship
                shelterAddress=p.shelter.address,  # from relationship
            )
        )

    return result

@router.get("/pets/{pet_id}", response_model=PetDetailOut)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    # join Pet + Shelter so we can get address
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
        shelterAddress=shelter.address,   # 👈 this was missing
        ageYears=ageYears,
    )