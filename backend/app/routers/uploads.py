from pathlib import Path
from uuid import uuid4
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import settings
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])


class UploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str | None = None


def _sanitize_segment(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", value or "general").strip("-").lower()
    return cleaned or "general"


def _uploads_root() -> Path:
    root = Path(settings.upload_dir)
    if not root.is_absolute():
        root = (Path.cwd() / root).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


@router.post("/", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_user: User = Depends(get_current_user),
):
    original_name = file.filename or "archivo"
    extension = Path(original_name).suffix.lower()
    safe_category = _sanitize_segment(category)
    safe_name = f"{uuid4().hex}{extension}"
    target_dir = _uploads_root() / safe_category
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / safe_name

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo esta vacio.",
        )

    target_path.write_bytes(content)
    relative_path = target_path.relative_to(_uploads_root()).as_posix()
    return UploadResponse(
        url=f"/api/uploads/{relative_path}",
        filename=original_name,
        content_type=file.content_type,
    )


@router.get("/{file_path:path}")
def get_uploaded_file(file_path: str):
    root = _uploads_root()
    requested_path = (root / file_path).resolve()

    if root not in requested_path.parents and requested_path != root:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado.",
        )

    if not requested_path.exists() or not requested_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado.",
        )

    return FileResponse(requested_path)
