from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
from database import get_db
from models import Admin, Doctor, Patient
import os

router = APIRouter()
security = HTTPBearer()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_type: str
    user_id: int
    user_name: str

class CreateUserRequest(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    user_type: str  # "admin", "doctor", or "patient"
    # Doctor specific fields
    license_number: str = None
    specialization: str = None
    # Patient specific fields
    phone: str = None
    emergency_contact: str = None
    emergency_phone: str = None
    doctor_id: int = None

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        user_type: str = payload.get("user_type")
        if user_id is None or user_type is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"user_id": user_id, "user_type": user_type}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Check admin first
    admin = db.query(Admin).filter(Admin.email == login_data.email).first()
    if admin and admin.password_hash and admin.check_password(login_data.password):
        access_token = create_access_token(
            data={"sub": admin.id, "user_type": "admin"},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_type="admin",
            user_id=admin.id,
            user_name=f"{admin.first_name} {admin.last_name}"
        )
    
    # Check doctor
    doctor = db.query(Doctor).filter(Doctor.email == login_data.email).first()
    if doctor and doctor.password_hash and doctor.check_password(login_data.password):
        access_token = create_access_token(
            data={"sub": doctor.id, "user_type": "doctor"},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_type="doctor",
            user_id=doctor.id,
            user_name=f"{doctor.first_name} {doctor.last_name}"
        )
    
    # Check patient
    patient = db.query(Patient).filter(Patient.email == login_data.email).first()
    if patient and patient.password_hash and patient.check_password(login_data.password):
        access_token = create_access_token(
            data={"sub": patient.id, "user_type": "patient"},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_type="patient",
            user_id=patient.id,
            user_name=f"{patient.first_name} {patient.last_name}"
        )
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.post("/admin/create-user")
async def create_user(
    user_data: CreateUserRequest, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    # Only admins can create users
    if current_user["user_type"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create users"
        )
    
    # Check if email already exists across all user types
    existing_admin = db.query(Admin).filter(Admin.email == user_data.email).first()
    existing_doctor = db.query(Doctor).filter(Doctor.email == user_data.email).first()
    existing_patient = db.query(Patient).filter(Patient.email == user_data.email).first()
    
    if existing_admin or existing_doctor or existing_patient:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user based on type
    if user_data.user_type == "admin":
        admin = Admin(
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
        admin.set_password(user_data.password)
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return {"message": "Admin created successfully", "user_id": admin.id}
    
    elif user_data.user_type == "doctor":
        doctor = Doctor(
            firebase_uid=f"doctor_{user_data.email}",
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            license_number=user_data.license_number or "TBD",
            specialization=user_data.specialization or "General"
        )
        doctor.set_password(user_data.password)
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
        return {"message": "Doctor created successfully", "user_id": doctor.id}
    
    elif user_data.user_type == "patient":
        # Get first available doctor if not specified
        doctor_id = user_data.doctor_id
        if not doctor_id:
            first_doctor = db.query(Doctor).first()
            doctor_id = first_doctor.id if first_doctor else 1
            
        patient = Patient(
            firebase_uid=f"patient_{user_data.email}",
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone or "",
            emergency_contact=user_data.emergency_contact or "",
            emergency_phone=user_data.emergency_phone or "",
            doctor_id=doctor_id
        )
        patient.set_password(user_data.password)
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return {"message": "Patient created successfully", "user_id": patient.id}
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user type. Must be 'admin', 'doctor', or 'patient'"
        )

@router.get("/me")
async def get_current_user(
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    user_id = current_user["user_id"]
    user_type = current_user["user_type"]
    
    if user_type == "admin":
        user = db.query(Admin).filter(Admin.id == user_id).first()
    elif user_type == "doctor":
        user = db.query(Doctor).filter(Doctor.id == user_id).first()
    elif user_type == "patient":
        user = db.query(Patient).filter(Patient.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "user_type": user_type,
        "is_active": user.is_active
    }
