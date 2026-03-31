from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


class NewsContentBlock(BaseModel):
    block_type: Literal["text", "image", "video"]
    text: Optional[str] = None
    media_url: Optional[str] = None
    caption: Optional[str] = None

    @model_validator(mode="after")
    def validate_payload(self):
        if self.block_type == "text" and not (self.text or "").strip():
            raise ValueError("Los bloques de texto deben incluir contenido.")
        if self.block_type in {"image", "video"} and not (self.media_url or "").strip():
            raise ValueError("Los bloques multimedia deben incluir una URL.")
        return self


class NewsBase(BaseModel):
    title: str
    news_type: str = "noticia"
    summary: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    cover_media_type: Literal["image", "video"] = "image"
    link_url: Optional[str] = None
    content_blocks: List[NewsContentBlock] = Field(default_factory=list)


class NewsCreate(NewsBase):
    pass


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    news_type: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    cover_media_type: Optional[Literal["image", "video"]] = None
    link_url: Optional[str] = None
    content_blocks: Optional[List[NewsContentBlock]] = None
    is_active: Optional[bool] = None
    published_at: Optional[datetime] = None


class NewsResponse(NewsBase):
    id: int
    is_active: bool
    published_at: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
