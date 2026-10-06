from sqlalchemy import Column, Integer, String, Float, Boolean

from app.database.database import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        unique=True,
        nullable=False
    )

    category = Column(
        String,
        nullable=True
    )

    description = Column(
        String,
        nullable=True
    )

    stock_quantity = Column(
        Integer,
        default=0,
        nullable=False
    )

    price = Column(
        Float,
        default=0.0,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )