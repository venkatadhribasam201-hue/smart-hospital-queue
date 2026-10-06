from pydantic import BaseModel
from typing import Optional
from datetime import date


class PatientProfileCreate(BaseModel):
    user_id: int
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None