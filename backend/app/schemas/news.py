from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NewsBase(BaseModel):
    title: str
    summary: str
    content: Optional[str] = None
    image_url: Optional[str] = None


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    published_at: Optional[datetime] = None


class NewsResponse(NewsBase):
    id: int
    is_active: bool
    published_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
