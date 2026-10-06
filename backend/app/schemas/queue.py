from pydantic import BaseModel
from typing import Optional
from datetime import date


class QueueTokenCreate(BaseModel):
    appointment_id: int
    patient_id: int
    doctor_id: int
    queue_date: date
    estimated_waiting_time: Optional[int] = 0


class QueueTokenResponse(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    doctor_id: int
    token_number: int
    queue_date: date
    status: str
    estimated_waiting_time: int


class QueueStatusUpdate(BaseModel):
    status: str