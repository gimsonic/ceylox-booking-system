from pydantic import BaseModel
from typing import Optional

# Define what needed when a user CREATES a service
class ServiceCreate(BaseModel):
    name: str
    description : Optional[str] = None
    price: float
    duration_minutes: int

# Defines what a service looks like when SEND it back to the user
class Service(ServiceCreate):
    id: int

    class Config:
        from_attributes = True