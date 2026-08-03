"""
Notifications router — user notification feed.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database.models import Notification, User
from backend.database.schemas import NotificationOut
from backend.routers.auth import auth_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationOut])
def list_notifications(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """List all notifications for the current user."""
    return db.query(Notification).filter(
        Notification.user_id == user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()


@router.put("/{notif_id}/read")
def mark_read(
    notif_id: str,
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == user.id,
    ).first()
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "read"}


@router.put("/read-all")
def mark_all_read(
    user: User = Depends(auth_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"status": "all read"}
