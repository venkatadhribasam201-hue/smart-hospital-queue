from pydantic import BaseModel
from typing import Optional


class VitalCreate(BaseModel):
    patient_id: int
    temperature: Optional[float] = None
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    oxygen_level: Optional[float] = None