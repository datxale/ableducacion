from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.live_class_attendance import AttendanceStatus


class LiveClassAttendanceResponse(BaseModel):
    id: int
    live_class_id: int
    student_id: int
    status: AttendanceStatus
    joined_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    student_name: Optional[str] = None

    model_config = {"from_attributes": True}
