from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Appointment(Base):

    __tablename__ = "appointments"

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

    doctor_id = Column(
        Integer,
        ForeignKey("doctors.id"),
        nullable=False
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False
    )

    appointment_date = Column(
        Date,
        nullable=False
    )

    reason = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="scheduled",
        nullable=False
    )

    patient = relationship(
        "Patient",
        back_populates="appointments"
    )

    doctor = relationship(
        "Doctor",
        back_populates="appointments"
    )

    department = relationship(
        "Department",
        back_populates="appointments"
    )

    queue_token = relationship(
        "QueueToken",
        back_populates="appointment",
        uselist=False
    )