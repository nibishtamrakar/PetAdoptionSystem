# app/models.py
from sqlalchemy import (
    Column, Integer, String, Enum, Date, DateTime, DECIMAL, Text,
    ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base


# 1. ---------- USERACCOUNT ----------
class UserAccount(Base):
    __tablename__ = "UserAccount"

    userID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    phone = Column(String(30))
    role = Column(Enum("ADOPTER", "STAFF", "VET", "ADMIN", name="user_role"), nullable=False)
    passwordHash = Column(String(255), nullable=False)

    # relationships
    adoptions = relationship("Adoption", back_populates="adopter")
    appointments = relationship("Appointment", back_populates="adopter")
    care_logs = relationship("CareLog", back_populates="staff")
    payments = relationship("Payment", back_populates="adopter")


# 2. ---------- SHELTER ----------
class Shelter(Base):
    __tablename__ = "Shelter"

    shelterID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    address = Column(String(100), nullable=False)
    phone = Column(String(30))

    pets = relationship("Pet", back_populates="shelter")
    appointments = relationship("Appointment", back_populates="shelter")


# 3. ---------- PET ----------
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
    adoptions = relationship("Adoption", back_populates="pet")
    appointments = relationship("Appointment", back_populates="pet")
    care_logs = relationship("CareLog", back_populates="pet")
    vaccines = relationship("PetVaccine", back_populates="pet")


# 4. ---------- VACCINE ----------
class Vaccine(Base):
    __tablename__ = "Vaccine"

    vaccineID = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False, unique=True)

    pet_vaccines = relationship("PetVaccine", back_populates="vaccine")


# 5. ---------- PETVACCINE (JUNCTION) ----------
class PetVaccine(Base):
    __tablename__ = "PetVaccine"

    petID = Column(Integer, ForeignKey("Pet.petID"), primary_key=True)
    vaccineID = Column(Integer, ForeignKey("Vaccine.vaccineID"), primary_key=True)
    vaccineDate = Column(Date, primary_key=True)
    lotNo = Column(String(64), nullable=False)

    pet = relationship("Pet", back_populates="vaccines")
    vaccine = relationship("Vaccine", back_populates="pet_vaccines")


# 6. ---------- ADOPTION ----------
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
    payments = relationship("Payment", back_populates="adoption")


# 7. ---------- APPOINTMENT ----------
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

    pet = relationship("Pet", back_populates="appointments")
    adopter = relationship("UserAccount", back_populates="appointments")
    shelter = relationship("Shelter", back_populates="appointments")
    payments = relationship("Payment", back_populates="appointment")


# 8. ---------- CARELOG ----------
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


# 9. ---------- PAYMENT ----------
class Payment(Base):
    __tablename__ = "Payment"

    paymentID = Column(Integer, primary_key=True, autoincrement=True)
    adopterID = Column(Integer, ForeignKey("UserAccount.userID"), nullable=False)
    adoptionID = Column(Integer, ForeignKey("Adoption.adoptionID"))
    appointmentID = Column(Integer, ForeignKey("Appointment.appointmentID"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    paymentDate = Column(DateTime, nullable=False)
    paymentMethod = Column(Enum("CASH", "CARD", name="pay_method"), nullable=False)
    status = Column(Enum("PENDING", "COMPLETED", "REFUNDED", name="pay_status"), default="PENDING")

    adopter = relationship("UserAccount", back_populates="payments")
    adoption = relationship("Adoption", back_populates="payments")
    appointment = relationship("Appointment", back_populates="payments")


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

