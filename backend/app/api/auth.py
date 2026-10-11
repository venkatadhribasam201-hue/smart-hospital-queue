from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.hospital import Hospital

from app.schemas.auth import UserRegister, UserLogin

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)

from app.utils.email import send_email


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    try:
        # ---------------------------------------------
        # 1. Validate role
        # ---------------------------------------------

        allowed_roles = {
            "patient",
            "doctor",
            "nurse",
            "receptionist"
        }

        role = user_data.role

        if role not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail="Invalid role"
            )

        # ---------------------------------------------
        # 2. Check existing email
        # ---------------------------------------------

        existing_user = (
            db.query(User)
            .filter(User.email == user_data.email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # ---------------------------------------------
        # 3. Check existing phone
        # ---------------------------------------------

        if user_data.phone:
            existing_phone = (
                db.query(User)
                .filter(User.phone == user_data.phone)
                .first()
            )

            if existing_phone:
                raise HTTPException(
                    status_code=400,
                    detail="Phone number already registered"
                )

        patient_id = None
        doctor_id = None
        hospital_id = None

        # hospital_id must be included in UserRegister
        # if the frontend sends it.
        requested_hospital_id = getattr(
            user_data,
            "hospital_id",
            None
        )

        # ---------------------------------------------
        # 4. Validate hospital assignment
        # ---------------------------------------------

        if role in {"doctor", "patient"} and requested_hospital_id:
            hospital = (
                db.query(Hospital)
                .filter(
                    Hospital.id == requested_hospital_id,
                    Hospital.is_active.is_(True)
                )
                .first()
            )

            if not hospital:
                raise HTTPException(
                    status_code=400,
                    detail="Selected hospital does not exist or is inactive"
                )

            hospital_id = hospital.id

        # ---------------------------------------------
        # 5. Doctor validation
        # ---------------------------------------------

        if role == "doctor":
            if not user_data.specialization:
                raise HTTPException(
                    status_code=400,
                    detail="Specialization is required"
                )

            if not user_data.license_number:
                raise HTTPException(
                    status_code=400,
                    detail="License number is required"
                )

            existing_license = (
                db.query(Doctor)
                .filter(
                    Doctor.license_number
                    == user_data.license_number
                )
                .first()
            )

            if existing_license:
                raise HTTPException(
                    status_code=400,
                    detail="License number already registered"
                )

            # Hospital assignment is required for doctors.
            # If hospital_id was not sent, try matching the
            # existing hospital_name field for compatibility.
            if not hospital_id and user_data.hospital_name:
                hospital = (
                    db.query(Hospital)
                    .filter(
                        Hospital.name == user_data.hospital_name,
                        Hospital.is_active.is_(True)
                    )
                    .first()
                )

                if hospital:
                    hospital_id = hospital.id

            if not hospital_id:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "A valid hospital_id is required "
                        "for doctor registration"
                    )
                )

        # ---------------------------------------------
        # 6. Create user
        # ---------------------------------------------

        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            phone=user_data.phone,
            password=hash_password(user_data.password),
            role=role
        )

        db.add(new_user)

        # Get generated user ID without committing yet.
        db.flush()

        # ---------------------------------------------
        # 7. Create patient profile
        # ---------------------------------------------

        if role == "patient":
            new_patient = Patient(
                user_id=new_user.id,
                hospital_id=hospital_id
            )

            db.add(new_patient)
            db.flush()

            patient_id = new_patient.id

        # ---------------------------------------------
        # 8. Create doctor profile
        # ---------------------------------------------

        elif role == "doctor":
            new_doctor = Doctor(
                user_id=new_user.id,
                specialization=user_data.specialization,
                hospital_id=hospital_id,
                hospital_name=user_data.hospital_name,
                license_number=user_data.license_number,
                experience_years=(
                    user_data.experience_years or 0
                ),
                consultation_fee=(
                    user_data.consultation_fee or 0.0
                )
            )

            db.add(new_doctor)
            db.flush()

            doctor_id = new_doctor.id

        # ---------------------------------------------
        # 9. Save user and profile together
        # ---------------------------------------------

        db.commit()
        db.refresh(new_user)

        # ---------------------------------------------
        # 10. Registration email
        # ---------------------------------------------

        try:
            send_email(
                new_user.email,
                "Smart Hospital - Account Created",
                f"""
Hello {new_user.full_name},

Your Smart Hospital account has been created successfully.

Name: {new_user.full_name}
Email: {new_user.email}
Role: {new_user.role}

Thank you,
Smart Hospital Team
"""
            )
        except Exception as email_error:
            # Email failure should not undo registration.
            print("REGISTRATION EMAIL ERROR:")
            print(repr(email_error))

        # ---------------------------------------------
        # 11. Registration response
        # ---------------------------------------------

        return {
            "message": "User registered successfully",
            "user_id": new_user.id,
            "full_name": new_user.full_name,
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "hospital_id": hospital_id,
            "role": new_user.role
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        print("REGISTER ERROR:")
        print(repr(e))

        raise HTTPException(
            status_code=500,
            detail="Registration failed. Please check the server logs."
        )


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    try:
        # ---------------------------------------------
        # 1. Find user
        # ---------------------------------------------

        user = (
            db.query(User)
            .filter(User.email == user_data.email)
            .first()
        )

        if not user or not verify_password(
            user_data.password,
            user.password
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        patient_id = None
        doctor_id = None
        hospital_id = None

        # ---------------------------------------------
        # 2. Patient login
        # ---------------------------------------------

        if user.role == "patient":
            patient = (
                db.query(Patient)
                .filter(Patient.user_id == user.id)
                .first()
            )

            if patient:
                patient_id = patient.id
                hospital_id = patient.hospital_id

        # ---------------------------------------------
        # 3. Doctor login
        # ---------------------------------------------

        elif user.role == "doctor":
            doctor = (
                db.query(Doctor)
                .filter(Doctor.user_id == user.id)
                .first()
            )

            if not doctor:
                raise HTTPException(
                    status_code=403,
                    detail="Doctor profile not found"
                )

            if not doctor.hospital_id:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        "Your account has no hospital assigned. "
                        "Please contact the administrator."
                    )
                )

            hospital = (
                db.query(Hospital)
                .filter(
                    Hospital.id == doctor.hospital_id,
                    Hospital.is_active.is_(True)
                )
                .first()
            )

            if not hospital:
                raise HTTPException(
                    status_code=403,
                    detail="Your assigned hospital is unavailable"
                )

            doctor_id = doctor.id
            hospital_id = doctor.hospital_id

        # ---------------------------------------------
        # 4. Create JWT token
        # ---------------------------------------------

        access_token = create_access_token({
            "user_id": user.id,
            "email": user.email,
            "role": user.role
        })

        # ---------------------------------------------
        # 5. Login notification email
        # ---------------------------------------------

        try:
            send_email(
                user.email,
                "Smart Hospital - Login Alert",
                f"""
Hello {user.full_name},

You have successfully logged in to the Smart Hospital system.

Name: {user.full_name}
Role: {user.role}
Email: {user.email}

Thank you,
Smart Hospital Team
"""
            )
        except Exception as email_error:
            print("LOGIN EMAIL ERROR:")
            print(repr(email_error))

        # ---------------------------------------------
        # 6. Login response
        # ---------------------------------------------

        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "full_name": user.full_name,
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "hospital_id": hospital_id,
            "role": user.role
        }

    except HTTPException:
        raise

    except Exception as e:
        print("LOGIN ERROR:")
        print(repr(e))

        raise HTTPException(
            status_code=500,
            detail="Login failed. Please check the server logs."
        )