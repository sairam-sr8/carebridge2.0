from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from models import Doctor, Patient, Interaction, Note, Alert
from database import get_db

router = APIRouter()

@router.get("/patients")
async def get_doctor_patients(db: Session = Depends(get_db)):
    """Get list of patients assigned to the current doctor"""
    # For demo purposes, return all patients
    # In production, this would filter by current doctor's ID
    patients = db.query(Patient).filter(Patient.is_active == True).all()
    
    return [
        {
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "email": patient.email,
            "phone": patient.phone,
            "last_contact": patient.updated_at.isoformat() if patient.updated_at else None,
            "status": "Active" if patient.is_active else "Inactive",
            "doctor_id": patient.doctor_id
        }
        for patient in patients
    ]

@router.get("/patient/{patient_id}/summary")
async def get_patient_summary(patient_id: int, db: Session = Depends(get_db)):
    """Get AI summary, mood trend, red flags, and notes preview for a patient"""
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get recent interactions (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    interactions = db.query(Interaction).filter(
        Interaction.patient_id == patient_id,
        Interaction.created_at >= thirty_days_ago
    ).order_by(Interaction.created_at.desc()).all()
    
    # Get recent notes
    notes = db.query(Note).filter(
        Note.patient_id == patient_id
    ).order_by(Note.created_at.desc()).limit(3).all()
    
    # Get active alerts
    alerts = db.query(Alert).filter(
        Alert.patient_id == patient_id,
        Alert.is_resolved == False
    ).all()
    
    # Calculate mood trend (mock data for demo)
    mood_scores = [interaction.sentiment_score for interaction in interactions if interaction.sentiment_score is not None]
    avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 0.5
    
    # Generate AI summary (mock for demo)
    ai_summary = f"Patient {patient.first_name} has been actively engaging in {len(interactions)} interactions over the past 30 days. "
    if avg_mood > 0.7:
        ai_summary += "Overall mood appears positive with good engagement patterns."
    elif avg_mood > 0.4:
        ai_summary += "Mood shows some variability but generally stable."
    else:
        ai_summary += "Mood indicators suggest the patient may need additional support."
    
    # Count red flags
    red_flags = [interaction for interaction in interactions if interaction.red_flags]
    red_flag_count = len(red_flags)
    
    return {
        "patient": {
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "email": patient.email,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "emergency_contact": patient.emergency_contact,
            "emergency_phone": patient.emergency_phone
        },
        "ai_summary": ai_summary,
        "mood_trend": {
            "current": avg_mood,
            "trend": "improving" if avg_mood > 0.6 else "stable" if avg_mood > 0.4 else "declining",
            "data_points": len(mood_scores)
        },
        "red_flags": {
            "count": red_flag_count,
            "recent": [{"date": flag.created_at.isoformat(), "type": "interaction"} for flag in red_flags[:3]]
        },
        "last_contact": interactions[0].created_at.isoformat() if interactions else None,
        "notes_preview": [
            {
                "id": note.id,
                "title": note.title,
                "content": note.content[:100] + "..." if len(note.content) > 100 else note.content,
                "created_at": note.created_at.isoformat(),
                "note_type": note.note_type
            }
            for note in notes
        ],
        "active_alerts": [
            {
                "id": alert.id,
                "title": alert.title,
                "message": alert.message,
                "severity": alert.severity,
                "created_at": alert.created_at.isoformat()
            }
            for alert in alerts
        ],
        "stats": {
            "total_interactions": len(interactions),
            "recent_notes": len(notes),
            "active_alerts": len(alerts)
        }
    }

# Pydantic models
class NoteCreate(BaseModel):
    title: str
    content: str
    note_type: str = "general"

class AlertAcknowledge(BaseModel):
    resolved_by: int

@router.get("/alerts")
async def get_doctor_alerts(db: Session = Depends(get_db)):
    """Get all alerts for the current doctor"""
    alerts = db.query(Alert).filter(Alert.doctor_id == 1).order_by(Alert.created_at.desc()).all()
    
    return [
        {
            "id": alert.id,
            "patient_id": alert.patient_id,
            "patient_name": f"{alert.patient.first_name} {alert.patient.last_name}",
            "alert_type": alert.alert_type,
            "title": alert.title,
            "message": alert.message,
            "severity": alert.severity,
            "is_resolved": alert.is_resolved,
            "created_at": alert.created_at.isoformat(),
            "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
        }
        for alert in alerts
    ]

@router.post("/alert/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, data: AlertAcknowledge, db: Session = Depends(get_db)):
    """Acknowledge/resolve an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if alert.is_resolved:
        raise HTTPException(status_code=400, detail="Alert already resolved")
    
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = data.resolved_by
    
    db.commit()
    return {"message": "Alert acknowledged successfully"}

@router.post("/patient/{patient_id}/note")
async def create_patient_note(patient_id: int, note_data: NoteCreate, db: Session = Depends(get_db)):
    """Create a new note for a patient"""
    if len(note_data.content) < 10:
        raise HTTPException(status_code=400, detail="Note content must be at least 10 characters")
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    note = Note(
        doctor_id=1,  # For demo purposes
        patient_id=patient_id,
        title=note_data.title,
        content=note_data.content,
        note_type=note_data.note_type
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "note_type": note.note_type,
        "created_at": note.created_at.isoformat()
    }
