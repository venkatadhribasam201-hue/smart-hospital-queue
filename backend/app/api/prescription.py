from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.prescription import Prescription
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.consultation import Consultation
from app.models.notification import Notification
from app.schemas.prescription import PrescriptionCreate


router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescriptions"]
)


@router.post("/")
def create_prescription(
    prescription_data: PrescriptionCreate,
    db: Session = Depends(get_db)
):

    # Check patient
    patient = db.query(Patient).filter(
        Patient.id == prescription_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Check doctor
    doctor = db.query(Doctor).filter(
        Doctor.id == prescription_data.doctor_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # Check consultation
    consultation = db.query(Consultation).filter(
        Consultation.id == prescription_data.consultation_id
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=404,
            detail="Consultation not found"
        )

    # Create prescription
    new_prescription = Prescription(
        patient_id=prescription_data.patient_id,
        doctor_id=prescription_data.doctor_id,
        consultation_id=prescription_data.consultation_id,
        medicine_name=prescription_data.medicine_name,
        dosage=prescription_data.dosage,
        frequency=prescription_data.frequency,
        duration=prescription_data.duration,
        instructions=prescription_data.instructions
    )

    db.add(new_prescription)
    db.commit()
    db.refresh(new_prescription)

    # Create automatic notification
    notification = Notification(
        user_id=patient.user_id,
        title="Prescription Added",
        message=(
            "Your doctor has added a new prescription. "
            "Please check your prescription details."
        ),
        notification_type="prescription",
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Prescription created successfully",
        "prescription_id": new_prescription.id,
        "patient_id": new_prescription.patient_id,
        "doctor_id": new_prescription.doctor_id,
        "consultation_id": new_prescription.consultation_id,
        "medicine_name": new_prescription.medicine_name,
        "dosage": new_prescription.dosage,
        "frequency": new_prescription.frequency,
        "duration": new_prescription.duration,
        "instructions": new_prescription.instructions,
        "prescribed_at": new_prescription.prescribed_at,
        "notification": "Prescription notification created",
        "notification_id": notification.id
    }


@router.get("/")
def get_prescriptions(
    db: Session = Depends(get_db)
):

    prescriptions = db.query(
        Prescription
    ).order_by(
        Prescription.id
    ).all()

    return [
        {
            "id": prescription.id,
            "patient_id": prescription.patient_id,
            "doctor_id": prescription.doctor_id,
            "consultation_id": prescription.consultation_id,
            "medicine_name": prescription.medicine_name,
            "dosage": prescription.dosage,
            "frequency": prescription.frequency,
            "duration": prescription.duration,
            "instructions": prescription.instructions,
            "prescribed_at": prescription.prescribed_at
        }
        for prescription in prescriptions
    ]


@router.get("/{prescription_id}")
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db)
):

    prescription = db.query(
        Prescription
    ).filter(
        Prescription.id == prescription_id
    ).first()

    if not prescription:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    return {
        "id": prescription.id,
        "patient_id": prescription.patient_id,
        "doctor_id": prescription.doctor_id,
        "consultation_id": prescription.consultation_id,
        "medicine_name": prescription.medicine_name,
        "dosage": prescription.dosage,
        "frequency": prescription.frequency,
        "duration": prescription.duration,
        "instructions": prescription.instructions,
        "prescribed_at": prescription.prescribed_at
    }