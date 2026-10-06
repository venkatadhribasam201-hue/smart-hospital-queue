from pydantic import BaseModel
from typing import Optional
from datetime import date


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    department_id: int
    appointment_date: date
    reason: Optional[str] = None
    status: str = "scheduled"