from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    try:
        payload = decode_access_token(token)
        user_id = int(payload["user_id"])

    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user


def get_current_doctor(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.doctor import Doctor

    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Doctor access only"
        )

    doctor = (
        db.query(Doctor)
        .filter(Doctor.user_id == current_user.id)
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=403,
            detail="Doctor profile not found"
        )

    if not doctor.hospital_id:
        raise HTTPException(
            status_code=403,
            detail="No hospital assigned to this doctor"
        )

    return doctor
