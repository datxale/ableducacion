from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.planning import PlanningType


class PlanningBase(BaseModel):
    planning_type: PlanningType
    title: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    grade_id: int
    month_id: Optional[int] = None


class PlanningCreate(PlanningBase):
    pass


class PlanningUpdate(BaseModel):
    planning_type: Optional[PlanningType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    file_url: Optional[str] = None
    grade_id: Optional[int] = None
    month_id: Optional[int] = None


class PlanningResponse(PlanningBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
