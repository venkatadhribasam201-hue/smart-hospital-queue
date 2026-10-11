
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import engine, Base


# =========================
# MODELS
# =========================

from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.appointment import Appointment
from app.models.queue import QueueToken
from app.models.vital import Vital
from app.models.consultation import Consultation
from app.models.prescription import Prescription
from app.models.lab_test import LabTest
from app.models.lab_report import LabReport
from app.models.medicine import Medicine
from app.models.notification import Notification
from app.models.hospital import Hospital


# =========================
# API ROUTERS
# =========================

from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.department import router as departments_router
from app.api.doctors import router as doctors_router
from app.api.appointments import router as appointments_router
from app.api.queue import router as queue_router
from app.api.vital import router as vital_router
from app.api.consultation import router as consultation_router
from app.api.prescription import router as prescription_router
from app.api.lab_test import router as lab_test_router
from app.api.lab_report import router as lab_report_router
from app.api.medicine import router as medicine_router
from app.api.notification import router as notification_router
from app.api.prediction import router as prediction_router
from app.api.hospital import router as hospitals_router


# =========================
# FASTAPI APPLICATION
# =========================

app = FastAPI(
    title="Smart Hospital Queue Management System",
    description=(
        "AI-Driven Smart Hospital Queue Management "
        "and Waiting Time Prediction System"
    ),
    version="1.0.0",
)


# =========================
# CORS CONFIGURATION
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:5173",
        "http://127.0.0.1:5173",

        # Local network development
        "http://10.157.76.151:5173",

        # Development tunnel
        "https://nw48n1b1-5173.inc1.devtunnels.ms",

        # Existing deployed frontend
        "https://smart-hospital-frontend-n63y.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# CREATE DATABASE TABLES
# =========================

Base.metadata.create_all(bind=engine)


# =========================
# DATABASE COLUMN UPDATES
# =========================

with engine.begin() as connection:

    # Add hospital_name column to doctors table if missing
    connection.execute(
        text(
            "ALTER TABLE doctors "
            "ADD COLUMN IF NOT EXISTS hospital_name VARCHAR"
        )
    )

    # Add image_url column to hospitals table if missing
    connection.execute(
        text(
            "ALTER TABLE hospitals "
            "ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)"
        )
    )


# =========================
# INCLUDE API ROUTERS
# =========================

app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(departments_router)
app.include_router(doctors_router)
app.include_router(appointments_router)
app.include_router(queue_router)
app.include_router(vital_router)
app.include_router(consultation_router)
app.include_router(prescription_router)
app.include_router(lab_test_router)
app.include_router(lab_report_router)
app.include_router(medicine_router)
app.include_router(notification_router)
app.include_router(prediction_router)
app.include_router(hospitals_router)


# =========================
# ROOT API
# =========================

@app.get("/")
def root():
    return {
        "message": "Smart Hospital API is running",
        "status": "success",
    }


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as e:
        print("HEALTH CHECK ERROR:", repr(e))

        return {
            "status": "unhealthy",
            "database": "connection failed",
        }
