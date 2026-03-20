from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.landing_page import LandingPageConfig
from app.models.user import User
from app.schemas.landing_page import (
    LANDING_PAGE_DEFAULTS,
    LandingPageResponse,
    LandingPageUpdate,
)

router = APIRouter(prefix="/api/landing-page", tags=["Landing Page"])


def get_or_create_landing_page_config(db: Session) -> LandingPageConfig:
    config = db.query(LandingPageConfig).order_by(LandingPageConfig.id.asc()).first()
    if config:
        return config

    config = LandingPageConfig(**LANDING_PAGE_DEFAULTS)
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@router.get("/", response_model=LandingPageResponse)
def get_landing_page(db: Session = Depends(get_db)):
    return get_or_create_landing_page_config(db)


@router.put("/", response_model=LandingPageResponse)
def update_landing_page(
    data: LandingPageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    config = get_or_create_landing_page_config(db)

    for field, value in data.model_dump().items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return config
