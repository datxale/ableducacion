from typing import List, Set

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.academic_group import AcademicGroup
from app.models.grade import Grade
from app.models.live_class import LiveClass
from app.models.user import User, UserRole
from app.schemas.grade import GradeCreate, GradeUpdate, GradeResponse

router = APIRouter(prefix="/api/grades", tags=["Grados"])


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


@router.get("/public", response_model=List[GradeResponse])
def list_public_grades(db: Session = Depends(get_db)):
    return db.query(Grade).order_by(Grade.id).all()


@router.get("/", response_model=List[GradeResponse])
def list_grades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Grade)
    if current_user.role == UserRole.docente:
        allowed_grade_ids = _allowed_grade_ids_for_teacher(db, current_user.id)
        if not allowed_grade_ids:
            return []
        query = query.filter(Grade.id.in_(allowed_grade_ids))
    return query.order_by(Grade.id).all()


@router.get("/{grade_id}", response_model=GradeResponse)
def get_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    if current_user.role == UserRole.docente:
        allowed_grade_ids = _allowed_grade_ids_for_teacher(db, current_user.id)
        if grade.id not in allowed_grade_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para acceder a este grado",
            )
    return grade


@router.post("/", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def create_grade(
    grade_data: GradeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing = db.query(Grade).filter(Grade.name == grade_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un grado con ese nombre",
        )
    grade = Grade(**grade_data.model_dump())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.put("/{grade_id}", response_model=GradeResponse)
def update_grade(
    grade_id: int,
    grade_data: GradeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    for field, value in grade_data.model_dump(exclude_unset=True).items():
        setattr(grade, field, value)
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    db.delete(grade)
    db.commit()
