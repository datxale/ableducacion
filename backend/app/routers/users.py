from typing import List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.academic_group import AcademicGroup
from app.models.grade import Grade
from app.models.live_class import LiveClass
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserPublic, UserResponse
from app.services.auth import hash_password
from app.middleware.auth import get_current_user, require_admin, require_admin_or_docente

router = APIRouter(prefix="/api/users", tags=["Usuarios"])


def _allowed_scope_for_teacher(db: Session, teacher_id: int) -> tuple[Set[int], Set[int]]:
    groups = db.query(AcademicGroup).filter(AcademicGroup.teacher_id == teacher_id).all()
    group_ids = {item.id for item in groups}
    group_grade_ids = {item.grade_id for item in groups}
    class_grade_ids = {
        item.grade_id
        for item in db.query(LiveClass).filter(LiveClass.teacher_id == teacher_id).all()
    }
    return group_grade_ids | class_grade_ids, group_ids


def _validate_user_assignment(
    db: Session,
    role: UserRole,
    grade_id: Optional[int],
    group_id: Optional[int],
    current_user_id: Optional[int] = None,
) -> Optional[AcademicGroup]:
    if role == UserRole.admin:
        return None

    if grade_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Debe asignar un grado al {role.value}.",
        )

    if group_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Debe asignar una seccion al {role.value}.",
        )

    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )

    group = db.query(AcademicGroup).filter(AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seccion no encontrada",
        )

    if group.grade_id != grade_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La seccion seleccionada no pertenece al grado indicado.",
        )

    if (
        role == UserRole.docente
        and group.teacher_id is not None
        and group.teacher_id != current_user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La seccion seleccionada ya tiene otro docente asignado.",
        )

    return group


@router.get("/me", response_model=UserPublic)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=List[UserPublic])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[UserRole] = None,
    grade_id: Optional[int] = None,
    group_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    query = db.query(User)
    if current_user.role == UserRole.docente:
        allowed_grade_ids, allowed_group_ids = _allowed_scope_for_teacher(db, current_user.id)

        if grade_id is not None and grade_id not in allowed_grade_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para consultar usuarios de este grado",
            )
        if group_id is not None and group_id not in allowed_group_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para consultar usuarios de esta seccion",
            )

        if role == UserRole.docente:
            query = query.filter(User.id == current_user.id)
        elif role == UserRole.admin:
            return []
        else:
            if not allowed_grade_ids and not allowed_group_ids:
                return []
            query = query.filter(
                or_(
                    User.id == current_user.id,
                    and_(User.group_id.isnot(None), User.group_id.in_(allowed_group_ids or {-1})),
                    and_(User.group_id.is_(None), User.grade_id.in_(allowed_grade_ids or {-1})),
                )
            )
    if role:
        query = query.filter(User.role == role)
    if grade_id is not None:
        query = query.filter(User.grade_id == grade_id)
    if group_id is not None:
        query = query.filter(User.group_id == group_id)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserPublic)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    if current_user.role == UserRole.docente and current_user.id != user.id:
        allowed_grade_ids, allowed_group_ids = _allowed_scope_for_teacher(db, current_user.id)
        can_access = (
            (user.group_id is not None and user.group_id in allowed_group_ids)
            or (user.group_id is None and user.grade_id in allowed_grade_ids)
        )
        if not can_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para acceder a este usuario",
            )
    return user


@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese correo electrónico",
        )
    selected_group = _validate_user_assignment(
        db,
        user_data.role,
        user_data.grade_id,
        user_data.group_id,
    )
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        age=user_data.age,
        birth_date=user_data.birth_date,
        document_id=user_data.document_id,
        professions=user_data.professions,
        phone=user_data.phone,
        whatsapp=user_data.whatsapp,
        grade_id=user_data.grade_id,
        group_id=user_data.group_id,
        is_active=True,
    )
    db.add(new_user)
    db.flush()
    if user_data.role == UserRole.docente and selected_group is not None:
        selected_group.teacher_id = new_user.id
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para editar este usuario",
        )
    update_data = user_data.model_dump(exclude_unset=True)
    if current_user.role == UserRole.admin:
        next_role = update_data.get("role", user.role)
        next_grade_id = update_data.get("grade_id", user.grade_id)
        next_group_id = update_data.get("group_id", user.group_id)
        selected_group = _validate_user_assignment(
            db,
            next_role,
            next_grade_id,
            next_group_id,
            current_user_id=user.id,
        )
    else:
        selected_group = None
    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(user, field, value)
    if current_user.role == UserRole.admin and user.role == UserRole.docente and selected_group is not None:
        selected_group.teacher_id = user.id
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede eliminar su propia cuenta",
        )
    db.delete(user)
    db.commit()
