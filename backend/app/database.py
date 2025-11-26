# app/database.py
import os
import ssl
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("MYSQL_USER")
DB_PASS = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST")
DB_PORT = os.getenv("MYSQL_PORT", "3306")
DB_NAME = os.getenv("MYSQL_DB")
CA_PATH = os.getenv("MYSQL_CA") 

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4",
)

# ---- SSL handling ----
connect_args = {}

if CA_PATH and os.path.exists(CA_PATH):
    connect_args = {
        "ssl": {
            "ca": CA_PATH,
        }
    }
else:
    connect_args = {
        "ssl": {
            "cert_reqs": ssl.CERT_NONE,
        }
    }

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,   # drops dead connections
    pool_recycle=300,     # avoid stale connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
