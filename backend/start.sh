#!/bin/bash

# Set up the database
echo "🔄 Setting up database..."
python setup_database.py

# Start the application
echo "🚀 Starting CareBridge API..."
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
