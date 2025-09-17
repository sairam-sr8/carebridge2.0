#!/bin/bash

echo "🚀 Deploying CareBridge to Production..."

# Backend setup
echo "📦 Setting up backend..."
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Create database
python setup_database.py

# Start backend
echo "🔧 Starting backend server..."
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend
npm install
npm run build

# Start frontend
echo "🔧 Starting frontend server..."
npm run preview &

echo "✅ CareBridge deployed successfully!"
echo "🌐 Backend: http://localhost:8000"
echo "🌐 Frontend: http://localhost:3000"
