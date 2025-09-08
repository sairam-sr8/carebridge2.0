#!/usr/bin/env python3
"""
CareBridge Deployment Script
This script helps deploy the CareBridge application
"""

import subprocess
import sys
import os
import time

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_requirements():
    """Check if all requirements are installed"""
    print("🔍 Checking requirements...")
    
    # Check Python
    success, output = run_command("python --version")
    if not success:
        print("❌ Python not found. Please install Python 3.8+")
        return False
    print(f"✅ Python: {output.strip()}")
    
    # Check Python version compatibility
    success, output = run_command("python check_python_version.py", cwd="backend")
    if not success:
        print("❌ Python version compatibility check failed")
        print("💡 Try using Python 3.11 or 3.12 for best compatibility")
        return False
    
    # Check Node.js
    success, output = run_command("node --version")
    if not success:
        print("❌ Node.js not found. Please install Node.js 16+")
        return False
    print(f"✅ Node.js: {output.strip()}")
    
    # Check npm
    success, output = run_command("npm --version")
    if not success:
        print("❌ npm not found. Please install npm")
        return False
    print(f"✅ npm: {output.strip()}")
    
    return True

def install_backend_dependencies():
    """Install backend dependencies"""
    print("📦 Installing backend dependencies...")
    
    # Try minimal requirements first
    if os.path.exists("backend/requirements_minimal.txt"):
        success, output = run_command("pip install -r requirements_minimal.txt", cwd="backend")
        if success:
            print("✅ Backend dependencies installed (minimal)")
            return True
    
    # Try simplified requirements second
    if os.path.exists("backend/requirements_simple.txt"):
        success, output = run_command("pip install -r requirements_simple.txt", cwd="backend")
        if success:
            print("✅ Backend dependencies installed (simplified)")
            return True
    
    # Fallback to full requirements
    if not os.path.exists("backend/requirements.txt"):
        print("❌ requirements.txt not found in backend directory")
        return False
    
    success, output = run_command("pip install -r requirements.txt", cwd="backend")
    if not success:
        print(f"❌ Failed to install backend dependencies: {output}")
        print("💡 Try installing Rust from https://rustup.rs/ or use requirements_simple.txt")
        return False
    
    print("✅ Backend dependencies installed")
    return True

def install_frontend_dependencies():
    """Install frontend dependencies"""
    print("📦 Installing frontend dependencies...")
    
    if not os.path.exists("frontend/package.json"):
        print("❌ package.json not found in frontend directory")
        return False
    
    success, output = run_command("npm install", cwd="frontend")
    if not success:
        print(f"❌ Failed to install frontend dependencies: {output}")
        return False
    
    print("✅ Frontend dependencies installed")
    return True

def seed_database():
    """Seed the database with initial data"""
    print("🌱 Seeding database...")
    
    success, output = run_command("python seed_admin_data.py", cwd="backend")
    if not success:
        print(f"❌ Failed to seed database: {output}")
        return False
    
    print("✅ Database seeded successfully")
    return True

def start_backend():
    """Start the backend server"""
    print("🚀 Starting backend server...")
    
    # Start backend in background
    backend_process = subprocess.Popen(
        ["python", "main.py"],
        cwd="backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait a moment for server to start
    time.sleep(3)
    
    # Check if server is running
    success, output = run_command("curl -s http://localhost:8000/api/v1/health")
    if not success:
        print("❌ Backend server failed to start")
        return False, None
    
    print("✅ Backend server started on http://localhost:8000")
    return True, backend_process

def start_frontend():
    """Start the frontend server"""
    print("🚀 Starting frontend server...")
    
    # Start frontend in background
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd="frontend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait a moment for server to start
    time.sleep(5)
    
    print("✅ Frontend server started on http://localhost:3000")
    return True, frontend_process

def main():
    """Main deployment function"""
    print("🚀 CareBridge Deployment Script")
    print("=" * 40)
    
    # Check requirements
    if not check_requirements():
        print("❌ Requirements check failed. Please install missing dependencies.")
        sys.exit(1)
    
    # Install dependencies
    if not install_backend_dependencies():
        print("❌ Backend dependency installation failed.")
        sys.exit(1)
    
    if not install_frontend_dependencies():
        print("❌ Frontend dependency installation failed.")
        sys.exit(1)
    
    # Seed database
    if not seed_database():
        print("❌ Database seeding failed.")
        sys.exit(1)
    
    # Start servers
    backend_success, backend_process = start_backend()
    if not backend_success:
        print("❌ Backend startup failed.")
        sys.exit(1)
    
    frontend_success, frontend_process = start_frontend()
    if not frontend_success:
        print("❌ Frontend startup failed.")
        backend_process.terminate()
        sys.exit(1)
    
    print("\n🎉 CareBridge is now running!")
    print("=" * 40)
    print("📱 Frontend: http://localhost:3000")
    print("🔧 Backend API: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("\n🔑 Admin Console: http://localhost:3000/admin")
    print("👨‍⚕️ Doctor Dashboard: http://localhost:3000/doctor/dashboard")
    print("👥 Patient Portal: http://localhost:3000/patient")
    print("\nPress Ctrl+C to stop all servers")
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        print("✅ Servers stopped")

if __name__ == "__main__":
    main()
