from pydantic import BaseModel
from typing import Optional, List


class DoctorCreate(BaseModel):
    user_id: int
    specialization: str
    hospital_name: Optional[str] = None
    license_number: str
    experience_years: Optional[int] = 0
    consultation_fee: Optional[float] = 0.0


class DoctorResponse(BaseModel):
    id: int
    user_id: int
    specialization: str
    hospital_name: Optional[str] = None
    license_number: str
    experience_years: int
    consultation_fee: float


# Bulk Doctor Registration
class BulkDoctorCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    specialization: str
    hospital_name: Optional[str] = None
    license_number: str
    experience_years: Optional[int] = 0
    consultation_fee: Optional[float] = 0.0


class BulkDoctorRequest(BaseModel):
    doctors: List[BulkDoctorCreate]