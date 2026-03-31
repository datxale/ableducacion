from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.news import NewsPost
from app.models.user import User
from app.schemas.news import NewsCreate, NewsResponse, NewsUpdate

router = APIRouter(prefix="/api/news", tags=["Noticias"])


@router.get("/", response_model=List[NewsResponse])
def list_news(
    news_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(NewsPost).filter(NewsPost.is_active == True)
    if news_type:
        query = query.filter(NewsPost.news_type == news_type)
    return query.order_by(NewsPost.published_at.desc(), NewsPost.created_at.desc()).all()


@router.get("/all", response_model=List[NewsResponse])
def list_all_news(
    news_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    query = db.query(NewsPost)
    if news_type:
        query = query.filter(NewsPost.news_type == news_type)
    return query.order_by(NewsPost.published_at.desc(), NewsPost.created_at.desc()).all()


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
    return news_post


@router.post("/", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
def create_news(
    data: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    news_post = NewsPost(**data.model_dump())
    db.add(news_post)
    db.commit()
    db.refresh(news_post)
    return news_post


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

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(news_post, field, value)

    db.commit()
    db.refresh(news_post)
    return news_post


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
