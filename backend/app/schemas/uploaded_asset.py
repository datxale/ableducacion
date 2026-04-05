from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UploadedAssetResponse(BaseModel):
    id: int
    owner_user_id: Optional[int] = None
    owner_name: Optional[str] = None
    category: str
    original_filename: str
    stored_filename: str
    relative_path: str
    url: str
    content_type: Optional[str] = None
    size_bytes: Optional[int] = None
    media_kind: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str | None = None
    asset_id: Optional[int] = None
    category: Optional[str] = None
    media_kind: Optional[str] = None
    size_bytes: Optional[int] = None
