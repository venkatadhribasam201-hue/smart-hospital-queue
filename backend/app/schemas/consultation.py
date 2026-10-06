from pydantic import BaseModel
from typing import Optional


class ConsultationCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_id: int
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None