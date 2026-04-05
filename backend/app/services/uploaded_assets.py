import json
from pathlib import Path
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.academic_group import AcademicGroup
from app.models.activity import Activity
from app.models.activity_resource import ActivityResource
from app.models.landing_page import LandingPageConfig
from app.models.news import NewsPost
from app.models.planning import Planning
from app.models.uploaded_asset import UploadedAsset


def uploads_root() -> Path:
    root = Path(settings.upload_dir)
    if not root.is_absolute():
        root = (Path.cwd() / root).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def sanitize_category(value: str) -> str:
    cleaned = "".join(char if char.isalnum() or char in {"-", "_"} else "-" for char in (value or "general"))
    cleaned = cleaned.strip("-").lower()
    return cleaned or "general"


def relative_path_from_url(url: Optional[str]) -> Optional[str]:
    normalized = (url or "").strip()
    if not normalized.startswith("/api/uploads/"):
        return None
    relative_path = normalized.replace("/api/uploads/", "", 1).strip("/")
    return relative_path or None


def build_asset_url(relative_path: str) -> str:
    return f"/api/uploads/{relative_path}"


def derive_media_kind(filename: Optional[str], content_type: Optional[str]) -> str:
    normalized_type = (content_type or "").lower()
    if normalized_type.startswith("image/"):
        return "image"
    if normalized_type.startswith("video/"):
        return "video"
    if normalized_type.startswith("audio/"):
        return "audio"
    if "pdf" in normalized_type:
        return "pdf"

    lower_name = (filename or "").lower().split("?")[0]
    if lower_name.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")):
        return "image"
    if lower_name.endswith((".mp4", ".webm", ".mov", ".m4v", ".avi", ".ogg")):
        return "video"
    if lower_name.endswith((".mp3", ".wav", ".aac", ".m4a")):
        return "audio"
    if lower_name.endswith(".pdf"):
        return "pdf"
    if lower_name.endswith((".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".csv", ".txt")):
        return "document"
    return "file"


def upsert_uploaded_asset(
    db: Session,
    *,
    owner_user_id: Optional[int],
    category: str,
    original_filename: str,
    relative_path: str,
    content_type: Optional[str],
    size_bytes: Optional[int],
) -> UploadedAsset:
    normalized_relative_path = relative_path.strip().replace("\\", "/")
    stored_filename = Path(normalized_relative_path).name
    fallback_category = (
        Path(normalized_relative_path).parts[0]
        if "/" in normalized_relative_path
        else "general"
    )
    normalized_category = sanitize_category(category or fallback_category)
    asset = (
        db.query(UploadedAsset)
        .filter(UploadedAsset.relative_path == normalized_relative_path)
        .first()
    )

    if not asset:
        asset = UploadedAsset(
            owner_user_id=owner_user_id,
            category=normalized_category,
            original_filename=original_filename or stored_filename,
            stored_filename=stored_filename,
            relative_path=normalized_relative_path,
            url=build_asset_url(normalized_relative_path),
            content_type=content_type,
            size_bytes=size_bytes,
        )
        db.add(asset)
        db.flush()
        return asset

    asset.category = normalized_category
    asset.stored_filename = stored_filename
    asset.url = build_asset_url(normalized_relative_path)
    if owner_user_id is not None:
        asset.owner_user_id = owner_user_id
    if original_filename:
        asset.original_filename = original_filename
    if content_type:
        asset.content_type = content_type
    if size_bytes is not None:
        asset.size_bytes = size_bytes
    db.flush()
    return asset


def serialize_uploaded_asset(asset: UploadedAsset) -> dict:
    return {
        "id": asset.id,
        "owner_user_id": asset.owner_user_id,
        "owner_name": asset.owner.full_name if asset.owner else None,
        "category": asset.category,
        "original_filename": asset.original_filename,
        "stored_filename": asset.stored_filename,
        "relative_path": asset.relative_path,
        "url": asset.url,
        "content_type": asset.content_type,
        "size_bytes": asset.size_bytes,
        "media_kind": derive_media_kind(asset.original_filename or asset.stored_filename, asset.content_type),
        "created_at": asset.created_at,
        "updated_at": asset.updated_at,
    }


def _iter_existing_files(root: Path) -> Iterable[tuple[str, str, Optional[int], Optional[str], Optional[int]]]:
    for file_path in root.rglob("*"):
        if not file_path.is_file():
            continue
        relative_path = file_path.relative_to(root).as_posix()
        category = relative_path.split("/", 1)[0] if "/" in relative_path else "general"
        yield relative_path, category, None, file_path.name, file_path.stat().st_size


def _sync_activity_assets(db: Session) -> None:
    resources = (
        db.query(ActivityResource, Activity)
        .join(Activity, Activity.id == ActivityResource.activity_id)
        .all()
    )
    for resource, activity in resources:
        relative_path = relative_path_from_url(resource.url)
        if not relative_path:
            continue
        upsert_uploaded_asset(
            db,
            owner_user_id=activity.created_by,
            category="activities",
            original_filename=resource.filename or Path(relative_path).name,
            relative_path=relative_path,
            content_type=resource.content_type,
            size_bytes=None,
        )

    legacy_activities = (
        db.query(Activity)
        .outerjoin(ActivityResource, ActivityResource.activity_id == Activity.id)
        .filter(Activity.file_url.isnot(None), ActivityResource.id.is_(None))
        .all()
    )
    for activity in legacy_activities:
        relative_path = relative_path_from_url(activity.file_url)
        if not relative_path:
            continue
        upsert_uploaded_asset(
            db,
            owner_user_id=activity.created_by,
            category="activities",
            original_filename=Path(relative_path).name,
            relative_path=relative_path,
            content_type=None,
            size_bytes=None,
        )


def _sync_planning_assets(db: Session) -> None:
    items = (
        db.query(Planning, AcademicGroup.teacher_id)
        .outerjoin(AcademicGroup, AcademicGroup.id == Planning.group_id)
        .all()
    )
    for planning, teacher_id in items:
        references = [
            (planning.file_url, "planning"),
            (planning.source_file_url, "planning"),
            (planning.presentation_video_url, "planning"),
        ]
        for url, category in references:
            relative_path = relative_path_from_url(url)
            if not relative_path:
                continue
            upsert_uploaded_asset(
                db,
                owner_user_id=teacher_id,
                category=category,
                original_filename=Path(relative_path).name,
                relative_path=relative_path,
                content_type=None,
                size_bytes=None,
            )


def _sync_news_assets(db: Session) -> None:
    items = db.query(NewsPost).all()
    for item in items:
        cover_path = relative_path_from_url(item.image_url)
        if cover_path:
            upsert_uploaded_asset(
                db,
                owner_user_id=None,
                category="news",
                original_filename=Path(cover_path).name,
                relative_path=cover_path,
                content_type=None,
                size_bytes=None,
            )

        raw_blocks = (item.content_blocks_json or "").strip()
        if not raw_blocks:
            continue
        try:
            blocks = json.loads(raw_blocks)
        except (TypeError, ValueError):
            continue
        if not isinstance(blocks, list):
            continue
        for block in blocks:
            if not isinstance(block, dict):
                continue
            media_path = relative_path_from_url(block.get("media_url"))
            if not media_path:
                continue
            upsert_uploaded_asset(
                db,
                owner_user_id=None,
                category="news",
                original_filename=Path(media_path).name,
                relative_path=media_path,
                content_type=None,
                size_bytes=None,
            )


def _sync_landing_assets(db: Session) -> None:
    config = db.query(LandingPageConfig).order_by(LandingPageConfig.id.asc()).first()
    if not config or not config.hero_slider_json:
        return

    try:
        slides = json.loads(config.hero_slider_json)
    except (TypeError, ValueError):
        return

    if not isinstance(slides, list):
        return

    for slide in slides:
        if not isinstance(slide, dict):
            continue
        for key in ("media_url", "poster_url"):
            relative_path = relative_path_from_url(slide.get(key))
            if not relative_path:
                continue
            upsert_uploaded_asset(
                db,
                owner_user_id=None,
                category="landing-hero",
                original_filename=Path(relative_path).name,
                relative_path=relative_path,
                content_type=None,
                size_bytes=None,
            )


def sync_existing_uploaded_assets(db: Session) -> int:
    root = uploads_root()
    created_or_updated = 0

    for relative_path, category, owner_user_id, original_filename, size_bytes in _iter_existing_files(root):
        upsert_uploaded_asset(
            db,
            owner_user_id=owner_user_id,
            category=category,
            original_filename=original_filename or Path(relative_path).name,
            relative_path=relative_path,
            content_type=None,
            size_bytes=size_bytes,
        )
        created_or_updated += 1

    _sync_activity_assets(db)
    _sync_planning_assets(db)
    _sync_news_assets(db)
    _sync_landing_assets(db)
    db.commit()
    return created_or_updated
