from sqlalchemy import Column, Integer, String, Float
from database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    duration_minutes = Column(Integer)