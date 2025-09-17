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
    prompts = relationship("DoctorPrompt", back_populates="doctor")
    
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
    medical_history = Column(Text)
    current_medications = Column(Text)
    allergies = Column(Text)
    password_hash = Column(String)  # For admin-created accounts
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="patients")
    interactions = relationship("Interaction", back_populates="patient")
    notes = relationship("Note", back_populates="patient")
    alerts = relationship("Alert", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    triage_assessments = relationship("TriageAssessment", back_populates="patient")
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
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

class Interaction(Base):
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    speaker = Column(String, nullable=False)  # "patient" or "ai"
    content = Column(Text, nullable=False)
    interaction_type = Column(String, default="chat")  # "chat", "journal", "triage"
    sentiment_score = Column(Float, default=0.5)
    mood_label = Column(String)
    risk_level = Column(String, default="none")
    interaction_metadata = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="interactions")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    note_type = Column(String, nullable=False)  # "session", "observation", "conversation_summary"
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="notes")
    doctor = relationship("Doctor", back_populates="notes")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    alert_type = Column(String, nullable=False)  # "high_risk", "crisis", "medication", "appointment"
    severity = Column(Integer, default=1)  # 1-5 scale
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="alerts")
    doctor = relationship("Doctor", back_populates="alerts", foreign_keys=[doctor_id])
    resolver = relationship("Doctor", foreign_keys=[resolved_by], overlaps="alerts")

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(String, default="scheduled")  # "scheduled", "confirmed", "completed", "cancelled"
    notes = Column(Text)
    hospital_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor")

class TriageAssessment(Base):
    __tablename__ = "triage_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    questions = Column(JSON, nullable=False)
    answers = Column(JSON, nullable=False)
    feeling = Column(JSON, nullable=False)
    risk_score = Column(Float, default=0.0)
    severity_level = Column(String, default="low")
    recommendations = Column(Text)
    ai_analysis = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient", back_populates="triage_assessments")

class TriageItem(Base):
    __tablename__ = "triage_items"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    assessment_id = Column(Integer, ForeignKey("triage_assessments.id"), nullable=True)
    status = Column(String, default="pending")  # "pending", "assigned", "resolved"
    priority = Column(String, default="medium")  # "low", "medium", "high", "urgent"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    patient = relationship("Patient")
    doctor = relationship("Doctor", back_populates="triage_items")

class DoctorPrompt(Base):
    __tablename__ = "doctor_prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    doctor = relationship("Doctor", back_populates="prompts")
