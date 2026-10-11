from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(200),
        nullable=False,
        index=True
    )

    address = Column(Text, nullable=False)

    city = Column(
        String(100),
        nullable=False,
        index=True
    )

    state = Column(
        String(100),
        nullable=False,
        index=True
    )

    pincode = Column(String(10), nullable=True)

    phone = Column(String(20), nullable=True)

    email = Column(String(150), nullable=True)

    latitude = Column(Float, nullable=True)

    longitude = Column(Float, nullable=True)

    description = Column(Text, nullable=True)

    image_url = Column(String(500), nullable=True)

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    is_approved = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # Doctors assigned to this hospital
    doctors = relationship(
        "Doctor",
        back_populates="hospital"
    )

    # Patients associated with this hospital
    patients = relationship(
        "Patient",
        back_populates="hospital"
    )