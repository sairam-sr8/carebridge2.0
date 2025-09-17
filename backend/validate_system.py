"""
CareBridge System Validator - Complete Architecture Test
Tests the entire mental health platform end-to-end
"""

import requests
import json
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Admin, Doctor, Patient, TriageAssessment, TriageItem, Appointment

class CareBridgeValidator:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.admin_token = None
        self.doctor_token = None
        self.patient_token = None
        self.test_assessment_id = None
        
    def validate_database(self):
        """Validate database structure and demo data"""
        print("🔍 VALIDATING DATABASE STRUCTURE")
        print("=" * 50)
        
        try:
            db = SessionLocal()
            
            # Check core tables
            admin_count = db.query(Admin).count()
            doctor_count = db.query(Doctor).count()
            patient_count = db.query(Patient).count()
            
            print(f"✅ Database connected")
            print(f"📊 Admins: {admin_count}, Doctors: {doctor_count}, Patients: {patient_count}")
            
            # Validate demo users
            admin = db.query(Admin).filter(Admin.email == "admin@carebridge.com").first()
            doctor = db.query(Doctor).filter(Doctor.email == "doctor@carebridge.com").first()
            patient = db.query(Patient).filter(Patient.email == "patient@carebridge.com").first()
            
            results = {
                'admin_exists': admin is not None,
                'doctor_exists': doctor is not None,
                'patient_exists': patient is not None,
                'admin_password': admin.password_hash is not None if admin else False,
                'doctor_password': doctor.password_hash is not None if doctor else False,
                'patient_password': patient.password_hash is not None if patient else False
            }
            
            for key, value in results.items():
                status = "✅" if value else "❌"
                print(f"   {key}: {status}")
            
            db.close()
            return all(results.values())
            
        except Exception as e:
            print(f"❌ Database validation failed: {e}")
            return False
    
    def validate_authentication(self):
        """Validate all user authentication"""
        print("\n🔍 VALIDATING AUTHENTICATION SYSTEM")
        print("=" * 50)
        
        credentials = [
            ("admin", "admin@carebridge.com", "admin123"),
            ("doctor", "doctor@carebridge.com", "doctor123"),
            ("patient", "patient@carebridge.com", "patient123")
        ]
        
        tokens = {}
        all_passed = True
        
        for user_type, email, password in credentials:
            try:
                print(f"🔐 Testing {user_type} login...")
                response = requests.post(
                    f"{self.base_url}/api/v1/auth/login",
                    json={"email": email, "password": password},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    tokens[user_type] = data.get('access_token')
                    print(f"   ✅ {user_type} login SUCCESS")
                    print(f"   📧 Email: {data.get('email')}")
                    print(f"   🎭 Type: {data.get('user_type')}")
                else:
                    print(f"   ❌ {user_type} login FAILED: {response.status_code}")
                    print(f"   Error: {response.text}")
                    all_passed = False
                    
            except Exception as e:
                print(f"   ❌ {user_type} login ERROR: {e}")
                all_passed = False
        
        self.admin_token = tokens.get('admin')
        self.doctor_token = tokens.get('doctor')
        self.patient_token = tokens.get('patient')
        
        return all_passed
    
    def validate_triage_chatbot(self):
        """Validate complete triage chatbot flow"""
        print("\n🔍 VALIDATING AI TRIAGE CHATBOT (Dr. Sarah)")
        print("=" * 50)
        
        try:
            # Test 1: Get triage flow
            print("📋 Testing triage flow structure...")
            response = requests.get(f"{self.base_url}/api/v1/triage/flow", timeout=10)
            if response.status_code == 200:
                flow = response.json()
                steps = flow.get('steps', [])
                print(f"   ✅ Triage flow loaded - {len(steps)} questions")
                
                # Validate question structure
                required_questions = ['mood', 'interest', 'worry_general', 'stress_overwhelm', 
                                    'sleep_quality', 'energy', 'social', 'safety']
                found_questions = [step.get('id') for step in steps]
                
                missing = set(required_questions) - set(found_questions)
                if not missing:
                    print(f"   ✅ All 8 required questions present")
                else:
                    print(f"   ❌ Missing questions: {missing}")
                    return False
            else:
                print(f"   ❌ Triage flow failed: {response.status_code}")
                return False
            
            # Test 2: Submit assessment with Gemini AI
            print("🤖 Testing Gemini Flash 2.0 assessment...")
            test_answers = {
                "mood": 2, "interest": 2, "worry_general": 1, "stress_overwhelm": 2,
                "sleep_quality": 2, "energy": 2, "social": 1, "safety": 0
            }
            
            assessment_data = {
                "answers": test_answers,
                "patient_name": "Test Patient",
                "patient_email": "validator@test.com"
            }
            
            response = requests.post(
                f"{self.base_url}/api/v1/triage/assess",
                json=assessment_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.test_assessment_id = result.get('assessment_id')
                
                print(f"   ✅ Assessment completed - ID: {self.test_assessment_id}")
                print(f"   🤖 Gemini Success: {result.get('gemini_success')}")
                print(f"   🚨 Urgent Flag: {result.get('urgent')}")
                print(f"   📊 Severity: {result.get('overall_severity')}")
                
                if result.get('ai_insights'):
                    print(f"   💬 AI Insights: {result.get('ai_insights')[:80]}...")
                    
                return True
            else:
                print(f"   ❌ Assessment failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Triage validation error: {e}")
            return False
    
    def validate_doctor_assignment(self):
        """Validate AI-powered doctor assignment"""
        print("\n🔍 VALIDATING DOCTOR ASSIGNMENT")
        print("=" * 50)
        
        if not self.test_assessment_id:
            print("❌ No assessment ID available")
            return False
        
        try:
            print("👨‍⚕️ Testing AI doctor matching...")
            response = requests.post(
                f"{self.base_url}/api/v1/triage/assign-doctor",
                json={"assessment_id": self.test_assessment_id},
                headers={"Content-Type": "application/json"},
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Doctor assignment SUCCESS")
                print(f"   👨‍⚕️ Doctor: {result.get('doctor_name')}")
                print(f"   🏥 Specialization: {result.get('doctor_specialization')}")
                print(f"   🏢 Hospital: {result.get('hospital_name')}")
                print(f"   📅 Appointment: {result.get('appointment_time')}")
                return True
            else:
                print(f"   ❌ Doctor assignment FAILED: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Doctor assignment error: {e}")
            return False
    
    def validate_admin_dashboard(self):
        """Validate admin dashboard functionality"""
        print("\n🔍 VALIDATING ADMIN DASHBOARD")
        print("=" * 50)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test dashboard stats
            print("📊 Testing dashboard stats...")
            response = requests.get(f"{self.base_url}/api/v1/admin/dashboard", headers=headers)
            if response.status_code == 200:
                stats = response.json().get('stats', {})
                print(f"   ✅ Dashboard accessible")
                print(f"   📈 Stats: {stats}")
            else:
                print(f"   ❌ Dashboard failed: {response.status_code}")
                return False
            
            # Test triage assessments
            print("🧪 Testing triage assessments...")
            response = requests.get(f"{self.base_url}/api/v1/triage/admin/assessments", headers=headers)
            if response.status_code == 200:
                data = response.json()
                assessments = data.get('assessments', [])
                print(f"   ✅ Triage assessments accessible - {len(assessments)} found")
                
                if assessments:
                    latest = assessments[0]
                    print(f"   📋 Latest: {latest.get('patient_name')} - {latest.get('severity_level')}")
                
                return True
            else:
                print(f"   ❌ Triage assessments failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Admin dashboard error: {e}")
            return False
    
    def validate_doctor_dashboard(self):
        """Validate doctor dashboard functionality"""
        print("\n🔍 VALIDATING DOCTOR DASHBOARD")
        print("=" * 50)
        
        if not self.doctor_token:
            print("❌ No doctor token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.doctor_token}"}
            
            print("👨‍⚕️ Testing doctor dashboard...")
            response = requests.get(f"{self.base_url}/api/v1/doctor/dashboard", headers=headers)
            if response.status_code == 200:
                data = response.json()
                stats = data.get('stats', {})
                triage_items = data.get('triage_items', [])
                
                print(f"   ✅ Doctor dashboard accessible")
                print(f"   📊 Stats: {stats}")
                print(f"   📋 Triage items: {len(triage_items)}")
                
                return True
            else:
                print(f"   ❌ Doctor dashboard failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Doctor dashboard error: {e}")
            return False
    
    def run_complete_validation(self):
        """Run complete system validation"""
        print("🚀 CAREBRIDGE COMPLETE SYSTEM VALIDATION")
        print("=" * 60)
        print(f"🕐 Validation started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        tests = [
            ("Database Structure", self.validate_database),
            ("Authentication System", self.validate_authentication),
            ("AI Triage Chatbot", self.validate_triage_chatbot),
            ("Doctor Assignment", self.validate_doctor_assignment),
            ("Admin Dashboard", self.validate_admin_dashboard),
            ("Doctor Dashboard", self.validate_doctor_dashboard)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ {test_name} validation crashed: {e}")
                results[test_name] = False
        
        # Final Report
        print("\n📋 COMPLETE VALIDATION REPORT")
        print("=" * 50)
        
        for test_name, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{test_name.upper()}: {status}")
        
        passed_count = sum(results.values())
        total_count = len(results)
        
        print(f"\n🎯 OVERALL SCORE: {passed_count}/{total_count}")
        
        if passed_count == total_count:
            print("🎉 CAREBRIDGE SYSTEM FULLY OPERATIONAL!")
            print("🚀 Ready for production deployment!")
        else:
            print("⚠️ Issues found - system needs attention")
            
            # Specific guidance
            if not results.get("Database Structure"):
                print("💡 Run: python setup_database.py")
            if not results.get("Authentication System"):
                print("💡 Check: Backend server running on port 8000")
            if not results.get("AI Triage Chatbot"):
                print("💡 Check: Gemini API key and internet connection")
        
        return results

if __name__ == "__main__":
    validator = CareBridgeValidator()
    validator.run_complete_validation()
