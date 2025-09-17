from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import core routers only
from routers import (
    auth, admin, doctors, patients, triage
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 CareBridge API starting up...")
    yield
    # Shutdown
    print("🛑 CareBridge API shutting down...")

# Create FastAPI app
app = FastAPI(
    title="CareBridge API",
    description="AI-Powered Mental Health Platform",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://carebridge-ruby.vercel.app",
        "https://carebridge-production-3c20.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "service": "CareBridge API",
        "version": "2.0.0"
    }

# Include core API routers - Clean Architecture
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(doctors.router, prefix="/api/v1/doctor", tags=["Doctor"])
app.include_router(patients.router, prefix="/api/v1/patient", tags=["Patient"])
app.include_router(triage.router, prefix="/api/v1/triage", tags=["Triage"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
