from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.progress import ProgressStatus


class ProgressBase(BaseModel):
    student_id: int
    activity_id: int
    status: ProgressStatus = ProgressStatus.pending
    score: Optional[float] = None


class ProgressCreate(ProgressBase):
    pass


class ProgressUpdate(BaseModel):
    status: Optional[ProgressStatus] = None
    score: Optional[float] = None
    completed_at: Optional[datetime] = None


class ProgressResponse(ProgressBase):
    id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudentProgressSummary(BaseModel):
    student_id: int
    student_name: str
    total_activities: int
    completed: int
    in_progress: int
    pending: int
    average_score: Optional[float] = None
    completion_rate: float

    model_config = {"from_attributes": True}


class GradeProgressSummary(BaseModel):
    grade_id: int
    grade_name: str
    total_students: int
    students_progress: List[StudentProgressSummary]

    model_config = {"from_attributes": True}
