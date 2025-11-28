# Mock Data Script - Add to your database
# This creates 3 adoption applications (2 REJECTED, 1 APPLIED) and 1 appointment
# Using actual pets from your database

from datetime import datetime, timedelta
from database import SessionLocal
from models import Adoption, Pet, Appointment, Shelter

# Get database session
db = SessionLocal()

# The logged-in user is userID = 2 (sam@gmail.com)
ADOPTER_ID = 21
ADOPTER_NAME = "sam"

# Create 3 mock adoptions using REAL pets from your database
# Using: Buddy (petID=1), Luna (petID=2), Max (petID=3)
adoptions_data = [
    {
        "petID": 1,  # Buddy - Dog
        "petName": "Buddy",
        "petSpecies": "Dog",
        "status": "REJECTED",
        "applicationDate": datetime(2025, 9, 15),
    },
    {
        "petID": 2,  # Luna - Cat
        "petName": "Luna",
        "petSpecies": "Cat",
        "status": "REJECTED",
        "applicationDate": datetime(2025, 10, 5),
    },
    {
        "petID": 3,  # Max - Dog
        "petName": "Max",
        "petSpecies": "Dog",
        "status": "APPLIED",
        "applicationDate": datetime(2025, 11, 20),
    },
]

# Add adoptions to database
for adoption_data in adoptions_data:
    adoption = Adoption(
        petID=adoption_data["petID"],
        adopterID=ADOPTER_ID,
        status=adoption_data["status"],
        applicationDate=adoption_data["applicationDate"],
    )
    db.add(adoption)

db.commit()
print("✅ 3 Adoption applications added!")

# Create 1 mock appointment for Max with APPLIED status
appointment = Appointment(
    petID=3,  # Max (the pet with APPLIED adoption status)
    adopterID=ADOPTER_ID,
    shelterID=3,  # Using Max's shelterID
    appointmentTime=datetime(2025, 12, 5, 14, 30),  # Dec 5, 2025 at 2:30 PM
    appointmentType="MEET&GREET",
)
db.add(appointment)
db.commit()
print("✅ 1 Appointment scheduled!")

# Verify the data
print("\n--- Adoption Applications for", ADOPTER_NAME, "---")
adoptions = db.query(Adoption).filter(Adoption.adopterID == ADOPTER_ID).all()
for adoption in adoptions:
    pet = db.query(Pet).filter(Pet.petID == adoption.petID).first()
    status_display = "REJECTED ❌" if adoption.status == "REJECTED" else "IN PROGRESS ⏳"
    print(
        f"- {pet.name} ({pet.species}): {status_display} - Applied on {adoption.applicationDate.strftime('%Y-%m-%d')}"
    )

print("\n--- Appointments for", ADOPTER_NAME, "---")
from models import Shelter
appointments = db.query(Appointment).filter(Appointment.adopterID == ADOPTER_ID).all()
for appt in appointments:
    pet = db.query(Pet).filter(Pet.petID == appt.petID).first()
    shelter = db.query(Shelter).filter(Shelter.shelterID == appt.shelterID).first()
    shelter_name = shelter.name if shelter else "Unknown Shelter"
    print(
        f"- {pet.name} at {shelter_name} on {appt.appointmentTime.strftime('%Y-%m-%d %H:%M')} ({appt.appointmentType})"
    )

db.close()
print("\n✅ Mock data setup complete!")