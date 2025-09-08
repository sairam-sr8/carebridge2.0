# CareBridge PowerShell Deployment Script
# This script helps deploy the CareBridge application on Windows

Write-Host "🚀 CareBridge Deployment Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check requirements
Write-Host "🔍 Checking requirements..." -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
    
    # Check Python version compatibility
    Set-Location backend
    try {
        python check_python_version.py
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Python version compatibility check failed" -ForegroundColor Red
            Write-Host "💡 Try using Python 3.11 or 3.12 for best compatibility" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "⚠️  Python version compatibility check failed" -ForegroundColor Yellow
        Write-Host "💡 Continuing anyway, but you may encounter issues" -ForegroundColor Yellow
    }
    Set-Location ..
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 16+" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>&1
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend

# Try minimal requirements first
if (Test-Path "requirements_minimal.txt") {
    try {
        pip install -r requirements_minimal.txt
        Write-Host "✅ Backend dependencies installed (minimal)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install minimal dependencies" -ForegroundColor Red
        Write-Host "💡 Trying simplified requirements..." -ForegroundColor Yellow
        
        if (Test-Path "requirements_simple.txt") {
            try {
                pip install -r requirements_simple.txt
                Write-Host "✅ Backend dependencies installed (simplified)" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to install simplified dependencies" -ForegroundColor Red
                Write-Host "💡 Trying full requirements..." -ForegroundColor Yellow
                
                try {
                    pip install -r requirements.txt
                    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
                    Write-Host "💡 Try installing Rust from https://rustup.rs/" -ForegroundColor Yellow
                    exit 1
                }
            }
        } else {
            try {
                pip install -r requirements.txt
                Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
                Write-Host "💡 Try installing Rust from https://rustup.rs/" -ForegroundColor Yellow
                exit 1
            }
        }
    }
} else {
    try {
        pip install -r requirements.txt
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
        Write-Host "💡 Try installing Rust from https://rustup.rs/" -ForegroundColor Yellow
        exit 1
    }
}

# Seed database
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
try {
    python seed_admin_data.py
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python main.py
}

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend server started on http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend server failed to start" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend

try {
    npm install
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Stop-Job $backendJob
    Remove-Job $backendJob
    exit 1
}

# Start frontend server
Write-Host "🚀 Starting frontend server..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

# Wait a moment for server to start
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
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Red

try {
    # Keep the script running
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob
    Stop-Job $frontendJob
    Remove-Job $backendJob
    Remove-Job $frontendJob
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}
