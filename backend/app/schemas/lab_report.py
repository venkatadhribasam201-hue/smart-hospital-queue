from pydantic import BaseModel
from typing import Optional


class LabReportCreate(BaseModel):
    lab_test_id: int
    patient_id: int
    result: Optional[str] = None
    result_value: Optional[str] = None
    normal_range: Optional[str] = None
    report_status: str = "completed"