from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.models.planning import PlanningType


class PlanningSessionItem(BaseModel):
    subject: str
    title: str

    @field_validator("subject", "title")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Los campos de la sesion no pueden estar vacios")
        return normalized


class PlanningDayPlan(BaseModel):
    day_key: str
    day_label: str
    date_label: Optional[str] = None
    sessions: List[PlanningSessionItem] = Field(default_factory=list)

    @field_validator("day_key", "day_label")
    @classmethod
    def validate_day_fields(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Los datos del dia son obligatorios")
        return normalized


class PlanningWeekPlan(BaseModel):
    week_number: int
    title: str
    days: List[PlanningDayPlan] = Field(default_factory=list)

    @field_validator("week_number")
    @classmethod
    def validate_week_number(cls, value: int) -> int:
        if value < 1:
            raise ValueError("La semana debe iniciar desde 1")
        return value

    @field_validator("title")
    @classmethod
    def validate_week_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El titulo de la semana es obligatorio")
        return normalized


class PlanningBase(BaseModel):
    planning_type: PlanningType
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    source_file_url: Optional[str] = None
    grade_id: int
    month_id: Optional[int] = None
    unit_number: Optional[str] = None
    unit_title: Optional[str] = None
    situation_context: Optional[str] = None
    learning_challenge: Optional[str] = None
    structured_content: List[PlanningWeekPlan] = Field(default_factory=list)

    @field_validator(
        "title",
        "description",
        "file_url",
        "source_file_url",
        "unit_number",
        "unit_title",
        "situation_context",
        "learning_challenge",
        mode="before",
    )
    @classmethod
    def normalize_optional_text(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.strip()
            return normalized or None
        return value

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El titulo es obligatorio")
        return normalized


class PlanningCreate(PlanningBase):
    pass


class PlanningUpdate(BaseModel):
    planning_type: Optional[PlanningType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    source_file_url: Optional[str] = None
    grade_id: Optional[int] = None
    month_id: Optional[int] = None
    unit_number: Optional[str] = None
    unit_title: Optional[str] = None
    situation_context: Optional[str] = None
    learning_challenge: Optional[str] = None
    structured_content: Optional[List[PlanningWeekPlan]] = None

    @field_validator(
        "title",
        "description",
        "file_url",
        "source_file_url",
        "unit_number",
        "unit_title",
        "situation_context",
        "learning_challenge",
        mode="before",
    )
    @classmethod
    def normalize_update_text(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.strip()
            return normalized or None
        return value


class PlanningResponse(PlanningBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
