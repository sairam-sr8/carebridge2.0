#!/usr/bin/env python3
"""
Create demo users for CareBridge application
Run this script to add demo admin, doctor, and patient users
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Admin, Doctor, Patient, Base
import bcrypt

def create_demo_users():
    """Create demo users for testing"""
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create demo admin if not exists
        existing_admin = db.query(Admin).filter(Admin.email == "admin@carebridge.com").first()
        if not existing_admin:
            admin = Admin(
                firebase_uid="admin_demo_uid",
                email="admin@carebridge.com",
                first_name="System",
                last_name="Administrator"
            )
            admin.set_password("admin123")
            db.add(admin)
            print("✅ Created demo admin: admin@carebridge.com / admin123")
        else:
            print("ℹ️ Demo admin already exists")

        # Create demo doctor if not exists
        existing_doctor = db.query(Doctor).filter(Doctor.email == "doctor@carebridge.com").first()
        if not existing_doctor:
            doctor = Doctor(
                firebase_uid="doctor_demo_uid",
                email="doctor@carebridge.com",
                first_name="Dr. Sarah",
                last_name="Johnson",
                license_number="MD12345",
                specialization="Psychiatry"
            )
            doctor.set_password("doctor123")
            db.add(doctor)
            print("✅ Created demo doctor: doctor@carebridge.com / doctor123")
        else:
            print("ℹ️ Demo doctor already exists")

        # Create demo patient if not exists
        existing_patient = db.query(Patient).filter(Patient.email == "patient@carebridge.com").first()
        if not existing_patient:
            # Get the doctor ID for the relationship
            doctor = db.query(Doctor).filter(Doctor.email == "doctor@carebridge.com").first()
            
            patient = Patient(
                firebase_uid="patient_demo_uid",
                email="patient@carebridge.com",
                first_name="John",
                last_name="Smith",
                phone="555-0123",
                emergency_contact="Jane Smith",
                emergency_phone="555-0124",
                doctor_id=doctor.id if doctor else 1
            )
            patient.set_password("patient123")
            db.add(patient)
            print("✅ Created demo patient: patient@carebridge.com / patient123")
        else:
            print("ℹ️ Demo patient already exists")

        # Commit all changes
        db.commit()
        print("\n🎉 Demo users setup complete!")
        print("\n📋 Demo Credentials:")
        print("Admin:   admin@carebridge.com   / admin123")
        print("Doctor:  doctor@carebridge.com  / doctor123")
        print("Patient: patient@carebridge.com / patient123")
        
    except Exception as e:
        print(f"❌ Error creating demo users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_users()
