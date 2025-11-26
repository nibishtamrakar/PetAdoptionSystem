from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


# ---------- PETS ----------

class PetOut(BaseModel):
    petID: int
    name: Optional[str]
    species: Optional[str]
    breed: Optional[str]
    sex: str
    dob: Optional[date]
    status: str
    intakeDate: date
    shelterName: str
    shelterAddress: str
    
    class Config:
        orm_mode = True


class PetDetailOut(BaseModel):
    petID: int
    name: Optional[str]
    species: Optional[str]
    breed: Optional[str]
    sex: str
    dob: Optional[date]
    status: str
    intakeDate: date
    shelterName: str
    ageYears: Optional[float]
    shelterAddress: str

    class Config:
        orm_mode = True


# ---------- ADOPTION ----------

class AdoptionCreate(BaseModel):
    petID: int
    adopterID: int


class AdoptionOut(BaseModel):
    adoptionID: int
    petID: int
    adopterID: int
    status: str
    applicationDate: Optional[datetime]
    approvalDate: Optional[datetime]
    finalizationDate: Optional[datetime]

    class Config:
        orm_mode = True


# ---------- APPOINTMENT ----------

class ScheduleAppointmentIn(BaseModel):
    petID: int
    adopterID: int
    shelterID: int
    time: datetime
    type: str  # 'VISIT' | 'MEET&GREET' | 'VET'


class AppointmentOut(BaseModel):
    appointmentID: int
    petID: int
    adopterID: int
    shelterID: int
    appointmentTime: datetime
    appointmentType: str

    class Config:
        orm_mode = True


# ---------- CARE LOG ----------

class CareLogCreate(BaseModel):
    petID: int
    staffID: int
    careType: str
    notes: Optional[str] = None


class CareLogOut(BaseModel):
    careID: int
    petID: int
    staffID: int
    careDate: datetime
    careType: str
    notes: Optional[str]

    class Config:
        orm_mode = True


# ---------- BREED ----------

class BreedOut(BaseModel):
    breedID: int
    species: str
    breedName: str
    size: str
    lifespan: Optional[str]
    temperament: Optional[str]

    class Config:
        orm_mode = True


# ---------- VACCINE / PETVACCINE ----------

class VaccineOut(BaseModel):
    vaccineID: int
    name: str

    class Config:
        orm_mode = True


class PetVaccineOut(BaseModel):
    petID: int
    vaccineID: int
    vaccineDate: date
    lotNo: str

    class Config:
        orm_mode = True


# ---------- STAFF (NEW) ----------

class StaffCreate(BaseModel):
    userID: int
    shelterID: int
    position: Optional[str] = None


class StaffOut(BaseModel):
    staffID: int
    userID: int
    shelterID: int
    position: Optional[str]

    class Config:
        orm_mode = True


# ---------- USER ACCOUNT ----------

class UserSignupIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str


class UserOut(BaseModel):
    userID: int
    name: str
    email: EmailStr
    phone: Optional[str]
    role: str  # ADOPTER, STAFF, ADMIN

    class Config:
        orm_mode = True


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class LoginOut(BaseModel):
    userID: int
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True
