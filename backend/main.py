from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
#from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import engine, get_db, SessionLocal
from typing import List, Optional
from auth_utils import hash_password, verify_password, create_access_token
import models, schemas


# Create the tables in Superbase if do not exist (using SQLAlchemy)
#models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Define API accessed origins
origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

# Allows secure handshake with backend (Middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"], # allows GET, POST, PUT, DELETE
    allow_headers = ["*"], # allows custom headers (Auth tokens)
)

# ------------------------- POST methods ------------------------------

@app.post("/services/", response_model=schemas.Service)
def create_service(service: schemas.ServiceCreate, db: Session = Depends(get_db)):
    db_service = models.Service(
        name = service.name,
        description = service.description,
        price = service.price,
        duration_minutes = service.duration_minutes,
        img_url = service.img_url
    )

    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@app.post("/bookings/", response_model=schemas.Booking)
def create_booking(
    booking_data: schemas.BookingCreate, 
    db: Session=Depends(get_db),
    authorization: Optional[str] = Header(None)
    ):
    
    try:
        # Overlapping check
        overlapping_booking = db.query(models.Booking).filter(
            models.Booking.room_id == booking_data.room_id,
            models.Booking.status == "confirmed",
            #overlap formula
            models.Booking.check_in_date < booking_data.check_out_date,
            models.Booking.check_out_date > booking_data.check_in_date
        ).first()

        if overlapping_booking:
            raise HTTPException(
                status_code = status.HTTP_409_CONFLICT,
                detail = "Sorry! This room is already booked for some or all of your selected dates."
            )

        ''' Lazy registration: Check if user exist by email '''
        db_user = db.query(models.User).filter(
            models.User.email == booking_data.email
            ).first() # Returns details if user already exist. Otherwise return None

        if not db_user:
            # -- Create if user is new --
            db_user = models.User(
                full_name = booking_data.full_name,
                email = booking_data.email,
                mobile = booking_data.mobile
            )

            db.add(db_user)
            #db.commit()
            #db.refresh(new_user)
            #db_user = new_user

            db.flush() # Save User temporary

    
        new_booking = models.Booking(
            user_id = db_user.id, # Foreign Key link
            room_id = booking_data.room_id,
            check_in_date = booking_data.check_in_date,
            check_out_date = booking_data.check_out_date,
            total_price = booking_data.total_price,
            status = "confirmed"
        )

        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)

        return new_booking
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback() # Cleans up the failed transaction
        print(f"DATABASE ERROR: {str(e)}") # Help to identify the real error and show it in terminal
        raise HTTPException(status_code=400, detail="Booking could not be created") #detail=f"Booking failed: {str(e)}"

# Authentication
@app.post("/signup/", response_model=schemas.User)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):

    # Check if email exist in the system
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()

    if existing_user:
        # If the User is guest then convert into a registered user
        if getattr(existing_user, 'is_guest', False):
            existing_user.hashed_password = hash_password(user_data.password)
            existing_user.is_guest = False
            existing_user.full_name = user_data.full_name
            existing_user.mobile = user_data.mobile

            db.commit()
            db.refresh(existing_user)
            return existing_user
        
        else:
            # If already registered
            raise HTTPException(
                status_code = status.HTTP_400_BAD_REQUEST,
                detail = "Email is already registered. Please log in."
            )

    # New user registration
    new_user = models.User(
        email = user_data.email,
        full_name = user_data.full_name,
        mobile = user_data.mobile,
        hashed_password = hash_password(user_data.password),
        is_guest = False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login/", response_model = schemas.LoginResponse)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):

    # Find user by email
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()

    if not user or user.is_guest or not user.hashed_password:
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid email or password"
        )
    
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Invalid email or password"
        )
    
    # Generate digital passport (JWT)
    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
        }

'''
@app.post("/token/")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user:
        raise HTTPException(status_code=401)

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401)

    access_token = create_access_token(data={"sub": user.email})

    return {"access_token": access_token, "token_type": "bearer"}
'''
    
# -------------------------- GET methods --------------------------------------------

@app.get("/")
def read_root():
    return {"message": "Welcome to Ceylox Booking System API"}

@app.get("/status/")
def get_status():
    return {"status": "online", "database": "pending connection"}

@app.get("/services/", response_model = List[schemas.Service])
def get_services(db: Session = Depends(get_db)):
        # Give everything in the services table
    services = db.query(models.Service).all()
    return services


@app.get("/bookings/", response_model = List[schemas.Booking])
def get_bookings(db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).all()
    return bookings