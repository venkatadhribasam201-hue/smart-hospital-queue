from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import sys
import joblib
import pandas as pd


router = APIRouter(
    prefix="/prediction",
    tags=["ML Prediction"]
)


# =========================
# MODEL PATH
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "../../../ml/models/waiting_time_model.pkl"
    )
)


# =========================
# REQUEST SCHEMA
# =========================

class WaitingTimeRequest(BaseModel):
    queue_position: int
    patients_ahead: int
    doctor_experience: int
    avg_consultation_time: float
    day_of_week: int
    hour: int


# =========================
# PREDICTION API
# =========================

@router.post("/waiting-time")
def predict_waiting_time(data: WaitingTimeRequest):

    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=500,
            detail="ML model file not found"
        )

    try:

        model = joblib.load(MODEL_PATH)

        input_data = pd.DataFrame([{
            "queue_position": data.queue_position,
            "patients_ahead": data.patients_ahead,
            "doctor_experience": data.doctor_experience,
            "avg_consultation_time": data.avg_consultation_time,
            "day_of_week": data.day_of_week,
            "hour": data.hour
        }])

        prediction = model.predict(input_data)

        waiting_time = round(
            float(prediction[0]),
            2
        )

        return {
            "message": "Waiting time predicted successfully",
            "predicted_waiting_time_minutes": waiting_time,
            "unit": "minutes"
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )