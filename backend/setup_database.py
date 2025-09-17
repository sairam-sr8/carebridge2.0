from database import engine, Base
from models import *

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")

def create_demo_data():
    """Create demo users for testing"""
    from sqlalchemy.orm import sessionmaker
    from models import Admin, Doctor, Patient
    import bcrypt
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Create admin
        admin = Admin(
            firebase_uid="admin_demo",
            email="admin@carebridge.com",
            first_name="Admin",
            last_name="User"
        )
        admin.set_password("admin123")
        db.add(admin)
        
        # Create doctor
        doctor = Doctor(
            firebase_uid="doctor_demo",
            email="doctor@carebridge.com",
            first_name="Dr. John",
            last_name="Smith",
            license_number="LIC123456",
            specialization="General Practice"
        )
        doctor.set_password("doctor123")
        db.add(doctor)
        
        # Create patient
        patient = Patient(
            firebase_uid="patient_demo",
            email="patient@carebridge.com",
            first_name="Jane",
            last_name="Doe",
            doctor_id=1
        )
        patient.set_password("patient123")
        db.add(patient)
        
        db.commit()
        print("✅ Demo users created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_tables()
    create_demo_data()
