@echo off
echo 🚀 CareBridge Deployment Script
echo ========================================

echo 🔍 Checking requirements...

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python found

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
)
echo ✅ Node.js found

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install npm
    pause
    exit /b 1
)
echo ✅ npm found

echo.
echo 📦 Installing backend dependencies...
cd backend

:: Try minimal requirements first
if exist requirements_minimal.txt (
    pip install -r requirements_minimal.txt
    if %errorlevel% equ 0 (
        echo ✅ Backend dependencies installed (minimal)
        goto :seed_db
    )
)

:: Try simplified requirements second
if exist requirements_simple.txt (
    pip install -r requirements_simple.txt
    if %errorlevel% equ 0 (
        echo ✅ Backend dependencies installed (simplified)
        goto :seed_db
    )
)

:: Fallback to full requirements
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    echo 💡 Try installing Rust from https://rustup.rs/
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

:seed_db
echo.
echo 🌱 Seeding database...
python seed_admin_data.py
if %errorlevel% neq 0 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)
echo ✅ Database seeded successfully

echo.
echo 🚀 Starting backend server...
start "Backend Server" cmd /k "python main.py"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

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

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

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
