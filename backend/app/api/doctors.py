
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.doctor import Doctor
from app.models.user import User
from app.models.department import Department
from app.models.hospital import Hospital
from app.schemas.doctor import DoctorCreate, BulkDoctorRequest
from app.utils.security import hash_password


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


# =========================================================
# UPDATE SCHEMA
# =========================================================

class DoctorUpdate(BaseModel):
    specialization: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_id: Optional[int] = None
    license_number: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def find_hospital(db: Session, hospital_id: Optional[int], hospital_name: Optional[str] = None):
    """Find a hospital by ID or its existing name."""

    if hospital_id is not None:
        hospital = (
            db.query(Hospital)
            .filter(Hospital.id == hospital_id)
            .first()
        )

        if not hospital:
            raise HTTPException(
                status_code=404,
                detail=f"Hospital with ID {hospital_id} not found"
            )

        if not hospital.is_active:
            raise HTTPException(
                status_code=400,
                detail="This hospital is inactive"
            )

        return hospital

    if hospital_name:
        return (
            db.query(Hospital)
            .filter(
                func.lower(func.trim(Hospital.name))
                == hospital_name.strip().lower()
            )
            .first()
        )

    return None


def get_doctor_department(
    db: Session,
    doctor: Doctor
):
    """Find the matching department in the doctor's hospital."""

    query = db.query(Department).filter(
        func.lower(func.trim(Department.name))
        == doctor.specialization.strip().lower()
    )

    if doctor.hospital_id is not None:
        query = query.filter(
            Department.hospital_id == doctor.hospital_id
        )

    return query.first()


def doctor_response(db: Session, doctor: Doctor):
    """Build a consistent response for a doctor."""

    user = (
        db.query(User)
        .filter(User.id == doctor.user_id)
        .first()
    )

    department = get_doctor_department(db, doctor)

    return {
        "id": doctor.id,
        "doctor_id": doctor.id,
        "user_id": doctor.user_id,
        "name": user.full_name if user else f"Doctor {doctor.id}",
        "full_name": user.full_name if user else f"Doctor {doctor.id}",
        "hospital_id": doctor.hospital_id,
        "hospital_name": doctor.hospital_name,
        "department_id": department.id if department else None,
        "department_name": (
            department.name if department else doctor.specialization
        ),
        "specialization": doctor.specialization,
        "license_number": doctor.license_number,
        "experience_years": doctor.experience_years,
        "consultation_fee": doctor.consultation_fee
    }


# =========================================================
# CREATE DOCTOR
# =========================================================

@router.post("/")
def create_doctor(
    doctor_data: DoctorCreate,
    hospital_id: Optional[int] = None,
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

    hospital = find_hospital(
        db,
        hospital_id,
        getattr(doctor_data, "hospital_name", None)
    )

    new_doctor = Doctor(
        user_id=doctor_data.user_id,
        specialization=doctor_data.specialization,
        hospital_name=(
            hospital.name
            if hospital
            else getattr(doctor_data, "hospital_name", None)
        ),
        hospital_id=hospital.id if hospital else None,
        license_number=doctor_data.license_number,
        experience_years=doctor_data.experience_years,
        consultation_fee=doctor_data.consultation_fee
    )

    try:
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create doctor profile"
        )

    return {
        "message": "Doctor profile created successfully",
        **doctor_response(db, new_doctor)
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

            hospital = find_hospital(
                db,
                getattr(doctor_data, "hospital_id", None),
                getattr(doctor_data, "hospital_name", None)
            )

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
                hospital_name=(
                    hospital.name
                    if hospital
                    else getattr(doctor_data, "hospital_name", None)
                ),
                hospital_id=hospital.id if hospital else None,
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
                "hospital_id": new_doctor.hospital_id,
                "hospital_name": new_doctor.hospital_name,
                "specialization": new_doctor.specialization,
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

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Bulk doctor registration failed"
        )


# =========================================================
# GET ALL DOCTORS
# =========================================================

@router.get("/")
def get_doctors(
    hospital_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Doctor)

    # Filter by hospital
    if hospital_id is not None:
        hospital = (
            db.query(Hospital)
            .filter(Hospital.id == hospital_id)
            .first()
        )

        if not hospital:
            raise HTTPException(
                status_code=404,
                detail="Hospital not found"
            )

        query = query.filter(
            Doctor.hospital_id == hospital_id
        )

    # Filter by department
    if department_id is not None:
        department = (
            db.query(Department)
            .filter(Department.id == department_id)
            .first()
        )

        if not department:
            raise HTTPException(
                status_code=404,
                detail="Department not found"
            )

        if (
            hospital_id is not None
            and department.hospital_id != hospital_id
        ):
            raise HTTPException(
                status_code=400,
                detail="This department does not belong to the selected hospital"
            )

        query = query.filter(
            func.lower(func.trim(Doctor.specialization))
            == department.name.strip().lower()
        )

        # When department is selected without hospital_id,
        # use that department's hospital.
        if hospital_id is None:
            query = query.filter(
                Doctor.hospital_id == department.hospital_id
            )

    doctors = query.order_by(Doctor.id).all()

    return [
        doctor_response(db, doctor)
        for doctor in doctors
    ]


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

    return doctor_response(db, doctor)


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

    update_data = doctor_data.model_dump(exclude_unset=True)

    if "hospital_id" in update_data:
        new_hospital_id = update_data["hospital_id"]

        hospital = find_hospital(db, new_hospital_id)

        doctor.hospital_id = hospital.id if hospital else None
        doctor.hospital_name = hospital.name if hospital else None

    elif "hospital_name" in update_data:
        hospital = find_hospital(
            db,
            None,
            update_data["hospital_name"]
        )

        doctor.hospital_name = update_data["hospital_name"]
        doctor.hospital_id = hospital.id if hospital else None

    if (
        "specialization" in update_data
        and update_data["specialization"] is not None
    ):
        doctor.specialization = update_data["specialization"]

    if (
        "license_number" in update_data
        and update_data["license_number"] is not None
    ):
        existing_license = (
            db.query(Doctor)
            .filter(
                Doctor.license_number == update_data["license_number"],
                Doctor.id != doctor_id
            )
            .first()
        )

        if existing_license:
            raise HTTPException(
                status_code=400,
                detail="License number already exists"
            )

        doctor.license_number = update_data["license_number"]

    if (
        "experience_years" in update_data
        and update_data["experience_years"] is not None
    ):
        doctor.experience_years = update_data["experience_years"]

    if (
        "consultation_fee" in update_data
        and update_data["consultation_fee"] is not None
    ):
        doctor.consultation_fee = update_data["consultation_fee"]

    try:
        db.commit()
        db.refresh(doctor)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update doctor profile"
        )

    return {
        "message": "Doctor profile updated successfully",
        **doctor_response(db, doctor)
    }
