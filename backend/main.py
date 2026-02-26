from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import engine, get_db
from typing import List
import models, schemas

# Tells SQLAlchemy to create the tables in Superbase
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ------------------------- POST methods ------------------------------

@app.post("/services/", response_model=schemas.Service)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db)):
    db_service = models.Service(
        name = service.name,
        description = service.description,
        price = service.price,
        duration_minutes = service.duration_minutes
    )

    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

# -------------------------- GET methods --------------------------------------------

@app.get("/")
def read_root():
    return {"message": "Welcome to Ceylox Booking System API"}

@app.get("/status")
def get_status():
    return {"status": "online", "database": "pending connection"}

@app.get("/services/", response_model = List[schemas.Service])
def get_services(db: Session = Depends(get_db)):
    # Give everything in the services table
    services = db.query(models.Service).all()
    return services
