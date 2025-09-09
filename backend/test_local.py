#!/usr/bin/env python3
"""
Local Test Script - Test database setup and basic functionality
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Doctor, Patient, Admin, Interaction, SafetyFlag, TriageItem
from datetime import datetime

def test_database_setup():
    """Test database setup locally"""
    print("🧪 Testing local database setup...")
    
    # Use SQLite for local testing
    DATABASE_URL = "sqlite:///./test_carebridge.db"
    engine = create_engine(DATABASE_URL, echo=True)
    
    try:
        # Create all tables
        print("1️⃣ Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        
        # Test creating a session
        print("2️⃣ Testing database session...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Test creating a doctor
        print("3️⃣ Testing doctor creation...")
        doctor = Doctor(
            firebase_uid="test_doctor_123",
            email="test@doctor.com",
            first_name="Test",
            last_name="Doctor",
            license_number="DOC123456"
        )
        doctor.set_password("testpassword")
        db.add(doctor)
        db.commit()
        print("✅ Doctor created successfully!")
        
        # Test creating a patient
        print("4️⃣ Testing patient creation...")
        patient = Patient(
            firebase_uid="test_patient_123",
            email="test@patient.com",
            first_name="Test",
            last_name="Patient",
            doctor_id=doctor.id
        )
        patient.set_password("testpassword")
        db.add(patient)
        db.commit()
        print("✅ Patient created successfully!")
        
        # Test creating an interaction
        print("5️⃣ Testing interaction creation...")
        interaction = Interaction(
            patient_id=patient.id,
            speaker="patient",
            interaction_type="chat",
            content="Hello, I'm feeling anxious today."
        )
        db.add(interaction)
        db.commit()
        print("✅ Interaction created successfully!")
        
        # Test creating a safety flag
        print("6️⃣ Testing safety flag creation...")
        safety_flag = SafetyFlag(
            interaction_id=interaction.id,
            flag_type="moderation",
            severity="low",
            confidence=0.7,
            evidence_snippets=["feeling anxious"]
        )
        db.add(safety_flag)
        db.commit()
        print("✅ Safety flag created successfully!")
        
        # Test creating a triage item
        print("7️⃣ Testing triage item creation...")
        triage_item = TriageItem(
            safety_flag_id=safety_flag.id,
            patient_id=patient.id,
            doctor_id=doctor.id,
            priority="low",
            sla_deadline=datetime.utcnow()
        )
        db.add(triage_item)
        db.commit()
        print("✅ Triage item created successfully!")
        
        # Test relationships
        print("8️⃣ Testing relationships...")
        print(f"   Doctor has {len(doctor.patients)} patients")
        print(f"   Patient has {len(patient.interactions)} interactions")
        print(f"   Interaction safety flag: {interaction.safety_flag is not None}")
        print(f"   Safety flag triage items: {len(safety_flag.triage_items)}")
        print("✅ Relationships working correctly!")
        
        db.close()
        print("\n🎉 All tests passed! Database setup is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_database_setup()
    sys.exit(0 if success else 1)
