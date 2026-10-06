from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.lab_report import LabReport
from app.models.lab_test import LabTest
from app.models.patient import Patient
from app.models.notification import Notification
from app.schemas.lab_report import LabReportCreate


router = APIRouter(
    prefix="/lab-reports",
    tags=["Lab Reports"]
)


@router.post("/")
def create_lab_report(
    report_data: LabReportCreate,
    db: Session = Depends(get_db)
):

    # Check lab test
    lab_test = db.query(LabTest).filter(
        LabTest.id == report_data.lab_test_id
    ).first()

    if not lab_test:
        raise HTTPException(
            status_code=404,
            detail="Lab test not found"
        )

    # Check patient
    patient = db.query(Patient).filter(
        Patient.id == report_data.patient_id
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    # Create lab report
    new_report = LabReport(
        lab_test_id=report_data.lab_test_id,
        patient_id=report_data.patient_id,
        result=report_data.result,
        result_value=report_data.result_value,
        normal_range=report_data.normal_range,
        report_status=report_data.report_status
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # Create automatic notification
    notification = Notification(
        user_id=patient.user_id,
        title="Lab Report Available",
        message=(
            "Your lab report has been completed. "
            "Please check your lab report details."
        ),
        notification_type="lab_report",
        is_read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return {
        "message": "Lab report created successfully",
        "report_id": new_report.id,
        "lab_test_id": new_report.lab_test_id,
        "patient_id": new_report.patient_id,
        "result": new_report.result,
        "result_value": new_report.result_value,
        "normal_range": new_report.normal_range,
        "report_status": new_report.report_status,
        "report_date": new_report.report_date,
        "notification": "Lab report notification created",
        "notification_id": notification.id
    }


@router.get("/")
def get_lab_reports(
    db: Session = Depends(get_db)
):

    reports = db.query(
        LabReport
    ).order_by(
        LabReport.id
    ).all()

    return [
        {
            "id": report.id,
            "lab_test_id": report.lab_test_id,
            "patient_id": report.patient_id,
            "result": report.result,
            "result_value": report.result_value,
            "normal_range": report.normal_range,
            "report_status": report.report_status,
            "report_date": report.report_date
        }
        for report in reports
    ]


@router.get("/{report_id}")
def get_lab_report(
    report_id: int,
    db: Session = Depends(get_db)
):

    report = db.query(
        LabReport
    ).filter(
        LabReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Lab report not found"
        )

    return {
        "id": report.id,
        "lab_test_id": report.lab_test_id,
        "patient_id": report.patient_id,
        "result": report.result,
        "result_value": report.result_value,
        "normal_range": report.normal_range,
        "report_status": report.report_status,
        "report_date": report.report_date
    }