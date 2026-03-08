from pydantic import BaseModel
from typing import Optional


class GradeBase(BaseModel):
    name: str
    description: Optional[str] = None


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class GradeResponse(GradeBase):
    id: int

    model_config = {"from_attributes": True}
