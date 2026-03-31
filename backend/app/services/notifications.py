from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.user import User, UserRole


def create_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.info,
    link: Optional[str] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
    )
    db.add(notification)
    return notification


def create_notifications_for_users(
    db: Session,
    *,
    user_ids: Iterable[int],
    title: str,
    message: str,
    notification_type: NotificationType = NotificationType.info,
    link: Optional[str] = None,
    exclude_user_id: Optional[int] = None,
) -> None:
    seen_user_ids = set()
    for user_id in user_ids:
        if user_id == exclude_user_id or user_id in seen_user_ids:
            continue
        seen_user_ids.add(user_id)
        create_notification(
            db,
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link,
        )


def notify_grade_students(
    db: Session,
    *,
    grade_id: int,
    title: str,
    message: str,
    notification_type: NotificationType,
    link: Optional[str] = None,
) -> None:
    students = (
        db.query(User)
        .filter(
            User.role == UserRole.estudiante,
            User.grade_id == grade_id,
            User.is_active.is_(True),
        )
        .all()
    )
    create_notifications_for_users(
        db,
        user_ids=[student.id for student in students],
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
    )
