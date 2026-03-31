from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from datetime import datetime
from app.models.activity import ActivityType
from app.schemas.activity_submission import ActivitySubmissionResponse


ALLOWED_LEARNING_FORMATS = {"material", "tarea", "examen"}


class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    activity_type: ActivityType
    learning_format: str = "material"
    instructions: Optional[str] = None
    max_score: Optional[int] = None
    due_at: Optional[datetime] = None
    file_url: Optional[str] = None
    video_url: Optional[str] = None
    week_id: int

    @field_validator("learning_format")
    @classmethod
    def validate_learning_format(cls, value: str) -> str:
        if value not in ALLOWED_LEARNING_FORMATS:
            raise ValueError("learning_format debe ser material, tarea o examen")
        return value


class ActivityCreate(ActivityBase):
    @model_validator(mode="after")
    def check_url_by_type(self) -> "ActivityCreate":
        if self.activity_type == ActivityType.ficha and not self.file_url:
            raise ValueError("Las fichas deben tener un file_url")
        if self.activity_type == ActivityType.video and not self.video_url:
            raise ValueError("Los videos deben tener un video_url")
        return self


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    activity_type: Optional[ActivityType] = None
    learning_format: Optional[str] = None
    instructions: Optional[str] = None
    max_score: Optional[int] = None
    due_at: Optional[datetime] = None
    file_url: Optional[str] = None
    video_url: Optional[str] = None
    week_id: Optional[int] = None

    @field_validator("learning_format")
    @classmethod
    def validate_learning_format(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in ALLOWED_LEARNING_FORMATS:
            raise ValueError("learning_format debe ser material, tarea o examen")
        return value


class ActivityResponse(ActivityBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    my_submission: Optional[ActivitySubmissionResponse] = None
    submission_count: int = 0

    model_config = {"from_attributes": True}
