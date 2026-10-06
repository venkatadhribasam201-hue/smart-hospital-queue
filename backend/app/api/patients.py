from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientProfileCreate


router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.post("/profile")
def create_patient_profile(
    patient_data: PatientProfileCreate,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == patient_data.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_patient = (
        db.query(Patient)
        .filter(Patient.user_id == patient_data.user_id)
        .first()
    )

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient profile already exists"
        )

    new_patient = Patient(
        user_id=patient_data.user_id,
        date_of_birth=patient_data.date_of_birth,
        gender=patient_data.gender,
        blood_group=patient_data.blood_group,
        address=patient_data.address,
        emergency_contact=patient_data.emergency_contact
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "message": "Patient profile created successfully",
        "patient_id": new_patient.id,
        "user_id": new_patient.user_id
    }


@router.get("/profile/{user_id}")
def get_patient_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    patient = (
        db.query(Patient)
        .filter(Patient.user_id == user_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    return {
        "patient_id": patient.id,
        "user_id": patient.user_id,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "blood_group": patient.blood_group,
        "address": patient.address,
        "emergency_contact": patient.emergency_contact
    }