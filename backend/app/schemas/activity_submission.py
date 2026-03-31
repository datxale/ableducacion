from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.activity_submission import ActivitySubmissionStatus


class ActivitySubmissionCreate(BaseModel):
    activity_id: int
    response_text: Optional[str] = None
    attachment_url: Optional[str] = None


class ActivitySubmissionGrade(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None


class ActivitySubmissionResponse(BaseModel):
    id: int
    activity_id: int
    student_id: int
    response_text: Optional[str] = None
    attachment_url: Optional[str] = None
    status: ActivitySubmissionStatus
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    student_name: Optional[str] = None
    activity_title: Optional[str] = None
    grader_name: Optional[str] = None

    model_config = {"from_attributes": True}
