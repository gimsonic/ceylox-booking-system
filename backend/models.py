from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Numeric, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    mobile = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_guest = Column(Boolean, default=True)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    duration_minutes = Column(Integer)
    img_url = Column(String, nullable=True)


class Booking(Base):
    __tablename__ = "bookings"

    id =  Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # -- Relational link: Foriegn Key to USERS table --
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # -- Relational link: Foriegn Key to SERVICES table --
    room_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)

    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    total_price = Column(Numeric(10, 2))
    status = Column(String, default="confirmed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())