@echo off
echo 🚀 CareBridge - Starting Application
echo ========================================

echo 🔍 Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python found

echo 🔍 Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
)
echo ✅ Node.js found

echo.
echo 📦 Installing backend dependencies...
cd backend
pip install -r requirements_minimal.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo.
echo 🌱 Seeding database...
python seed_admin_data.py
if %errorlevel% neq 0 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)
echo ✅ Database seeded

echo.
echo 🚀 Starting backend server...
start "Backend Server" cmd /k "python main.py"

echo.
echo 📦 Installing frontend dependencies...
cd ../frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo 🚀 Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 🎉 CareBridge is now running!
echo ========================================
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo 🔑 Admin Console: http://localhost:3000/admin
echo 👨‍⚕️ Doctor Dashboard: http://localhost:3000/doctor/dashboard
echo 👥 Patient Portal: http://localhost:3000/patient
echo.
echo Press any key to exit...
pause >nul
