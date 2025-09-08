from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from pydantic import BaseModel
from datetime import datetime, timedelta
from models import Doctor, Patient, Interaction, Note, Alert
from database import get_db

router = APIRouter()

# Pydantic models
class SystemOverview(BaseModel):
    total_patients: int
    total_doctors: int
    active_alerts: int
    high_risk_alerts: int
    recent_interactions: int
    system_health: str

class AuditEvent(BaseModel):
    id: int
    event_type: str
    description: str
    user_type: str
    user_id: int
    timestamp: str
    details: dict

class HighRiskAlert(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    doctor_id: int
    doctor_name: str
    alert_type: str
    title: str
    message: str
    severity: int
    created_at: str
    urgency_level: int

@router.get("/overview")
async def get_system_overview(db: Session = Depends(get_db)):
    """Get system overview statistics for admin dashboard"""
    
    # Count total patients
    total_patients = db.query(Patient).filter(Patient.is_active == True).count()
    
    # Count total doctors
    total_doctors = db.query(Doctor).filter(Doctor.is_active == True).count()
    
    # Count active alerts
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    
    # Count high-risk alerts (severity >= 4)
    high_risk_alerts = db.query(Alert).filter(
        Alert.is_resolved == False,
        Alert.severity >= 4
    ).count()
    
    # Count recent interactions (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_interactions = db.query(Interaction).filter(
        Interaction.created_at >= yesterday
    ).count()
    
    # Determine system health
    if high_risk_alerts > 5:
        system_health = "critical"
    elif high_risk_alerts > 2:
        system_health = "warning"
    elif active_alerts > 10:
        system_health = "attention"
    else:
        system_health = "healthy"
    
    return SystemOverview(
        total_patients=total_patients,
        total_doctors=total_doctors,
        active_alerts=active_alerts,
        high_risk_alerts=high_risk_alerts,
        recent_interactions=recent_interactions,
        system_health=system_health
    )

@router.get("/audit")
async def get_audit_log(db: Session = Depends(get_db)):
    """Get last 100 audit events for compliance monitoring"""
    
    # Get recent interactions (as audit events)
    interactions = db.query(Interaction).order_by(desc(Interaction.created_at)).limit(50).all()
    
    # Get recent alerts
    alerts = db.query(Alert).order_by(desc(Alert.created_at)).limit(30).all()
    
    # Get recent notes
    notes = db.query(Note).order_by(desc(Note.created_at)).limit(20).all()
    
    audit_events = []
    
    # Process interactions
    for interaction in interactions:
        audit_events.append(AuditEvent(
            id=interaction.id,
            event_type="patient_interaction",
            description=f"Patient {interaction.patient.first_name} {interaction.patient.last_name} had {interaction.interaction_type} interaction",
            user_type="patient",
            user_id=interaction.patient_id,
            timestamp=interaction.created_at.isoformat(),
            details={
                "interaction_type": interaction.interaction_type,
                "content_preview": interaction.content[:100] + "..." if len(interaction.content) > 100 else interaction.content,
                "sentiment_score": interaction.sentiment_score,
                "red_flags": interaction.red_flags,
                "urgency_level": interaction.urgency_level
            }
        ))
    
    # Process alerts
    for alert in alerts:
        audit_events.append(AuditEvent(
            id=alert.id + 10000,  # Offset to avoid ID conflicts
            event_type="alert_created",
            description=f"Alert '{alert.title}' created for patient {alert.patient.first_name} {alert.patient.last_name}",
            user_type="system",
            user_id=0,
            timestamp=alert.created_at.isoformat(),
            details={
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "is_resolved": alert.is_resolved,
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
                "message": alert.message
            }
        ))
    
    # Process notes
    for note in notes:
        audit_events.append(AuditEvent(
            id=note.id + 20000,  # Offset to avoid ID conflicts
            event_type="note_created",
            description=f"Note '{note.title}' created by Dr. {note.doctor.first_name} {note.doctor.last_name}",
            user_type="doctor",
            user_id=note.doctor_id,
            timestamp=note.created_at.isoformat(),
            details={
                "note_type": note.note_type,
                "is_private": note.is_private,
                "content_preview": note.content[:100] + "..." if len(note.content) > 100 else note.content,
                "patient_id": note.patient_id
            }
        ))
    
    # Sort by timestamp and return last 100
    audit_events.sort(key=lambda x: x.timestamp, reverse=True)
    return audit_events[:100]

@router.get("/alerts/high-risk")
async def get_high_risk_alerts(db: Session = Depends(get_db)):
    """Get unresolved high-risk alerts for crisis coordination"""
    
    # Get unresolved alerts with severity >= 4
    alerts = db.query(Alert).filter(
        Alert.is_resolved == False,
        Alert.severity >= 4
    ).order_by(desc(Alert.created_at)).all()
    
    high_risk_alerts = []
    
    for alert in alerts:
        # Get patient and doctor info
        patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()
        doctor = db.query(Doctor).filter(Doctor.id == alert.doctor_id).first()
        
        # Get urgency level from related interaction if available
        interaction = db.query(Interaction).filter(
            Interaction.patient_id == alert.patient_id,
            Interaction.created_at <= alert.created_at
        ).order_by(desc(Interaction.created_at)).first()
        
        urgency_level = interaction.urgency_level if interaction else alert.severity
        
        high_risk_alerts.append(HighRiskAlert(
            id=alert.id,
            patient_id=alert.patient_id,
            patient_name=f"{patient.first_name} {patient.last_name}" if patient else "Unknown Patient",
            doctor_id=alert.doctor_id,
            doctor_name=f"Dr. {doctor.first_name} {doctor.last_name}" if doctor else "Unknown Doctor",
            alert_type=alert.alert_type,
            title=alert.title,
            message=alert.message,
            severity=alert.severity,
            created_at=alert.created_at.isoformat(),
            urgency_level=urgency_level
        ))
    
    return high_risk_alerts

@router.get("/patients")
async def get_all_patients(db: Session = Depends(get_db)):
    """Get all patients for admin view (read-only)"""
    
    patients = db.query(Patient).filter(Patient.is_active == True).all()
    
    return [
        {
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "email": patient.email,
            "phone": patient.phone,
            "doctor_id": patient.doctor_id,
            "doctor_name": f"Dr. {patient.doctor.first_name} {patient.doctor.last_name}" if patient.doctor else "Unassigned",
            "last_contact": patient.updated_at.isoformat() if patient.updated_at else None,
            "status": "Active" if patient.is_active else "Inactive",
            "created_at": patient.created_at.isoformat()
        }
        for patient in patients
    ]

@router.get("/doctors")
async def get_all_doctors(db: Session = Depends(get_db)):
    """Get all doctors for admin view"""
    
    doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
    
    return [
        {
            "id": doctor.id,
            "first_name": doctor.first_name,
            "last_name": doctor.last_name,
            "email": doctor.email,
            "license_number": doctor.license_number,
            "specialization": doctor.specialization,
            "patient_count": len(doctor.patients),
            "active_alerts": len([alert for alert in doctor.alerts if not alert.is_resolved]),
            "created_at": doctor.created_at.isoformat()
        }
        for doctor in doctors
    ]

@router.get("/interactions/stats")
async def get_interaction_stats(db: Session = Depends(get_db)):
    """Get interaction statistics for admin dashboard"""
    
    # Get interactions from last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Count by type
    interaction_stats = db.query(
        Interaction.interaction_type,
        func.count(Interaction.id).label('count')
    ).filter(
        Interaction.created_at >= thirty_days_ago
    ).group_by(Interaction.interaction_type).all()
    
    # Count with red flags
    red_flag_count = db.query(Interaction).filter(
        Interaction.created_at >= thirty_days_ago,
        Interaction.red_flags.isnot(None)
    ).count()
    
    # Average sentiment
    avg_sentiment = db.query(func.avg(Interaction.sentiment_score)).filter(
        Interaction.created_at >= thirty_days_ago,
        Interaction.sentiment_score.isnot(None)
    ).scalar() or 0.5
    
    return {
        "interaction_types": {stat.interaction_type: stat.count for stat in interaction_stats},
        "total_interactions": sum(stat.count for stat in interaction_stats),
        "red_flag_count": red_flag_count,
        "average_sentiment": round(avg_sentiment, 2),
        "period_days": 30
    }

# User Management Endpoints
class DoctorCreate(BaseModel):
    firebase_uid: str
    email: str
    first_name: str
    last_name: str
    license_number: str
    specialization: str = None

class PatientCreate(BaseModel):
    firebase_uid: str
    email: str
    first_name: str
    last_name: str
    phone: str = None
    emergency_contact: str = None
    emergency_phone: str = None
    doctor_id: int = None

@router.post("/doctors")
async def create_doctor(doctor_data: DoctorCreate, db: Session = Depends(get_db)):
    """Create a new doctor profile"""
    
    # Check if email already exists
    existing_doctor = db.query(Doctor).filter(Doctor.email == doctor_data.email).first()
    if existing_doctor:
        raise HTTPException(status_code=400, detail="Doctor with this email already exists")
    
    # Check if license number already exists
    existing_license = db.query(Doctor).filter(Doctor.license_number == doctor_data.license_number).first()
    if existing_license:
        raise HTTPException(status_code=400, detail="Doctor with this license number already exists")
    
    doctor = Doctor(
        firebase_uid=doctor_data.firebase_uid,
        email=doctor_data.email,
        first_name=doctor_data.first_name,
        last_name=doctor_data.last_name,
        license_number=doctor_data.license_number,
        specialization=doctor_data.specialization,
        is_active=True
    )
    
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    
    return {
        "id": doctor.id,
        "firebase_uid": doctor.firebase_uid,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
        "license_number": doctor.license_number,
        "specialization": doctor.specialization,
        "is_active": doctor.is_active,
        "created_at": doctor.created_at.isoformat()
    }

@router.post("/patients")
async def create_patient(patient_data: PatientCreate, db: Session = Depends(get_db)):
    """Create a new patient profile"""
    
    # Check if email already exists
    existing_patient = db.query(Patient).filter(Patient.email == patient_data.email).first()
    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient with this email already exists")
    
    # Verify doctor exists if doctor_id provided
    if patient_data.doctor_id:
        doctor = db.query(Doctor).filter(Doctor.id == patient_data.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=400, detail="Doctor not found")
    
    patient = Patient(
        firebase_uid=patient_data.firebase_uid,
        email=patient_data.email,
        first_name=patient_data.first_name,
        last_name=patient_data.last_name,
        phone=patient_data.phone,
        emergency_contact=patient_data.emergency_contact,
        emergency_phone=patient_data.emergency_phone,
        doctor_id=patient_data.doctor_id,
        is_active=True
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return {
        "id": patient.id,
        "firebase_uid": patient.firebase_uid,
        "email": patient.email,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "phone": patient.phone,
        "emergency_contact": patient.emergency_contact,
        "emergency_phone": patient.emergency_phone,
        "doctor_id": patient.doctor_id,
        "is_active": patient.is_active,
        "created_at": patient.created_at.isoformat()
    }

@router.put("/doctors/{doctor_id}")
async def update_doctor(doctor_id: int, doctor_data: DoctorCreate, db: Session = Depends(get_db)):
    """Update a doctor profile"""
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if email already exists (excluding current doctor)
    existing_doctor = db.query(Doctor).filter(
        Doctor.email == doctor_data.email,
        Doctor.id != doctor_id
    ).first()
    if existing_doctor:
        raise HTTPException(status_code=400, detail="Doctor with this email already exists")
    
    # Update doctor fields
    doctor.firebase_uid = doctor_data.firebase_uid
    doctor.email = doctor_data.email
    doctor.first_name = doctor_data.first_name
    doctor.last_name = doctor_data.last_name
    doctor.license_number = doctor_data.license_number
    doctor.specialization = doctor_data.specialization
    doctor.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(doctor)
    
    return {
        "id": doctor.id,
        "firebase_uid": doctor.firebase_uid,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
        "license_number": doctor.license_number,
        "specialization": doctor.specialization,
        "is_active": doctor.is_active,
        "updated_at": doctor.updated_at.isoformat()
    }

@router.put("/patients/{patient_id}")
async def update_patient(patient_id: int, patient_data: PatientCreate, db: Session = Depends(get_db)):
    """Update a patient profile"""
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if email already exists (excluding current patient)
    existing_patient = db.query(Patient).filter(
        Patient.email == patient_data.email,
        Patient.id != patient_id
    ).first()
    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient with this email already exists")
    
    # Verify doctor exists if doctor_id provided
    if patient_data.doctor_id:
        doctor = db.query(Doctor).filter(Doctor.id == patient_data.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=400, detail="Doctor not found")
    
    # Update patient fields
    patient.firebase_uid = patient_data.firebase_uid
    patient.email = patient_data.email
    patient.first_name = patient_data.first_name
    patient.last_name = patient_data.last_name
    patient.phone = patient_data.phone
    patient.emergency_contact = patient_data.emergency_contact
    patient.emergency_phone = patient_data.emergency_phone
    patient.doctor_id = patient_data.doctor_id
    patient.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(patient)
    
    return {
        "id": patient.id,
        "firebase_uid": patient.firebase_uid,
        "email": patient.email,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "phone": patient.phone,
        "emergency_contact": patient.emergency_contact,
        "emergency_phone": patient.emergency_phone,
        "doctor_id": patient.doctor_id,
        "is_active": patient.is_active,
        "updated_at": patient.updated_at.isoformat()
    }

@router.delete("/doctors/{doctor_id}")
async def deactivate_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Deactivate a doctor (soft delete)"""
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doctor.is_active = False
    doctor.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Doctor deactivated successfully"}

@router.delete("/patients/{patient_id}")
async def deactivate_patient(patient_id: int, db: Session = Depends(get_db)):
    """Deactivate a patient (soft delete)"""
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.is_active = False
    patient.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Patient deactivated successfully"}
