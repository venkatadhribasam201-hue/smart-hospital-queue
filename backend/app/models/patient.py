from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Patient(Base):

    __tablename__ = "patients"

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

    date_of_birth = Column(
        Date,
        nullable=True
    )

    gender = Column(
        String,
        nullable=True
    )

    blood_group = Column(
        String,
        nullable=True
    )

    address = Column(
        String,
        nullable=True
    )

    emergency_contact = Column(
        String,
        nullable=True
    )

    user = relationship(
    "User",
    back_populates="patient"
)

    appointments = relationship(
        "Appointment",
        back_populates="patient"
    )

    queue_tokens = relationship(
    "QueueToken",
    back_populates="patient"
)

    vitals = relationship(
    "Vital",
    back_populates="patient"
)