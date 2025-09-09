from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db
import uvicorn

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(
    title="CareBridge API", 
    version="1.0.0",
    description="AI-Powered Mental Health Platform API"
)

# CORS middleware
import os
from dotenv import load_dotenv

load_dotenv()

# Get frontend URL from environment or use default for development
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Configure CORS based on environment
if ENVIRONMENT == "production":
    allowed_origins = [FRONTEND_URL, "https://*.vercel.app"]
else:
    allowed_origins = ["*"]  # Allow all origins for development

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "CareBridge API", "status": "running"}

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}

# Include routers
from routers import doctors, patients, admin, auth, safety, patient_safety, websocket, compliance
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(doctors.router, prefix="/api/v1/doctor", tags=["doctor"])
app.include_router(patients.router, prefix="/api/v1/patient", tags=["patient"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(safety.router, tags=["safety"])
app.include_router(patient_safety.router, tags=["patient-safety"])
app.include_router(websocket.router, tags=["websocket"])
app.include_router(compliance.router, tags=["compliance"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)