from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.uploaded_asset import UploadedAsset
from app.models.user import User
from app.schemas.uploaded_asset import UploadResponse, UploadedAssetResponse
from app.services.uploaded_assets import (
    derive_media_kind,
    serialize_uploaded_asset,
    sanitize_category,
    upsert_uploaded_asset,
    uploads_root,
)

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])


@router.post("/", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original_name = file.filename or "archivo"
    extension = Path(original_name).suffix.lower()
    safe_category = sanitize_category(category)
    safe_name = f"{uuid4().hex}{extension}"
    target_dir = uploads_root() / safe_category
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / safe_name

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo esta vacio.",
        )

    target_path.write_bytes(content)
    relative_path = target_path.relative_to(uploads_root()).as_posix()
    asset = upsert_uploaded_asset(
        db,
        owner_user_id=current_user.id,
        category=safe_category,
        original_filename=original_name,
        relative_path=relative_path,
        content_type=file.content_type,
        size_bytes=len(content),
    )
    db.commit()
    db.refresh(asset)
    return UploadResponse(
        url=f"/api/uploads/{relative_path}",
        filename=original_name,
        content_type=file.content_type,
        asset_id=asset.id,
        category=asset.category,
        media_kind=derive_media_kind(original_name, file.content_type),
        size_bytes=len(content),
    )


@router.get("/assets", response_model=list[UploadedAssetResponse])
def list_uploaded_assets(
    category: str | None = Query(None),
    search: str | None = Query(None),
    media_kind: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    query = db.query(UploadedAsset).order_by(UploadedAsset.created_at.desc(), UploadedAsset.id.desc())

    normalized_category = sanitize_category(category) if category else None
    if normalized_category and normalized_category != "all":
        query = query.filter(UploadedAsset.category == normalized_category)

    if current_user.role.value == "docente":
        query = query.filter(UploadedAsset.owner_user_id == current_user.id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(UploadedAsset.original_filename.ilike(search_term))

    assets = query.limit(limit).all()
    serialized_assets = [serialize_uploaded_asset(asset) for asset in assets]

    if media_kind and media_kind != "all":
        serialized_assets = [
            asset for asset in serialized_assets
            if asset["media_kind"] == media_kind
        ]

    return [UploadedAssetResponse.model_validate(asset) for asset in serialized_assets]


@router.get("/{file_path:path}")
def get_uploaded_file(file_path: str):
    root = uploads_root()
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
