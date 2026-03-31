from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.grade import Grade
from app.models.user import User, UserRole
from app.schemas.user import LoginRequest, PublicRegisterCreate, Token, UserPublic
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.presence import get_presence_for_users, mark_user_online

router = APIRouter(prefix="/api/auth", tags=["Autenticacion"])


class PresenceItem(BaseModel):
    user_id: int
    is_online: bool
    last_seen: Optional[datetime] = None


class PresenceResponse(BaseModel):
    items: List[PresenceItem]


def _parse_user_ids(user_ids_raw: str) -> List[int]:
    parsed: List[int] = []
    for token in user_ids_raw.split(","):
        token = token.strip()
        if not token:
            continue
        if not token.isdigit():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ID de usuario invalido: {token}",
            )
        parsed.append(int(token))

    parsed = sorted(set(parsed))
    if not parsed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe enviar al menos un user_id valido",
        )
    return parsed


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(user_data: PublicRegisterCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese correo electronico",
        )

    if user_data.role == UserRole.estudiante:
        grade = db.query(Grade).filter(Grade.id == user_data.grade_id).first()
        if not grade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grado no encontrado",
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
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador",
        )

    mark_user_online(user.id)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserPublic.model_validate(user),
    )


@router.post("/login/form", response_model=Token, include_in_schema=False)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contrasena incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador",
        )

    mark_user_online(user.id)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserPublic.model_validate(user),
    )


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    mark_user_online(current_user.id)
    return current_user


@router.post("/heartbeat", status_code=status.HTTP_204_NO_CONTENT)
def heartbeat(current_user: User = Depends(get_current_user)):
    mark_user_online(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/presence", response_model=PresenceResponse)
def get_presence(
    user_ids: str = Query(..., description="Lista de user_id separados por coma"),
    current_user: User = Depends(require_admin_or_docente),
):
    parsed_ids = _parse_user_ids(user_ids)
    items = get_presence_for_users(parsed_ids)
    return PresenceResponse(items=[PresenceItem(**item) for item in items])


@router.post("/impersonate/{user_id}", response_model=Token)
def impersonate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo un administrador puede impersonar usuarios",
        )

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede impersonar su propia cuenta",
        )

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if not target_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puede impersonar un usuario inactivo",
        )

    mark_user_online(target_user.id)
    access_token = create_access_token(
        data={
            "sub": str(target_user.id),
            "email": target_user.email,
            "role": target_user.role.value,
            "impersonated_by": str(current_user.id),
        },
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserPublic.model_validate(target_user),
    )
