from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Doctor(Base):

    __tablename__ = "doctors"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    specialization = Column(
        String,
        nullable=False
    )

    hospital_name = Column(
        String,
        nullable=True
    )

    license_number = Column(
        String,
        unique=True,
        nullable=False
    )

    experience_years = Column(
        Integer,
        default=0
    )

    consultation_fee = Column(
        Float,
        default=0.0
    )

    user = relationship(
        "User",
        back_populates="doctor"
    )

    appointments = relationship(
        "Appointment",
        back_populates="doctor"
    )

    queue_tokens = relationship(
        "QueueToken",
        back_populates="doctor"
    )
