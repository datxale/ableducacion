from typing import List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin, require_admin_or_docente
from app.models.academic_group import AcademicGroup
from app.models.grade import Grade
from app.models.live_class import LiveClass
from app.models.user import User, UserRole
from app.schemas.academic_group import (
    AcademicGroupCreate,
    AcademicGroupResponse,
    AcademicGroupUpdate,
)

router = APIRouter(prefix="/api/groups", tags=["Grupos"])


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


def _ensure_docente_can_manage_grade(db: Session, current_user: User, grade_id: int) -> None:
    if current_user.role != UserRole.docente:
        return
    allowed_grade_ids = _allowed_grade_ids_for_teacher(db, current_user.id)
    if grade_id not in allowed_grade_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para gestionar secciones de este grado",
        )


def _ensure_docente_can_access_group(db: Session, current_user: User, group: AcademicGroup) -> None:
    if current_user.role != UserRole.docente:
        return
    allowed_grade_ids = _allowed_grade_ids_for_teacher(db, current_user.id)
    if group.teacher_id != current_user.id and group.grade_id not in allowed_grade_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a esta seccion",
        )


def _validate_teacher(db: Session, teacher_id: Optional[int]) -> Optional[User]:
    if teacher_id is None:
        return None
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or teacher.role != UserRole.docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado",
        )
    return teacher


def _validate_grade(db: Session, grade_id: int) -> Grade:
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    return grade


@router.get("/", response_model=List[AcademicGroupResponse])
def list_groups(
    grade_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    query = db.query(AcademicGroup)
    if current_user.role == UserRole.docente:
        allowed_grade_ids = _allowed_grade_ids_for_teacher(db, current_user.id)
        if teacher_id is not None and teacher_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para consultar secciones de otro docente",
            )
        if grade_id is not None and grade_id not in allowed_grade_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para consultar secciones de este grado",
            )
        if not allowed_grade_ids:
            return []
        query = query.filter(AcademicGroup.grade_id.in_(allowed_grade_ids))
    if grade_id is not None:
        query = query.filter(AcademicGroup.grade_id == grade_id)
    if teacher_id is not None:
        query = query.filter(AcademicGroup.teacher_id == teacher_id)
    if is_active is not None:
        query = query.filter(AcademicGroup.is_active == is_active)
    return query.order_by(AcademicGroup.grade_id, AcademicGroup.name).all()


@router.get("/{group_id}", response_model=AcademicGroupResponse)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    group = db.query(AcademicGroup).filter(AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo no encontrado",
        )
    _ensure_docente_can_access_group(db, current_user, group)
    return group


@router.post("/", response_model=AcademicGroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_data: AcademicGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    _validate_grade(db, group_data.grade_id)
    _validate_teacher(db, group_data.teacher_id)
    _ensure_docente_can_manage_grade(db, current_user, group_data.grade_id)
    if current_user.role == UserRole.docente and group_data.teacher_id not in (None, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes asignarte a ti mismo como docente de la seccion",
        )

    existing = (
        db.query(AcademicGroup)
        .filter(
            AcademicGroup.grade_id == group_data.grade_id,
            AcademicGroup.name == group_data.name,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un grupo con ese nombre para el grado seleccionado",
        )

    payload = group_data.model_dump()
    if current_user.role == UserRole.docente and payload.get("teacher_id") is None:
        payload["teacher_id"] = current_user.id

    group = AcademicGroup(**payload)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/{group_id}", response_model=AcademicGroupResponse)
def update_group(
    group_id: int,
    group_data: AcademicGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    group = db.query(AcademicGroup).filter(AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo no encontrado",
        )
    _ensure_docente_can_access_group(db, current_user, group)

    update_data = group_data.model_dump(exclude_unset=True)
    if "grade_id" in update_data:
        _validate_grade(db, update_data["grade_id"])
        _ensure_docente_can_manage_grade(db, current_user, update_data["grade_id"])
    if "teacher_id" in update_data:
        _validate_teacher(db, update_data["teacher_id"])
        if current_user.role == UserRole.docente and update_data["teacher_id"] not in (None, current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes asignarte a ti mismo como docente de la seccion",
            )

    for field, value in update_data.items():
        setattr(group, field, value)

    db.commit()
    db.refresh(group)
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    group = db.query(AcademicGroup).filter(AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo no encontrado",
        )
    _ensure_docente_can_access_group(db, current_user, group)
    db.delete(group)
    db.commit()
