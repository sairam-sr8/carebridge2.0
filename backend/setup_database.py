#!/usr/bin/env python3
"""
Complete database setup for CareBridge application
This script will:
1. Drop existing database
2. Create fresh database with proper schema
3. Create demo users with proper passwords
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Admin, Doctor, Patient, Base
import bcrypt

def setup_database():
    """Complete database setup"""
    
    print("🔄 Setting up CareBridge database...")
    
    try:
        # Step 1: Drop all existing tables
        print("1️⃣ Dropping existing tables...")
        Base.metadata.drop_all(bind=engine)
        
        # Step 2: Create all tables with fresh schema
        print("2️⃣ Creating tables with fresh schema...")
        Base.metadata.create_all(bind=engine)
        
        # Step 3: Create demo users
        print("3️⃣ Creating demo users...")
        db = SessionLocal()
        
        # Create demo admin
        admin = Admin(
            email="admin@carebridge.com",
            first_name="System",
            last_name="Administrator"
        )
        admin.set_password("admin123")
        db.add(admin)
        print("   ✅ Admin: admin@carebridge.com / admin123")

        # Create demo doctor
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
        print("   ✅ Doctor: doctor@carebridge.com / doctor123")

        # Commit to get doctor ID
        db.commit()
        
        # Create demo patient (linked to doctor)
        patient = Patient(
            firebase_uid="patient_demo_uid",
            email="patient@carebridge.com",
            first_name="John",
            last_name="Smith",
            phone="555-0123",
            emergency_contact="Jane Smith",
            emergency_phone="555-0124",
            doctor_id=doctor.id
        )
        patient.set_password("patient123")
        db.add(patient)
        print("   ✅ Patient: patient@carebridge.com / patient123")

        # Final commit
        db.commit()
        db.close()
        
        print("\n🎉 DATABASE SETUP COMPLETE!")
        print("\n📋 Demo Credentials:")
        print("👑 Admin:   admin@carebridge.com   / admin123")
        print("👨‍⚕️ Doctor:  doctor@carebridge.com  / doctor123") 
        print("🏥 Patient: patient@carebridge.com / patient123")
        print("\n✅ You can now login with any of these accounts!")
        print("✅ Admin can create new users from the dashboard!")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        return False
    
    return True

if __name__ == "__main__":
    setup_database()
