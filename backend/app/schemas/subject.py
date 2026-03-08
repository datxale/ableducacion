from pydantic import BaseModel
from typing import Optional
from app.schemas.grade import GradeResponse


class SubjectBase(BaseModel):
    name: str
    grade_id: int


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    grade_id: Optional[int] = None


class SubjectResponse(SubjectBase):
    id: int
    grade: Optional[GradeResponse] = None

    model_config = {"from_attributes": True}


class SubjectSimple(BaseModel):
    id: int
    name: str
    grade_id: int

    model_config = {"from_attributes": True}
