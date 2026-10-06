from pydantic import BaseModel
from typing import Optional


class MedicineCreate(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    stock_quantity: int = 0
    price: float = 0.0
    is_active: bool = True