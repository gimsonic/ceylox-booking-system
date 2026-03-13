from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

# SCRAMBLER (Bcrypt) : encrypt passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "GIMSONIC_CEYLOX_SUPER_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Hashing the passwords
def hash_password(password: str):
    return pwd_context.hash(password)

# Checks if the entered password matches the scrambled version in the DB
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Creates the 'Digital Passport' (JWT)
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt