
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

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
# BULK APPOINTMENT SCHEMAS
# ==========================================

class BulkAppointmentItem(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: datetime
    reason: str
    status: str = "scheduled"


class BulkAppointmentRequest(BaseModel):
    appointments: List[BulkAppointmentItem]


# ==========================================
# HOSPITAL VALIDATION
# ==========================================

def validate_doctor_department(doctor, department):
    doctor_hospital_id = getattr(doctor, "hospital_id", None)
    department_hospital_id = getattr(
        department, "hospital_id", None
    )

    if doctor_hospital_id is None:
        raise HTTPException(
            status_code=400,
            detail="Doctor is not assigned to a hospital"
        )

    if department_hospital_id is None:
        raise HTTPException(
            status_code=400,
            detail="Department is not assigned to a hospital"
        )

    if doctor_hospital_id != department_hospital_id:
        raise HTTPException(
            status_code=400,
            detail="Doctor and department belong to different hospitals"
        )


def validate_hospital_id(doctor, hospital_id):
    doctor_hospital_id = getattr(doctor, "hospital_id", None)

    if doctor_hospital_id is None:
        raise HTTPException(
            status_code=400,
            detail="Doctor is not assigned to a hospital"
        )

    if doctor_hospital_id != hospital_id:
        raise HTTPException(
            status_code=400,
            detail="Selected doctor does not belong to this hospital"
        )


# ==========================================
# APPOINTMENT RESPONSE
# ==========================================

def appointment_response(appointment, hospital_id=None):
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "department_id": appointment.department_id,
        "hospital_id": hospital_id,
        "appointment_date": appointment.appointment_date,
        "reason": appointment.reason,
        "status": appointment.status
    }


# ==========================================
# CREATE SINGLE APPOINTMENT
# ==========================================

@router.post("/")
def create_appointment(
    appointment_data: AppointmentCreate,
    hospital_id: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == appointment_data.patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    doctor = (
        db.query(Doctor)
        .filter(Doctor.id == appointment_data.doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    department = (
        db.query(Department)
        .filter(Department.id == appointment_data.department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    validate_hospital_id(doctor, hospital_id)
    validate_doctor_department(doctor, department)

    new_appointment = Appointment(
        patient_id=appointment_data.patient_id,
        doctor_id=appointment_data.doctor_id,
        department_id=appointment_data.department_id,
        appointment_date=appointment_data.appointment_date,
        reason=appointment_data.reason,
        status=appointment_data.status
    )

    try:
        db.add(new_appointment)
        db.commit()
        db.refresh(new_appointment)
    except Exception as error:
        db.rollback()
        print("Appointment creation error:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Failed to create appointment"
        )

    # Email errors must not undo the saved appointment.
    patient_user = (
        db.query(User)
        .filter(User.id == patient.user_id)
        .first()
    )

    doctor_user = (
        db.query(User)
        .filter(User.id == doctor.user_id)
        .first()
    )

    patient_name = (
        patient_user.full_name
        if patient_user
        else f"Patient {patient.id}"
    )

    doctor_name = (
        doctor_user.full_name
        if doctor_user
        else f"Doctor {doctor.id}"
    )

    if patient_user and patient_user.email:
        try:
            send_email(
                patient_user.email,
                "Smart Hospital - Appointment Confirmed",
                f"""
Hello {patient_name},

Your appointment has been booked successfully.

Appointment ID: {new_appointment.id}
Doctor: {doctor_name}
Department: {department.name}
Date: {new_appointment.appointment_date}
Reason: {new_appointment.reason}
Status: {new_appointment.status}

Smart Hospital Team
"""
            )
        except Exception as error:
            print("Patient email error:", repr(error))

    if doctor_user and doctor_user.email:
        try:
            send_email(
                doctor_user.email,
                "Smart Hospital - New Appointment",
                f"""
Hello Dr. {doctor_name},

A new appointment has been scheduled.

Appointment ID: {new_appointment.id}
Patient: {patient_name}
Department: {department.name}
Date: {new_appointment.appointment_date}
Reason: {new_appointment.reason}

Please check your Doctor Dashboard.

Smart Hospital Team
"""
            )
        except Exception as error:
            print("Doctor email error:", repr(error))

    response = appointment_response(
        new_appointment,
        hospital_id=doctor.hospital_id
    )
    response["message"] = "Appointment created successfully"

    return response


# ==========================================
# BULK CREATE APPOINTMENTS
# ==========================================

@router.post("/bulk")
def create_bulk_appointments(
    data: BulkAppointmentRequest,
    hospital_id: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    created_appointments = []
    skipped_appointments = []

    try:
        for item in data.appointments:
            patient = (
                db.query(Patient)
                .filter(Patient.id == item.patient_id)
                .first()
            )

            doctor = (
                db.query(Doctor)
                .filter(Doctor.id == item.doctor_id)
                .first()
            )

            department = (
                db.query(Department)
                .filter(Department.id == item.department_id)
                .first()
            )

            if not patient:
                reason = "Patient not found"
            elif not doctor:
                reason = "Doctor not found"
            elif not department:
                reason = "Department not found"
            else:
                reason = None

            if reason:
                skipped_appointments.append({
                    "patient_id": item.patient_id,
                    "doctor_id": item.doctor_id,
                    "department_id": item.department_id,
                    "reason": reason
                })
                continue

            try:
                validate_hospital_id(doctor, hospital_id)
                validate_doctor_department(doctor, department)
            except HTTPException as error:
                skipped_appointments.append({
                    "patient_id": item.patient_id,
                    "doctor_id": item.doctor_id,
                    "department_id": item.department_id,
                    "reason": error.detail
                })
                continue

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

            created_appointments.append(
                appointment_response(
                    new_appointment,
                    hospital_id=doctor.hospital_id
                )
            )

        db.commit()

        return {
            "message": "Bulk appointment processing completed",
            "total_created": len(created_appointments),
            "total_skipped": len(skipped_appointments),
            "created_appointments": created_appointments,
            "skipped_appointments": skipped_appointments
        }

    except Exception as error:
        db.rollback()
        print("Bulk appointment error:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Bulk appointment creation failed"
        )


# ==========================================
# GET APPOINTMENTS FOR SELECTED HOSPITAL
# ==========================================

@router.get("/")
def get_appointments(
    hospital_id: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    appointments = (
        db.query(Appointment, Doctor.hospital_id)
        .join(
            Doctor,
            Appointment.doctor_id == Doctor.id
        )
        .filter(Doctor.hospital_id == hospital_id)
        .order_by(Appointment.appointment_date.asc())
        .all()
    )

    return [
        appointment_response(appointment, appointment_hospital_id)
        for appointment, appointment_hospital_id in appointments
    ]


# ==========================================
# GET APPOINTMENTS BY DOCTOR
# ==========================================

@router.get("/doctor/{doctor_id}")
def get_doctor_appointments(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    doctor = (
        db.query(Doctor)
        .filter(Doctor.id == doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    appointments = (
        db.query(Appointment)
        .filter(Appointment.doctor_id == doctor_id)
        .order_by(Appointment.appointment_date.asc())
        .all()
    )

    result = []

    for appointment in appointments:
        patient = (
            db.query(Patient)
            .filter(Patient.id == appointment.patient_id)
            .first()
        )

        department = (
            db.query(Department)
            .filter(Department.id == appointment.department_id)
            .first()
        )

        patient_user = None

        if patient:
            patient_user = (
                db.query(User)
                .filter(User.id == patient.user_id)
                .first()
            )

        result.append({
            **appointment_response(
                appointment,
                hospital_id=doctor.hospital_id
            ),
            "patient_name": (
                patient_user.full_name
                if patient_user
                else f"Patient {appointment.patient_id}"
            ),
            "department_name": (
                department.name
                if department
                else f"Department {appointment.department_id}"
            )
        })

    return result


# ==========================================
# GET APPOINTMENT BY ID
# ==========================================

@router.get("/{appointment_id}")
def get_appointment(
    appointment_id: int,
    hospital_id: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    result = (
        db.query(Appointment, Doctor.hospital_id)
        .join(
            Doctor,
            Appointment.doctor_id == Doctor.id
        )
        .filter(
            Appointment.id == appointment_id,
            Doctor.hospital_id == hospital_id
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found in this hospital"
        )

    appointment, appointment_hospital_id = result

    return appointment_response(
        appointment,
        appointment_hospital_id
    )