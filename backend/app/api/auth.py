
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User
from app.models.patient import Patient
from app.models.doctor import Doctor

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

        # Check email
        existing_user = (
            db.query(User)
            .filter(
                User.email == user_data.email
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Check phone
        existing_phone = (
            db.query(User)
            .filter(
                User.phone == user_data.phone
            )
            .first()
        )

        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail="Phone number already registered"
            )

        # Hash password
        hashed_password = hash_password(
            user_data.password
        )

        # Create user
        new_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            phone=user_data.phone,
            password=hashed_password,
            role=user_data.role
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        patient_id = None
        doctor_id = None

        # =================================================
        # PATIENT
        # =================================================

        if user_data.role == "patient":

            new_patient = Patient(
                user_id=new_user.id
            )

            db.add(new_patient)
            db.commit()
            db.refresh(new_patient)

            patient_id = new_patient.id

        # =================================================
        # DOCTOR
        # =================================================

        elif user_data.role == "doctor":

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
                    Doctor.license_number ==
                    user_data.license_number
                )
                .first()
            )

            if existing_license:

                db.rollback()

                raise HTTPException(
                    status_code=400,
                    detail="License number already registered"
                )

            new_doctor = Doctor(
                user_id=new_user.id,
                specialization=user_data.specialization,
                hospital_name=user_data.hospital_name,
                license_number=user_data.license_number,
                experience_years=user_data.experience_years or 0,
                consultation_fee=user_data.consultation_fee or 0.0
            )

            db.add(new_doctor)

            db.commit()

            db.refresh(new_doctor)

            doctor_id = new_doctor.id

        # =================================================
        # NURSE
        # =================================================

        elif user_data.role == "nurse":

            pass

        # =================================================
        # RECEPTIONIST
        # =================================================

        elif user_data.role == "receptionist":

            pass

        # =================================================
        # REGISTRATION EMAIL
        # =================================================

        try:

            send_email(
                new_user.email,
                "Smart Hospital - Account Created",
                f"""
Hello {new_user.full_name},

Your Smart Hospital account has been created successfully.

Account Details:

Name: {new_user.full_name}
Email: {new_user.email}
Role: {new_user.role}

You can now log in to the Smart Hospital system.

Thank you,
Smart Hospital Team
"""
            )

            print(
                f"Registration email sent to {new_user.email}"
            )

        except Exception as email_error:

            print("REGISTRATION EMAIL ERROR:")
            print(repr(email_error))

        # =================================================
        # REGISTER RESPONSE
        # =================================================

        return {
            "message": "User registered successfully",
            "user_id": new_user.id,
            "full_name": new_user.full_name,
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "role": new_user.role
        }

    except HTTPException:

        raise

    except Exception as e:

        db.rollback()

        print("REGISTER ERROR:")
        print(repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
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

        # =================================================
        # FIND USER
        # =================================================

        user = (
            db.query(User)
            .filter(
                User.email == user_data.email
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        # =================================================
        # VERIFY PASSWORD
        # =================================================

        if not verify_password(
            user_data.password,
            user.password
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        patient_id = None
        doctor_id = None

        # =================================================
        # PATIENT LOGIN
        # =================================================

        if user.role == "patient":

            patient = (
                db.query(Patient)
                .filter(
                    Patient.user_id == user.id
                )
                .first()
            )

            if patient:

                patient_id = patient.id

        # =================================================
        # DOCTOR LOGIN
        # =================================================

        elif user.role == "doctor":

            doctor = (
                db.query(Doctor)
                .filter(
                    Doctor.user_id == user.id
                )
                .first()
            )

            if not doctor:

                raise HTTPException(
                    status_code=403,
                    detail="Doctor profile not found"
                )

            doctor_id = doctor.id

        # =================================================
        # NURSE LOGIN
        # =================================================

        elif user.role == "nurse":

            pass

        # =================================================
        # RECEPTIONIST LOGIN
        # =================================================

        elif user.role == "receptionist":

            pass

        # =================================================
        # CREATE JWT TOKEN
        # =================================================

        access_token = create_access_token({

            "user_id": user.id,
            "email": user.email,
            "role": user.role

        })

        # =================================================
        # LOGIN EMAIL NOTIFICATION
        # =================================================

        try:

            send_email(
                user.email,
                "Smart Hospital - Login Alert",
                f"""
Hello {user.full_name},

You have successfully logged in to the Smart Hospital system.

Login Details:

Name: {user.full_name}
Role: {user.role}
Email: {user.email}

Your login was successful.

If this login was not performed by you,
please contact the hospital administration.

Thank you,
Smart Hospital Team
"""
            )

            print(
                f"Login email sent to {user.email}"
            )

        except Exception as email_error:

            print("LOGIN EMAIL ERROR:")
            print(repr(email_error))

        # =================================================
        # LOGIN RESPONSE
        # =================================================

        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "full_name": user.full_name,
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "role": user.role
        }

    except HTTPException:

        raise

    except Exception as e:

        print("LOGIN ERROR:")
        print(repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )