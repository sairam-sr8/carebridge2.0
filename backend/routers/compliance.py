"""
GDPR Compliance Tools - Phase 4
Data export, deletion, and consent management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json
import zipfile
import io
import csv

from database import get_db
from models import Patient, Doctor, Admin, Interaction, SafetyFlag, TriageItem, Audit
from routers.auth import get_current_user
from services.audit_service import audit_service

router = APIRouter(prefix="/api/v1/compliance", tags=["compliance"])

@router.get("/data-export/{user_id}")
async def export_user_data(
    user_id: int,
    user_type: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Export all user data for GDPR compliance"""
    
    # Only admins can export user data
    if current_user.get('user_type') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can export user data"
        )
    
    try:
        export_data = {}
        
        if user_type == "patient":
            # Export patient data
            patient = db.query(Patient).filter(Patient.id == user_id).first()
            if not patient:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            
            export_data = await _export_patient_data(patient, db)
            
        elif user_type == "doctor":
            # Export doctor data
            doctor = db.query(Doctor).filter(Doctor.id == user_id).first()
            if not doctor:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
            
            export_data = await _export_doctor_data(doctor, db)
            
        elif user_type == "admin":
            # Export admin data
            admin = db.query(Admin).filter(Admin.id == user_id).first()
            if not admin:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Admin not found"
                )
            
            export_data = await _export_admin_data(admin, db)
        
        # Log the data export
        audit_service.create_audit_entry(
            actor_id=current_user.get('id'),
            actor_type=current_user.get('user_type'),
            action="data_export",
            target_type=user_type,
            target_id=user_id,
            metadata={"export_timestamp": datetime.utcnow().isoformat()},
            db=db
        )
        
        return {
            "success": True,
            "export_data": export_data,
            "exported_at": datetime.utcnow().isoformat(),
            "data_subject": f"{user_type}_{user_id}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export data: {str(e)}"
        )

@router.post("/data-deletion/{user_id}")
async def delete_user_data(
    user_id: int,
    user_type: str,
    confirmation_token: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete all user data for GDPR compliance (Right to be Forgotten)"""
    
    # Only admins can delete user data
    if current_user.get('user_type') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete user data"
        )
    
    # Require confirmation token for safety
    if confirmation_token != f"DELETE_{user_type}_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation token"
        )
    
    try:
        deletion_summary = {}
        
        if user_type == "patient":
            deletion_summary = await _delete_patient_data(user_id, db)
        elif user_type == "doctor":
            deletion_summary = await _delete_doctor_data(user_id, db)
        elif user_type == "admin":
            deletion_summary = await _delete_admin_data(user_id, db)
        
        # Log the data deletion
        audit_service.create_audit_entry(
            actor_id=current_user.get('id'),
            actor_type=current_user.get('user_type'),
            action="data_deletion",
            target_type=user_type,
            target_id=user_id,
            metadata={
                "deletion_timestamp": datetime.utcnow().isoformat(),
                "deletion_summary": deletion_summary
            },
            db=db
        )
        
        return {
            "success": True,
            "deletion_summary": deletion_summary,
            "deleted_at": datetime.utcnow().isoformat(),
            "data_subject": f"{user_type}_{user_id}"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete data: {str(e)}"
        )

@router.get("/consent-status/{user_id}")
async def get_consent_status(
    user_id: int,
    user_type: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get user consent status and history"""
    
    # Users can only view their own consent status
    if (current_user.get('user_type') != 'admin' and 
        current_user.get('id') != user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own consent status"
        )
    
    try:
        # Get consent-related audit entries
        consent_audits = audit_service.get_audit_log(
            actor_id=user_id,
            action="consent",
            db=db
        )
        
        # Get current consent status (stored in user metadata)
        if user_type == "patient":
            user = db.query(Patient).filter(Patient.id == user_id).first()
        elif user_type == "doctor":
            user = db.query(Doctor).filter(Doctor.id == user_id).first()
        elif user_type == "admin":
            user = db.query(Admin).filter(Admin.id == user_id).first()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user type"
            )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "user_id": user_id,
            "user_type": user_type,
            "consent_history": consent_audits,
            "current_status": {
                "data_processing": True,  # Default consent
                "marketing": False,      # Default no marketing
                "analytics": True,       # Default consent for analytics
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get consent status: {str(e)}"
        )

@router.post("/consent-update/{user_id}")
async def update_consent(
    user_id: int,
    consent_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update user consent preferences"""
    
    # Users can only update their own consent
    if (current_user.get('user_type') != 'admin' and 
        current_user.get('id') != user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own consent"
        )
    
    try:
        # Log consent update
        audit_service.create_audit_entry(
            actor_id=current_user.get('id'),
            actor_type=current_user.get('user_type'),
            action="consent_update",
            target_type="user",
            target_id=user_id,
            metadata={
                "consent_data": consent_data,
                "updated_at": datetime.utcnow().isoformat()
            },
            db=db
        )
        
        return {
            "success": True,
            "consent_updated": consent_data,
            "updated_at": datetime.utcnow().isoformat(),
            "user_id": user_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update consent: {str(e)}"
        )

@router.get("/audit-verification")
async def verify_audit_integrity(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Verify audit log integrity"""
    
    # Only admins can verify audit integrity
    if current_user.get('user_type') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can verify audit integrity"
        )
    
    try:
        verification_result = audit_service.verify_audit_chain(db)
        
        return {
            "verification_result": verification_result,
            "verified_at": datetime.utcnow().isoformat(),
            "verified_by": current_user.get('user_name', 'Admin')
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify audit integrity: {str(e)}"
        )

# Helper functions for data export/deletion

async def _export_patient_data(patient: Patient, db: Session) -> Dict[str, Any]:
    """Export all patient data"""
    
    # Basic patient info
    patient_data = {
        "id": patient.id,
        "email": patient.email,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "phone": patient.phone,
        "emergency_contact": patient.emergency_contact,
        "emergency_phone": patient.emergency_phone,
        "created_at": patient.created_at.isoformat(),
        "updated_at": patient.updated_at.isoformat()
    }
    
    # Interactions
    interactions = db.query(Interaction).filter(Interaction.patient_id == patient.id).all()
    patient_data["interactions"] = [
        {
            "id": i.id,
            "speaker": i.speaker,
            "content": i.content,
            "interaction_type": i.interaction_type,
            "created_at": i.created_at.isoformat(),
            "moderation_level": i.moderation_level
        }
        for i in interactions
    ]
    
    # Safety flags
    safety_flags = db.query(SafetyFlag).join(Interaction).filter(
        Interaction.patient_id == patient.id
    ).all()
    patient_data["safety_flags"] = [
        {
            "id": sf.id,
            "flag_type": sf.flag_type,
            "severity": sf.severity,
            "confidence": sf.confidence,
            "created_at": sf.created_at.isoformat()
        }
        for sf in safety_flags
    ]
    
    # Triage items
    triage_items = db.query(TriageItem).filter(TriageItem.patient_id == patient.id).all()
    patient_data["triage_items"] = [
        {
            "id": ti.id,
            "priority": ti.priority,
            "state": ti.state,
            "created_at": ti.created_at.isoformat(),
            "resolved_at": ti.resolved_at.isoformat() if ti.resolved_at else None
        }
        for ti in triage_items
    ]
    
    return patient_data

async def _export_doctor_data(doctor: Doctor, db: Session) -> Dict[str, Any]:
    """Export all doctor data"""
    
    doctor_data = {
        "id": doctor.id,
        "email": doctor.email,
        "first_name": doctor.first_name,
        "last_name": doctor.last_name,
        "license_number": doctor.license_number,
        "specialization": doctor.specialization,
        "created_at": doctor.created_at.isoformat(),
        "updated_at": doctor.updated_at.isoformat()
    }
    
    # Patients assigned to this doctor
    patients = db.query(Patient).filter(Patient.doctor_id == doctor.id).all()
    doctor_data["assigned_patients"] = [
        {
            "id": p.id,
            "first_name": p.first_name,
            "last_name": p.last_name,
            "email": p.email
        }
        for p in patients
    ]
    
    # Triage items assigned to this doctor
    triage_items = db.query(TriageItem).filter(TriageItem.doctor_id == doctor.id).all()
    doctor_data["triage_items"] = [
        {
            "id": ti.id,
            "priority": ti.priority,
            "state": ti.state,
            "created_at": ti.created_at.isoformat()
        }
        for ti in triage_items
    ]
    
    return doctor_data

async def _export_admin_data(admin: Admin, db: Session) -> Dict[str, Any]:
    """Export all admin data"""
    
    admin_data = {
        "id": admin.id,
        "email": admin.email,
        "first_name": admin.first_name,
        "last_name": admin.last_name,
        "created_at": admin.created_at.isoformat(),
        "updated_at": admin.updated_at.isoformat()
    }
    
    # Admin actions (from audit log)
    admin_actions = audit_service.get_audit_log(
        actor_id=admin.id,
        actor_type="admin",
        db=db
    )
    admin_data["actions"] = admin_actions
    
    return admin_data

async def _delete_patient_data(patient_id: int, db: Session) -> Dict[str, Any]:
    """Delete all patient data"""
    
    deletion_summary = {
        "interactions_deleted": 0,
        "safety_flags_deleted": 0,
        "triage_items_deleted": 0,
        "patient_deleted": False
    }
    
    # Delete interactions
    interactions = db.query(Interaction).filter(Interaction.patient_id == patient_id).all()
    for interaction in interactions:
        db.delete(interaction)
    deletion_summary["interactions_deleted"] = len(interactions)
    
    # Delete safety flags
    safety_flags = db.query(SafetyFlag).join(Interaction).filter(
        Interaction.patient_id == patient_id
    ).all()
    for safety_flag in safety_flags:
        db.delete(safety_flag)
    deletion_summary["safety_flags_deleted"] = len(safety_flags)
    
    # Delete triage items
    triage_items = db.query(TriageItem).filter(TriageItem.patient_id == patient_id).all()
    for triage_item in triage_items:
        db.delete(triage_item)
    deletion_summary["triage_items_deleted"] = len(triage_items)
    
    # Delete patient
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        db.delete(patient)
        deletion_summary["patient_deleted"] = True
    
    db.commit()
    return deletion_summary

async def _delete_doctor_data(doctor_id: int, db: Session) -> Dict[str, Any]:
    """Delete all doctor data"""
    
    deletion_summary = {
        "triage_items_deleted": 0,
        "doctor_deleted": False
    }
    
    # Delete triage items
    triage_items = db.query(TriageItem).filter(TriageItem.doctor_id == doctor_id).all()
    for triage_item in triage_items:
        db.delete(triage_item)
    deletion_summary["triage_items_deleted"] = len(triage_items)
    
    # Delete doctor
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if doctor:
        db.delete(doctor)
        deletion_summary["doctor_deleted"] = True
    
    db.commit()
    return deletion_summary

async def _delete_admin_data(admin_id: int, db: Session) -> Dict[str, Any]:
    """Delete all admin data"""
    
    deletion_summary = {
        "admin_deleted": False
    }
    
    # Delete admin
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if admin:
        db.delete(admin)
        deletion_summary["admin_deleted"] = True
    
    db.commit()
    return deletion_summary
