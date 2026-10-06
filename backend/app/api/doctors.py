
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database.database import get_db
from app.models.doctor import Doctor
from app.models.user import User
from app.models.department import Department
from app.schemas.doctor import DoctorCreate, BulkDoctorRequest
from app.utils.security import hash_password


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    hospital_name: Optional[str] = None
    license_number: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None


# =========================================================
# CREATE DOCTOR
# =========================================================

@router.post("/")
def create_doctor(
    doctor_data: DoctorCreate,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == doctor_data.user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_doctor = (
        db.query(Doctor)
        .filter(Doctor.user_id == doctor_data.user_id)
        .first()
    )

    if existing_doctor:
        raise HTTPException(
            status_code=400,
            detail="Doctor profile already exists"
        )

    existing_license = (
        db.query(Doctor)
        .filter(
            Doctor.license_number == doctor_data.license_number
        )
        .first()
    )

    if existing_license:
        raise HTTPException(
            status_code=400,
            detail="License number already exists"
        )

    new_doctor = Doctor(
        user_id=doctor_data.user_id,
        specialization=doctor_data.specialization,
        hospital_name=doctor_data.hospital_name,
        license_number=doctor_data.license_number,
        experience_years=doctor_data.experience_years,
        consultation_fee=doctor_data.consultation_fee
    )

    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    return {
        "message": "Doctor profile created successfully",
        "doctor_id": new_doctor.id,
        "user_id": new_doctor.user_id,
        "name": user.full_name,
        "full_name": user.full_name,
        "specialization": new_doctor.specialization,
        "hospital_name": new_doctor.hospital_name,
        "license_number": new_doctor.license_number,
        "experience_years": new_doctor.experience_years,
        "consultation_fee": new_doctor.consultation_fee
    }


# =========================================================
# BULK REGISTER DOCTORS
# =========================================================

@router.post("/bulk-register")
def bulk_register_doctors(
    data: BulkDoctorRequest,
    db: Session = Depends(get_db)
):

    created_doctors = []
    skipped_doctors = []

    try:

        for doctor_data in data.doctors:

            existing_user = (
                db.query(User)
                .filter(User.email == doctor_data.email)
                .first()
            )

            if existing_user:
                skipped_doctors.append({
                    "email": doctor_data.email,
                    "reason": "Email already exists"
                })
                continue

            existing_license = (
                db.query(Doctor)
                .filter(
                    Doctor.license_number
                    == doctor_data.license_number
                )
                .first()
            )

            if existing_license:
                skipped_doctors.append({
                    "email": doctor_data.email,
                    "reason": "License number already exists"
                })
                continue

            hashed_password = hash_password(
                doctor_data.password
            )

            new_user = User(
                full_name=doctor_data.full_name,
                email=doctor_data.email,
                phone=doctor_data.phone,
                password=hashed_password,
                role="doctor"
            )

            db.add(new_user)
            db.flush()

            new_doctor = Doctor(
                user_id=new_user.id,
                specialization=doctor_data.specialization,
                hospital_name=doctor_data.hospital_name,
                license_number=doctor_data.license_number,
                experience_years=doctor_data.experience_years,
                consultation_fee=doctor_data.consultation_fee
            )

            db.add(new_doctor)
            db.flush()

            created_doctors.append({
                "user_id": new_user.id,
                "doctor_id": new_doctor.id,
                "name": new_user.full_name,
                "full_name": new_user.full_name,
                "email": new_user.email,
                "specialization": new_doctor.specialization,
                "hospital_name": new_doctor.hospital_name,
                "license_number": new_doctor.license_number
            })

        db.commit()

        return {
            "message": "Bulk doctor registration completed",
            "total_created": len(created_doctors),
            "total_skipped": len(skipped_doctors),
            "created_doctors": created_doctors,
            "skipped_doctors": skipped_doctors
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Bulk doctor registration failed: {str(e)}"
        )


# =========================================================
# GET ALL DOCTORS
# =========================================================

@router.get("/")
def get_doctors(
    db: Session = Depends(get_db)
):

    doctors = db.query(Doctor).all()

    result = []

    for doctor in doctors:

        # Get doctor user
        user = (
            db.query(User)
            .filter(User.id == doctor.user_id)
            .first()
        )

        doctor_name = (
            user.full_name
            if user
            else f"Doctor {doctor.id}"
        )

        # Find department using specialization
        department = (
            db.query(Department)
            .filter(
                Department.name.ilike(
                    doctor.specialization
                )
            )
            .first()
        )

        department_id = (
            department.id
            if department
            else None
        )

        department_name = (
            department.name
            if department
            else doctor.specialization
        )

        result.append({
            "id": doctor.id,
            "user_id": doctor.user_id,

            # Doctor name
            "name": doctor_name,
            "full_name": doctor_name,

            # Department information
            "department_id": department_id,
            "department_name": department_name,

            # Doctor information
            "specialization": doctor.specialization,
            "hospital_name": doctor.hospital_name,
            "license_number": doctor.license_number,
            "experience_years": doctor.experience_years,
            "consultation_fee": doctor.consultation_fee
        })

    return result


# =========================================================
# GET SINGLE DOCTOR
# =========================================================

@router.get("/{doctor_id}")
def get_doctor(
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

    user = (
        db.query(User)
        .filter(User.id == doctor.user_id)
        .first()
    )

    doctor_name = (
        user.full_name
        if user
        else f"Doctor {doctor.id}"
    )

    department = (
        db.query(Department)
        .filter(
            Department.name.ilike(
                doctor.specialization
            )
        )
        .first()
    )

    department_id = (
        department.id
        if department
        else None
    )

    department_name = (
        department.name
        if department
        else doctor.specialization
    )

    return {
        "id": doctor.id,
        "user_id": doctor.user_id,

        "name": doctor_name,
        "full_name": doctor_name,

        "department_id": department_id,
        "department_name": department_name,

        "specialization": doctor.specialization,
        "hospital_name": doctor.hospital_name,
        "license_number": doctor.license_number,
        "experience_years": doctor.experience_years,
        "consultation_fee": doctor.consultation_fee
    }


# =========================================================
# UPDATE DOCTOR
# =========================================================

@router.put("/{doctor_id}")
def update_doctor(
    doctor_id: int,
    doctor_data: DoctorUpdate,
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

    if doctor_data.specialization is not None:
        doctor.specialization = doctor_data.specialization

    if doctor_data.hospital_name is not None:
        doctor.hospital_name = doctor_data.hospital_name

    if doctor_data.license_number is not None:

        existing_license = (
            db.query(Doctor)
            .filter(
                Doctor.license_number
                == doctor_data.license_number,
                Doctor.id != doctor_id
            )
            .first()
        )

        if existing_license:
            raise HTTPException(
                status_code=400,
                detail="License number already exists"
            )

        doctor.license_number = doctor_data.license_number

    if doctor_data.experience_years is not None:
        doctor.experience_years = doctor_data.experience_years

    if doctor_data.consultation_fee is not None:
        doctor.consultation_fee = doctor_data.consultation_fee

    db.commit()
    db.refresh(doctor)

    user = (
        db.query(User)
        .filter(User.id == doctor.user_id)
        .first()
    )

    doctor_name = (
        user.full_name
        if user
        else f"Doctor {doctor.id}"
    )

    department = (
        db.query(Department)
        .filter(
            Department.name.ilike(
                doctor.specialization
            )
        )
        .first()
    )

    department_id = (
        department.id
        if department
        else None
    )

    department_name = (
        department.name
        if department
        else doctor.specialization
    )

    return {
        "message": "Doctor profile updated successfully",

        "doctor_id": doctor.id,
        "user_id": doctor.user_id,

        "name": doctor_name,
        "full_name": doctor_name,

        "department_id": department_id,
        "department_name": department_name,

        "specialization": doctor.specialization,
        "hospital_name": doctor.hospital_name,
        "license_number": doctor.license_number,
        "experience_years": doctor.experience_years,
        "consultation_fee": doctor.consultation_fee
    }