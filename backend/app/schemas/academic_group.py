from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.grade import GradeResponse
from app.schemas.user import UserPublic


class AcademicGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    grade_id: int
    teacher_id: Optional[int] = None
    is_active: bool = True


class AcademicGroupCreate(AcademicGroupBase):
    pass


class AcademicGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    grade_id: Optional[int] = None
    teacher_id: Optional[int] = None
    is_active: Optional[bool] = None


class AcademicGroupResponse(AcademicGroupBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    grade: Optional[GradeResponse] = None
    teacher: Optional[UserPublic] = None

    model_config = {"from_attributes": True}


class AcademicGroupSimple(BaseModel):
    id: int
    name: str
    grade_id: int
    teacher_id: Optional[int] = None
    is_active: bool

    model_config = {"from_attributes": True}
