# CareBridge PowerShell Deployment Script
Write-Host "🚀 CareBridge - Starting Application" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check Python
Write-Host "🔍 Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "🔍 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

# Backend Setup
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location backend

# Install dependencies
pip install -r requirements_minimal.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Seed database
python seed_admin_data.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database seeded" -ForegroundColor Green

# Start backend
Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python main.py"

# Wait for backend to start
Start-Sleep -Seconds 3

# Frontend Setup
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location ../frontend

# Install dependencies
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Start frontend
Write-Host "🚀 Starting frontend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Wait for frontend to start
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🎉 CareBridge is now running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 Admin Console: http://localhost:3000/admin" -ForegroundColor Yellow
Write-Host "👨‍⚕️ Doctor Dashboard: http://localhost:3000/doctor/dashboard" -ForegroundColor Yellow
Write-Host "👥 Patient Portal: http://localhost:3000/patient" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
