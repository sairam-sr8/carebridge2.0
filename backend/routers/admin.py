from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Admin, Doctor, Patient, Interaction, Alert
from routers.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime, timedelta
import json

router = APIRouter()

@router.get("/dashboard")
async def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get admin dashboard data"""
    
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access dashboard")
    
    # Get counts
    total_doctors = db.query(Doctor).count()
    total_patients = db.query(Patient).count()
    total_interactions = db.query(Interaction).count()
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    
    # Get recent activity
    recent_interactions = db.query(Interaction).order_by(
        Interaction.created_at.desc()
    ).limit(10).all()
    
    recent_activity = []
    for interaction in recent_interactions:
        recent_activity.append({
            "id": interaction.id,
            "patient_id": interaction.patient_id,
            "speaker": interaction.speaker,
            "type": interaction.interaction_type,
            "timestamp": interaction.created_at.isoformat(),
            "content": interaction.content[:100] + "..." if len(interaction.content) > 100 else interaction.content
        })
    
    return {
        "stats": {
            "total_doctors": total_doctors,
            "total_patients": total_patients,
            "total_interactions": total_interactions,
            "active_alerts": active_alerts
        },
        "recent_activity": recent_activity
    }

@router.get("/users")
async def get_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all users"""
    
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view users")
    
    # Get all users
    admins = db.query(Admin).all()
    doctors = db.query(Doctor).all()
    patients = db.query(Patient).all()
    
    users = []
    
    # Add admins
    for admin in admins:
        users.append({
            "id": admin.id,
            "email": admin.email,
            "first_name": admin.first_name,
            "last_name": admin.last_name,
            "user_type": "admin",
            "is_active": admin.is_active,
            "created_at": admin.created_at.isoformat()
        })
    
    # Add doctors
    for doctor in doctors:
        users.append({
        "id": doctor.id,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
            "user_type": "doctor",
            "is_active": doctor.is_active,
            "specialization": doctor.specialization,
        "license_number": doctor.license_number,
        "created_at": doctor.created_at.isoformat()
        })
    
    # Add patients
    for patient in patients:
        users.append({
        "id": patient.id,
        "email": patient.email,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
            "user_type": "patient",
            "is_active": patient.is_active,
        "doctor_id": patient.doctor_id,
        "created_at": patient.created_at.isoformat()
        })
    
    return {"users": users}

class CreateUserRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    user_type: str
    specialization: str = "General Practice"  # For doctors
    license_number: str = None  # For doctors

@router.post("/create-user")
async def create_user(
    user_data: CreateUserRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new user"""
    
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")
    
    # Check if user already exists
    if user_data.user_type == "admin":
        existing_user = db.query(Admin).filter(Admin.email == user_data.email).first()
    elif user_data.user_type == "doctor":
        existing_user = db.query(Doctor).filter(Doctor.email == user_data.email).first()
    elif user_data.user_type == "patient":
        existing_user = db.query(Patient).filter(Patient.email == user_data.email).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid user type")
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user based on type
    if user_data.user_type == "admin":
        user = Admin(
            firebase_uid=f"admin_{user_data.email}",
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
    elif user_data.user_type == "doctor":
        user = Doctor(
            firebase_uid=f"doctor_{user_data.email}",
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            license_number=user_data.license_number or f"LIC{user_data.email.split('@')[0]}",
            specialization=user_data.specialization
        )
    elif user_data.user_type == "patient":
        user = Patient(
            firebase_uid=f"patient_{user_data.email}",
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
    
    user.set_password(user_data.password)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": f"{user_data.user_type.title()} created successfully", "user_id": user.id}

class DeleteUserRequest(BaseModel):
    user_type: str

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: DeleteUserRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a user"""
    
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")
    
    # Find and delete user
    user_type = request.user_type
    if user_type == "admin":
        user = db.query(Admin).filter(Admin.id == user_id).first()
    elif user_type == "doctor":
        user = db.query(Doctor).filter(Doctor.id == user_id).first()
        if user:
            # Unassign patients
            db.query(Patient).filter(Patient.doctor_id == user_id).update({"doctor_id": None})
    elif user_type == "patient":
        user = db.query(Patient).filter(Patient.id == user_id).first()
        if user:
            # Delete related records
            db.query(Interaction).filter(Interaction.patient_id == user_id).delete()
            db.query(Alert).filter(Alert.patient_id == user_id).delete()
    else:
        raise HTTPException(status_code=400, detail="Invalid user type")
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"message": f"{user_type.title()} deleted successfully"}

@router.get("/activities")
async def get_activities(
    filter: str = "all",
    timeRange: str = "24h",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get system activities for monitoring"""
    
    if current_user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view activities")
    
    # Mock activities data for now
    activities = [
        {
            "id": 1,
            "type": "user_login",
            "user": "patient@carebridge.com",
            "timestamp": "2025-09-16T10:30:00Z",
            "details": "Patient logged in successfully"
        },
        {
            "id": 2,
            "type": "ai_interaction",
            "user": "patient@carebridge.com",
            "timestamp": "2025-09-16T10:35:00Z",
            "details": "AI Buddy conversation started"
        },
        {
            "id": 3,
            "type": "doctor_assignment",
            "user": "doctor@carebridge.com",
            "timestamp": "2025-09-16T10:40:00Z",
            "details": "Patient assigned to doctor"
        }
    ]
    
    return {
        "activities": activities,
        "total": len(activities),
        "filter": filter,
        "timeRange": timeRange
    }
