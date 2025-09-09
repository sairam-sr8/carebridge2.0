"""
Safety and Triage API Endpoints - Phase 1
Handles safety flagging, triage management, and crisis escalation
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from database import get_db
from models import (
    SafetyFlag, TriageItem, Escalation, Interaction, 
    Patient, Doctor, Audit
)
from services.safety_engine import safety_engine
from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/safety", tags=["safety"])

# ===== SAFETY ANALYSIS ENDPOINTS =====

@router.post("/analyze")
async def analyze_content(
    content: str,
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Analyze content for safety concerns"""
    try:
        # Run safety analysis
        analysis = safety_engine.analyze_content(content, patient_id)
        
        # Log the analysis
        audit_log = Audit(
            actor_id=current_user.get('id'),
            actor_type=current_user.get('user_type'),
            action="content_analyzed",
            target_type="patient",
            target_id=patient_id,
            metadata_json={
                "content_length": len(content),
                "flags_found": len(analysis['flags']),
                "severity": analysis['severity'],
                "confidence": analysis['confidence']
            }
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "safe": analysis['safe'],
            "severity": analysis['severity'],
            "confidence": analysis['confidence'],
            "flags": analysis['flags'],
            "evidence_snippets": analysis['evidence_snippets'],
            "model_version": analysis['model_version']
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Safety analysis failed: {str(e)}"
        )

@router.post("/flag")
async def create_safety_flag(
    interaction_id: int,
    flag_type: str,
    severity: str,
    confidence: float,
    evidence_snippets: List[str],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a safety flag for an interaction"""
    try:
        # Get the interaction
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
        if not interaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interaction not found"
            )
        
        # Create safety flag
        safety_flag = SafetyFlag(
            interaction_id=interaction_id,
            flag_type=flag_type,
            severity=severity,
            confidence=confidence,
            evidence_snippets=evidence_snippets,
            model_version=safety_engine.model_version
        )
        db.add(safety_flag)
        db.flush()  # Get the ID
        
        # Update interaction
        interaction.moderation_level = "flagged"
        interaction.safety_flag_id = safety_flag.id
        interaction.processed_at = datetime.utcnow()
        
        # Create triage item
        priority = safety_engine.get_escalation_priority(severity)
        sla_deadline = safety_engine.get_sla_deadline(severity)
        
        triage_item = TriageItem(
            safety_flag_id=safety_flag.id,
            patient_id=interaction.patient_id,
            doctor_id=interaction.patient.doctor_id,  # Assign to patient's doctor
            priority=priority,
            sla_deadline=sla_deadline
        )
        db.add(triage_item)
        db.flush()
        
        # Create escalation if critical/high
        if safety_engine.should_escalate_immediately(severity):
            escalation = Escalation(
                triage_item_id=triage_item.id,
                escalation_type="critical_risk",
                escalated_to="admin"
            )
            db.add(escalation)
        
        db.commit()
        
        # Log the flag creation
        audit_log = Audit(
            actor_id=current_user.get('id'),
            actor_type=current_user.get('user_type'),
            action="safety_flag_created",
            target_type="interaction",
            target_id=interaction_id,
            metadata_json={
                "flag_type": flag_type,
                "severity": severity,
                "confidence": confidence,
                "triage_item_id": triage_item.id
            }
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "safety_flag_id": safety_flag.id,
            "triage_item_id": triage_item.id,
            "priority": priority,
            "sla_deadline": sla_deadline.isoformat(),
            "escalated": safety_engine.should_escalate_immediately(severity)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create safety flag: {str(e)}"
        )

# ===== TRIAGE MANAGEMENT ENDPOINTS =====

@router.get("/triage/inbox")
async def get_triage_inbox(
    doctor_id: Optional[int] = None,
    state: Optional[str] = "pending",
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get triage items for doctor review"""
    try:
        query = db.query(TriageItem)
        
        # Filter by doctor if specified
        if doctor_id:
            query = query.filter(TriageItem.doctor_id == doctor_id)
        
        # Filter by state
        if state:
            query = query.filter(TriageItem.state == state)
        
        # Order by priority and SLA deadline
        query = query.order_by(
            TriageItem.priority.desc(),
            TriageItem.sla_deadline.asc()
        ).limit(limit)
        
        triage_items = query.all()
        
        # Format response with patient and safety flag details
        result = []
        for item in triage_items:
            patient = db.query(Patient).filter(Patient.id == item.patient_id).first()
            safety_flag = db.query(SafetyFlag).filter(SafetyFlag.id == item.safety_flag_id).first()
            interaction = db.query(Interaction).filter(Interaction.id == safety_flag.interaction_id).first()
            
            result.append({
                "id": item.id,
                "patient_name": f"{patient.first_name} {patient.last_name}",
                "patient_id": item.patient_id,
                "priority": item.priority,
                "state": item.state,
                "sla_deadline": item.sla_deadline.isoformat(),
                "created_at": item.created_at.isoformat(),
                "severity": safety_flag.severity,
                "flag_type": safety_flag.flag_type,
                "confidence": safety_flag.confidence,
                "evidence_snippets": safety_flag.evidence_snippets,
                "interaction_content": interaction.content[:200] + "..." if len(interaction.content) > 200 else interaction.content,
                "sla_status": "overdue" if item.sla_deadline < datetime.utcnow() else "on_time"
            })
        
        return {
            "triage_items": result,
            "total_count": len(result),
            "overdue_count": len([item for item in result if item["sla_status"] == "overdue"])
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get triage inbox: {str(e)}"
        )

@router.get("/triage/{triage_id}")
async def get_triage_item(
    triage_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed triage item information"""
    try:
        triage_item = db.query(TriageItem).filter(TriageItem.id == triage_id).first()
        if not triage_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Triage item not found"
            )
        
        # Get related data
        safety_flag = db.query(SafetyFlag).filter(SafetyFlag.id == triage_item.safety_flag_id).first()
        interaction = db.query(Interaction).filter(Interaction.id == safety_flag.interaction_id).first()
        patient = db.query(Patient).filter(Patient.id == triage_item.patient_id).first()
        doctor = db.query(Doctor).filter(Doctor.id == triage_item.doctor_id).first() if triage_item.doctor_id else None
        
        return {
            "id": triage_item.id,
            "patient": {
                "id": patient.id,
                "name": f"{patient.first_name} {patient.last_name}",
                "email": patient.email,
                "phone": patient.phone,
                "emergency_contact": patient.emergency_contact,
                "emergency_phone": patient.emergency_phone
            },
            "doctor": {
                "id": doctor.id,
                "name": f"{doctor.first_name} {doctor.last_name}",
                "email": doctor.email,
                "specialization": doctor.specialization
            } if doctor else None,
            "priority": triage_item.priority,
            "state": triage_item.state,
            "sla_deadline": triage_item.sla_deadline.isoformat(),
            "created_at": triage_item.created_at.isoformat(),
            "acknowledged_at": triage_item.acknowledged_at.isoformat() if triage_item.acknowledged_at else None,
            "resolved_at": triage_item.resolved_at.isoformat() if triage_item.resolved_at else None,
            "safety_flag": {
                "id": safety_flag.id,
                "flag_type": safety_flag.flag_type,
                "severity": safety_flag.severity,
                "confidence": safety_flag.confidence,
                "evidence_snippets": safety_flag.evidence_snippets,
                "model_version": safety_flag.model_version
            },
            "interaction": {
                "id": interaction.id,
                "content": interaction.content,
                "speaker": interaction.speaker,
                "created_at": interaction.created_at.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get triage item: {str(e)}"
        )

@router.post("/triage/{triage_id}/acknowledge")
async def acknowledge_triage_item(
    triage_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Acknowledge a triage item"""
    try:
        triage_item = db.query(TriageItem).filter(TriageItem.id == triage_id).first()
        if not triage_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Triage item not found"
            )
        
        if triage_item.state != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Triage item is not in pending state"
            )
        
        # Update triage item
        triage_item.state = "acknowledged"
        triage_item.acknowledged_at = datetime.utcnow()
        
        db.commit()
        
        # Log the acknowledgment
        audit_log = Audit(
            actor_id=current_user.get('id'),
            actor_type=current_user.get('user_type'),
            action="triage_acknowledged",
            target_type="triage_item",
            target_id=triage_id,
            metadata_json={}
        )
        db.add(audit_log)
        db.commit()
        
        return {"message": "Triage item acknowledged successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to acknowledge triage item: {str(e)}"
        )

@router.post("/triage/{triage_id}/resolve")
async def resolve_triage_item(
    triage_id: int,
    action_taken: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Resolve a triage item"""
    try:
        triage_item = db.query(TriageItem).filter(TriageItem.id == triage_id).first()
        if not triage_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Triage item not found"
            )
        
        if triage_item.state not in ["pending", "acknowledged"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Triage item cannot be resolved in current state"
            )
        
        # Update triage item
        triage_item.state = "resolved"
        triage_item.resolved_at = datetime.utcnow()
        
        db.commit()
        
        # Log the resolution
        audit_log = Audit(
            actor_id=current_user.get('id'),
            actor_type=current_user.get('user_type'),
            action="triage_resolved",
            target_type="triage_item",
            target_id=triage_id,
            metadata_json={
                "action_taken": action_taken,
                "notes": notes
            }
        )
        db.add(audit_log)
        db.commit()
        
        return {"message": "Triage item resolved successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve triage item: {str(e)}"
        )

# ===== ESCALATION ENDPOINTS =====

@router.get("/escalations")
async def get_escalations(
    resolved: Optional[bool] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get escalation list"""
    try:
        query = db.query(Escalation)
        
        if resolved is not None:
            query = query.filter(Escalation.resolved == resolved)
        
        query = query.order_by(Escalation.created_at.desc()).limit(limit)
        escalations = query.all()
        
        result = []
        for escalation in escalations:
            triage_item = db.query(TriageItem).filter(TriageItem.id == escalation.triage_item_id).first()
            patient = db.query(Patient).filter(Patient.id == triage_item.patient_id).first()
            
            result.append({
                "id": escalation.id,
                "patient_name": f"{patient.first_name} {patient.last_name}",
                "escalation_type": escalation.escalation_type,
                "escalated_to": escalation.escalated_to,
                "notification_sent": escalation.notification_sent,
                "resolved": escalation.resolved,
                "created_at": escalation.created_at.isoformat(),
                "resolved_at": escalation.resolved_at.isoformat() if escalation.resolved_at else None
            })
        
        return {"escalations": result}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get escalations: {str(e)}"
        )
