from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enrollment import EnrollmentStatus


class EnrollmentBase(BaseModel):
    student_id: int
    grade_id: int
    academic_year: str
    status: EnrollmentStatus = EnrollmentStatus.active


class EnrollmentCreate(BaseModel):
    student_id: int
    grade_id: int
    academic_year: str


class EnrollmentUpdate(BaseModel):
    grade_id: Optional[int] = None
    academic_year: Optional[str] = None
    status: Optional[EnrollmentStatus] = None


class EnrollmentResponse(EnrollmentBase):
    id: int
    enrolled_at: datetime

    model_config = {"from_attributes": True}
