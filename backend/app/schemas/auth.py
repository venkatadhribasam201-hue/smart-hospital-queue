from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):

    full_name: str

    email: EmailStr

    phone: Optional[str] = None

    password: str

    role: str = "patient"

    # Doctor fields
    specialization: Optional[str] = None

    hospital_name: Optional[str] = None

    license_number: Optional[str] = None

    experience_years: Optional[int] = 0

    consultation_fee: Optional[float] = 0.0


class UserLogin(BaseModel):

    email: EmailStr

    password: str