from sqlalchemy import (
    Column, Integer, String, Enum, Date, DateTime, Text,
    ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


# 1. ---------- USERACCOUNT ----------
class UserAccount(Base):
    __tablename__ = "UserAccount"

    userID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    phone = Column(String(30))
    role = Column(
        Enum("ADOPTER", "STAFF", "ADMIN", name="user_role"),
        nullable=False,
        default="ADOPTER",       # SQLAlchemy default
        server_default="ADOPTER" # DB default
    )
    passwordHash = Column(String(255), nullable=False)

    # relationships
    adoptions = relationship("Adoption", back_populates="adopter", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="adopter", cascade="all, delete-orphan")
    care_logs = relationship("CareLog", back_populates="staff", cascade="all, delete-orphan")

    staff_profile = relationship("Staff", back_populates="user", cascade="all, delete-orphan", uselist=False)


# 2. ---------- SHELTER ----------
class Shelter(Base):
    __tablename__ = "Shelter"

    shelterID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    address = Column(String(100), nullable=False)
    phone = Column(String(30))

    pets = relationship("Pet", back_populates="shelter")
    appointments = relationship("Appointment", back_populates="shelter")

    staff_members = relationship("Staff", back_populates="shelter")

    __table_args__ = (
        Index("ix_shelter_name", "name"),
        Index("ix_shelter_address", "address"),
    )


# 3. ---------- STAFF ----------
class Staff(Base):
    __tablename__ = "Staff"

    staffID = Column(Integer, primary_key=True, autoincrement=True)
    userID = Column(Integer, ForeignKey("UserAccount.userID"), nullable=False, unique=True)
    shelterID = Column(Integer, ForeignKey("Shelter.shelterID"), nullable=False)
    position = Column(String(100), nullable=True)  # optional field if you want

    # relationships
    user = relationship("UserAccount", back_populates="staff_profile")
    shelter = relationship("Shelter", back_populates="staff_members")


# 4. ---------- PET ----------
class Pet(Base):
    __tablename__ = "Pet"

    petID = Column(Integer, primary_key=True, autoincrement=True)
    shelterID = Column(Integer, ForeignKey("Shelter.shelterID"), nullable=False)
    name = Column(String(100))
    species = Column(String(50))
    breed = Column(String(50))
    sex = Column(Enum("M", "F", "UNKNOWN", name="pet_sex"), nullable=False, default="UNKNOWN")
    dob = Column(Date)
    status = Column(Enum("AVAILABLE", "HOLD", "ADOPTED", name="pet_status"), nullable=False, default="AVAILABLE")
    intakeDate = Column(Date, nullable=False)

    shelter = relationship("Shelter", back_populates="pets")
    adoptions = relationship("Adoption", back_populates="pet", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="pet", cascade="all, delete-orphan")
    care_logs = relationship("CareLog", back_populates="pet", cascade="all, delete-orphan")
    vaccines = relationship("PetVaccine", back_populates="pet", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_pet_status", "status"),
        Index("ix_pet_species", "species"),
        Index("ix_pet_breed", "breed"),
        Index("ix_pet_shelterID", "shelterID"),
    )


# 5. ---------- VACCINE ----------
class Vaccine(Base):
    __tablename__ = "Vaccine"

    vaccineID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False, unique=True)

    pet_vaccines = relationship("PetVaccine", back_populates="vaccine")


# 6. ---------- PETVACCINE (JUNCTION) ----------
class PetVaccine(Base):
    __tablename__ = "PetVaccine"

    petID = Column(Integer, ForeignKey("Pet.petID"), primary_key=True)
    vaccineID = Column(Integer, ForeignKey("Vaccine.vaccineID"), primary_key=True)
    vaccineDate = Column(Date, primary_key=True)
    lotNo = Column(String(64), nullable=False)

    pet = relationship("Pet", back_populates="vaccines")
    vaccine = relationship("Vaccine", back_populates="pet_vaccines")


# 7. ---------- ADOPTION ----------
class Adoption(Base):
    __tablename__ = "Adoption"

    adoptionID = Column(Integer, primary_key=True, autoincrement=True)
    petID = Column(Integer, ForeignKey("Pet.petID"), nullable=False)
    adopterID = Column(Integer, ForeignKey("UserAccount.userID"), nullable=False)
    status = Column(
        Enum("APPLIED", "APPROVED", "FINALIZED", "REJECTED", "CANCELED", name="adopt_status"),
        nullable=False,
    )
    applicationDate = Column(DateTime)
    approvalDate = Column(DateTime)
    finalizationDate = Column(DateTime)

    pet = relationship("Pet", back_populates="adoptions")
    adopter = relationship("UserAccount", back_populates="adoptions")


# 8. ---------- APPOINTMENT ----------
from sqlalchemy import func
from datetime import datetime

class Appointment(Base):
    __tablename__ = "Appointment"
    
    appointmentID = Column(Integer, primary_key=True, autoincrement=True)
    petID = Column(Integer, ForeignKey("Pet.petID"), nullable=False)
    adopterID = Column(Integer, ForeignKey("UserAccount.userID"), nullable=False)
    shelterID = Column(Integer, ForeignKey("Shelter.shelterID"), nullable=False)
    appointmentTime = Column(DateTime, nullable=False)
    appointmentType = Column(
        Enum("VISIT", "MEET&GREET", "VET", name="appt_type"), nullable=False
    )
    
    # NEW FIELDS:
    status = Column(
        Enum("PENDING", "PENDING_EDIT", "UPCOMING", "COMPLETED", "REJECTED", name="appointment_status"),
        nullable=False,
        default="PENDING",
        server_default="PENDING"
    )
    requestedAt = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=func.now())
    updatedAt = Column(DateTime, nullable=True, onupdate=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    pet = relationship("Pet", back_populates="appointments")
    adopter = relationship("UserAccount", back_populates="appointments")
    shelter = relationship("Shelter", back_populates="appointments")
    
    __table_args__ = (
        Index("ix_appointment_status", "status"),
        Index("ix_appointment_shelterID", "shelterID"),
        Index("ix_appointment_adopterID", "adopterID"),
    )



# 9. ---------- CARELOG ----------
class CareLog(Base):
    __tablename__ = "CareLog"

    careID = Column(Integer, primary_key=True, autoincrement=True)
    petID = Column(Integer, ForeignKey("Pet.petID"), nullable=False)
    staffID = Column(Integer, ForeignKey("UserAccount.userID"), nullable=False)
    careDate = Column(DateTime, nullable=False)
    careType = Column(String(80), nullable=False)
    notes = Column(Text)

    pet = relationship("Pet", back_populates="care_logs")
    staff = relationship("UserAccount", back_populates="care_logs")


# 10. ---------- BREED ----------
class Breed(Base):
    __tablename__ = "Breed"

    breedID = Column(Integer, primary_key=True, autoincrement=True)
    species = Column(String(50), nullable=False)
    breedName = Column(String(100), nullable=False)
    size = Column(
        Enum("SMALL", "MEDIUM", "LARGE", name="breed_size"),
        default="MEDIUM",
    )
    lifespan = Column(String(30))
    temperament = Column(String(255))
