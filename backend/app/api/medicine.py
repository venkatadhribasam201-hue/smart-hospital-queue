from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.medicine import Medicine
from app.schemas.medicine import MedicineCreate


router = APIRouter(
    prefix="/medicines",
    tags=["Medicines"]
)


@router.post("/")
def create_medicine(
    medicine_data: MedicineCreate,
    db: Session = Depends(get_db)
):

    existing_medicine = db.query(Medicine).filter(
        Medicine.name == medicine_data.name
    ).first()

    if existing_medicine:
        raise HTTPException(
            status_code=400,
            detail="Medicine already exists"
        )

    new_medicine = Medicine(
        name=medicine_data.name,
        category=medicine_data.category,
        description=medicine_data.description,
        stock_quantity=medicine_data.stock_quantity,
        price=medicine_data.price,
        is_active=medicine_data.is_active
    )

    db.add(new_medicine)
    db.commit()
    db.refresh(new_medicine)

    return {
        "message": "Medicine created successfully",
        "medicine_id": new_medicine.id,
        "name": new_medicine.name,
        "category": new_medicine.category,
        "description": new_medicine.description,
        "stock_quantity": new_medicine.stock_quantity,
        "price": new_medicine.price,
        "is_active": new_medicine.is_active
    }


@router.get("/")
def get_medicines(
    db: Session = Depends(get_db)
):

    medicines = db.query(Medicine).order_by(
        Medicine.id
    ).all()

    return [
        {
            "id": medicine.id,
            "name": medicine.name,
            "category": medicine.category,
            "description": medicine.description,
            "stock_quantity": medicine.stock_quantity,
            "price": medicine.price,
            "is_active": medicine.is_active
        }
        for medicine in medicines
    ]


@router.get("/{medicine_id}")
def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db)
):

    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id
    ).first()

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )

    return {
        "id": medicine.id,
        "name": medicine.name,
        "category": medicine.category,
        "description": medicine.description,
        "stock_quantity": medicine.stock_quantity,
        "price": medicine.price,
        "is_active": medicine.is_active
    }


@router.put("/{medicine_id}")
def update_medicine(
    medicine_id: int,
    medicine_data: MedicineCreate,
    db: Session = Depends(get_db)
):

    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id
    ).first()

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )

    medicine.name = medicine_data.name
    medicine.category = medicine_data.category
    medicine.description = medicine_data.description
    medicine.stock_quantity = medicine_data.stock_quantity
    medicine.price = medicine_data.price
    medicine.is_active = medicine_data.is_active

    db.commit()
    db.refresh(medicine)

    return {
        "message": "Medicine updated successfully",
        "medicine_id": medicine.id,
        "name": medicine.name,
        "category": medicine.category,
        "stock_quantity": medicine.stock_quantity,
        "price": medicine.price,
        "is_active": medicine.is_active
    }


@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db)
):

    medicine = db.query(Medicine).filter(
        Medicine.id == medicine_id
    ).first()

    if not medicine:
        raise HTTPException(
            status_code=404,
            detail="Medicine not found"
        )

    db.delete(medicine)
    db.commit()

    return {
        "message": "Medicine deleted successfully",
        "medicine_id": medicine_id
    }