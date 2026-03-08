from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime
from app.models.activity import ActivityType


class ActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    activity_type: ActivityType
    file_url: Optional[str] = None
    video_url: Optional[str] = None
    week_id: int


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
    file_url: Optional[str] = None
    video_url: Optional[str] = None
    week_id: Optional[int] = None


class ActivityResponse(ActivityBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
