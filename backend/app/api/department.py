
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.department import Department
from app.models.hospital import Hospital
from app.schemas.department import DepartmentCreate


router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


# CREATE DEPARTMENT
@router.post("/")
def create_department(
    department_data: DepartmentCreate,
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Check selected hospital
    hospital = None

    if hospital_id is not None:
        hospital = (
            db.query(Hospital)
            .filter(Hospital.id == hospital_id)
            .first()
        )

        if not hospital:
            raise HTTPException(
                status_code=404,
                detail="Hospital not found"
            )

        if not hospital.is_active:
            raise HTTPException(
                status_code=400,
                detail="Hospital is inactive"
            )

    # Check duplicate department within the same hospital
    existing_query = db.query(Department).filter(
        func.lower(func.trim(Department.name))
        == department_data.name.strip().lower()
    )

    if hospital_id is not None:
        existing_query = existing_query.filter(
            Department.hospital_id == hospital_id
        )
    else:
        existing_query = existing_query.filter(
            Department.hospital_id.is_(None)
        )

    if existing_query.first():
        raise HTTPException(
            status_code=400,
            detail="Department already exists in this hospital"
        )

    # Create department
    new_department = Department(
        name=department_data.name.strip(),
        description=department_data.description,
        hospital_id=hospital_id
    )

    try:
        db.add(new_department)
        db.commit()
        db.refresh(new_department)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create department"
        )

    return {
        "message": "Department created successfully",
        "department_id": new_department.id,
        "name": new_department.name,
        "description": new_department.description,
        "hospital_id": new_department.hospital_id,
        "hospital_name": hospital.name if hospital else None
    }


# GET DEPARTMENTS
@router.get("/")
def get_departments(
    hospital_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Department).filter(
        Department.is_active.is_(True)
    )

    # Return only departments belonging to selected hospital
    if hospital_id is not None:
        hospital = (
            db.query(Hospital)
            .filter(Hospital.id == hospital_id)
            .first()
        )

        if not hospital:
            raise HTTPException(
                status_code=404,
                detail="Hospital not found"
            )

        query = query.filter(
            Department.hospital_id == hospital_id
        )

    departments = query.order_by(Department.id).all()

    return [
        {
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "is_active": department.is_active,
            "hospital_id": department.hospital_id
        }
        for department in departments
    ]


# GET ONE DEPARTMENT
@router.get("/{department_id}")
def get_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    department = (
        db.query(Department)
        .filter(Department.id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    return {
        "id": department.id,
        "name": department.name,
        "description": department.description,
        "is_active": department.is_active,
        "hospital_id": department.hospital_id
    }
