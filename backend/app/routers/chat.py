from datetime import datetime, timezone
from typing import List, Set

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.academic_group import AcademicGroup
from app.models.chat_message import ChatMessage
from app.models.live_class import LiveClass
from app.models.user import User, UserRole
from app.schemas.chat import ChatContactResponse, ChatMessageCreate, ChatMessageResponse

router = APIRouter(prefix="/api/chat", tags=["Chat"])


def _teacher_grade_ids(db: Session, teacher_id: int) -> Set[int]:
    group_grade_ids = {
        item.grade_id
        for item in db.query(AcademicGroup).filter(AcademicGroup.teacher_id == teacher_id).all()
    }
    class_grade_ids = {
        item.grade_id
        for item in db.query(LiveClass).filter(LiveClass.teacher_id == teacher_id).all()
    }
    return group_grade_ids | class_grade_ids


def _allowed_contact_ids(db: Session, current_user: User) -> Set[int]:
    if current_user.role == UserRole.admin:
        return {
            user.id
            for user in db.query(User)
            .filter(User.id != current_user.id, User.is_active == True)
            .all()
        }

    admin_ids = {
        admin.id
        for admin in db.query(User)
        .filter(User.role == UserRole.admin, User.is_active == True)
        .all()
    }

    if current_user.role == UserRole.estudiante:
        teacher_ids: Set[int] = set()
        if current_user.group_id:
            group = db.query(AcademicGroup).filter(AcademicGroup.id == current_user.group_id).first()
            if group and group.teacher_id:
                teacher_ids.add(group.teacher_id)
        if not teacher_ids and current_user.grade_id:
            teacher_ids.update(
                item.teacher_id
                for item in db.query(AcademicGroup)
                .filter(
                    AcademicGroup.grade_id == current_user.grade_id,
                    AcademicGroup.teacher_id.isnot(None),
                    AcademicGroup.is_active == True,
                )
                .all()
                if item.teacher_id
            )
            teacher_ids.update(
                item.teacher_id
                for item in db.query(LiveClass)
                .filter(LiveClass.grade_id == current_user.grade_id)
                .all()
                if item.teacher_id
            )
        return teacher_ids | admin_ids

    allowed: Set[int] = set(admin_ids)
    grade_ids = _teacher_grade_ids(db, current_user.id)
    group_ids = {
        item.id
        for item in db.query(AcademicGroup).filter(AcademicGroup.teacher_id == current_user.id).all()
    }
    student_query = db.query(User).filter(
        User.role == UserRole.estudiante,
        User.is_active == True,
    )
    if group_ids:
        student_query = student_query.filter(
            or_(
                User.group_id.in_(group_ids),
                and_(User.group_id.is_(None), User.grade_id.in_(grade_ids or {-1})),
            )
        )
    elif grade_ids:
        student_query = student_query.filter(User.grade_id.in_(grade_ids))
    else:
        student_query = student_query.filter(User.id == -1)
    allowed.update(student.id for student in student_query.all())
    return allowed


def _ensure_contact_allowed(db: Session, current_user: User, contact_id: int) -> User:
    allowed_ids = _allowed_contact_ids(db, current_user)
    if contact_id not in allowed_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para conversar con este usuario",
        )
    contact = db.query(User).filter(User.id == contact_id, User.is_active == True).first()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
        )
    return contact


@router.get("/contacts", response_model=List[ChatContactResponse])
def list_contacts(
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    allowed_ids = _allowed_contact_ids(db, current_user)
    if not allowed_ids:
        return []

    query = db.query(User).filter(User.id.in_(allowed_ids), User.is_active == True)
    if search.strip():
        query = query.filter(User.full_name.ilike(f"%{search.strip()}%"))

    contacts = query.order_by(User.role, User.full_name).all()
    items: List[ChatContactResponse] = []
    for contact in contacts:
        last_message = (
            db.query(ChatMessage)
            .filter(
                or_(
                    and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == contact.id),
                    and_(ChatMessage.sender_id == contact.id, ChatMessage.recipient_id == current_user.id),
                )
            )
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        unread_count = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.sender_id == contact.id,
                ChatMessage.recipient_id == current_user.id,
                ChatMessage.is_read == False,
            )
            .count()
        )
        payload = ChatContactResponse.model_validate(contact).model_dump()
        payload.update(
            {
                "unread_count": unread_count,
                "last_message": last_message.content if last_message else None,
                "last_message_at": last_message.created_at if last_message else None,
            }
        )
        items.append(ChatContactResponse(**payload))
    return items


@router.get("/messages/{contact_id}", response_model=List[ChatMessageResponse])
def list_messages(
    contact_id: int,
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_contact_allowed(db, current_user, contact_id)
    messages = (
        db.query(ChatMessage)
        .filter(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == contact_id),
                and_(ChatMessage.sender_id == contact_id, ChatMessage.recipient_id == current_user.id),
            )
        )
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )

    unread_messages = [
        message
        for message in messages
        if message.sender_id == contact_id and message.recipient_id == current_user.id and not message.is_read
    ]
    if unread_messages:
        now = datetime.now(timezone.utc)
        for message in unread_messages:
            message.is_read = True
            message.read_at = now
        db.commit()

    return messages


@router.post("/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if message_data.recipient_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviarte mensajes a ti mismo",
        )
    _ensure_contact_allowed(db, current_user, message_data.recipient_id)
    message = ChatMessage(
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        content=message_data.content.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
