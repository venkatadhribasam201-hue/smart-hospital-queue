
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    phone = Column(
        String,
        nullable=True
    )

    # Store a securely hashed password, never plain text.
    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        default="patient",
        nullable=False,
        index=True
    )

    # One-to-one relationships
    patient = relationship(
        "Patient",
        back_populates="user",
        uselist=False
    )

    doctor = relationship(
        "Doctor",
        back_populates="user",
        uselist=False
    )

    # One user can have multiple notifications
    notifications = relationship(
        "Notification",
        back_populates="user"
    )
