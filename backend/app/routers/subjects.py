from typing import List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.academic_group import AcademicGroup
from app.models.subject import Subject
from app.models.grade import Grade
from app.models.live_class import LiveClass
from app.models.user import User, UserRole
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/subjects", tags=["Asignaturas"])


def _allowed_grade_ids_for_teacher(db: Session, teacher_id: int) -> Set[int]:
    group_grade_ids = {
        item.grade_id
        for item in db.query(AcademicGroup).filter(AcademicGroup.teacher_id == teacher_id).all()
    }
    class_grade_ids = {
        item.grade_id
        for item in db.query(LiveClass).filter(LiveClass.teacher_id == teacher_id).all()
    }
    return group_grade_ids | class_grade_ids


@router.get("/", response_model=List[SubjectResponse])
def list_subjects(
    grade_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Subject)
    if current_user.role == UserRole.docente:
        allowed_grade_ids = _allowed_grade_ids_for_teacher(db, current_user.id)
        if not allowed_grade_ids:
            return []
        query = query.filter(Subject.grade_id.in_(allowed_grade_ids))
    if grade_id is not None:
        if current_user.role == UserRole.docente and grade_id not in _allowed_grade_ids_for_teacher(db, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para acceder a esta asignatura",
            )
        query = query.filter(Subject.grade_id == grade_id)
    return query.order_by(Subject.grade_id, Subject.name).all()


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )
    if current_user.role == UserRole.docente:
        allowed_grade_ids = _allowed_grade_ids_for_teacher(db, current_user.id)
        if subject.grade_id not in allowed_grade_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para acceder a esta asignatura",
            )
    return subject


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    grade = db.query(Grade).filter(Grade.id == subject_data.grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    existing = (
        db.query(Subject)
        .filter(
            Subject.name == subject_data.name,
            Subject.grade_id == subject_data.grade_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe esa asignatura para este grado",
        )
    subject = Subject(**subject_data.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )
    if subject_data.grade_id is not None:
        grade = db.query(Grade).filter(Grade.id == subject_data.grade_id).first()
        if not grade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grado no encontrado",
            )
    for field, value in subject_data.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )
    db.delete(subject)
    db.commit()
