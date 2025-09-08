from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from models import Doctor, Patient, Interaction, Note, Alert
from database import get_db

router = APIRouter()

# Pydantic models
class ChatMessage(BaseModel):
    message: str

class JournalEntry(BaseModel):
    mood: int  # -2 to +2
    content: str

# OpenAI configuration (mock for demo)
def get_openai_response(user_message: str) -> str:
    """Generate empathetic AI response using OpenAI API"""
    # Mock response for demo - in production, use actual OpenAI API
    empathetic_responses = [
        "I understand how you're feeling. It takes courage to share what's on your mind.",
        "Thank you for trusting me with your thoughts. I'm here to listen and support you.",
        "Your feelings are valid and important. Let's work through this together.",
        "I can sense this is difficult for you. Remember, you're not alone in this journey.",
        "It's okay to feel this way. Every step forward, no matter how small, is progress."
    ]
    
    # Simple keyword-based response selection
    if any(word in user_message.lower() for word in ['sad', 'depressed', 'down', 'hopeless']):
        return "I can hear the pain in your words. It's important to acknowledge these feelings. Have you considered reaching out to someone you trust about how you're feeling?"
    elif any(word in user_message.lower() for word in ['anxious', 'worried', 'nervous', 'panic']):
        return "Anxiety can feel overwhelming. Let's take this one step at a time. What's one small thing that might help you feel more grounded right now?"
    elif any(word in user_message.lower() for word in ['angry', 'frustrated', 'mad', 'irritated']):
        return "I can feel the frustration in your message. Anger is a natural emotion. What do you think might be at the root of these feelings?"
    else:
        return "Thank you for sharing with me. I'm here to listen and support you through whatever you're experiencing."

def detect_red_flags(message: str) -> List[str]:
    """Detect potential red flags in patient messages"""
    red_flags = []
    
    # Crisis indicators
    crisis_keywords = ['suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead']
    if any(keyword in message.lower() for keyword in crisis_keywords):
        red_flags.append("CRISIS: Potential suicidal ideation detected")
    
    # Self-harm indicators
    self_harm_keywords = ['hurt myself', 'cut myself', 'self harm', 'harm myself']
    if any(keyword in message.lower() for keyword in self_harm_keywords):
        red_flags.append("SELF_HARM: Potential self-harm indicators detected")
    
    # Substance abuse
    substance_keywords = ['drinking too much', 'using drugs', 'overdose', 'substance abuse']
    if any(keyword in message.lower() for keyword in substance_keywords):
        red_flags.append("SUBSTANCE: Potential substance abuse concerns")
    
    # Severe depression
    depression_keywords = ['completely hopeless', 'no point', 'give up', 'can\'t go on']
    if any(keyword in message.lower() for keyword in depression_keywords):
        red_flags.append("DEPRESSION: Severe depression indicators detected")
    
    return red_flags

@router.post("/chat")
async def patient_chat(message_data: ChatMessage, db: Session = Depends(get_db)):
    """Handle patient chat message and generate AI response"""
    
    # Get patient (for demo, use patient ID 1)
    patient = db.query(Patient).filter(Patient.id == 1).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Generate AI response
    ai_response = get_openai_response(message_data.message)
    
    # Detect red flags
    red_flags = detect_red_flags(message_data.message)
    red_flags_json = json.dumps(red_flags) if red_flags else None
    
    # Calculate sentiment score (simple mock)
    sentiment_score = 0.5  # Neutral by default
    if any(word in message_data.message.lower() for word in ['happy', 'good', 'great', 'better', 'positive']):
        sentiment_score = 0.8
    elif any(word in message_data.message.lower() for word in ['sad', 'bad', 'terrible', 'awful', 'negative']):
        sentiment_score = 0.2
    
    # Store interaction
    interaction = Interaction(
        patient_id=patient.id,
        interaction_type="chat",
        content=message_data.message,
        ai_summary=f"Patient shared: {message_data.message[:100]}...",
        red_flags=red_flags_json,
        sentiment_score=sentiment_score,
        urgency_level=5 if red_flags else 1
    )
    
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    
    # Create alert if red flags detected
    if red_flags:
        alert = Alert(
            patient_id=patient.id,
            doctor_id=patient.doctor_id,
            alert_type="red_flag",
            title="Red Flag Detected in Chat",
            message=f"Patient message triggered alerts: {', '.join(red_flags)}",
            severity=5,
            created_at=datetime.utcnow()
        )
        db.add(alert)
        db.commit()
    
    return {
        "response": ai_response,
        "red_flags": red_flags,
        "sentiment_score": sentiment_score
    }

@router.post("/journal")
async def create_journal_entry(entry_data: JournalEntry, db: Session = Depends(get_db)):
    """Create a new journal entry"""
    
    if entry_data.mood < -2 or entry_data.mood > 2:
        raise HTTPException(status_code=400, detail="Mood must be between -2 and +2")
    
    if len(entry_data.content) < 10:
        raise HTTPException(status_code=400, detail="Journal content must be at least 10 characters")
    
    # Get patient (for demo, use patient ID 1)
    patient = db.query(Patient).filter(Patient.id == 1).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Convert mood to sentiment score (0-1 scale)
    sentiment_score = (entry_data.mood + 2) / 4
    
    # Detect red flags in journal entry
    red_flags = detect_red_flags(entry_data.content)
    red_flags_json = json.dumps(red_flags) if red_flags else None
    
    # Store journal entry as interaction
    interaction = Interaction(
        patient_id=patient.id,
        interaction_type="journal",
        content=entry_data.content,
        ai_summary=f"Journal entry with mood {entry_data.mood}: {entry_data.content[:100]}...",
        red_flags=red_flags_json,
        sentiment_score=sentiment_score,
        urgency_level=5 if red_flags else 1
    )
    
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    
    # Create alert if red flags detected
    if red_flags:
        alert = Alert(
            patient_id=patient.id,
            doctor_id=patient.doctor_id,
            alert_type="red_flag",
            title="Red Flag Detected in Journal",
            message=f"Journal entry triggered alerts: {', '.join(red_flags)}",
            severity=5,
            created_at=datetime.utcnow()
        )
        db.add(alert)
        db.commit()
    
    return {
        "id": interaction.id,
        "mood": entry_data.mood,
        "content": entry_data.content,
        "sentiment_score": sentiment_score,
        "red_flags": red_flags,
        "created_at": interaction.created_at.isoformat()
    }

@router.get("/history")
async def get_patient_history(db: Session = Depends(get_db)):
    """Get patient's chat and journal history"""
    
    # Get patient (for demo, use patient ID 1)
    patient = db.query(Patient).filter(Patient.id == 1).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all interactions
    interactions = db.query(Interaction).filter(
        Interaction.patient_id == patient.id
    ).order_by(Interaction.created_at.desc()).all()
    
    return [
        {
            "id": interaction.id,
            "type": interaction.interaction_type,
            "content": interaction.content,
            "ai_summary": interaction.ai_summary,
            "sentiment_score": interaction.sentiment_score,
            "red_flags": json.loads(interaction.red_flags) if interaction.red_flags else [],
            "created_at": interaction.created_at.isoformat()
        }
        for interaction in interactions
    ]

@router.get("/summary")
async def get_patient_summary(db: Session = Depends(get_db)):
    """Get AI-generated summary of patient's progress"""
    
    # Get patient (for demo, use patient ID 1)
    patient = db.query(Patient).filter(Patient.id == 1).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get recent interactions (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    interactions = db.query(Interaction).filter(
        Interaction.patient_id == patient.id,
        Interaction.created_at >= thirty_days_ago
    ).order_by(Interaction.created_at.desc()).all()
    
    # Calculate mood trend
    mood_scores = [i.sentiment_score for i in interactions if i.sentiment_score is not None]
    avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 0.5
    
    # Count red flags
    red_flag_count = len([i for i in interactions if i.red_flags])
    
    # Generate summary
    if avg_mood > 0.7:
        mood_trend = "positive"
        summary = f"Your recent entries show a positive trend with an average mood score of {avg_mood:.2f}. Keep up the great work!"
    elif avg_mood > 0.4:
        mood_trend = "stable"
        summary = f"Your mood has been relatively stable with an average score of {avg_mood:.2f}. This is a good foundation to build upon."
    else:
        mood_trend = "concerning"
        summary = f"I notice your recent entries show some challenges with an average mood score of {avg_mood:.2f}. Remember, it's okay to reach out for support."
    
    return {
        "patient_name": f"{patient.first_name} {patient.last_name}",
        "summary": summary,
        "mood_trend": mood_trend,
        "average_mood": avg_mood,
        "total_entries": len(interactions),
        "red_flags_count": red_flag_count,
        "last_entry": interactions[0].created_at.isoformat() if interactions else None
    }
