import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor


# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATASET_PATH = os.path.join(
    BASE_DIR,
    "dataset",
    "queue_waiting_time.csv"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "xgboost_waiting_time_model.pkl"
)


# Load dataset
data = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully!")
print("Number of records:", len(data))


# Features
features = [
    "queue_position",
    "patients_ahead",
    "doctor_experience",
    "avg_consultation_time",
    "day_of_week",
    "hour"
]

X = data[features]
y = data["waiting_time"]


# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# Create XGBoost model
model = XGBRegressor(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.05,
    random_state=42,
    objective="reg:squarederror"
)


# Train model
model.fit(X_train, y_train)

print("XGBoost model training completed!")


# Predict
predictions = model.predict(X_test)


# Evaluation
mae = mean_absolute_error(y_test, predictions)
mse = mean_squared_error(y_test, predictions)
r2 = r2_score(y_test, predictions)


print("\nXGBoost Model Evaluation")
print("-------------------------")
print("Mean Absolute Error:", round(mae, 2))
print("Mean Squared Error:", round(mse, 2))
print("R2 Score:", round(r2, 2))


# Create models folder
os.makedirs(
    os.path.dirname(MODEL_PATH),
    exist_ok=True
)


# Save model
joblib.dump(model, MODEL_PATH)

print("\nXGBoost model saved successfully!")
print("Model location:", MODEL_PATH)