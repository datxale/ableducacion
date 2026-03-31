from pydantic import BaseModel, field_validator
from typing import Optional, ClassVar
from datetime import datetime
from app.models.live_class import ClassType
from app.schemas.grade import GradeResponse
from app.schemas.subject import SubjectSimple


class LiveClassTeacher(BaseModel):
    id: int
    full_name: str

    model_config = {"from_attributes": True}


class LiveClassBase(BaseModel):
    allowed_meeting_providers: ClassVar[set[str]] = {"manual", "google_meet", "zoom"}
    title: str
    description: Optional[str] = None
    meeting_provider: str = "manual"
    meeting_url: Optional[str] = None
    grade_id: int
    subject_id: int
    scheduled_at: datetime
    class_type: ClassType = ClassType.regular

    @field_validator("meeting_provider")
    @classmethod
    def validate_meeting_provider(cls, value: str) -> str:
        if value not in cls.allowed_meeting_providers:
            raise ValueError("meeting_provider debe ser manual, google_meet o zoom")
        return value


class LiveClassCreate(LiveClassBase):
    pass


class LiveClassUpdate(BaseModel):
    allowed_meeting_providers: ClassVar[set[str]] = {"manual", "google_meet", "zoom"}
    title: Optional[str] = None
    description: Optional[str] = None
    meeting_provider: Optional[str] = None
    meeting_url: Optional[str] = None
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    class_type: Optional[ClassType] = None

    @field_validator("meeting_provider")
    @classmethod
    def validate_meeting_provider(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in cls.allowed_meeting_providers:
            raise ValueError("meeting_provider debe ser manual, google_meet o zoom")
        return value


class LiveClassResponse(LiveClassBase):
    id: int
    teacher_id: int
    external_event_id: Optional[str] = None
    meeting_code: Optional[str] = None
    meet_space_name: Optional[str] = None
    recording_status: Optional[str] = None
    recording_file_id: Optional[str] = None
    recording_resource_name: Optional[str] = None
    recording_url: Optional[str] = None
    recording_started_at: Optional[datetime] = None
    recording_ended_at: Optional[datetime] = None
    recording_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    teacher: Optional[LiveClassTeacher] = None
    grade: Optional[GradeResponse] = None
    subject: Optional[SubjectSimple] = None

    model_config = {"from_attributes": True}
