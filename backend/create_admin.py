#!/usr/bin/env python3
"""
Create Admin User Script
Creates the initial admin user for CareBridge
"""

from sqlalchemy.orm import sessionmaker
from models import Admin, Base
from database import engine
import sys

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def create_admin():
    """Create initial admin user"""
    try:
        print("🔐 Creating admin user...")
        
        # Check if admin already exists
        existing_admin = db.query(Admin).filter(Admin.email == "admin@carebridge.com").first()
        if existing_admin:
            print("❌ Admin user already exists!")
            return
        
        # Create admin user
        admin = Admin(
            email="admin@carebridge.com",
            first_name="System",
            last_name="Administrator"
        )
        admin.set_password("admin123")  # Default password
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"   Email: admin@carebridge.com")
        print(f"   Password: admin123")
        print(f"   Admin ID: {admin.id}")
        print("\n⚠️  IMPORTANT: Change the default password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
