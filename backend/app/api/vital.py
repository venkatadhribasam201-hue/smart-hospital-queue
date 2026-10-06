from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.database import get_db
from app.models.vital import Vital
from app.models.patient import Patient
from app.models.notification import Notification
from app.schemas.vital import VitalCreate


router = APIRouter(
    prefix="/vitals",
    tags=["Vitals"]
)


# ==============================
# ADD VITALS
# ==============================
@router.post("/")
def create_vital(
    vital_data: VitalCreate,
    db: Session = Depends(get_db)
):

    # Check patient
    patient = (
        db.query(Patient)
        .filter(Patient.id == vital_data.patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Create vital record
    new_vital = Vital(
        patient_id=vital_data.patient_id,
        temperature=vital_data.temperature,
        blood_pressure=vital_data.blood_pressure,
        heart_rate=vital_data.heart_rate,
        oxygen_level=vital_data.oxygen_level,
        recorded_at=datetime.utcnow()
    )

    db.add(new_vital)
    db.commit()
    db.refresh(new_vital)

    # Create automatic notification
    notification = Notification(
        user_id=patient.user_id,
        title="Vitals Recorded",
        message=(
            "Your latest vital signs have been recorded successfully. "
            "Please check your health details."
        ),
        notification_type="vitals",
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Vitals recorded successfully",
        "vital_id": new_vital.id,
        "patient_id": new_vital.patient_id,
        "temperature": new_vital.temperature,
        "blood_pressure": new_vital.blood_pressure,
        "heart_rate": new_vital.heart_rate,
        "oxygen_level": new_vital.oxygen_level,
        "recorded_at": new_vital.recorded_at,
        "notification": "Vitals notification created",
        "notification_id": notification.id
    }


# ==============================
# GET ALL VITALS
# ==============================
@router.get("/")
def get_vitals(
    db: Session = Depends(get_db)
):

    vitals = (
        db.query(Vital)
        .order_by(Vital.id)
        .all()
    )

    return [
        {
            "id": vital.id,
            "patient_id": vital.patient_id,
            "temperature": vital.temperature,
            "blood_pressure": vital.blood_pressure,
            "heart_rate": vital.heart_rate,
            "oxygen_level": vital.oxygen_level,
            "recorded_at": vital.recorded_at
        }
        for vital in vitals
    ]


# ==============================
# GET PATIENT VITALS
# ==============================
@router.get("/patient/{patient_id}")
def get_patient_vitals(
    patient_id: int,
    db: Session = Depends(get_db)
):

    # Check patient
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    vitals = (
        db.query(Vital)
        .filter(Vital.patient_id == patient_id)
        .order_by(Vital.id.desc())
        .all()
    )

    return [
        {
            "id": vital.id,
            "patient_id": vital.patient_id,
            "temperature": vital.temperature,
            "blood_pressure": vital.blood_pressure,
            "heart_rate": vital.heart_rate,
            "oxygen_level": vital.oxygen_level,
            "recorded_at": vital.recorded_at
        }
        for vital in vitals
    ]