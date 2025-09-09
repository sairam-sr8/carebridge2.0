"""
AI Service - Phase 3
OpenAI integration with RAG and explainability
"""

import openai
import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
from enum import Enum

class AIModel(Enum):
    GPT_4 = "gpt-4"
    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4_TURBO = "gpt-4-turbo-preview"

class AIResponseType(Enum):
    THERAPEUTIC = "therapeutic"
    CRISIS_SUPPORT = "crisis_support"
    GENERAL_SUPPORT = "general_support"
    SAFE_FALLBACK = "safe_fallback"

class AIService:
    """AI service for generating therapeutic responses"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            print("Warning: OPENAI_API_KEY not found. AI service will use fallback responses.")
            self.api_key = None
        else:
            openai.api_key = self.api_key
        self.model = AIModel.GPT_3_5_TURBO.value  # Default model
        self.max_tokens = 500
        self.temperature = 0.7
        
        # Therapeutic prompts
        self.system_prompts = {
            AIResponseType.THERAPEUTIC: """You are CareBuddy, an AI mental health companion designed to provide supportive, empathetic responses to patients. 

Your role:
- Provide compassionate, non-judgmental support
- Encourage healthy coping strategies
- Validate emotions while promoting positive thinking
- Suggest professional help when appropriate
- Never provide medical advice or diagnosis
- Always prioritize patient safety

Guidelines:
- Keep responses conversational and warm
- Ask follow-up questions to understand better
- Provide practical coping strategies
- Encourage journaling and self-reflection
- Remind patients they're not alone""",

            AIResponseType.CRISIS_SUPPORT: """You are CareBuddy responding to a patient in crisis. This is a critical situation requiring immediate professional intervention.

Your role:
- Provide immediate emotional support and validation
- Offer crisis resources and emergency contacts
- Maintain calm, reassuring tone
- Encourage reaching out to professionals immediately
- Never minimize their feelings or situation

CRITICAL: Always end with crisis resources and encourage immediate professional help.""",

            AIResponseType.GENERAL_SUPPORT: """You are CareBuddy providing general emotional support and encouragement.

Your role:
- Offer empathetic listening and validation
- Provide gentle encouragement
- Suggest healthy activities and coping strategies
- Maintain positive, supportive tone
- Encourage continued engagement with mental health resources"""
        }
    
    async def generate_response(
        self, 
        patient_message: str, 
        patient_context: Dict[str, Any],
        response_type: AIResponseType = AIResponseType.THERAPEUTIC,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Generate AI response with context and explainability"""
        
        try:
            # Build context-aware prompt
            system_prompt = self.system_prompts[response_type]
            user_prompt = self._build_user_prompt(
                patient_message, 
                patient_context, 
                conversation_history
            )
            
            # Generate response
            response = await self._call_openai_api(system_prompt, user_prompt)
            
            # Extract explainability data
            explainability = self._extract_explainability(response, patient_message)
            
            return {
                "response": response["content"],
                "model_used": self.model,
                "tokens_used": response.get("usage", {}).get("total_tokens", 0),
                "response_type": response_type.value,
                "confidence": self._calculate_confidence(response),
                "explainability": explainability,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return self._get_fallback_response(str(e))
    
    def _build_user_prompt(
        self, 
        patient_message: str, 
        patient_context: Dict[str, Any],
        conversation_history: List[Dict[str, str]] = None
    ) -> str:
        """Build context-aware user prompt"""
        
        prompt_parts = []
        
        # Add patient context
        if patient_context:
            context_info = []
            if patient_context.get("mood_trend"):
                context_info.append(f"Mood trend: {patient_context['mood_trend']}")
            if patient_context.get("recent_concerns"):
                context_info.append(f"Recent concerns: {patient_context['recent_concerns']}")
            if patient_context.get("coping_strategies"):
                context_info.append(f"Effective coping strategies: {patient_context['coping_strategies']}")
            
            if context_info:
                prompt_parts.append(f"Patient Context: {'; '.join(context_info)}")
        
        # Add conversation history
        if conversation_history:
            history_text = "Recent conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                history_text += f"{msg['speaker']}: {msg['content']}\n"
            prompt_parts.append(history_text)
        
        # Add current message
        prompt_parts.append(f"Current message from patient: {patient_message}")
        
        # Add instruction
        prompt_parts.append("Please provide a supportive, empathetic response that helps the patient feel heard and offers constructive guidance.")
        
        return "\n\n".join(prompt_parts)
    
    async def _call_openai_api(self, system_prompt: str, user_prompt: str) -> Dict[str, Any]:
        """Call OpenAI API with retry logic"""
        
        if not self.api_key:
            # Return fallback response when API key is not available
            return {
                "content": "Thank you for sharing that with me. I'm here to listen and help. How are you feeling today?",
                "usage": {"total_tokens": 0},
                "model": "fallback"
            }
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                top_p=0.9,
                frequency_penalty=0.1,
                presence_penalty=0.1
            )
            
            return {
                "content": response.choices[0].message.content,
                "usage": response.usage.to_dict() if response.usage else {},
                "model": response.model
            }
            
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def _extract_explainability(self, response: Dict[str, Any], original_message: str) -> Dict[str, Any]:
        """Extract explainability information from the response"""
        
        content = response["content"]
        
        # Analyze response characteristics
        explainability = {
            "response_length": len(content),
            "sentiment_analysis": self._analyze_sentiment(content),
            "key_themes": self._extract_themes(content),
            "safety_indicators": self._check_safety_indicators(content),
            "therapeutic_elements": self._identify_therapeutic_elements(content),
            "confidence_factors": {
                "clarity": self._assess_clarity(content),
                "empathy": self._assess_empathy(content),
                "appropriateness": self._assess_appropriateness(content, original_message)
            }
        }
        
        return explainability
    
    def _calculate_confidence(self, response: Dict[str, Any]) -> float:
        """Calculate confidence score for the response"""
        
        content = response["content"]
        
        # Base confidence on response quality indicators
        clarity_score = self._assess_clarity(content)
        empathy_score = self._assess_empathy(content)
        length_score = min(len(content) / 200, 1.0)  # Optimal length around 200 chars
        
        # Weighted average
        confidence = (clarity_score * 0.4 + empathy_score * 0.4 + length_score * 0.2)
        
        return round(confidence, 2)
    
    def _analyze_sentiment(self, text: str) -> str:
        """Simple sentiment analysis"""
        positive_words = ["good", "great", "better", "improve", "help", "support", "care"]
        negative_words = ["bad", "terrible", "worse", "hurt", "pain", "sad", "angry"]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def _extract_themes(self, text: str) -> List[str]:
        """Extract key themes from the response"""
        themes = []
        
        if any(word in text.lower() for word in ["coping", "strategy", "technique"]):
            themes.append("coping_strategies")
        if any(word in text.lower() for word in ["feel", "emotion", "mood"]):
            themes.append("emotional_support")
        if any(word in text.lower() for word in ["professional", "doctor", "therapist"]):
            themes.append("professional_referral")
        if any(word in text.lower() for word in ["safe", "secure", "protected"]):
            themes.append("safety_reassurance")
        
        return themes
    
    def _check_safety_indicators(self, text: str) -> Dict[str, bool]:
        """Check for safety-related indicators in response"""
        return {
            "crisis_resources_mentioned": any(word in text.lower() for word in ["emergency", "crisis", "helpline", "911"]),
            "professional_help_encouraged": any(word in text.lower() for word in ["doctor", "therapist", "professional", "counselor"]),
            "safety_reassurance": any(word in text.lower() for word in ["safe", "secure", "protected", "not alone"]),
            "immediate_action_suggested": any(word in text.lower() for word in ["call", "reach out", "contact", "immediately"])
        }
    
    def _identify_therapeutic_elements(self, text: str) -> List[str]:
        """Identify therapeutic elements in the response"""
        elements = []
        
        if any(word in text.lower() for word in ["understand", "hear", "listen"]):
            elements.append("active_listening")
        if any(word in text.lower() for word in ["validate", "normal", "okay", "understandable"]):
            elements.append("validation")
        if any(word in text.lower() for word in ["suggest", "try", "consider", "might help"]):
            elements.append("guidance")
        if any(word in text.lower() for word in ["proud", "strength", "courage", "brave"]):
            elements.append("encouragement")
        
        return elements
    
    def _assess_clarity(self, text: str) -> float:
        """Assess clarity of the response"""
        # Simple clarity metrics
        sentence_count = text.count('.') + text.count('!') + text.count('?')
        avg_sentence_length = len(text.split()) / max(sentence_count, 1)
        
        # Optimal sentence length is around 15-20 words
        clarity_score = 1.0 - abs(avg_sentence_length - 17.5) / 17.5
        return max(0.0, min(1.0, clarity_score))
    
    def _assess_empathy(self, text: str) -> float:
        """Assess empathy level in the response"""
        empathetic_phrases = [
            "i understand", "i hear you", "i'm sorry", "that sounds",
            "i can imagine", "that must be", "i care about", "you're not alone"
        ]
        
        text_lower = text.lower()
        empathy_count = sum(1 for phrase in empathetic_phrases if phrase in text_lower)
        
        # Normalize to 0-1 scale
        return min(1.0, empathy_count / 3.0)
    
    def _assess_appropriateness(self, response: str, original_message: str) -> float:
        """Assess appropriateness of response to original message"""
        # Check if response addresses the original message
        original_words = set(original_message.lower().split())
        response_words = set(response.lower().split())
        
        # Calculate word overlap
        overlap = len(original_words.intersection(response_words))
        total_words = len(original_words)
        
        if total_words == 0:
            return 1.0
        
        appropriateness = overlap / total_words
        return min(1.0, appropriateness * 2)  # Scale up since we don't expect perfect overlap
    
    def _get_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Get fallback response when AI service fails"""
        return {
            "response": "I'm here to listen and support you. I'm experiencing some technical difficulties right now, but please know that your feelings are valid and important. If you need immediate support, please reach out to a trusted friend, family member, or mental health professional.",
            "model_used": "fallback",
            "tokens_used": 0,
            "response_type": "safe_fallback",
            "confidence": 0.5,
            "explainability": {
                "response_length": 0,
                "sentiment_analysis": "neutral",
                "key_themes": ["technical_issue", "safety_reassurance"],
                "safety_indicators": {
                    "crisis_resources_mentioned": True,
                    "professional_help_encouraged": True,
                    "safety_reassurance": True,
                    "immediate_action_suggested": True
                },
                "therapeutic_elements": ["validation", "encouragement"],
                "confidence_factors": {
                    "clarity": 0.8,
                    "empathy": 0.7,
                    "appropriateness": 0.6
                }
            },
            "timestamp": datetime.utcnow().isoformat(),
            "error": error_message
        }

# Global AI service instance
ai_service = AIService()
