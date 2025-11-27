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
    shelterAddress: str     
    ageYears: Optional[float]

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



# ---------- STAFF ----------

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class StaffProfile(BaseModel):
    userID: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    position: Optional[str]
    shelterID: int
    shelterName: str
    shelterAddress: str
    shelterPhone: Optional[str]

    class Config:
        orm_mode = True

class PetBase(BaseModel):
    name: str
    species: str
    breed: str
    sex: str = "UNKNOWN"
    dob: Optional[date] = None
    status: str = "AVAILABLE"
    intakeDate: date

class PetCreate(PetBase):
    pass

class Pet(PetBase):
    petID: int
    shelterID: int

    class Config:
        orm_mode = True

class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    sex: Optional[str] = None
    dob: Optional[date] = None
    status: Optional[str] = None
    intakeDate: Optional[date] = None

class CareLogBase(BaseModel):
    petID: int
    careType: str
    notes: Optional[str] = None

class CareLogCreate(CareLogBase):
    pass

class CareLog(CareLogBase):
    careID: int
    staffID: int
    careDate: datetime

    class Config:
        orm_mode = True

class AppointmentBase(BaseModel):
    petID: int
    adopterID: int
    appointmentTime: datetime
    appointmentType: str
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    petID: Optional[int] = None
    adopterID: Optional[int] = None
    appointmentTime: Optional[datetime] = None
    appointmentType: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class Appointment(AppointmentBase):
    appointmentID: int
    shelterID: int
    status: str

    class Config:
        orm_mode = True