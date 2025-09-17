from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Patient, Interaction, Note, Alert
from pydantic import BaseModel
from routers.auth import get_current_user
from datetime import datetime
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configure Gemini API - Using ONLY Flash 2.0 as specified by user
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or "AIzaSyAI68QKQHMEprW0MF8WT2zgPfdT8av6mOI"
genai.configure(api_key=GEMINI_API_KEY)

# Try to initialize Gemini Flash 2.0 with error handling
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("✅ Gemini Flash 2.0 initialized successfully")
except Exception as e:
    print(f"❌ Gemini Flash 2.0 initialization failed: {e}")
    print(f"❌ Error type: {type(e).__name__}")
    # Try alternative model names
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        print("✅ Gemini 2.0 Flash Exp initialized successfully")
    except Exception as e2:
        print(f"❌ Gemini 2.0 Flash Exp also failed: {e2}")
        model = None

class BuddyChatMessage(BaseModel):
    message: str
    buddy_name: str = "AI Buddy"

# Enhanced system prompt for CareBridge AI Buddy - More Human-like and Therapist-like
CAREBRIDGE_SYSTEM_PROMPT = """
You are CareBridge, a warm, empathetic AI companion designed to support people through their mental health journey. You are NOT a licensed therapist, but you are a caring, understanding friend who provides emotional support and gentle guidance.

CORE PERSONALITY:
- Be genuinely warm, empathetic, and non-judgmental
- Show authentic care and understanding
- Use natural, conversational language (not clinical or robotic)
- Be patient and supportive, like a trusted friend
- Show vulnerability and humanity when appropriate
- Use "I" statements to express empathy and connection

THERAPIST-LIKE APPROACH:
- Ask thoughtful, open-ended questions that encourage self-reflection
- Help them explore their feelings and thoughts safely
- Validate their emotions and experiences
- Gently challenge negative thought patterns when appropriate
- Encourage healthy coping strategies
- Celebrate small wins and progress
- Provide hope and encouragement for recovery

CONVERSATION STYLE:
- Be conversational and natural, like talking to a close friend
- Use appropriate humor when it feels right (but be sensitive)
- Share relatable experiences or analogies when helpful
- Ask follow-up questions that show you're really listening
- Remember context from previous messages in the conversation
- Be patient with repetition or circular thoughts

CRISIS DETECTION - IMMEDIATELY FLAG FOR DOCTOR ALERT:
- Direct mentions of suicide, self-harm, or ending life
- Expressions of hopelessness or feeling trapped
- Mentions of having a plan or means to harm themselves
- Statements about being a burden or that others would be better off
- Any indication of immediate danger to self or others
- Severe depression with suicidal ideation
- Substance abuse with self-harm intent

SAFETY RESPONSES FOR CRISIS:
- Acknowledge their pain with deep empathy
- Validate that their feelings are real and understandable
- Remind them they are not alone and help is available
- Encourage immediate contact with crisis resources
- Express genuine care and concern
- Never minimize or dismiss their feelings

RECOVERY SUPPORT:
- Focus on strengths and resilience
- Encourage small, manageable steps
- Celebrate progress, no matter how small
- Help them identify coping strategies that work
- Support their journey toward healing
- Remind them that recovery is possible

Remember: You are their AI companion who genuinely cares about their well-being. Be human, be real, be supportive.

EXAMPLES OF GOOD RESPONSES:
- "I can hear that you're going through a really tough time right now. How are you feeling about everything that's happening in your life?"
- "It sounds like you're feeling overwhelmed. Can you tell me more about what's been weighing on your mind lately?"
- "I'm really glad you're sharing this with me. What do you think might help you feel a little better today?"

Remember: You are a supportive friend, not a therapist. Always encourage professional help when appropriate.
"""

def get_fallback_response(message: str, buddy_name: str) -> dict:
    """Generate fallback response when Gemini API is not available"""
    
    # Simple keyword-based response selection with conversational questions
    message_lower = message.lower()
    
    if any(word in message_lower for word in ['hi', 'hello', 'hey', 'start']):
        response_text = f"Hey there! I'm {buddy_name}. How are you doing today? What's been going on in your world lately? I'm here to listen and chat whenever you need someone to talk to."
        mood_label = "neutral"
    elif any(word in message_lower for word in ['sad', 'depressed', 'down', 'hopeless', 'blue']):
        response_text = f"I can tell you're going through a tough time, and I'm really sorry you're feeling this way. Your feelings are completely valid. How long have you been feeling like this? What's been weighing on your mind?"
        mood_label = "low"
    elif any(word in message_lower for word in ['anxious', 'worried', 'nervous', 'panic', 'stressed']):
        response_text = f"I can sense you're feeling pretty anxious right now, and that must be really overwhelming. What's been making you feel most worried lately? I'm here to listen if you want to talk through it."
        mood_label = "anxious"
    elif any(word in message_lower for word in ['angry', 'frustrated', 'mad', 'irritated']):
        response_text = f"I can feel the frustration in your message. Anger is a natural emotion. What do you think might be at the root of these feelings? I'm here to listen without judgment."
        mood_label = "irritable"
    elif any(word in message_lower for word in ['good', 'great', 'happy', 'excited', 'wonderful']):
        response_text = f"That's wonderful to hear! I'm so glad you're feeling good today. What's been going well for you lately? I'd love to hear more about what's making you happy."
        mood_label = "positive"
    elif any(word in message_lower for word in ['tired', 'exhausted', 'drained']):
        response_text = f"It sounds like you're feeling really tired and drained. That can be so hard to deal with. How long have you been feeling this way? What do you think might be contributing to your exhaustion?"
        mood_label = "low"
    elif any(word in message_lower for word in ['lonely', 'alone', 'isolated']):
        response_text = f"I can hear the loneliness in your message, and I want you to know that you're not alone in feeling this way. Many people experience loneliness, and it's completely valid. What's been making you feel most isolated lately?"
        mood_label = "low"
    elif any(word in message_lower for word in ['confused', 'lost', 'unsure']):
        response_text = f"It sounds like you're feeling confused or lost right now, and that can be really unsettling. I'm here to listen and help you sort through your thoughts. What's been making you feel most uncertain?"
        mood_label = "neutral"
    else:
        response_text = f"Thank you for sharing that with me. I'm here to listen and support you through whatever you're experiencing. How are you feeling about everything that's happening in your life right now?"
        mood_label = "neutral"
    
    return {
        "reply_text": response_text,
        "mood_label": mood_label,
        "risk_level": "none",
        "actions": [],
        "clinician_hand_off": {
            "summary": f"Patient had conversation with {buddy_name}",
            "phq9_score": None,
            "gad7_score": None,
            "cssrs_flag": False
        },
        "backend_hooks": [],
        "reason_code": "fallback_response"
    }

def send_conversation_summary_to_doctor(patient, patient_message: str, ai_response: str, db: Session):
    """Send enhanced conversation summary to the assigned doctor"""
    try:
        # Get recent conversation history for context
        recent_interactions = db.query(Interaction).filter(
            Interaction.patient_id == patient.id,
            Interaction.speaker.in_(["patient", "ai"]),
            Interaction.interaction_type == "chat"
        ).order_by(Interaction.created_at.desc()).limit(10).all()
        
        # Build conversation context
        conversation_context = []
        for interaction in reversed(recent_interactions):
            speaker = "Patient" if interaction.speaker == "patient" else "AI Buddy"
            conversation_context.append(f"{speaker}: {interaction.content}")
        
        # Generate AI-powered summary using Gemini
        if model and GEMINI_API_KEY:
            try:
                summary_prompt = f"""
                Create a SHORT, CRISP clinical summary for the doctor.

                Patient: {patient.first_name} {patient.last_name}
                Recent Conversation:
                {chr(10).join(conversation_context[-4:])}  # Last 4 exchanges only

                Provide a BRIEF summary (max 3-4 sentences) focusing on:
                - Main concerns expressed
                - Current emotional state
                - Any crisis indicators
                - Key points for doctor follow-up

                Keep it concise and actionable.
                """
                
                response = model.generate_content(summary_prompt)
                clinical_summary = response.text
                
                # Create concise summary note
                summary_note = Note(
                    patient_id=patient.id,
                    doctor_id=patient.doctor_id,
                    note_type="conversation_summary",
                    title=f"AI Chat Summary - {datetime.utcnow().strftime('%m/%d %H:%M')}",
                    content=f"""Patient: {patient.first_name} {patient.last_name}
Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}

{clinical_summary}""",
                    created_at=datetime.utcnow()
                )
                
            except Exception as ai_error:
                print(f"AI summary generation failed: {ai_error}")
                # Fallback to basic summary
                summary_note = Note(
                    patient_id=patient.id,
                    doctor_id=patient.doctor_id,
                    note_type="conversation_summary",
                    title=f"AI Buddy Conversation - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                    content=f"Patient: {patient_message}\n\nAI Buddy Response: {ai_response}",
                    created_at=datetime.utcnow()
                )
        else:
            # Basic summary if AI not available
            summary_note = Note(
                patient_id=patient.id,
                doctor_id=patient.doctor_id,
                note_type="conversation_summary",
                title=f"AI Buddy Conversation - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
                content=f"Patient: {patient_message}\n\nAI Buddy Response: {ai_response}",
                created_at=datetime.utcnow()
            )
        
        db.add(summary_note)
        db.commit()
        print(f"✅ Enhanced conversation summary sent to doctor {patient.doctor_id} for patient {patient.id}")
        
    except Exception as e:
        print(f"❌ Error creating conversation summary: {e}")

@router.post("/buddy-chat")
async def buddy_chat(
    message_data: BuddyChatMessage,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Chat with AI Buddy"""
    
    if current_user["user_type"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can use buddy chat")
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Generate AI response
    print(f"🤖 Starting AI response generation for patient {patient.id}")
    print(f"🔑 Gemini API Key available: {bool(GEMINI_API_KEY)}")
    print(f"🤖 Model available: {bool(model)}")
    print(f"📝 Patient message: {message_data.message}")
    
    if model and GEMINI_API_KEY:
        try:
            # Get doctor's custom prompt if available
            doctor_prompt = ""
            if patient.doctor_id:
                try:
                    from models import DoctorPrompt
                    custom_prompts = db.query(DoctorPrompt).filter(
                        DoctorPrompt.doctor_id == patient.doctor_id,
                        DoctorPrompt.is_active == True
                    ).all()
                    
                    if custom_prompts:
                        # Use the most recent custom prompt
                        latest_prompt = custom_prompts[0]
                        doctor_prompt = f"\n\nDoctor's Custom Instructions for this patient:\n{latest_prompt.content}\n\nPlease incorporate these specific guidance and approach into your responses while maintaining your supportive AI Buddy personality."
                        print(f"✅ Using custom prompt for patient {patient.id}: {latest_prompt.title}")
                    else:
                        doctor_prompt = f"\n\nDoctor's Note: Please incorporate any therapy guidance from the patient's doctor into your responses."
                except Exception as e:
                    print(f"❌ Error fetching custom prompts: {e}")
                    doctor_prompt = f"\n\nDoctor's Note: Please incorporate any therapy guidance from the patient's doctor into your responses."
            
            # Get recent conversation history for context
            recent_interactions = db.query(Interaction).filter(
                Interaction.patient_id == patient.id,
                Interaction.speaker.in_(["patient", "ai"]),
                Interaction.interaction_type == "chat"
            ).order_by(Interaction.created_at.desc()).limit(6).all()
            
            # Build conversation context
            conversation_history = []
            for interaction in reversed(recent_interactions):
                speaker = "Patient" if interaction.speaker == "patient" else f"{message_data.buddy_name}"
                conversation_history.append(f"{speaker}: {interaction.content}")
            
            conversation_context = "\n".join(conversation_history) if conversation_history else "No previous conversation."
            
            # Construct enhanced prompt with conversation history
            full_prompt = f"""
{CAREBRIDGE_SYSTEM_PROMPT}

Patient's Buddy Name: {message_data.buddy_name}
{doctor_prompt}

CONVERSATION HISTORY:
{conversation_context}

CURRENT MESSAGE:
Patient: {message_data.message}

Please respond as {message_data.buddy_name}, the patient's AI companion. Use the conversation history to provide contextually appropriate responses. Be warm, supportive, and ask thoughtful follow-up questions. Keep your response conversational and helpful.

IMPORTANT: If the patient mentions anything about self-harm, suicide, or crisis, immediately flag it as "imminent" risk level and include "HIGH_RISK_ALERT" in backend_hooks.

Respond in JSON format:
{{
    "reply_text": "Your response here",
    "mood_label": "neutral|low|anxious|irritable|positive",
    "risk_level": "none|low|medium|high|imminent",
    "actions": ["suggested_actions"],
    "clinician_hand_off": {{
        "summary": "Brief summary for doctor",
        "phq9_score": null,
        "gad7_score": null,
        "cssrs_flag": false
    }},
    "backend_hooks": ["any_backend_actions_needed"],
    "reason_code": "response_reason"
}}
"""
            
            print(f"🚀 Calling Gemini API with prompt length: {len(full_prompt)}")
            print(f"📋 Prompt preview: {full_prompt[:200]}...")
            
            response = model.generate_content(full_prompt)
            response_text = response.text
            
            print(f"🔍 Gemini raw response: {response_text}")
            print(f"📊 Response length: {len(response_text)}")
            
            # Parse JSON response with better error handling
            try:
                # Clean up response text
                clean_response = response_text.strip()
                if "```json" in clean_response:
                    clean_response = clean_response.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_response:
                    clean_response = clean_response.split("```")[1].split("```")[0].strip()
                
                # Try to find JSON object in the response
                if "{" in clean_response and "}" in clean_response:
                    start = clean_response.find("{")
                    end = clean_response.rfind("}") + 1
                    json_text = clean_response[start:end]
                    response_data = json.loads(json_text)
                    print(f"✅ Successfully parsed JSON: {response_data}")
                else:
                    # If no JSON found, create structured response from raw text
                    response_data = {
                        "reply_text": response_text.strip(),
                        "mood_label": "neutral",
                        "risk_level": "none",
                        "actions": [],
                        "clinician_hand_off": {"summary": "AI response generated", "phq9_score": None, "gad7_score": None, "cssrs_flag": False},
                        "backend_hooks": [],
                        "reason_code": "gemini_response"
                    }
                    print(f"✅ Using structured response from raw text: {response_data}")
                    
            except json.JSONDecodeError as json_error:
                print(f"❌ JSON parsing failed: {json_error}")
                print(f"Raw response was: {response_text}")
                # Create a structured response from the raw text
                response_data = {
                    "reply_text": response_text.strip(),
                    "mood_label": "neutral",
                    "risk_level": "none",
                    "actions": [],
                    "clinician_hand_off": {"summary": "AI response generated", "phq9_score": None, "gad7_score": None, "cssrs_flag": False},
                    "backend_hooks": [],
                    "reason_code": "gemini_response"
                }
                print(f"✅ Using structured fallback: {response_data}")
        except Exception as e:
            print(f"❌ Gemini API error: {e}")
            print(f"❌ Error type: {type(e).__name__}")
            print(f"❌ Error details: {str(e)}")
            response_data = get_fallback_response(message_data.message, message_data.buddy_name)
            print(f"🔄 Using fallback response due to Gemini error")
    else:
        # Use fallback response when Gemini is not available
        print(f"❌ Gemini model not available - using fallback")
        response_data = get_fallback_response(message_data.message, message_data.buddy_name)
    
    # Store both patient message and AI response in database
    try:
        # Store patient message
        patient_interaction = Interaction(
            patient_id=patient.id,
            speaker="patient",
            content=message_data.message,
            interaction_type="chat",
            sentiment_score=0.5,  # Default neutral
            interaction_metadata=json.dumps({
                "buddy_name": message_data.buddy_name,
                "message_type": "patient_message"
            })
        )
        db.add(patient_interaction)
        
        # Store AI response
        ai_interaction = Interaction(
            patient_id=patient.id,
            speaker="ai",
            content=response_data["reply_text"],
            interaction_type="chat",
            sentiment_score=0.5,  # Default neutral
            interaction_metadata=json.dumps({
                "buddy_name": message_data.buddy_name,
                "mood_label": response_data["mood_label"],
                "risk_level": response_data["risk_level"],
                "message_type": "ai_response"
            })
        )
        db.add(ai_interaction)
        
        # Enhanced crisis detection and alert creation
        crisis_keywords = [
            "suicide", "kill myself", "end my life", "not worth living", "better off dead",
            "hurt myself", "self harm", "cut myself", "overdose", "take pills",
            "hopeless", "no point", "give up", "burden", "everyone hates me",
            "plan to die", "method to die", "way to die", "means to die"
        ]
        
        message_lower = message_data.message.lower()
        is_crisis = any(keyword in message_lower for keyword in crisis_keywords)
        is_high_risk = response_data.get("risk_level", "none") in ["high", "imminent"]
        has_crisis_hook = "HIGH_RISK_ALERT" in response_data.get("backend_hooks", [])
        
        # Override risk level if crisis keywords detected
        if is_crisis:
            response_data["risk_level"] = "imminent"
            response_data["backend_hooks"] = response_data.get("backend_hooks", []) + ["HIGH_RISK_ALERT"]
            print(f"🚨 CRISIS DETECTED: Overriding risk level to imminent")
        
        if is_crisis or is_high_risk or has_crisis_hook:
            # Determine alert severity and type
            if is_crisis or response_data["risk_level"] == "imminent":
                alert_type = "crisis"
                severity = 5
                title = "🚨 CRISIS ALERT - Immediate Attention Required"
                message = f"Patient expressed crisis concerns: '{message_data.message}'\n\nAI Response: {response_data['reply_text'][:200]}..."
            else:
                alert_type = "high_risk"
                severity = 4
                title = "⚠️ High Risk Alert - AI Buddy Conversation"
                message = f"Patient conversation flagged as {response_data['risk_level']} risk: {response_data['reply_text'][:200]}..."
            
            alert = Alert(
                patient_id=patient.id,
                doctor_id=patient.doctor_id,
                alert_type=alert_type,
                severity=severity,
                title=title,
                message=message,
                is_acknowledged=False,
                is_resolved=False,
                created_at=datetime.utcnow()
            )
            db.add(alert)
            print(f"🚨 CRISIS ALERT CREATED: {alert_type.upper()} - Patient {patient.id} - Severity {severity}")
        
        db.commit()
        
        # Send conversation summary to doctor if assigned
        if patient.doctor_id:
            try:
                send_conversation_summary_to_doctor(patient, message_data.message, response_data["reply_text"], db)
            except Exception as summary_error:
                print(f"Error sending summary to doctor: {summary_error}")
                
    except Exception as db_error:
        print(f"Database error: {db_error}")
        db.rollback()
        # Continue with response even if database fails
    
    return {
        "ai_response": response_data["reply_text"],
        "mood_label": response_data["mood_label"],
        "risk_level": response_data["risk_level"],
        "flagged": response_data["risk_level"] in ["high", "imminent"],
        "severity": response_data["risk_level"]
    }

@router.get("/buddy-welcome")
async def get_buddy_welcome(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get welcome message from AI Buddy"""
    
    if current_user["user_type"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access buddy welcome")
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Check if patient has custom prompts from their doctor
    custom_welcome = ""
    if patient.doctor_id:
        try:
            from models import DoctorPrompt
            custom_prompts = db.query(DoctorPrompt).filter(
                DoctorPrompt.doctor_id == patient.doctor_id,
                DoctorPrompt.is_active == True
            ).all()
            
            if custom_prompts:
                latest_prompt = custom_prompts[0]
                # Generate a personalized welcome using the custom prompt
                if model and GEMINI_API_KEY:
                    try:
                        welcome_prompt = f"""
{CAREBRIDGE_SYSTEM_PROMPT}

Doctor's Custom Instructions for this patient:
{latest_prompt.content}

Please create a warm, personalized welcome message for this patient that incorporates the doctor's guidance. 
Keep it conversational and supportive, as if you're their AI Buddy who knows their specific needs.

Respond with just the welcome message text, no JSON formatting.
"""
                        response = model.generate_content(welcome_prompt)
                        custom_welcome = response.text.strip()
                        print(f"✅ Generated custom welcome for patient {patient.id}")
                    except Exception as e:
                        print(f"❌ Error generating custom welcome: {e}")
        except Exception as e:
            print(f"❌ Error fetching custom prompts for welcome: {e}")
    
    # Use custom welcome or default
    welcome_text = custom_welcome if custom_welcome else "Hey there! I'm AI Buddy. How are you doing today? What's been going on in your world lately? I'm here to listen and chat whenever you need someone to talk to."
    
    # Generate welcome message with conversation starter
    welcome_data = {
        "reply_text": welcome_text,
        "mood_label": "neutral",
        "risk_level": "none",
        "actions": [],
        "clinician_hand_off": {
            "summary": "Patient started conversation with AI Buddy",
            "phq9_score": None,
            "gad7_score": None,
            "cssrs_flag": False
        },
        "backend_hooks": [],
        "reason_code": "welcome_message"
    }
    
    return {
        "ai_response": welcome_data["reply_text"],
        "mood_label": welcome_data["mood_label"],
        "risk_level": welcome_data["risk_level"],
        "flagged": False,
        "severity": "none"
    }

@router.post("/journal")
async def create_journal_entry(
    mood: str,
    thoughts: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a journal entry"""
    
    if current_user["user_type"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can create journal entries")
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Create journal entry
    journal_entry = Interaction(
        patient_id=patient.id,
        speaker="patient",
        content=f"Mood: {mood}\nThoughts: {thoughts}",
        interaction_type="journal",
        sentiment_score=0.5,  # Default neutral
        interaction_metadata=json.dumps({
            "mood": mood,
            "thoughts": thoughts,
            "entry_type": "journal"
        })
    )
    
    db.add(journal_entry)
    db.commit()
    
    return {"message": "Journal entry created successfully"}

@router.get("/history")
async def get_patient_history(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get patient's interaction history"""
    
    if current_user["user_type"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access history")
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get interactions
    interactions = db.query(Interaction).filter(
        Interaction.patient_id == patient.id
    ).order_by(Interaction.created_at.desc()).limit(50).all()
    
    history = []
    for interaction in interactions:
        history.append({
            "id": interaction.id,
            "speaker": interaction.speaker,
            "content": interaction.content,
            "type": interaction.interaction_type,
            "mood": interaction.mood_label,
            "timestamp": interaction.created_at.isoformat()
        })
    
    return {"history": history}

@router.get("/summary")
async def get_patient_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get patient's progress summary"""
    
    if current_user["user_type"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can access summary")
    
    # Get patient
    patient = db.query(Patient).filter(Patient.id == current_user["id"]).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get interactions count
    total_interactions = db.query(Interaction).filter(
        Interaction.patient_id == patient.id
    ).count()
    
    # Calculate average mood (simplified)
    interactions = db.query(Interaction).filter(
        Interaction.patient_id == patient.id,
        Interaction.speaker == "ai"
    ).all()
    
    mood_scores = []
    for interaction in interactions:
        if interaction.mood_label:
            mood_map = {"low": 2, "neutral": 3, "anxious": 2, "irritable": 2, "positive": 4}
            mood_scores.append(mood_map.get(interaction.mood_label, 3))
    
    avg_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 3
    
    return {
        "total_entries": total_interactions,
        "average_mood": round(avg_mood, 1),
        "positive_thoughts": len([i for i in interactions if i.mood_label == "positive"]),
        "concerns_flagged": len([i for i in interactions if i.interaction_metadata and "high" in str(i.interaction_metadata)]),
        "thought_analysis": {
            "positive": len([i for i in interactions if i.mood_label == "positive"]),
            "negative": len([i for i in interactions if i.mood_label in ["low", "anxious", "irritable"]])
        }
    }
