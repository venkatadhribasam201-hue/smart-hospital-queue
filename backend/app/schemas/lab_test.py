from pydantic import BaseModel
from typing import Optional


class LabTestCreate(BaseModel):
    patient_id: int
    doctor_id: int
    consultation_id: Optional[int] = None
    test_name: str
    test_description: Optional[str] = None
    status: str = "requested"