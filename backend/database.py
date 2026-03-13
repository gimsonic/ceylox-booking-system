import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DB_URL")
SESSION_URL = os.getenv("SESSION_URL")

# Create the SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"}, # Security configuration
    pool_pre_ping=True,  # Check DB connection is still alive before using it
    #Free tier - 60 connections
    pool_size=5, # permanent connections
    max_overflow=10 # temporary connections
    )

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