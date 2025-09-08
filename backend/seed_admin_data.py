#!/usr/bin/env python3
"""
Admin Data Seeding Script for CareBridge
This script creates initial admin data for the system
"""

from sqlalchemy.orm import sessionmaker
from models import Doctor, Patient, Interaction, Note, Alert, Base
from database import engine
from datetime import datetime, timedelta
import random

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def seed_admin_data():
    """Seed the database with initial admin data"""
    try:
        print("🌱 Starting admin data seeding...")
        
        # Clear existing data
        print("🧹 Clearing existing data...")
        db.query(Alert).delete()
        db.query(Note).delete()
        db.query(Interaction).delete()
        db.query(Patient).delete()
        db.query(Doctor).delete()
        db.commit()
        
        # Create sample doctors
        print("👨‍⚕️ Creating doctors...")
        doctors_data = [
            {
                "firebase_uid": "doctor_1",
                "email": "dr.smith@carebridge.com",
                "first_name": "John",
                "last_name": "Smith",
                "license_number": "MD123456",
                "specialization": "Psychiatry"
            },
            {
                "firebase_uid": "doctor_2", 
                "email": "dr.jones@carebridge.com",
                "first_name": "Sarah",
                "last_name": "Jones",
                "license_number": "MD789012",
                "specialization": "Clinical Psychology"
            },
            {
                "firebase_uid": "doctor_3",
                "email": "dr.wilson@carebridge.com", 
                "first_name": "Michael",
                "last_name": "Wilson",
                "license_number": "MD345678",
                "specialization": "Counseling Psychology"
            }
        ]
        
        doctors = []
        for doctor_data in doctors_data:
            doctor = Doctor(**doctor_data, is_active=True)
            db.add(doctor)
            doctors.append(doctor)
        
        db.commit()
        for doctor in doctors:
            db.refresh(doctor)
        
        # Create sample patients
        print("👥 Creating patients...")
        patients_data = [
            {
                "firebase_uid": "patient_1",
                "email": "alice.johnson@email.com",
                "first_name": "Alice",
                "last_name": "Johnson",
                "phone": "+1-555-0101",
                "emergency_contact": "Bob Johnson",
                "emergency_phone": "+1-555-0102",
                "doctor_id": doctors[0].id
            },
            {
                "firebase_uid": "patient_2",
                "email": "michael.brown@email.com",
                "first_name": "Michael",
                "last_name": "Brown", 
                "phone": "+1-555-0201",
                "emergency_contact": "Sarah Brown",
                "emergency_phone": "+1-555-0202",
                "doctor_id": doctors[0].id
            },
            {
                "firebase_uid": "patient_3",
                "email": "emma.davis@email.com",
                "first_name": "Emma",
                "last_name": "Davis",
                "phone": "+1-555-0301",
                "emergency_contact": "Tom Davis",
                "emergency_phone": "+1-555-0302",
                "doctor_id": doctors[1].id
            },
            {
                "firebase_uid": "patient_4",
                "email": "david.wilson@email.com",
                "first_name": "David",
                "last_name": "Wilson",
                "phone": "+1-555-0401",
                "emergency_contact": "Lisa Wilson",
                "emergency_phone": "+1-555-0402",
                "doctor_id": doctors[1].id
            },
            {
                "firebase_uid": "patient_5",
                "email": "sarah.miller@email.com",
                "first_name": "Sarah",
                "last_name": "Miller",
                "phone": "+1-555-0501",
                "emergency_contact": "John Miller",
                "emergency_phone": "+1-555-0502",
                "doctor_id": doctors[2].id
            }
        ]
        
        patients = []
        for patient_data in patients_data:
            patient = Patient(**patient_data, is_active=True)
            db.add(patient)
            patients.append(patient)
        
        db.commit()
        for patient in patients:
            db.refresh(patient)
        
        # Create sample interactions
        print("💬 Creating interactions...")
        interaction_types = ["chat", "journal", "assessment"]
        for patient in patients:
            for i in range(random.randint(3, 8)):
                # Create some interactions with red flags for testing
                has_red_flags = random.random() < 0.2
                red_flags = None
                if has_red_flags:
                    red_flags = random.choice([
                        'CRISIS: Potential suicidal ideation detected',
                        'SELF_HARM: Potential self-harm indicators detected',
                        'DEPRESSION: Severe depression indicators detected'
                    ])
                
                interaction = Interaction(
                    patient_id=patient.id,
                    interaction_type=random.choice(interaction_types),
                    content=f"Sample {random.choice(interaction_types)} content for {patient.first_name}. This is a test interaction to demonstrate the system functionality.",
                    ai_summary=f"AI summary for {patient.first_name}'s {random.choice(interaction_types)} interaction",
                    red_flags=red_flags,
                    sentiment_score=random.uniform(0.2, 0.9),
                    urgency_level=5 if has_red_flags else random.randint(1, 3),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
                )
                db.add(interaction)
        
        # Create sample notes
        print("📝 Creating notes...")
        note_types = ["general", "assessment", "treatment"]
        for patient in patients:
            for i in range(random.randint(1, 3)):
                note = Note(
                    doctor_id=patient.doctor_id,
                    patient_id=patient.id,
                    title=f"{random.choice(note_types).title()} Note for {patient.first_name}",
                    content=f"Detailed {random.choice(note_types)} note content for {patient.first_name}. This note contains important clinical observations and treatment recommendations.",
                    note_type=random.choice(note_types),
                    is_private=random.choice([True, False]),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 20))
                )
                db.add(note)
        
        # Create sample alerts
        print("🚨 Creating alerts...")
        alert_types = ["crisis", "red_flag", "urgent", "routine"]
        for patient in patients[:3]:  # Only first 3 patients have alerts
            alert = Alert(
                patient_id=patient.id,
                doctor_id=patient.doctor_id,
                alert_type=random.choice(alert_types),
                title=f"Alert for {patient.first_name}",
                message=f"Important alert message regarding {patient.first_name}'s condition. This requires immediate attention.",
                severity=random.randint(1, 5),
                is_resolved=random.choice([True, False]),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10))
            )
            db.add(alert)
        
        db.commit()
        print("✅ Admin data seeded successfully!")
        print(f"   - {len(doctors)} doctors created")
        print(f"   - {len(patients)} patients created")
        print(f"   - {len(patients) * 5} interactions created")
        print(f"   - {len(patients) * 2} notes created")
        print(f"   - 3 alerts created")
        
    except Exception as e:
        print(f"❌ Error seeding admin data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin_data()
