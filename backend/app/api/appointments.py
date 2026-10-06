from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.database.database import get_db
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.department import Department
from app.models.user import User
from app.schemas.appointment import AppointmentCreate

from app.utils.email import send_email


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)


# ==========================================
# Bulk Appointment Schema
# ==========================================

class BulkAppointmentItem(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: str
    reason: str
    status: str = "scheduled"


class BulkAppointmentRequest(BaseModel):
    appointments: List[BulkAppointmentItem]


# ==========================================
# Create Single Appointment
# ==========================================

@router.post("/")
def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db)
):

    # Check patient
    patient = (
        db.query(Patient)
        .filter(
            Patient.id == appointment_data.patient_id
        )
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Check doctor
    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == appointment_data.doctor_id
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # Check department
    department = (
        db.query(Department)
        .filter(
            Department.id == appointment_data.department_id
        )
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    # Create appointment
    new_appointment = Appointment(
        patient_id=appointment_data.patient_id,
        doctor_id=appointment_data.doctor_id,
        department_id=appointment_data.department_id,
        appointment_date=appointment_data.appointment_date,
        reason=appointment_data.reason,
        status=appointment_data.status
    )

    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    # ==========================================
    # Get Patient User
    # ==========================================

    patient_user = (
        db.query(User)
        .filter(
            User.id == patient.user_id
        )
        .first()
    )

    # ==========================================
    # Get Doctor User
    # ==========================================

    doctor_user = (
        db.query(User)
        .filter(
            User.id == doctor.user_id
        )
        .first()
    )

    # ==========================================
    # Doctor Name
    # ==========================================

    doctor_name = (
        doctor_user.full_name
        if doctor_user
        else f"Doctor {doctor.id}"
    )

    # ==========================================
    # Patient Name
    # ==========================================

    patient_name = (
        patient_user.full_name
        if patient_user
        else f"Patient {patient.id}"
    )

    # ==========================================
    # Appointment Email - Patient
    # ==========================================

    if patient_user and patient_user.email:

        try:

            send_email(
                patient_user.email,
                "Smart Hospital - Appointment Confirmed",
                f"""
Hello {patient_name},

Your appointment has been successfully booked.

Appointment Details:

Appointment ID: {new_appointment.id}
Doctor: {doctor_name}
Department: {department.name}
Appointment Date: {new_appointment.appointment_date}
Reason: {new_appointment.reason}
Status: {new_appointment.status}

Please arrive at the hospital on time.

Thank you,
Smart Hospital Team
"""
            )

            print(
                f"Appointment email sent to patient: {patient_user.email}"
            )

        except Exception as email_error:

            print("PATIENT APPOINTMENT EMAIL ERROR:")
            print(repr(email_error))

    # ==========================================
    # Appointment Email - Doctor
    # ==========================================

    if doctor_user and doctor_user.email:

        try:

            send_email(
                doctor_user.email,
                "Smart Hospital - New Appointment",
                f"""
Hello Dr. {doctor_name},

A new patient appointment has been scheduled.

Appointment Details:

Appointment ID: {new_appointment.id}
Patient: {patient_name}
Department: {department.name}
Appointment Date: {new_appointment.appointment_date}
Reason: {new_appointment.reason}
Status: {new_appointment.status}

Please check your Doctor Dashboard for more details.

Thank you,
Smart Hospital Team
"""
            )

            print(
                f"Appointment email sent to doctor: {doctor_user.email}"
            )

        except Exception as email_error:

            print("DOCTOR APPOINTMENT EMAIL ERROR:")
            print(repr(email_error))

    # ==========================================
    # Response
    # ==========================================

    return {
        "message": "Appointment created successfully",
        "appointment_id": new_appointment.id,
        "patient_id": new_appointment.patient_id,
        "doctor_id": new_appointment.doctor_id,
        "department_id": new_appointment.department_id,
        "appointment_date": new_appointment.appointment_date,
        "reason": new_appointment.reason,
        "status": new_appointment.status
    }


# ==========================================
# BULK CREATE APPOINTMENTS
# ==========================================

@router.post("/bulk")
def create_bulk_appointments(
    data: BulkAppointmentRequest,
    db: Session = Depends(get_db)
):

    created_appointments = []
    skipped_appointments = []

    try:

        for item in data.appointments:

            # Check patient
            patient = (
                db.query(Patient)
                .filter(
                    Patient.id == item.patient_id
                )
                .first()
            )

            if not patient:
                skipped_appointments.append({
                    "patient_id": item.patient_id,
                    "doctor_id": item.doctor_id,
                    "reason": "Patient not found"
                })
                continue

            # Check doctor
            doctor = (
                db.query(Doctor)
                .filter(
                    Doctor.id == item.doctor_id
                )
                .first()
            )

            if not doctor:
                skipped_appointments.append({
                    "patient_id": item.patient_id,
                    "doctor_id": item.doctor_id,
                    "reason": "Doctor not found"
                })
                continue

            # Check department
            department = (
                db.query(Department)
                .filter(
                    Department.id == item.department_id
                )
                .first()
            )

            if not department:
                skipped_appointments.append({
                    "patient_id": item.patient_id,
                    "doctor_id": item.doctor_id,
                    "department_id": item.department_id,
                    "reason": "Department not found"
                })
                continue

            # Create appointment
            new_appointment = Appointment(
                patient_id=item.patient_id,
                doctor_id=item.doctor_id,
                department_id=item.department_id,
                appointment_date=item.appointment_date,
                reason=item.reason,
                status=item.status
            )

            db.add(new_appointment)
            db.flush()

            created_appointments.append({
                "appointment_id": new_appointment.id,
                "patient_id": new_appointment.patient_id,
                "doctor_id": new_appointment.doctor_id,
                "department_id": new_appointment.department_id,
                "appointment_date": new_appointment.appointment_date,
                "reason": new_appointment.reason,
                "status": new_appointment.status
            })

        db.commit()

        return {
            "message": "Bulk appointments created successfully",
            "total_created": len(created_appointments),
            "total_skipped": len(skipped_appointments),
            "created_appointments": created_appointments,
            "skipped_appointments": skipped_appointments
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Bulk appointment creation failed: {str(e)}"
        )


# ==========================================
# Get All Appointments
# ==========================================

@router.get("/")
def get_appointments(
    db: Session = Depends(get_db)
):

    appointments = (
        db.query(Appointment)
        .order_by(
            Appointment.appointment_date.asc()
        )
        .all()
    )

    return [
        {
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "doctor_id": appointment.doctor_id,
            "department_id": appointment.department_id,
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "status": appointment.status
        }
        for appointment in appointments
    ]


# ==========================================
# Get Appointments By Doctor ID
# ==========================================

@router.get("/doctor/{doctor_id}")
def get_doctor_appointments(
    doctor_id: int,
    db: Session = Depends(get_db)
):

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id == doctor_id
        )
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    appointments = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id
        )
        .order_by(
            Appointment.appointment_date.asc()
        )
        .all()
    )

    result = []

    for appointment in appointments:

        patient = (
            db.query(Patient)
            .filter(
                Patient.id == appointment.patient_id
            )
            .first()
        )

        department = (
            db.query(Department)
            .filter(
                Department.id == appointment.department_id
            )
            .first()
        )

        patient_name = None

        if patient:

            patient_user = (
                db.query(User)
                .filter(
                    User.id == patient.user_id
                )
                .first()
            )

            if patient_user:
                patient_name = patient_user.full_name

        if not patient_name:

            patient_name = (
                f"Patient {appointment.patient_id}"
            )

        department_name = (
            department.name
            if department
            else f"Department {appointment.department_id}"
        )

        result.append({
            "id": appointment.id,
            "patient_id": appointment.patient_id,
            "patient_name": patient_name,
            "doctor_id": appointment.doctor_id,
            "department_id": appointment.department_id,
            "department_name": department_name,
            "appointment_date": appointment.appointment_date,
            "reason": appointment.reason,
            "status": appointment.status
        })

    return result


# ==========================================
# Get Appointment By ID
# ==========================================

@router.get("/{appointment_id}")
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db)
):

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id == appointment_id
        )
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "department_id": appointment.department_id,
        "appointment_date": appointment.appointment_date,
        "reason": appointment.reason,
        "status": appointment.status
    }