from pydantic import BaseModel
from typing import Optional


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: Optional[str] = None
    is_read: bool = False