
from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    # Primary key
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Patient who booked the appointment
    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
        index=True
    )

    # Assigned doctor
    doctor_id = Column(
        Integer,
        ForeignKey("doctors.id"),
        nullable=False,
        index=True
    )

    # Department for the appointment
    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=False,
        index=True
    )

    # Appointment details
    appointment_date = Column(
        Date,
        nullable=False,
        index=True
    )

    reason = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="scheduled",
        nullable=False,
        index=True
    )

    # Relationships
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
