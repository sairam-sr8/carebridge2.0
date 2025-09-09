"""
Patient Safety Chat API - Phase 1
Handles patient chat with integrated safety analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from database import get_db
from models import (
    Interaction, Patient, SafetyFlag, TriageItem, Escalation, Audit
)
from services.safety_engine import safety_engine
from services.ai_service import ai_service, AIResponseType
from services.rag_service import rag_service
from routers.auth import get_current_user

router = APIRouter(prefix="/api/v1/patient/safety", tags=["patient-safety"])

@router.post("/chat/send")
async def send_patient_message(
    message: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send a patient message with safety analysis"""
    try:
        # Verify user is a patient
        if current_user.get('user_type') != 'patient':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can send messages"
            )
        
        # Get patient ID from current user
        patient_id = current_user.get('id')
        
        # Create interaction record
        interaction = Interaction(
            patient_id=patient_id,
            speaker="patient",
            interaction_type="chat",
            content=message,
            created_at=datetime.utcnow()
        )
        db.add(interaction)
        db.flush()  # Get the ID
        
        # Run safety analysis
        analysis = safety_engine.analyze_content(message, patient_id)
        
        # Update interaction with analysis results
        interaction.moderation_level = "safe" if analysis['safe'] else "flagged"
        interaction.sentiment_score = analysis.get('confidence', 0.0)
        interaction.urgency_level = 1 if analysis['safe'] else 3  # Default urgency
        
        # If content is flagged, create safety flag and triage item
        if not analysis['safe']:
            # Create safety flag
            safety_flag = SafetyFlag(
                interaction_id=interaction.id,
                flag_type=analysis['flags'][0]['type'] if analysis['flags'] else 'moderation',
                severity=analysis['severity'],
                confidence=analysis['confidence'],
                evidence_snippets=analysis['evidence_snippets'],
                model_version=analysis['model_version']
            )
            db.add(safety_flag)
            db.flush()
            
            # Update interaction with safety flag
            interaction.safety_flag_id = safety_flag.id
            
            # Create triage item
            priority = safety_engine.get_escalation_priority(analysis['severity'])
            sla_deadline = safety_engine.get_sla_deadline(analysis['severity'])
            
            # Get patient's assigned doctor
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            
            triage_item = TriageItem(
                safety_flag_id=safety_flag.id,
                patient_id=patient_id,
                doctor_id=patient.doctor_id,
                priority=priority,
                sla_deadline=sla_deadline
            )
            db.add(triage_item)
            db.flush()
            
            # Create escalation if critical/high
            if safety_engine.should_escalate_immediately(analysis['severity']):
                escalation = Escalation(
                    triage_item_id=triage_item.id,
                    escalation_type="critical_risk",
                    escalated_to="admin"
                )
                db.add(escalation)
        
        # Generate AI response with RAG context
        if analysis['safe']:
            # Safe content - generate AI response with context
            try:
                # Get patient context
                patient_context = await rag_service.get_patient_context(str(patient_id), limit=5)
                
                # Retrieve relevant psychoeducation content
                relevant_context = await rag_service.retrieve_relevant_context(
                    message, 
                    {"mood_trend": "unknown", "recent_concerns": ""}, 
                    top_k=3
                )
                
                # Generate AI response
                ai_result = await ai_service.generate_response(
                    patient_message=message,
                    patient_context={
                        "mood_trend": "unknown",
                        "recent_concerns": "",
                        "coping_strategies": [item["content"] for item in relevant_context if item["type"] == "coping_strategy"]
                    },
                    response_type=AIResponseType.THERAPEUTIC,
                    conversation_history=patient_context
                )
                
                ai_response = ai_result["response"]
                ai_explainability = ai_result["explainability"]
                
                # Store AI response metadata
                ai_interaction.ai_summary = json.dumps({
                    "model_used": ai_result["model_used"],
                    "confidence": ai_result["confidence"],
                    "explainability": ai_explainability,
                    "relevant_context": relevant_context
                })
                
            except Exception as e:
                print(f"AI service error: {e}")
                ai_response = "Thank you for sharing that with me. I'm here to listen and help. How are you feeling today?"
                ai_explainability = {"error": str(e)}
        else:
            # Flagged content - use safe fallback response
            ai_response = safety_engine.get_safe_fallback_response(analysis['severity'])
            ai_explainability = {"response_type": "safe_fallback", "reason": "content_flagged"}
        
        # Create AI interaction response
        ai_interaction = Interaction(
            patient_id=patient_id,
            speaker="ai",
            interaction_type="chat",
            content=ai_response,
            moderation_level="safe",
            processed_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(ai_interaction)
        
        db.commit()
        
        # Add patient interaction to RAG store
        await rag_service.add_patient_interaction(
            str(patient_id),
            message,
            "chat"
        )
        
        # Log the interaction
        audit_log = Audit(
            actor_id=patient_id,
            actor_type="patient",
            action="message_sent",
            target_type="interaction",
            target_id=interaction.id,
            metadata_json={
                "message_length": len(message),
                "flagged": not analysis['safe'],
                "severity": analysis['severity'],
                "confidence": analysis['confidence']
            }
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "interaction_id": interaction.id,
            "ai_response": ai_response,
            "flagged": not analysis['safe'],
            "severity": analysis['severity'] if not analysis['safe'] else None,
            "triage_created": not analysis['safe'],
            "escalated": safety_engine.should_escalate_immediately(analysis['severity']) if not analysis['safe'] else False
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )

@router.get("/chat/history")
async def get_chat_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get patient's chat history"""
    try:
        # Verify user is a patient
        if current_user.get('user_type') != 'patient':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can view chat history"
            )
        
        patient_id = current_user.get('id')
        
        # Get interactions
        interactions = db.query(Interaction).filter(
            Interaction.patient_id == patient_id,
            Interaction.interaction_type == "chat"
        ).order_by(Interaction.created_at.desc()).limit(limit).all()
        
        # Format response
        chat_history = []
        for interaction in reversed(interactions):  # Reverse to get chronological order
            chat_history.append({
                "id": interaction.id,
                "speaker": interaction.speaker,
                "content": interaction.content,
                "timestamp": interaction.created_at.isoformat(),
                "moderation_level": interaction.moderation_level,
                "flagged": interaction.moderation_level == "flagged"
            })
        
        return {
            "chat_history": chat_history,
            "total_count": len(chat_history)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat history: {str(e)}"
        )

@router.get("/safety-status")
async def get_safety_status(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get patient's current safety status"""
    try:
        # Verify user is a patient
        if current_user.get('user_type') != 'patient':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only patients can view safety status"
            )
        
        patient_id = current_user.get('id')
        
        # Get recent triage items
        recent_triage = db.query(TriageItem).filter(
            TriageItem.patient_id == patient_id,
            TriageItem.state.in_(["pending", "acknowledged"])
        ).order_by(TriageItem.created_at.desc()).limit(5).all()
        
        # Get recent safety flags
        recent_flags = db.query(SafetyFlag).join(Interaction).filter(
            Interaction.patient_id == patient_id
        ).order_by(SafetyFlag.created_at.desc()).limit(5).all()
        
        return {
            "active_triage_items": len(recent_triage),
            "recent_flags": len(recent_flags),
            "safety_status": "monitored" if recent_triage else "normal",
            "last_check": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get safety status: {str(e)}"
        )
