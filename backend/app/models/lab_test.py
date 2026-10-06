from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False
    )

    doctor_id = Column(
        Integer,
        ForeignKey("doctors.id"),
        nullable=False
    )

    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id"),
        nullable=True
    )

    test_name = Column(
        String,
        nullable=False
    )

    test_description = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="requested",
        nullable=False
    )

    requested_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )