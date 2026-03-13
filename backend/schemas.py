from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID     #UUID : for professional ID management
from datetime import date

# ---- SERVICES ----
class ServiceBase(BaseModel):
    name: str
    description : Optional[str] = None
    price: float
    duration_minutes: int
    img_url: Optional[str] = None

class ServiceCreate(ServiceBase):
    pass

# Defines what a service looks like when SEND it back to the user
class Service(ServiceCreate):
    id: int

    class Config:
        from_attributes = True   #Allows Pyddantic to read data from the database


# ---- USER ----
class UserBase(BaseModel):
    full_name: str
    email : EmailStr
    # mobile: Optional[str] = None
    mobile : str 

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response
class User(UserBase):
    id : UUID
    full_name: str
    email: EmailStr
    mobile: str
    is_guest: bool
    is_active: bool

    class Config:
        from_attributes = True

# ---- BOOKING ----
class BookingBase(BaseModel):
    room_id: int
    check_in_date: date
    check_out_date: date
    total_price: Optional[float] = None

class BookingCreate(BookingBase):
    ''' Combines room data and user data to facilitate a one-step checkout process '''
    full_name: str
    email: EmailStr
    mobile: Optional[str] = None

class Booking(BookingBase):
    # The complete Booking object as stored in thr DB
    id: UUID
    user_id: UUID # Link the BOOKING back with USER table
    status: str = "confirmed"
    
    class Config:
        from_attributes = True


''' -- Security and Token schemas -- '''
class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None