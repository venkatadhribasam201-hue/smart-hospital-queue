import os
import joblib
import pandas as pd


# =========================
# Model path
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "waiting_time_model.pkl"
)


# =========================
# Load trained model
# =========================

model = joblib.load(MODEL_PATH)


# =========================
# Prediction function
# =========================

def predict_waiting_time(
    queue_position,
    patients_ahead,
    doctor_experience,
    avg_consultation_time,
    day_of_week,
    hour
):

    input_data = pd.DataFrame([{
        "queue_position": queue_position,
        "patients_ahead": patients_ahead,
        "doctor_experience": doctor_experience,
        "avg_consultation_time": avg_consultation_time,
        "day_of_week": day_of_week,
        "hour": hour
    }])

    prediction = model.predict(input_data)

    return round(float(prediction[0]), 2)


# =========================
# Test Prediction
# =========================

if __name__ == "__main__":

    waiting_time = predict_waiting_time(
        queue_position=3,
        patients_ahead=2,
        doctor_experience=8,
        avg_consultation_time=10,
        day_of_week=1,
        hour=9
    )

    print("Predicted Waiting Time:", waiting_time, "minutes")