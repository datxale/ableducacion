from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.estudiante
    age: Optional[int] = None
    birth_date: Optional[date] = None
    document_id: Optional[str] = None
    professions: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    grade_id: Optional[int] = None
    group_id: Optional[int] = None

    @field_validator("full_name")
    @classmethod
    def full_name_required(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El nombre completo es obligatorio")
        return normalized

    @field_validator("document_id", "professions", "phone", "whatsapp", mode="before")
    @classmethod
    def normalize_optional_strings(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.strip()
            return normalized or None
        return value

    @field_validator("age")
    @classmethod
    def validate_age(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return None
        if value < 3 or value > 120:
            raise ValueError("La edad debe estar entre 3 y 120")
        return value


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value: str) -> str:
        if len(value) < 6:
            raise ValueError("La contrasena debe tener al menos 6 caracteres")
        return value


class PublicRegisterCreate(UserCreate):
    @model_validator(mode="after")
    def validate_registration_fields(self):
        if self.role == UserRole.estudiante:
            if self.age is None:
                raise ValueError("La edad es obligatoria para estudiantes")
            if self.grade_id is None:
                raise ValueError("El grado es obligatorio para estudiantes")

        if self.role == UserRole.docente:
            missing_labels = []
            if not self.professions:
                missing_labels.append("profesiones")
            if not self.birth_date:
                missing_labels.append("fecha de nacimiento")
            if not self.document_id:
                missing_labels.append("documento de identidad")
            if not self.phone:
                missing_labels.append("celular")

            if missing_labels:
                raise ValueError(
                    f"Faltan campos obligatorios para docente: {', '.join(missing_labels)}"
                )

        return self


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    age: Optional[int] = None
    birth_date: Optional[date] = None
    document_id: Optional[str] = None
    professions: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    grade_id: Optional[int] = None
    group_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

    @field_validator("document_id", "professions", "phone", "whatsapp", mode="before")
    @classmethod
    def normalize_update_strings(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.strip()
            return normalized or None
        return value

    @field_validator("age")
    @classmethod
    def validate_update_age(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return None
        if value < 3 or value > 120:
            raise ValueError("La edad debe estar entre 3 y 120")
        return value


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    age: Optional[int] = None
    birth_date: Optional[date] = None
    document_id: Optional[str] = None
    professions: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    grade_id: Optional[int] = None
    group_id: Optional[int] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserPublic


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
