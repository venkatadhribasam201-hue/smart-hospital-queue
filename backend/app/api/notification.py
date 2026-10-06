from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationCreate


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# =========================
# CREATE NOTIFICATION
# =========================

@router.post("/")
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == notification_data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_notification = Notification(
        user_id=notification_data.user_id,
        title=notification_data.title,
        message=notification_data.message,
        notification_type=notification_data.notification_type,
        is_read=notification_data.is_read
    )

    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)

    return {
        "message": "Notification created successfully",
        "notification_id": new_notification.id,
        "user_id": new_notification.user_id,
        "title": new_notification.title,
        "notification_message": new_notification.message,
        "notification_type": new_notification.notification_type,
        "is_read": new_notification.is_read,
        "created_at": new_notification.created_at
    }


# =========================
# GET ALL NOTIFICATIONS
# =========================

@router.get("/")
def get_notifications(
    db: Session = Depends(get_db)
):

    notifications = db.query(Notification).order_by(
        Notification.id
    ).all()

    return [
        {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "is_read": notification.is_read,
            "created_at": notification.created_at
        }
        for notification in notifications
    ]


# =========================
# GET USER NOTIFICATIONS
# =========================

@router.get("/user/{user_id}")
def get_user_notifications(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    notifications = db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(
        Notification.id.desc()
    ).all()

    return [
        {
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "is_read": notification.is_read,
            "created_at": notification.created_at
        }
        for notification in notifications
    ]


# =========================
# GET SINGLE NOTIFICATION
# =========================

@router.get("/{notification_id}")
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):

    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return {
        "id": notification.id,
        "user_id": notification.user_id,
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "is_read": notification.is_read,
        "created_at": notification.created_at
    }


# =========================
# UPDATE NOTIFICATION
# =========================

@router.put("/{notification_id}")
def update_notification(
    notification_id: int,
    notification_data: NotificationCreate,
    db: Session = Depends(get_db)
):

    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    user = db.query(User).filter(
        User.id == notification_data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    notification.user_id = notification_data.user_id
    notification.title = notification_data.title
    notification.message = notification_data.message
    notification.notification_type = notification_data.notification_type
    notification.is_read = notification_data.is_read

    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification updated successfully",
        "notification_id": notification.id,
        "user_id": notification.user_id,
        "title": notification.title,
        "message_text": notification.message,
        "notification_type": notification.notification_type,
        "is_read": notification.is_read,
        "created_at": notification.created_at
    }


# =========================
# MARK NOTIFICATION AS READ
# =========================

@router.put("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db)
):

    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification marked as read",
        "notification_id": notification.id,
        "is_read": notification.is_read
    }


# =========================
# DELETE NOTIFICATION
# =========================

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):

    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully",
        "notification_id": notification_id
    }   