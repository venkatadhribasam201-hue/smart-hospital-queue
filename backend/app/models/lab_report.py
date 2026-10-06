from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime

from app.database.database import Base


class LabReport(Base):
    __tablename__ = "lab_reports"

    id = Column(Integer, primary_key=True, index=True)

    lab_test_id = Column(
        Integer,
        ForeignKey("lab_tests.id"),
        nullable=False
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False
    )

    result = Column(String, nullable=True)

    result_value = Column(String, nullable=True)

    normal_range = Column(String, nullable=True)

    report_status = Column(
        String,
        default="completed",
        nullable=False
    )

    report_date = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )