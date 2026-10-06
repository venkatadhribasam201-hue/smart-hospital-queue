
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.consultation import Consultation
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.appointment import Appointment
from app.models.notification import Notification
from app.schemas.consultation import ConsultationCreate


router = APIRouter(
    prefix="/consultations",
    tags=["Consultations"]
)


@router.post("/")
def create_consultation(
    consultation_data: ConsultationCreate,
    db: Session = Depends(get_db)
):

    # =========================
    # CHECK PATIENT
    # =========================

    patient = db.query(Patient).filter(
        Patient.id == consultation_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # =========================
    # CHECK DOCTOR
    # =========================

    doctor = db.query(Doctor).filter(
        Doctor.id == consultation_data.doctor_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # =========================
    # CHECK APPOINTMENT
    # =========================

    appointment = db.query(Appointment).filter(
        Appointment.id == consultation_data.appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    # =========================
    # CREATE CONSULTATION
    # =========================

    new_consultation = Consultation(
        patient_id=consultation_data.patient_id,
        doctor_id=consultation_data.doctor_id,
        appointment_id=consultation_data.appointment_id,
        symptoms=consultation_data.symptoms,
        diagnosis=consultation_data.diagnosis,
        notes=consultation_data.notes
    )

    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)

    # =========================
    # CREATE NOTIFICATION
    # =========================

    try:

        notification = Notification(
            user_id=patient.user_id,
            title="Consultation Completed",
            message=(
                "Your doctor consultation has been completed successfully. "
                "Your diagnosis and consultation details are now available."
            ),
            notification_type="consultation",
            is_read=False
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

    except Exception as notification_error:

        print(
            "Notification creation error:",
            notification_error
        )

        db.rollback()

    # =========================
    # RESPONSE
    # =========================

    return {
        "message": "Consultation created successfully",
        "consultation_id": new_consultation.id,
        "patient_id": new_consultation.patient_id,
        "doctor_id": new_consultation.doctor_id,
        "appointment_id": new_consultation.appointment_id,
        "symptoms": new_consultation.symptoms,
        "diagnosis": new_consultation.diagnosis,
        "notes": new_consultation.notes,
        "notification": "Consultation notification created"
    }


@router.get("/")
def get_consultations(
    db: Session = Depends(get_db)
):

    consultations = db.query(
        Consultation
    ).order_by(
        Consultation.id
    ).all()

    return [
        {
            "id": consultation.id,
            "patient_id": consultation.patient_id,
            "doctor_id": consultation.doctor_id,
            "appointment_id": consultation.appointment_id,
            "symptoms": consultation.symptoms,
            "diagnosis": consultation.diagnosis,
            "notes": consultation.notes,
            "consultation_date": consultation.consultation_date
        }
        for consultation in consultations
    ]


@router.get("/{consultation_id}")
def get_consultation(
    consultation_id: int,
    db: Session = Depends(get_db)
):

    consultation = db.query(
        Consultation
    ).filter(
        Consultation.id == consultation_id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )

    return {
        "id": consultation.id,
        "patient_id": consultation.patient_id,
        "doctor_id": consultation.doctor_id,
        "appointment_id": consultation.appointment_id,
        "symptoms": consultation.symptoms,
        "diagnosis": consultation.diagnosis,
        "notes": consultation.notes,
        "consultation_date": consultation.consultation_date
    }
