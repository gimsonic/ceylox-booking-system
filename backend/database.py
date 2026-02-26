import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DB_URL")

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create a SessionLocal class (the actual tool to talk to the DB)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for the database models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()