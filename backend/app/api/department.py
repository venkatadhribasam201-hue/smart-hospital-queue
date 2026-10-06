from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.department import Department
from app.schemas.department import DepartmentCreate


router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


@router.post("/")
def create_department(
    department_data: DepartmentCreate,
    db: Session = Depends(get_db)
):
    existing_department = (
        db.query(Department)
        .filter(Department.name == department_data.name)
        .first()
    )

    if existing_department:
        raise HTTPException(
            status_code=400,
            detail="Department already exists"
        )

    new_department = Department(
        name=department_data.name,
        description=department_data.description
    )

    db.add(new_department)
    db.commit()
    db.refresh(new_department)

    return {
        "message": "Department created successfully",
        "department_id": new_department.id,
        "name": new_department.name,
        "description": new_department.description
    }


@router.get("/")
def get_departments(
    db: Session = Depends(get_db)
):
    departments = (
        db.query(Department)
        .filter(Department.is_active == True)
        .all()
    )

    return [
        {
            "id": department.id,
            "name": department.name,
            "description": department.description,
            "is_active": department.is_active
        }
        for department in departments
    ]