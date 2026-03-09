from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TestimonialBase(BaseModel):
    quote: str
    role: str
    rating: int = 5


class TestimonialCreate(TestimonialBase):
    pass


class TestimonialUpdate(BaseModel):
    quote: Optional[str] = None
    role: Optional[str] = None
    rating: Optional[int] = None
    is_active: Optional[bool] = None


class TestimonialResponse(TestimonialBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
