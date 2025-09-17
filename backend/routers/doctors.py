from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Doctor, Patient, Interaction, Alert, Note, Appointment, TriageItem, TriageAssessment
from routers.auth import get_current_user
from datetime import datetime, timedelta
import json

router = APIRouter()

@router.get("/dashboard")
async def get_doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get doctor dashboard data"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access dashboard")
    
    # Get doctor
    doctor = db.query(Doctor).filter(Doctor.id == current_user["id"]).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Get assigned patients
    assigned_patients = db.query(Patient).filter(Patient.doctor_id == doctor.id).all()
    
    # Get stats
    total_patients = len(assigned_patients)
    active_alerts = db.query(Alert).filter(
        Alert.doctor_id == doctor.id,
        Alert.is_resolved == False
    ).count()
    
    # Get recent interactions
    recent_interactions = db.query(Interaction).join(Patient).filter(
        Patient.doctor_id == doctor.id
    ).order_by(Interaction.created_at.desc()).limit(5).all()
    
    # Get triage assignments
    triage_items = db.query(TriageItem).filter(
        TriageItem.doctor_id == doctor.id,
        TriageItem.status != "resolved"
    ).order_by(TriageItem.created_at.desc()).all()
    
    # Calculate average mood
    ai_interactions = db.query(Interaction).join(Patient).filter(
        Patient.doctor_id == doctor.id,
        Interaction.speaker == "ai"
    ).all()
    
    mood_scores = []
    for interaction in ai_interactions:
        if interaction.mood_label:
            mood_map = {"low": 2, "neutral": 3, "anxious": 2, "irritable": 2, "positive": 4}
            mood_scores.append(mood_map.get(interaction.mood_label, 3))
    
    avg_mood_score = sum(mood_scores) / len(mood_scores) if mood_scores else 3
    
    # Prepare triage items data
    triage_list = []
    for item in triage_items:
        patient = db.query(Patient).filter(Patient.id == item.patient_id).first()
        assessment = db.query(TriageAssessment).filter(TriageAssessment.id == item.assessment_id).first()
        triage_list.append({
            "id": item.id,
            "patient_id": item.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "patient_email": patient.email if patient else "N/A",
            "status": item.status,
            "priority": item.priority,
            "severity_level": assessment.severity_level if assessment else "unknown",
            "risk_score": assessment.risk_score if assessment else 0,
            "created_at": item.created_at.isoformat()
        })

    return {
        "stats": {
            "total_patients": total_patients,
            "active_alerts": active_alerts,
            "avg_mood_score": round(avg_mood_score, 1),
            "pending_triage": len(triage_items)
        },
        "recent_interactions": [
            {
                "id": interaction.id,
                "patient_id": interaction.patient_id,
                "speaker": interaction.speaker,
                "content": interaction.content[:100] + "..." if len(interaction.content) > 100 else interaction.content,
                "timestamp": interaction.created_at.isoformat()
            }
            for interaction in recent_interactions
        ],
        "triage_items": triage_list
    }

@router.get("/patients")
async def get_doctor_patients(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get patients assigned to doctor"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view patients")
    
    # Get assigned patients
    patients = db.query(Patient).filter(Patient.doctor_id == current_user["id"]).all()
    
    patient_list = []
    for patient in patients:
        # Get last interaction
        last_interaction = db.query(Interaction).filter(
            Interaction.patient_id == patient.id
        ).order_by(Interaction.created_at.desc()).first()
        
        patient_list.append({
            "id": patient.id,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "email": patient.email,
            "last_interaction": last_interaction.created_at.isoformat() if last_interaction else None,
            "last_mood": last_interaction.mood_label if last_interaction else None
        })
    
    return {"patients": patient_list}

@router.get("/triage")
async def get_doctor_triage(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get triage items assigned to doctor"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view triage items")
    
    # Get triage items assigned to this doctor
    triage_items = db.query(TriageItem).filter(
        TriageItem.doctor_id == current_user["id"],
        TriageItem.status != "resolved"
    ).order_by(TriageItem.created_at.desc()).all()
    
    triage_list = []
    for item in triage_items:
        patient = db.query(Patient).filter(Patient.id == item.patient_id).first()
        assessment = db.query(TriageAssessment).filter(TriageAssessment.id == item.assessment_id).first()
        
        triage_list.append({
            "id": item.id,
            "patient_id": item.patient_id,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "patient_email": patient.email if patient else "N/A",
            "status": item.status,
            "priority": item.priority,
            "severity_level": assessment.severity_level if assessment else "unknown",
            "risk_score": assessment.risk_score if assessment else 0,
            "assessment_id": item.assessment_id,
            "created_at": item.created_at.isoformat()
        })
    
    return {"triage_items": triage_list}

@router.get("/alerts")
async def get_doctor_alerts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get alerts for doctor"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view alerts")
    
    # Get alerts for doctor's patients
    alerts = db.query(Alert).join(Patient).filter(
        Patient.doctor_id == current_user["id"]
    ).order_by(Alert.created_at.desc()).all()
    
    alert_list = []
    for alert in alerts:
        alert_list.append({
            "id": alert.id,
            "patient_id": alert.patient_id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "title": alert.title,
            "message": alert.message,
            "is_acknowledged": alert.is_acknowledged,
            "is_resolved": alert.is_resolved,
            "created_at": alert.created_at.isoformat()
        })
    
    return {"alerts": alert_list}

@router.post("/alert/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Acknowledge an alert"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can acknowledge alerts")
    
    # Get alert
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Check if doctor has access to this alert
    patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()
    if not patient or patient.doctor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Acknowledge alert
    alert.is_acknowledged = True
    db.commit()
    
    return {"message": "Alert acknowledged successfully"}

@router.post("/alert/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Resolve an alert"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can resolve alerts")
    
    # Get alert
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Check if doctor has access to this alert
    patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()
    if not patient or patient.doctor_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Resolve alert
    alert.is_resolved = True
    alert.resolved_by = current_user["id"]
    alert.resolved_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Alert resolved successfully"}

@router.get("/reports")
async def get_doctor_reports(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get reports for doctor"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view reports")
    
    # Get assigned patients with their notes
    patients = db.query(Patient).filter(Patient.doctor_id == current_user["id"]).all()
    
    patient_reports = []
    for patient in patients:
        # Get notes for this patient
        notes = db.query(Note).filter(Note.patient_id == patient.id).all()
        
        patient_reports.append({
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}",
            "email": patient.email,
            "notes": [
                {
                    "id": note.id,
                    "title": note.title,
                    "content": note.content,
                    "note_type": note.note_type,
                    "created_at": note.created_at.isoformat()
                }
                for note in notes
            ]
        })
    
    return {"reports": patient_reports}

@router.post("/patient/{patient_id}/note")
async def create_patient_note(
    patient_id: int,
    title: str,
    content: str,
    note_type: str = "session",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a note for a patient"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create notes")
    
    # Verify patient is assigned to this doctor
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.doctor_id == current_user["id"]
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    # Create note
    note = Note(
        patient_id=patient_id,
        doctor_id=current_user["id"],
        note_type=note_type,
        title=title,
        content=content,
        created_at=datetime.utcnow()
    )
    
    db.add(note)
    db.commit()
    db.refresh(note)
    
    return {"message": "Note created successfully", "note_id": note.id}

@router.get("/patient/{patient_id}/notes")
async def get_patient_notes(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get notes for a specific patient"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view patient notes")
    
    # Verify patient is assigned to this doctor
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.doctor_id == current_user["id"]
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    # Get notes for this patient
    notes = db.query(Note).filter(Note.patient_id == patient_id).order_by(Note.created_at.desc()).all()
    
    note_list = []
    for note in notes:
        note_list.append({
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "note_type": note.note_type,
            "created_at": note.created_at.isoformat()
        })
    
    return {"notes": note_list}

@router.get("/patient/{patient_id}/assessments")
async def get_patient_assessments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get assessments for a specific patient"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view patient assessments")
    
    # Verify patient is assigned to this doctor
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.doctor_id == current_user["id"]
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    # Get assessments for this patient
    assessments = db.query(TriageAssessment).filter(
        TriageAssessment.patient_id == patient_id
    ).order_by(TriageAssessment.created_at.desc()).all()
    
    assessment_list = []
    for assessment in assessments:
        # Parse feeling data to get interpretations
        feeling_data = json.loads(assessment.feeling) if assessment.feeling else {}
        ai_analysis = json.loads(assessment.ai_analysis) if assessment.ai_analysis else {}
        
        assessment_list.append({
            "id": assessment.id,
            "severity_level": assessment.severity_level,
            "risk_score": assessment.risk_score,
            "created_at": assessment.created_at.isoformat(),
            "summary_text": ai_analysis.get("summary_text", ""),
            "interpretations": feeling_data.get("interpretations", {}),
            "urgent": feeling_data.get("urgent", False)
        })
    
    return {"assessments": assessment_list}

@router.post("/patient/{patient_id}/custom-prompt")
async def create_custom_prompt(
    patient_id: int,
    prompt_data: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create custom prompt for patient's AI Buddy"""
    
    if current_user["user_type"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create custom prompts")
    
    # Verify patient is assigned to this doctor
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.doctor_id == current_user["id"]
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or not assigned to you")
    
    # Create custom prompt using DoctorPrompt model
    from models import DoctorPrompt
    
    custom_prompt = DoctorPrompt(
        doctor_id=current_user["id"],
        title=prompt_data.get("title", "Custom Prompt"),
        content=prompt_data.get("content", ""),
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(custom_prompt)
    db.commit()
    db.refresh(custom_prompt)
    
    return {
        "message": "Custom prompt created successfully",
        "prompt_id": custom_prompt.id,
        "patient_id": patient_id
    }
