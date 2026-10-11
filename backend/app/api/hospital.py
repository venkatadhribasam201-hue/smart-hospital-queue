
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.hospital import Hospital

router = APIRouter(
    prefix="/hospitals",
    tags=["Hospitals"]
)


@router.get("/")
def get_hospitals(
    search: str = "",
    city: str = "",
    db: Session = Depends(get_db)
):
    query = db.query(Hospital).filter(
        Hospital.is_active.is_(True),
        Hospital.is_approved.is_(True)
    )

    if search.strip():
        query = query.filter(
            Hospital.name.ilike(f"%{search.strip()}%")
        )

    if city.strip():
        query = query.filter(
            Hospital.city.ilike(f"%{city.strip()}%")
        )

    return query.order_by(Hospital.name).all()


@router.get("/{hospital_id}")
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    hospital = db.query(Hospital).filter(
        Hospital.id == hospital_id,
        Hospital.is_active.is_(True),
        Hospital.is_approved.is_(True)
    ).first()

    if hospital is None:
        raise HTTPException(
            status_code=404,
            detail="Hospital not found"
        )

    return hospital
