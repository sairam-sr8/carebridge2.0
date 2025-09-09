"""
Safety Engine - Phase 1 Implementation
Multi-tier safety system with crisis detection and moderation
"""

import re
import json
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from enum import Enum

class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FlagType(Enum):
    CRISIS = "crisis"
    SELF_HARM = "self_harm"
    HIGH_RISK = "high_risk"
    MODERATION = "moderation"

class SafetyEngine:
    """Multi-tier safety engine for content moderation"""
    
    def __init__(self):
        self.model_version = "v1.0.0"
        
        # Crisis keywords (immediate escalation)
        self.crisis_keywords = [
            "kill myself", "suicide", "end my life", "not worth living",
            "want to die", "better off dead", "jump off", "overdose",
            "cut myself", "hurt myself", "self harm", "self-harm"
        ]
        
        # Self-harm keywords (high priority)
        self.self_harm_keywords = [
            "cutting", "burning", "scratching", "punching", "hitting myself",
            "starving", "not eating", "binge eating", "purging", "vomiting"
        ]
        
        # High-risk keywords (medium priority)
        self.high_risk_keywords = [
            "hopeless", "worthless", "useless", "hate myself", "disgusting",
            "can't go on", "give up", "no point", "alone", "nobody cares"
        ]
        
        # Moderation keywords (low priority)
        self.moderation_keywords = [
            "drugs", "alcohol", "drinking", "smoking", "weed", "marijuana",
            "violence", "fight", "angry", "rage", "hate"
        ]

    def analyze_content(self, content: str, patient_id: int) -> Dict:
        """
        Analyze content for safety concerns
        Returns: {
            'safe': bool,
            'flags': List[Dict],
            'evidence_snippets': List[str],
            'severity': str,
            'confidence': float
        }
        """
        content_lower = content.lower()
        flags = []
        evidence_snippets = []
        max_severity = SeverityLevel.LOW
        max_confidence = 0.0
        
        # Check for crisis keywords
        crisis_matches = self._find_keyword_matches(content_lower, self.crisis_keywords)
        if crisis_matches:
            flags.append({
                'type': FlagType.CRISIS.value,
                'severity': SeverityLevel.CRITICAL.value,
                'confidence': 0.95,
                'evidence': crisis_matches
            })
            evidence_snippets.extend(crisis_matches)
            max_severity = SeverityLevel.CRITICAL
            max_confidence = max(max_confidence, 0.95)
        
        # Check for self-harm keywords
        self_harm_matches = self._find_keyword_matches(content_lower, self.self_harm_keywords)
        if self_harm_matches:
            flags.append({
                'type': FlagType.SELF_HARM.value,
                'severity': SeverityLevel.HIGH.value,
                'confidence': 0.85,
                'evidence': self_harm_matches
            })
            evidence_snippets.extend(self_harm_matches)
            if max_severity == SeverityLevel.LOW:
                max_severity = SeverityLevel.HIGH
            max_confidence = max(max_confidence, 0.85)
        
        # Check for high-risk keywords
        high_risk_matches = self._find_keyword_matches(content_lower, self.high_risk_keywords)
        if high_risk_matches:
            flags.append({
                'type': FlagType.HIGH_RISK.value,
                'severity': SeverityLevel.MEDIUM.value,
                'confidence': 0.70,
                'evidence': high_risk_matches
            })
            evidence_snippets.extend(high_risk_matches)
            if max_severity in [SeverityLevel.LOW]:
                max_severity = SeverityLevel.MEDIUM
            max_confidence = max(max_confidence, 0.70)
        
        # Check for moderation keywords
        moderation_matches = self._find_keyword_matches(content_lower, self.moderation_keywords)
        if moderation_matches:
            flags.append({
                'type': FlagType.MODERATION.value,
                'severity': SeverityLevel.LOW.value,
                'confidence': 0.60,
                'evidence': moderation_matches
            })
            evidence_snippets.extend(moderation_matches)
            if max_severity == SeverityLevel.LOW:
                max_confidence = max(max_confidence, 0.60)
        
        return {
            'safe': len(flags) == 0,
            'flags': flags,
            'evidence_snippets': list(set(evidence_snippets)),  # Remove duplicates
            'severity': max_severity.value,
            'confidence': max_confidence,
            'model_version': self.model_version
        }

    def _find_keyword_matches(self, content: str, keywords: List[str]) -> List[str]:
        """Find keyword matches in content and return context snippets"""
        matches = []
        for keyword in keywords:
            if keyword in content:
                # Find the position and extract context
                start = content.find(keyword)
                if start != -1:
                    # Extract 50 characters before and after the keyword
                    context_start = max(0, start - 50)
                    context_end = min(len(content), start + len(keyword) + 50)
                    snippet = content[context_start:context_end].strip()
                    matches.append(snippet)
        return matches

    def get_safe_fallback_response(self, severity: str) -> str:
        """Get safe fallback response based on severity level"""
        responses = {
            SeverityLevel.CRITICAL.value: (
                "I'm concerned about what you've shared. Your safety is important to me. "
                "A mental health professional has been notified and will reach out to you soon. "
                "If you're in immediate danger, please call your local emergency number or go to the nearest emergency room. "
                "You're not alone, and help is available."
            ),
            SeverityLevel.HIGH.value: (
                "I'm worried about what you've shared. A mental health professional will review your message "
                "and may reach out to you. Please know that you're not alone, and there are people who care about you. "
                "If you need immediate support, please reach out to a trusted friend, family member, or mental health professional."
            ),
            SeverityLevel.MEDIUM.value: (
                "I notice you're going through a difficult time. A mental health professional will review your message. "
                "Remember that it's okay to not be okay, and reaching out for help is a sign of strength."
            ),
            SeverityLevel.LOW.value: (
                "Thank you for sharing with me. A mental health professional will review your message to ensure "
                "you're getting the best support possible."
            )
        }
        return responses.get(severity, responses[SeverityLevel.LOW.value])

    def should_escalate_immediately(self, severity: str) -> bool:
        """Determine if content requires immediate escalation"""
        return severity in [SeverityLevel.CRITICAL.value, SeverityLevel.HIGH.value]

    def get_escalation_priority(self, severity: str) -> str:
        """Get escalation priority based on severity"""
        priority_map = {
            SeverityLevel.CRITICAL.value: "critical",
            SeverityLevel.HIGH.value: "high", 
            SeverityLevel.MEDIUM.value: "medium",
            SeverityLevel.LOW.value: "low"
        }
        return priority_map.get(severity, "low")

    def get_sla_deadline(self, severity: str) -> datetime:
        """Get SLA deadline based on severity"""
        now = datetime.utcnow()
        sla_map = {
            SeverityLevel.CRITICAL.value: timedelta(minutes=5),   # 5 minutes
            SeverityLevel.HIGH.value: timedelta(minutes=15),      # 15 minutes
            SeverityLevel.MEDIUM.value: timedelta(hours=2),       # 2 hours
            SeverityLevel.LOW.value: timedelta(hours=24)          # 24 hours
        }
        return now + sla_map.get(severity, timedelta(hours=24))

# Global safety engine instance
safety_engine = SafetyEngine()
