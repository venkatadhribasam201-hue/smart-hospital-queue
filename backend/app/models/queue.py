from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class QueueToken(Base):

    __tablename__ = "queue_tokens"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    appointment_id = Column(
        Integer,
        ForeignKey("appointments.id"),
        nullable=False
    )

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

    token_number = Column(
        Integer,
        nullable=False
    )

    queue_date = Column(
        Date,
        nullable=False
    )

    status = Column(
        String,
        default="waiting",
        nullable=False
    )

    estimated_waiting_time = Column(
        Integer,
        default=0,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    appointment = relationship(
        "Appointment",
        back_populates="queue_token"
    )

    patient = relationship(
        "Patient",
        back_populates="queue_tokens"
    )

    doctor = relationship(
        "Doctor",
        back_populates="queue_tokens"
    )