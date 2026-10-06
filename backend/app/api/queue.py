from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

import os
import joblib
import pandas as pd

from pydantic import BaseModel
from typing import List

from app.database.database import get_db

from app.models.queue import QueueToken
from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.user import User

from app.schemas.queue import (
    QueueTokenCreate,
    QueueStatusUpdate
)

from app.utils.email import send_email


router = APIRouter(
    prefix="/queue",
    tags=["Queue Management"]
)


# =========================================================
# LOAD XGBOOST MODEL
# =========================================================

def get_ml_model():

    project_root = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            ".."
        )
    )

    model_path = os.path.join(
        project_root,
        "ml",
        "models",
        "xgboost_waiting_time_model.pkl"
    )

    if not os.path.exists(model_path):

        print(
            "XGBoost model not found:",
            model_path
        )

        return None

    try:

        model = joblib.load(model_path)

        print(
            "XGBoost waiting time model loaded successfully"
        )

        return model

    except Exception as error:

        print(
            "XGBoost model loading failed:",
            error
        )

        return None


# =========================================================
# CALCULATE WAITING TIME USING XGBOOST
# =========================================================

def calculate_waiting_time(
    queue_token,
    doctor,
    db
):

    model = get_ml_model()

    if model is None:
        return 0

    # -----------------------------------------------------
    # Patients ahead for same doctor and same date
    # -----------------------------------------------------

    patients_ahead = db.query(
        QueueToken
    ).filter(

        QueueToken.doctor_id ==
        queue_token.doctor_id,

        QueueToken.queue_date ==
        queue_token.queue_date,

        QueueToken.token_number <
        queue_token.token_number,

        QueueToken.status.in_([
            "waiting",
            "serving"
        ])

    ).count()

    # Queue position
    queue_position = patients_ahead + 1

    # Doctor experience
    doctor_experience = (
        doctor.experience_years
        or 0
    )

    # Average consultation time
    avg_consultation_time = 10

    # Day of week
    day_of_week = (
        queue_token.queue_date.isoweekday()
    )

    # Hospital working hour
    hour = 10

    # -----------------------------------------------------
    # Prepare XGBoost input
    # -----------------------------------------------------

    input_data = pd.DataFrame([{

        "queue_position":
            queue_position,

        "patients_ahead":
            patients_ahead,

        "doctor_experience":
            doctor_experience,

        "avg_consultation_time":
            avg_consultation_time,

        "day_of_week":
            day_of_week,

        "hour":
            hour
    }])

    # -----------------------------------------------------
    # XGBoost prediction
    # -----------------------------------------------------

    prediction = model.predict(
        input_data
    )

    waiting_time = max(
        0,
        int(
            round(
                float(prediction[0])
            )
        )
    )

    return waiting_time


# =========================================================
# SEND QUEUE EMAIL TO PATIENT
# =========================================================

def send_queue_email(
    patient,
    queue_token,
    waiting_time,
    patients_ahead,
    db
):

    try:

        # -------------------------------------------------
        # Get patient user
        # -------------------------------------------------

        patient_user = (
            db.query(User)
            .filter(
                User.id == patient.user_id
            )
            .first()
        )

        if not patient_user:

            print(
                "Patient user not found for queue email"
            )

            return

        if not patient_user.email:

            print(
                "Patient email not found"
            )

            return

        # -------------------------------------------------
        # Send email
        # -------------------------------------------------

        send_email(

            patient_user.email,

            "Smart Hospital - Queue Token Generated",

            f"""
Hello {patient_user.full_name},

Your queue token has been generated successfully at Smart Hospital.

Queue Details:

Queue Token: #{queue_token.token_number}
Appointment ID: {queue_token.appointment_id}
Queue Date: {queue_token.queue_date}
Patients Ahead: {patients_ahead}
Estimated Waiting Time: {waiting_time} minutes
Status: {queue_token.status}

Please wait for your turn and arrive at the hospital on time.

You can check your queue status from your Smart Hospital Patient Dashboard.

Regards,
Smart Hospital Administration
"""
        )

        print(
            "Queue email sent successfully to patient:",
            patient_user.email
        )

    except Exception as email_error:

        print(
            "QUEUE EMAIL ERROR:"
        )

        print(
            repr(email_error)
        )


# =========================================================
# CREATE QUEUE TOKEN
# =========================================================

@router.post("/")
def create_queue_token(
    queue_data: QueueTokenCreate,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Check appointment
    # -----------------------------------------------------

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.id ==
            queue_data.appointment_id
        )
        .first()
    )

    if not appointment:

        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    # -----------------------------------------------------
    # Check patient
    # -----------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.id ==
            queue_data.patient_id
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # -----------------------------------------------------
    # Check doctor
    # -----------------------------------------------------

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.id ==
            queue_data.doctor_id
        )
        .first()
    )

    if not doctor:

        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    # -----------------------------------------------------
    # Prevent duplicate queue token
    # -----------------------------------------------------

    existing_token = (
        db.query(QueueToken)
        .filter(
            QueueToken.appointment_id ==
            queue_data.appointment_id
        )
        .first()
    )

    if existing_token:

        raise HTTPException(
            status_code=400,
            detail=(
                "Queue token already exists "
                "for this appointment"
            )
        )

    # -----------------------------------------------------
    # Find last token for same date
    # -----------------------------------------------------

    last_token = (
        db.query(
            func.max(
                QueueToken.token_number
            )
        )
        .filter(
            QueueToken.queue_date ==
            queue_data.queue_date
        )
        .scalar()
    )

    if last_token is None:

        next_token = 1

    else:

        next_token = last_token + 1

    # -----------------------------------------------------
    # Create queue token
    # -----------------------------------------------------

    new_token = QueueToken(

        appointment_id=
            queue_data.appointment_id,

        patient_id=
            queue_data.patient_id,

        doctor_id=
            queue_data.doctor_id,

        token_number=
            next_token,

        queue_date=
            queue_data.queue_date,

        status="waiting",

        estimated_waiting_time=0
    )

    db.add(new_token)

    db.commit()

    db.refresh(new_token)

    # -----------------------------------------------------
    # Automatic XGBoost prediction
    # -----------------------------------------------------

    try:

        waiting_time = calculate_waiting_time(
            new_token,
            doctor,
            db
        )

        new_token.estimated_waiting_time = (
            int(round(waiting_time))
        )

        db.commit()

        db.refresh(new_token)

    except Exception as error:

        print(
            "Automatic XGBoost prediction failed:",
            error
        )

        waiting_time = 0

    # -----------------------------------------------------
    # Calculate patients ahead
    # -----------------------------------------------------

    patients_ahead = (
        db.query(
            QueueToken
        )
        .filter(

            QueueToken.doctor_id ==
            new_token.doctor_id,

            QueueToken.queue_date ==
            new_token.queue_date,

            QueueToken.token_number <
            new_token.token_number,

            QueueToken.status.in_([
                "waiting",
                "serving"
            ])

        )
        .count()
    )

    # -----------------------------------------------------
    # Send queue email to patient
    # -----------------------------------------------------

    send_queue_email(
        patient=patient,
        queue_token=new_token,
        waiting_time=new_token.estimated_waiting_time,
        patients_ahead=patients_ahead,
        db=db
    )

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {

        "message":
            "Queue token generated successfully",

        "queue_id":
            new_token.id,

        "appointment_id":
            new_token.appointment_id,

        "patient_id":
            new_token.patient_id,

        "doctor_id":
            new_token.doctor_id,

        "token_number":
            new_token.token_number,

        "queue_date":
            new_token.queue_date,

        "status":
            new_token.status,

        "patients_ahead":
            patients_ahead,

        "estimated_waiting_time":
            new_token.estimated_waiting_time,

        "prediction_status":
            (
                "XGBoost prediction completed"
                if waiting_time > 0
                else "ML prediction unavailable"
            )
    }


# =========================================================
# GET ALL QUEUE TOKENS
# =========================================================

@router.get("/")
def get_queue(
    db: Session = Depends(get_db)
):

    queue_tokens = (
        db.query(
            QueueToken
        )
        .order_by(
            QueueToken.queue_date,
            QueueToken.token_number
        )
        .all()
    )

    result = []

    for token in queue_tokens:

        # -------------------------------------------------
        # Patients ahead
        # -------------------------------------------------

        patients_ahead = (
            db.query(
                QueueToken
            )
            .filter(

                QueueToken.doctor_id ==
                token.doctor_id,

                QueueToken.queue_date ==
                token.queue_date,

                QueueToken.token_number <
                token.token_number,

                QueueToken.status.in_([
                    "waiting",
                    "serving"
                ])

            )
            .count()
        )

        result.append({

            "id":
                token.id,

            "appointment_id":
                token.appointment_id,

            "patient_id":
                token.patient_id,

            "doctor_id":
                token.doctor_id,

            "token_number":
                token.token_number,

            "queue_date":
                token.queue_date,

            "status":
                token.status,

            "estimated_waiting_time":
                token.estimated_waiting_time,

            "patients_ahead":
                patients_ahead
        })

    return result


# =========================================================
# GET SINGLE QUEUE TOKEN
# =========================================================

@router.get("/{queue_id}")
def get_queue_token(
    queue_id: int,
    db: Session = Depends(get_db)
):

    token = (
        db.query(
            QueueToken
        )
        .filter(
            QueueToken.id ==
            queue_id
        )
        .first()
    )

    if not token:

        raise HTTPException(
            status_code=404,
            detail="Queue token not found"
        )

    # -----------------------------------------------------
    # Patients ahead
    # -----------------------------------------------------

    patients_ahead = (
        db.query(
            QueueToken
        )
        .filter(

            QueueToken.doctor_id ==
            token.doctor_id,

            QueueToken.queue_date ==
            token.queue_date,

            QueueToken.token_number <
            token.token_number,

            QueueToken.status.in_([
                "waiting",
                "serving"
            ])

        )
        .count()
    )

    return {

        "id":
            token.id,

        "appointment_id":
            token.appointment_id,

        "patient_id":
            token.patient_id,

        "doctor_id":
            token.doctor_id,

        "token_number":
            token.token_number,

        "queue_date":
            token.queue_date,

        "status":
            token.status,

        "estimated_waiting_time":
            token.estimated_waiting_time,

        "patients_ahead":
            patients_ahead
    }


# =========================================================
# UPDATE QUEUE STATUS
# =========================================================

@router.put("/{queue_id}/status")
def update_queue_status(
    queue_id: int,
    status_data: QueueStatusUpdate,
    db: Session = Depends(get_db)
):

    token = (
        db.query(
            QueueToken
        )
        .filter(
            QueueToken.id ==
            queue_id
        )
        .first()
    )

    if not token:

        raise HTTPException(
            status_code=404,
            detail="Queue token not found"
        )

    allowed_statuses = [
        "waiting",
        "serving",
        "completed",
        "cancelled"
    ]

    if status_data.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Invalid queue status"
        )

    token.status = status_data.status

    db.commit()

    db.refresh(token)

    return {

        "message":
            "Queue status updated successfully",

        "queue_id":
            token.id,

        "token_number":
            token.token_number,

        "status":
            token.status
    }


# =========================================================
# MANUAL ML WAITING TIME PREDICTION
# =========================================================

@router.post("/{queue_id}/predict-waiting-time")
def predict_queue_waiting_time(
    queue_id: int,
    db: Session = Depends(get_db)
):

    queue_token = (
        db.query(
            QueueToken
        )
        .filter(
            QueueToken.id ==
            queue_id
        )
        .first()
    )

    if not queue_token:

        raise HTTPException(
            status_code=404,
            detail="Queue token not found"
        )

    doctor = (
        db.query(
            Doctor
        )
        .filter(
            Doctor.id ==
            queue_token.doctor_id
        )
        .first()
    )

    if not doctor:

        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    try:

        waiting_time = calculate_waiting_time(
            queue_token,
            doctor,
            db
        )

        queue_token.estimated_waiting_time = (
            int(round(waiting_time))
        )

        db.commit()

        db.refresh(queue_token)

        # -------------------------------------------------
        # Patients ahead
        # -------------------------------------------------

        patients_ahead = (
            db.query(
                QueueToken
            )
            .filter(

                QueueToken.doctor_id ==
                queue_token.doctor_id,

                QueueToken.queue_date ==
                queue_token.queue_date,

                QueueToken.token_number <
                queue_token.token_number,

                QueueToken.status.in_([
                    "waiting",
                    "serving"
                ])

            )
            .count()
        )

        return {

            "message":
                "Waiting time predicted successfully",

            "queue_id":
                queue_token.id,

            "token_number":
                queue_token.token_number,

            "patients_ahead":
                patients_ahead,

            "predicted_waiting_time_minutes":
                waiting_time,

            "status":
                queue_token.status
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# BULK QUEUE TOKEN
# =========================================================

class BulkQueueTokenItem(BaseModel):

    appointment_id: int
    patient_id: int
    doctor_id: int
    queue_date: str


class BulkQueueTokenRequest(BaseModel):

    queue_tokens: List[
        BulkQueueTokenItem
    ]


@router.post("/bulk")
def create_bulk_queue_tokens(
    data: BulkQueueTokenRequest,
    db: Session = Depends(get_db)
):

    created_tokens = []

    skipped_tokens = []

    try:

        for item in data.queue_tokens:

            # -------------------------------------------------
            # Check appointment
            # -------------------------------------------------

            appointment = (
                db.query(
                    Appointment
                )
                .filter(
                    Appointment.id ==
                    item.appointment_id
                )
                .first()
            )

            if not appointment:

                skipped_tokens.append({

                    "appointment_id":
                        item.appointment_id,

                    "reason":
                        "Appointment not found"
                })

                continue

            # -------------------------------------------------
            # Check patient
            # -------------------------------------------------

            patient = (
                db.query(
                    Patient
                )
                .filter(
                    Patient.id ==
                    item.patient_id
                )
                .first()
            )

            if not patient:

                skipped_tokens.append({

                    "appointment_id":
                        item.appointment_id,

                    "reason":
                        "Patient not found"
                })

                continue

            # -------------------------------------------------
            # Check doctor
            # -------------------------------------------------

            doctor = (
                db.query(
                    Doctor
                )
                .filter(
                    Doctor.id ==
                    item.doctor_id
                )
                .first()
            )

            if not doctor:

                skipped_tokens.append({

                    "appointment_id":
                        item.appointment_id,

                    "reason":
                        "Doctor not found"
                })

                continue

            # -------------------------------------------------
            # Check duplicate token
            # -------------------------------------------------

            existing_token = (
                db.query(
                    QueueToken
                )
                .filter(
                    QueueToken.appointment_id ==
                    item.appointment_id
                )
                .first()
            )

            if existing_token:

                skipped_tokens.append({

                    "appointment_id":
                        item.appointment_id,

                    "reason":
                        "Queue token already exists"
                })

                continue

            # -------------------------------------------------
            # Hospital-wide token for same date
            # -------------------------------------------------

            last_token = (
                db.query(
                    func.max(
                        QueueToken.token_number
                    )
                )
                .filter(
                    QueueToken.queue_date ==
                    item.queue_date
                )
                .scalar()
            )

            if last_token is None:

                next_token = 1

            else:

                next_token = last_token + 1

            # -------------------------------------------------
            # Create queue token
            # -------------------------------------------------

            new_token = QueueToken(

                appointment_id=
                    item.appointment_id,

                patient_id=
                    item.patient_id,

                doctor_id=
                    item.doctor_id,

                token_number=
                    next_token,

                queue_date=
                    item.queue_date,

                status="waiting",

                estimated_waiting_time=0
            )

            db.add(new_token)

            db.flush()

            # -------------------------------------------------
            # XGBoost prediction
            # -------------------------------------------------

            try:

                waiting_time = (
                    calculate_waiting_time(
                        new_token,
                        doctor,
                        db
                    )
                )

                new_token.estimated_waiting_time = (
                    int(round(waiting_time))
                )

            except Exception as error:

                print(
                    "Bulk XGBoost prediction failed:",
                    error
                )

                waiting_time = 0

            # -------------------------------------------------
            # Patients ahead
            # -------------------------------------------------

            patients_ahead = (
                db.query(
                    QueueToken
                )
                .filter(

                    QueueToken.doctor_id ==
                    new_token.doctor_id,

                    QueueToken.queue_date ==
                    new_token.queue_date,

                    QueueToken.token_number <
                    new_token.token_number,

                    QueueToken.status.in_([
                        "waiting",
                        "serving"
                    ])

                )
                .count()
            )

            # -------------------------------------------------
            # Send queue email
            # -------------------------------------------------

            send_queue_email(
                patient=patient,
                queue_token=new_token,
                waiting_time=
                    new_token.estimated_waiting_time,
                patients_ahead=
                    patients_ahead,
                db=db
            )

            created_tokens.append({

                "queue_id":
                    new_token.id,

                "appointment_id":
                    new_token.appointment_id,

                "patient_id":
                    new_token.patient_id,

                "doctor_id":
                    new_token.doctor_id,

                "token_number":
                    new_token.token_number,

                "queue_date":
                    new_token.queue_date,

                "status":
                    new_token.status,

                "patients_ahead":
                    patients_ahead,

                "estimated_waiting_time":
                    new_token.estimated_waiting_time
            })

        db.commit()

        return {

            "message":
                "Bulk queue token creation completed",

            "total_created":
                len(created_tokens),

            "total_skipped":
                len(skipped_tokens),

            "created_tokens":
                created_tokens,

            "skipped_tokens":
                skipped_tokens
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Bulk queue token creation failed: "
                f"{str(e)}"
            )
        )