from datetime import datetime, timedelta
from typing import Annotated, Optional

import jwt
from fastapi import Depends, FastAPI, Form, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext  # type: ignore
from pydantic import BaseModel, EmailStr, Field, field_validator

from config import ACCESS_TOKEN_EXPIRE_MINUTES, ALGORITHM, SECRET_KEY
from db import get_db

# --- Configuration & Setup ---

# Password hashing setup using Argon2
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

if not SECRET_KEY:
    raise ValueError("No SECRET_KEY environment variable set for JWT")

# JWT setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


# --- Pydantic Models ---

class EmployerRegistration(BaseModel):
    business_email: EmailStr
    company_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('confirm_password')
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v


class EmployeeRegistration(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    confirm_password: str = Field(..., min_length=8)

    @field_validator('confirm_password')
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    user_type: Optional[str] = None


# --- Core Authentication Functions ---

async def get_user_by_email(db, email: str):
    """Looks for a user in the single 'users' collection by email."""
    return await db.users.find_one({"email": email})


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def authenticate_user(db, email: str, password: str, user_type: str):
    """Authenticates a user from the single 'users' collection, checking user_type."""
    user = await get_user_by_email(db, email)
    if not user:
        return False
    # Critical check: ensure the user_type from DB matches the one they're logging in as
    if user.get("user_type") != user_type:
        return False
    if not verify_password(password, user["password"]):
        return False
    return user


# --- FastAPI Dependencies ---

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if email is None or user_type is None:
            raise credentials_exception
        token_data = TokenData(email=email, user_type=user_type)
    except jwt.PyJWTError:
        raise credentials_exception

    db = get_db()
    user = await get_user_by_email(db, token_data.email) # type: ignore
    if user is None or user.get("user_type") != token_data.user_type:
        raise credentials_exception
    return user


async def get_current_employee(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_type") != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized - employee access required"
        )
    return current_user


async def get_current_employer(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_type") != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized - employer access required"
        )
    return current_user


# --- Auth Routes Factory ---

def add_auth_routes(app: FastAPI):

    @app.post("/api/register/employer", response_model=dict)
    async def register_employer(employer: EmployerRegistration):
        db = get_db()
        existing_user = await db.users.find_one({"email": employer.business_email})
        if existing_user:
            raise HTTPException(
                status_code=400, detail="Email already registered"
            )
        hashed_password = get_password_hash(employer.password)
        employer_data = {
            "email": employer.business_email,
            "company_name": employer.company_name,
            "password": hashed_password,
            "user_type": "employer",
            "plan": "free",  # Default plan
            "created_at": datetime.now(),
            "is_active": True
        }
        result = await db.users.insert_one(employer_data)
        return {"id": str(result.inserted_id), "message": "Employer registered successfully"}

    @app.post("/api/register/employee", response_model=dict)
    async def register_employee(employee: EmployeeRegistration):
        db = get_db()
        existing_user = await db.users.find_one({"email": employee.email})
        if existing_user:
            raise HTTPException(
                status_code=400, detail="Email already registered"
            )
        hashed_password = get_password_hash(employee.password)
        employee_data = {
            "email": employee.email,
            "full_name": employee.full_name,
            "password": hashed_password,
            "user_type": "employee",
            "plan": "free",  # Default plan
            "created_at": datetime.now(),
            "is_active": True
        }
        result = await db.users.insert_one(employee_data)
        return {"id": str(result.inserted_id), "message": "Employee registered successfully"}

    @app.post("/api/token", response_model=Token)
    async def login_for_access_token(
        username: str = Form(...),
        password: str = Form(...),
        user_type: str = Form(...)
    ):
        db = get_db()
        user = await authenticate_user(db, username, password, user_type)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email, password, or user type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"], "user_type": user["user_type"]},
            expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
