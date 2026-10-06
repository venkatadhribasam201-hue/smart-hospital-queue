from pydantic import BaseModel
from typing import Optional


class PrescriptionCreate(BaseModel):
    patient_id: int
    doctor_id: int
    consultation_id: int
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None