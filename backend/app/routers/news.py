import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.news import NewsPost
from app.models.user import User
from app.schemas.news import NewsCreate, NewsResponse, NewsUpdate

router = APIRouter(prefix="/api/news", tags=["Noticias"])


def _detect_cover_media_type(url: Optional[str]) -> str:
    lower = (url or "").lower().split("?")[0]
    if lower.endswith((".mp4", ".webm", ".mov", ".m4v", ".ogg")):
        return "video"
    return "image"


def _parse_content_blocks(raw_value: Optional[str]) -> list[dict]:
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
    except (TypeError, ValueError):
        return []

    if not isinstance(parsed, list):
        return []

    normalized: list[dict] = []
    for block in parsed:
        if not isinstance(block, dict):
            continue

        block_type = block.get("block_type")
        if block_type not in {"text", "image", "video"}:
            continue

        text_value = (block.get("text") or "").strip() or None
        media_url = (block.get("media_url") or "").strip() or None
        caption = (block.get("caption") or "").strip() or None

        if block_type == "text" and text_value:
            normalized.append(
                {
                    "block_type": block_type,
                    "text": text_value,
                    "media_url": None,
                    "caption": caption,
                }
            )
        elif block_type in {"image", "video"} and media_url:
            normalized.append(
                {
                    "block_type": block_type,
                    "text": None,
                    "media_url": media_url,
                    "caption": caption,
                }
            )

    return normalized


def _serialize_news(news_post: NewsPost) -> NewsResponse:
    cover_url = news_post.image_url
    cover_type = news_post.cover_media_type or _detect_cover_media_type(cover_url)
    payload = {
        "id": news_post.id,
        "title": news_post.title,
        "news_type": news_post.news_type,
        "summary": news_post.summary,
        "content": news_post.content,
        "image_url": cover_url,
        "cover_media_type": cover_type,
        "link_url": news_post.link_url,
        "content_blocks": _parse_content_blocks(news_post.content_blocks_json),
        "is_active": news_post.is_active,
        "published_at": news_post.published_at,
        "created_at": news_post.created_at,
        "updated_at": news_post.updated_at,
    }
    return NewsResponse.model_validate(payload)


def _validate_cover_payload(image_url: Optional[str], cover_media_type: Optional[str]) -> None:
    if not (image_url or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La publicacion debe tener una portada de imagen o video.",
        )
    if cover_media_type not in {"image", "video"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El tipo de portada debe ser image o video.",
        )


def _apply_news_payload(news_post: NewsPost, payload: dict) -> None:
    content_blocks = payload.pop("content_blocks", None)

    for field, value in payload.items():
        setattr(news_post, field, value)

    if content_blocks is not None:
        news_post.content_blocks_json = json.dumps(content_blocks, ensure_ascii=False)


@router.get("/", response_model=List[NewsResponse])
def list_news(
    news_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(NewsPost).filter(NewsPost.is_active == True)
    if news_type:
        query = query.filter(NewsPost.news_type == news_type)
    items = query.order_by(NewsPost.published_at.desc(), NewsPost.created_at.desc()).all()
    return [_serialize_news(item) for item in items]


@router.get("/all", response_model=List[NewsResponse])
def list_all_news(
    news_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(NewsPost)
    if news_type:
        query = query.filter(NewsPost.news_type == news_type)
    items = query.order_by(NewsPost.published_at.desc(), NewsPost.created_at.desc()).all()
    return [_serialize_news(item) for item in items]


@router.get("/{news_id}", response_model=NewsResponse)
def get_news(news_id: int, db: Session = Depends(get_db)):
    news_post = (
        db.query(NewsPost)
        .filter(NewsPost.id == news_id, NewsPost.is_active == True)
        .first()
    )
    if not news_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Noticia no encontrada",
        )
    return _serialize_news(news_post)


@router.post("/", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
def create_news(
    data: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    payload = data.model_dump()
    _validate_cover_payload(payload.get("image_url"), payload.get("cover_media_type"))

    news_post = NewsPost()
    _apply_news_payload(news_post, payload)
    db.add(news_post)
    db.commit()
    db.refresh(news_post)
    return _serialize_news(news_post)


@router.put("/{news_id}", response_model=NewsResponse)
def update_news(
    news_id: int,
    data: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    news_post = db.query(NewsPost).filter(NewsPost.id == news_id).first()
    if not news_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Noticia no encontrada",
        )

    update_data = data.model_dump(exclude_unset=True)
    should_validate_cover = any(
        field in update_data
        for field in {"title", "news_type", "summary", "content", "image_url", "cover_media_type", "link_url", "content_blocks"}
    )
    if should_validate_cover:
        _validate_cover_payload(
            update_data.get("image_url", news_post.image_url),
            update_data.get("cover_media_type", news_post.cover_media_type or _detect_cover_media_type(news_post.image_url)),
        )

    _apply_news_payload(news_post, update_data)
    db.commit()
    db.refresh(news_post)
    return _serialize_news(news_post)


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    news_post = db.query(NewsPost).filter(NewsPost.id == news_id).first()
    if not news_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Noticia no encontrada",
        )

    db.delete(news_post)
    db.commit()
