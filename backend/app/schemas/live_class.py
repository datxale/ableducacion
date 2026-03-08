from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.live_class import ClassType


class LiveClassBase(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_url: Optional[str] = None
    grade_id: int
    subject_id: int
    scheduled_at: datetime
    class_type: ClassType = ClassType.regular


class LiveClassCreate(LiveClassBase):
    pass


class LiveClassUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    meeting_url: Optional[str] = None
    grade_id: Optional[int] = None
    subject_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    class_type: Optional[ClassType] = None


class LiveClassResponse(LiveClassBase):
    id: int
    teacher_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
