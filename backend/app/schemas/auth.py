    
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# =========================================================
# USER REGISTRATION SCHEMA
# =========================================================

class UserRegister(BaseModel):

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    email: EmailStr

    phone: Optional[str] = None

    password: str = Field(
        ...,
        min_length=8
    )

    role: str = "patient"

    # Patient / Doctor hospital assignment
    hospital_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    # Doctor fields
    specialization: Optional[str] = None

    hospital_name: Optional[str] = None

    license_number: Optional[str] = None

    experience_years: Optional[int] = Field(
        default=0,
        ge=0
    )

    consultation_fee: Optional[float] = Field(
        default=0.0,
        ge=0
    )


# =========================================================
# USER LOGIN SCHEMA
# =========================================================

class UserLogin(BaseModel):

    email: EmailStr

    password: str
