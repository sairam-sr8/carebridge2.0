from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from database import Base
import bcrypt
import json

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    license_number = Column(String, unique=True, nullable=False)
    specialization = Column(String)
    password_hash = Column(String)  # For admin-created accounts
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patients = relationship("Patient", back_populates="doctor")
    notes = relationship("Note", back_populates="doctor")
    alerts = relationship("Alert", back_populates="doctor", foreign_keys="Alert.doctor_id")
    resolved_alerts = relationship("Alert", foreign_keys="Alert.resolved_by", overlaps="alerts")
    triage_items = relationship("TriageItem")
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime)
    phone = Column(String)
    emergency_contact = Column(String)
    emergency_phone = Column(String)
    password_hash = Column(String)  # For admin-created accounts
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    
    # Relationships
    doctor = relationship("Doctor", back_populates="patients")
    interactions = relationship("Interaction", back_populates="patient")
    notes = relationship("Note", back_populates="patient")
    alerts = relationship("Alert", back_populates="patient")
    triage_items = relationship("TriageItem")
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Interaction(Base):
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    speaker = Column(String, nullable=False)  # 'patient', 'ai', 'doctor'
    interaction_type = Column(String, nullable=False)  # 'chat', 'journal', 'assessment'
    content = Column(Text, nullable=False)
    ai_summary = Column(Text)
    red_flags = Column(Text)  # JSON string of detected red flags
    sentiment_score = Column(Float)
    urgency_level = Column(Integer, default=1)  # 1-5 scale
    moderation_level = Column(String, default="safe")  # 'safe', 'flagged', 'crisis'
    safety_flag_id = Column(Integer, ForeignKey("safety_flags.id"))
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="interactions")
    safety_flag = relationship("SafetyFlag", back_populates="interaction")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    note_type = Column(String, default="general")  # 'general', 'assessment', 'treatment'
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="notes")
    patient = relationship("Patient", back_populates="notes")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    alert_type = Column(String, nullable=False)  # 'crisis', 'red_flag', 'urgent', 'routine'
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(Integer, default=1)  # 1-5 scale
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    resolved_by = Column(Integer, ForeignKey("doctors.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="alerts")
    doctor = relationship("Doctor", back_populates="alerts", foreign_keys=[doctor_id])
    resolver = relationship("Doctor", back_populates="resolved_alerts", foreign_keys=[resolved_by])

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

# ===== PHASE 1: SAFETY ENGINE MODELS =====

class SafetyFlag(Base):
    """Flags created by the safety engine when content is flagged"""
    __tablename__ = "safety_flags"
    
    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=False)
    flag_type = Column(String, nullable=False)  # 'crisis', 'self_harm', 'high_risk', 'moderation'
    severity = Column(String, nullable=False)  # 'low', 'medium', 'high', 'critical'
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    evidence_snippets = Column(JSON)  # Array of text snippets that triggered the flag
    model_version = Column(String)  # Version of the safety model used
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    interaction = relationship("Interaction", back_populates="safety_flag")
    triage_items = relationship("TriageItem", back_populates="safety_flag")

class TriageItem(Base):
    """Items created for doctor review when content is flagged"""
    __tablename__ = "triage_items"
    
    id = Column(Integer, primary_key=True, index=True)
    safety_flag_id = Column(Integer, ForeignKey("safety_flags.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))  # Assigned doctor
    priority = Column(String, nullable=False)  # 'low', 'medium', 'high', 'critical'
    state = Column(String, default="pending")  # 'pending', 'acknowledged', 'resolved', 'escalated'
    sla_deadline = Column(DateTime)  # When this must be addressed
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime)
    resolved_at = Column(DateTime)
    
    # Relationships
    safety_flag = relationship("SafetyFlag", back_populates="triage_items")
    patient = relationship("Patient")
    doctor = relationship("Doctor")

class Escalation(Base):
    """Escalations when SLA is missed or critical issues arise"""
    __tablename__ = "escalations"
    
    id = Column(Integer, primary_key=True, index=True)
    triage_item_id = Column(Integer, ForeignKey("triage_items.id"), nullable=False)
    escalation_type = Column(String, nullable=False)  # 'sla_missed', 'critical_risk', 'manual'
    escalated_to = Column(String, nullable=False)  # 'admin', 'on_call', 'supervisor'
    notification_sent = Column(Boolean, default=False)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    
    # Relationships
    triage_item = relationship("TriageItem")

class Audit(Base):
    """Immutable audit log for all actions"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=False)  # User ID who performed action
    actor_type = Column(String, nullable=False)  # 'admin', 'doctor', 'patient', 'system'
    action = Column(String, nullable=False)  # 'login', 'create_user', 'acknowledge_triage', etc.
    target_type = Column(String)  # 'patient', 'doctor', 'triage_item', etc.
    target_id = Column(Integer)  # ID of the target object
    metadata_json = Column(JSON)  # Additional context
    timestamp = Column(DateTime, default=datetime.utcnow)
    hash_chain = Column(String)  # Cryptographic hash for tamper-proofing
