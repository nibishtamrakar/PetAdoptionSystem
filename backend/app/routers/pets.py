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
            )
        )

    return result

@router.get("/pets/{pet_id}", response_model=PetDetailOut)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = (
        db.query(models.Pet, models.Shelter.name.label("shelterName"))
        .join(models.Shelter, models.Pet.shelterID == models.Shelter.shelterID)
        .filter(models.Pet.petID == pet_id)
        .first()
    )

    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    (pet_obj, shelterName) = pet
    ageYears = None
    if pet_obj.dob:
        ageYears = round((date.today() - pet_obj.dob).days / 365, 1)

    return {
        "petID": pet_obj.petID,
        "name": pet_obj.name,
        "species": pet_obj.species,
        "breed": pet_obj.breed,
        "sex": pet_obj.sex,
        "status": pet_obj.status,
        "dob": pet_obj.dob,
        "intakeDate": pet_obj.intakeDate,
        "shelterName": shelterName,
        "ageYears": ageYears,
    }
