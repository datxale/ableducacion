from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.live_class import LiveClass
from app.models.grade import Grade
from app.models.subject import Subject
from app.schemas.live_class import LiveClassCreate, LiveClassUpdate, LiveClassResponse
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.user import User

router = APIRouter(prefix="/api/live-classes", tags=["Clases en Vivo"])


@router.get("/", response_model=List[LiveClassResponse])
def list_live_classes(
    grade_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LiveClass)
    if grade_id is not None:
        query = query.filter(LiveClass.grade_id == grade_id)
    if subject_id is not None:
        query = query.filter(LiveClass.subject_id == subject_id)
    if teacher_id is not None:
        query = query.filter(LiveClass.teacher_id == teacher_id)
    if from_date is not None:
        query = query.filter(LiveClass.scheduled_at >= from_date)
    if to_date is not None:
        query = query.filter(LiveClass.scheduled_at <= to_date)
    return query.order_by(LiveClass.scheduled_at).offset(skip).limit(limit).all()


@router.get("/{class_id}", response_model=LiveClassResponse)
def get_live_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    return live_class


@router.post("/", response_model=LiveClassResponse, status_code=status.HTTP_201_CREATED)
def create_live_class(
    class_data: LiveClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    grade = db.query(Grade).filter(Grade.id == class_data.grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    subject = db.query(Subject).filter(Subject.id == class_data.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )
    live_class = LiveClass(
        **class_data.model_dump(),
        teacher_id=current_user.id,
    )
    db.add(live_class)
    db.commit()
    db.refresh(live_class)
    return live_class


@router.put("/{class_id}", response_model=LiveClassResponse)
def update_live_class(
    class_id: int,
    class_data: LiveClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    if class_data.grade_id is not None:
        grade = db.query(Grade).filter(Grade.id == class_data.grade_id).first()
        if not grade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grado no encontrado",
            )
    if class_data.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == class_data.subject_id).first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asignatura no encontrada",
            )
    for field, value in class_data.model_dump(exclude_unset=True).items():
        setattr(live_class, field, value)
    db.commit()
    db.refresh(live_class)
    return live_class


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_live_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    db.delete(live_class)
    db.commit()
