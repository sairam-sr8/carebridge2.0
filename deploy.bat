@echo off
echo 🚀 Deploying CareBridge to Production...

REM Backend setup
echo 📦 Setting up backend...
cd backend
python -m venv .venv
call .venv\Scripts\activate
pip install -r requirements.txt

REM Create database
python setup_database.py

REM Start backend
echo 🔧 Starting backend server...
start uvicorn main:app --host 0.0.0.0 --port 8000

REM Frontend setup
echo 📦 Setting up frontend...
cd ..\frontend
npm install
npm run build

REM Start frontend
echo 🔧 Starting frontend server...
start npm run preview

echo ✅ CareBridge deployed successfully!
echo 🌐 Backend: http://localhost:8000
echo 🌐 Frontend: http://localhost:3000
pause
