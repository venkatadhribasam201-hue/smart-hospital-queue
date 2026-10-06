from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.lab_test import LabTest
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.consultation import Consultation
from app.models.notification import Notification
from app.schemas.lab_test import LabTestCreate


router = APIRouter(
    prefix="/lab-tests",
    tags=["Lab Tests"]
)


@router.post("/")
def create_lab_test(
    lab_test_data: LabTestCreate,
    db: Session = Depends(get_db)
):

    # Check patient
    patient = db.query(Patient).filter(
        Patient.id == lab_test_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Check doctor
    doctor = db.query(Doctor).filter(
        Doctor.id == lab_test_data.doctor_id
    ).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # Check consultation if provided
    if lab_test_data.consultation_id is not None:

        consultation = db.query(Consultation).filter(
            Consultation.id == lab_test_data.consultation_id
        ).first()

        if not consultation:
            raise HTTPException(
                status_code=404,
                detail="Consultation not found"
            )

    # Create lab test
    new_lab_test = LabTest(
        patient_id=lab_test_data.patient_id,
        doctor_id=lab_test_data.doctor_id,
        consultation_id=lab_test_data.consultation_id,
        test_name=lab_test_data.test_name,
        test_description=lab_test_data.test_description,
        status=lab_test_data.status
    )

    db.add(new_lab_test)
    db.commit()
    db.refresh(new_lab_test)

    # Create automatic notification
    notification = Notification(
        user_id=patient.user_id,
        title="Lab Test Requested",
        message=(
            "A new lab test has been requested by your doctor. "
            "Please check your lab test details."
        ),
        notification_type="lab_test",
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Lab test created successfully",
        "lab_test_id": new_lab_test.id,
        "patient_id": new_lab_test.patient_id,
        "doctor_id": new_lab_test.doctor_id,
        "consultation_id": new_lab_test.consultation_id,
        "test_name": new_lab_test.test_name,
        "test_description": new_lab_test.test_description,
        "status": new_lab_test.status,
        "requested_at": new_lab_test.requested_at,
        "notification": "Lab test notification created",
        "notification_id": notification.id
    }


@router.get("/")
def get_lab_tests(
    db: Session = Depends(get_db)
):

    lab_tests = db.query(
        LabTest
    ).order_by(
        LabTest.id
    ).all()

    return [
        {
            "id": lab_test.id,
            "patient_id": lab_test.patient_id,
            "doctor_id": lab_test.doctor_id,
            "consultation_id": lab_test.consultation_id,
            "test_name": lab_test.test_name,
            "test_description": lab_test.test_description,
            "status": lab_test.status,
            "requested_at": lab_test.requested_at
        }
        for lab_test in lab_tests
    ]


@router.get("/{lab_test_id}")
def get_lab_test(
    lab_test_id: int,
    db: Session = Depends(get_db)
):

    lab_test = db.query(
        LabTest
    ).filter(
        LabTest.id == lab_test_id
    ).first()

    if not lab_test:
        raise HTTPException(
            status_code=404,
            detail="Lab test not found"
        )

    return {
        "id": lab_test.id,
        "patient_id": lab_test.patient_id,
        "doctor_id": lab_test.doctor_id,
        "consultation_id": lab_test.consultation_id,
        "test_name": lab_test.test_name,
        "test_description": lab_test.test_description,
        "status": lab_test.status,
        "requested_at": lab_test.requested_at
    }