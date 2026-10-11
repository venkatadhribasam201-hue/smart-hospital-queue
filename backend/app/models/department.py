
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)

    # Same department name can exist in different hospitals
    name = Column(String, nullable=False, index=True)

    description = Column(String, nullable=True)

    hospital_id = Column(
        Integer,
        ForeignKey("hospitals.id"),
        nullable=True,
        index=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    hospital = relationship("Hospital")

    appointments = relationship(
        "Appointment",
        back_populates="department"
    )
