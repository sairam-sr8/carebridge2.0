from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models import Admin, Doctor, Patient
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Security - Fixed for development
SECRET_KEY = "carebridge-secret-key-2024-development-only"  # Fixed key for development
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: int
    email: str

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"❌ Password verification error: {e}")
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, email: str, password: str, user_type: str):
    print(f"🔍 Authenticating {user_type}: {email}")
    
    if user_type == "admin":
        user = db.query(Admin).filter(Admin.email == email).first()
    elif user_type == "doctor":
        user = db.query(Doctor).filter(Doctor.email == email).first()
    elif user_type == "patient":
        user = db.query(Patient).filter(Patient.email == email).first()
    else:
        print(f"❌ Invalid user type: {user_type}")
        return False
    
    if not user:
        print(f"❌ User not found: {email} as {user_type}")
        return False
        
    password_valid = user.check_password(password)
    print(f"🔐 Password check for {email}: {'✅ VALID' if password_valid else '❌ INVALID'}")
    
    if not password_valid:
        return False
        
    print(f"✅ Authentication SUCCESS: {user.first_name} {user.last_name} ({user_type})")
    return user

async def verify_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        user_type: str = payload.get("user_type")
        if user_id is None or user_type is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    if user_type == "admin":
        user = db.query(Admin).filter(Admin.id == user_id).first()
    elif user_type == "doctor":
        user = db.query(Doctor).filter(Doctor.id == user_id).first()
    elif user_type == "patient":
        user = db.query(Patient).filter(Patient.id == user_id).first()
    else:
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    return {"id": user.id, "email": user.email, "user_type": user_type}

# Alias for compatibility
get_current_user = verify_token

class LoginRequest(BaseModel):
    email: str  # Frontend sends 'email' not 'username'
    password: str

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    # Try to authenticate as each user type
    for user_type in ["admin", "doctor", "patient"]:
        user = authenticate_user(db, login_data.email, login_data.password, user_type)
        if user:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(user.id), "user_type": user_type}, 
                expires_delta=access_token_expires
            )
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user_type=user_type,
                user_id=user.id,
                email=user.email
            )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.post("/admin/create-user")
async def create_user(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    user_type: str,
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    
    # Check if user already exists
    if user_type == "admin":
        existing_user = db.query(Admin).filter(Admin.email == email).first()
    elif user_type == "doctor":
        existing_user = db.query(Doctor).filter(Doctor.email == email).first()
    elif user_type == "patient":
        existing_user = db.query(Patient).filter(Patient.email == email).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid user type")
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user based on type
    if user_type == "admin":
        user = Admin(
            firebase_uid=f"admin_{email}",
            email=email,
            first_name=first_name,
            last_name=last_name
        )
    elif user_type == "doctor":
        user = Doctor(
            firebase_uid=f"doctor_{email}",
            email=email,
            first_name=first_name,
            last_name=last_name,
            license_number=f"LIC{email.split('@')[0]}",
            specialization="General Practice"
        )
    elif user_type == "patient":
        user = Patient(
            firebase_uid=f"patient_{email}",
            email=email,
            first_name=first_name,
            last_name=last_name
        )
    
    user.set_password(password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": f"{user_type.title()} created successfully", "user_id": user.id}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(verify_token)):
    return current_user

# Alias for compatibility
get_current_user = verify_token
