from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class Vital(Base):

    __tablename__ = "vitals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False
    )

    temperature = Column(
        Float,
        nullable=True
    )

    blood_pressure = Column(
        String,
        nullable=True
    )

    heart_rate = Column(
        Integer,
        nullable=True
    )

    oxygen_level = Column(
        Float,
        nullable=True
    )

    recorded_at = Column(
    DateTime,
    default=datetime.utcnow,
    nullable=False
)

    patient = relationship(
        "Patient",
        back_populates="vitals"
    )