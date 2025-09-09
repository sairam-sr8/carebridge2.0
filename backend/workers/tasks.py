"""
Celery Background Tasks - Phase 2
Individual task definitions for async processing
"""

from celery import current_task
from celery_app import celery_app
from services.safety_engine import safety_engine
from services.event_bus import event_bus, EventType
from database import SessionLocal
from models import Interaction, SafetyFlag, TriageItem, Escalation, Audit
from datetime import datetime
import json
import requests
import os
from typing import Dict, Any

@celery_app.task(bind=True)
def process_moderation_task(self, interaction_id: int, content: str, patient_id: int):
    """Process content moderation asynchronously"""
    try:
        # Update task status
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Starting moderation..."}
        )
        
        # Run safety analysis
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 25, "total": 100, "status": "Running safety analysis..."}
        )
        
        analysis = safety_engine.analyze_content(content, patient_id)
        
        # Update database
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 50, "total": 100, "status": "Updating database..."}
        )
        
        db = SessionLocal()
        try:
            interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
            if interaction:
                interaction.moderation_level = "safe" if analysis['safe'] else "flagged"
                interaction.processed_at = datetime.utcnow()
                
                # Create safety flag if flagged
                if not analysis['safe']:
                    safety_flag = SafetyFlag(
                        interaction_id=interaction_id,
                        flag_type=analysis['flags'][0]['type'] if analysis['flags'] else 'moderation',
                        severity=analysis['severity'],
                        confidence=analysis['confidence'],
                        evidence_snippets=analysis['evidence_snippets'],
                        model_version=analysis['model_version']
                    )
                    db.add(safety_flag)
                    db.flush()
                    
                    interaction.safety_flag_id = safety_flag.id
                    
                    # Create triage item
                    priority = safety_engine.get_escalation_priority(analysis['severity'])
                    sla_deadline = safety_engine.get_sla_deadline(analysis['severity'])
                    
                    triage_item = TriageItem(
                        safety_flag_id=safety_flag.id,
                        patient_id=patient_id,
                        priority=priority,
                        sla_deadline=sla_deadline
                    )
                    db.add(triage_item)
                    db.flush()
                    
                    # Create escalation if critical
                    if safety_engine.should_escalate_immediately(analysis['severity']):
                        escalation = Escalation(
                            triage_item_id=triage_item.id,
                            escalation_type="critical_risk",
                            escalated_to="admin"
                        )
                        db.add(escalation)
                
                db.commit()
                
                # Publish events
                current_task.update_state(
                    state="PROGRESS",
                    meta={"current": 75, "total": 100, "status": "Publishing events..."}
                )
                
                event_bus.publish_event(
                    EventType.MODERATION_CHECKED,
                    {
                        "interaction_id": interaction_id,
                        "flagged": not analysis['safe'],
                        "severity": analysis['severity'],
                        "confidence": analysis['confidence']
                    }
                )
                
                if not analysis['safe']:
                    event_bus.publish_event(
                        EventType.SAFETY_FLAGGED,
                        {
                            "interaction_id": interaction_id,
                            "safety_flag_id": safety_flag.id,
                            "severity": analysis['severity']
                        }
                    )
                
                current_task.update_state(
                    state="SUCCESS",
                    meta={"current": 100, "total": 100, "status": "Moderation complete"}
                )
                
                return {
                    "success": True,
                    "flagged": not analysis['safe'],
                    "severity": analysis['severity'],
                    "confidence": analysis['confidence']
                }
                
        finally:
            db.close()
            
    except Exception as e:
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise

@celery_app.task(bind=True)
def send_notification_task(self, notification_type: str, recipient: str, message: str, metadata: Dict[str, Any] = None):
    """Send notifications via multiple channels"""
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Preparing notification..."}
        )
        
        # Send email notification
        if notification_type in ["email", "all"]:
            current_task.update_state(
                state="PROGRESS",
                meta={"current": 25, "total": 100, "status": "Sending email..."}
            )
            send_email_notification(recipient, message, metadata)
        
        # Send SMS notification
        if notification_type in ["sms", "all"]:
            current_task.update_state(
                state="PROGRESS",
                meta={"current": 50, "total": 100, "status": "Sending SMS..."}
            )
            send_sms_notification(recipient, message, metadata)
        
        # Send push notification
        if notification_type in ["push", "all"]:
            current_task.update_state(
                state="PROGRESS",
                meta={"current": 75, "total": 100, "status": "Sending push notification..."}
            )
            send_push_notification(recipient, message, metadata)
        
        # Log notification
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 90, "total": 100, "status": "Logging notification..."}
            )
        
        event_bus.publish_event(
            EventType.NOTIFICATION_SENT,
            {
                "notification_type": notification_type,
                "recipient": recipient,
                "message": message,
                "metadata": metadata or {}
            }
        )
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "Notification sent successfully"}
        )
        
        return {"success": True, "channels": notification_type}
        
    except Exception as e:
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise

@celery_app.task(bind=True)
def generate_ai_response_task(self, patient_id: int, context: str, interaction_history: list):
    """Generate AI response using OpenAI API"""
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Generating AI response..."}
        )
        
        # This will be implemented in Phase 3 with OpenAI integration
        # For now, return a placeholder response
        response = "Thank you for sharing that with me. I'm here to listen and help. How are you feeling today?"
        
        current_task.update_state(
            state="SUCCESS",
            meta={"current": 100, "total": 100, "status": "AI response generated"}
        )
        
        return {"response": response, "model_version": "placeholder_v1"}
        
    except Exception as e:
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise

@celery_app.task(bind=True)
def process_triage_task(self, triage_item_id: int, action: str, notes: str = None):
    """Process triage item actions"""
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Processing triage action..."}
        )
        
        db = SessionLocal()
        try:
            triage_item = db.query(TriageItem).filter(TriageItem.id == triage_item_id).first()
            if triage_item:
                if action == "acknowledge":
                    triage_item.state = "acknowledged"
                    triage_item.acknowledged_at = datetime.utcnow()
                elif action == "resolve":
                    triage_item.state = "resolved"
                    triage_item.resolved_at = datetime.utcnow()
                
                db.commit()
                
                # Publish event
                event_bus.publish_event(
                    EventType.TRIAGE_ACTION_TAKEN,
                    {
                        "triage_item_id": triage_item_id,
                        "action": action,
                        "notes": notes
                    }
                )
                
                current_task.update_state(
                    state="SUCCESS",
                    meta={"current": 100, "total": 100, "status": "Triage action processed"}
                )
                
                return {"success": True, "action": action}
                
        finally:
            db.close()
            
    except Exception as e:
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise

@celery_app.task(bind=True)
def audit_log_task(self, actor_id: int, actor_type: str, action: str, target_type: str = None, target_id: int = None, metadata: Dict[str, Any] = None):
    """Create audit log entry"""
    try:
        db = SessionLocal()
        try:
            audit_log = Audit(
                actor_id=actor_id,
                actor_type=actor_type,
                action=action,
                target_type=target_type,
                target_id=target_id,
                metadata_json=metadata or {},
                hash_chain=f"hash_{datetime.utcnow().timestamp()}"  # Simplified hash
            )
            db.add(audit_log)
            db.commit()
            
            # Publish event
            event_bus.publish_event(
                EventType.AUDIT_LOGGED,
                {
                    "audit_id": audit_log.id,
                    "actor_id": actor_id,
                    "action": action
                }
            )
            
            return {"success": True, "audit_id": audit_log.id}
            
        finally:
            db.close()
            
    except Exception as e:
        raise

@celery_app.task(bind=True)
def escalation_task(self, escalation_id: int, escalation_type: str, escalated_to: str):
    """Process escalation actions"""
    try:
        current_task.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 100, "status": "Processing escalation..."}
        )
        
        db = SessionLocal()
        try:
            escalation = db.query(Escalation).filter(Escalation.id == escalation_id).first()
            if escalation:
                escalation.notification_sent = True
                db.commit()
                
                # Send immediate notification
                send_notification_task.delay(
                    "all",
                    escalated_to,
                    f"URGENT: Escalation {escalation_type} requires immediate attention",
                    {"escalation_id": escalation_id, "type": escalation_type}
                )
                
                # Publish event
                event_bus.publish_event(
                    EventType.ESCALATION_CREATED,
                    {
                        "escalation_id": escalation_id,
                        "escalation_type": escalation_type,
                        "escalated_to": escalated_to
                    }
                )
                
                current_task.update_state(
                    state="SUCCESS",
                    meta={"current": 100, "total": 100, "status": "Escalation processed"}
                )
                
                return {"success": True, "escalation_id": escalation_id}
                
        finally:
            db.close()
            
    except Exception as e:
        current_task.update_state(
            state="FAILURE",
            meta={"error": str(e)}
        )
        raise

# Helper functions for notifications
def send_email_notification(recipient: str, message: str, metadata: Dict[str, Any]):
    """Send email notification (placeholder)"""
    print(f"📧 Email sent to {recipient}: {message}")
    # TODO: Implement actual email sending with SendGrid

def send_sms_notification(recipient: str, message: str, metadata: Dict[str, Any]):
    """Send SMS notification (placeholder)"""
    print(f"📱 SMS sent to {recipient}: {message}")
    # TODO: Implement actual SMS sending with Twilio

def send_push_notification(recipient: str, message: str, metadata: Dict[str, Any]):
    """Send push notification (placeholder)"""
    print(f"🔔 Push notification sent to {recipient}: {message}")
    # TODO: Implement actual push notifications
