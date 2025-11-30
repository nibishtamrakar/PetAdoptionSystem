from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, SessionLocal
from . import models
from app.routers import appointments
from app.routers import adoptions





from app.routers import users
from app.routers import pets
from app.routers import staff
from app.routers import admin

Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://pet-adoption-system-two.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,      # set True for cookies/auth
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
def ping():
    return {"ok": True}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"ok": True}



app.include_router(users.router)
app.include_router(pets.router)
app.include_router(staff.router)
app.include_router(admin.router)
app.include_router(appointments.router)
app.include_router(adoptions.router)