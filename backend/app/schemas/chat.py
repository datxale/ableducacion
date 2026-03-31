from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.schemas.user import UserPublic


class ChatMessageCreate(BaseModel):
    recipient_id: int
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("El mensaje no puede estar vacio")
        return cleaned


class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    sender: Optional[UserPublic] = None
    recipient: Optional[UserPublic] = None

    model_config = {"from_attributes": True}


class ChatContactResponse(UserPublic):
    unread_count: int = 0
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
