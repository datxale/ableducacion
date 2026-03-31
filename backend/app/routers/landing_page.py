import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.landing_page import LandingPageConfig
from app.models.user import User
from app.schemas.landing_page import (
    LANDING_PAGE_DEFAULTS,
    LandingHeroSlide,
    LandingPageResponse,
    LandingPageUpdate,
    build_default_hero_slides,
    build_default_landing_page_config,
)

router = APIRouter(prefix="/api/landing-page", tags=["Landing Page"])


def build_legacy_payload(config: LandingPageConfig) -> dict:
    return {
        key: getattr(config, key, value)
        for key, value in LANDING_PAGE_DEFAULTS.items()
    }


def get_serialized_slides(config: LandingPageConfig) -> list[dict]:
    fallback = build_default_hero_slides(build_legacy_payload(config))
    raw_value = (config.hero_slider_json or "").strip()

    if not raw_value:
        return fallback

    try:
        parsed = json.loads(raw_value)
    except (TypeError, ValueError):
        return fallback

    if not isinstance(parsed, list):
        return fallback

    slides = []
    for item in parsed:
        try:
            slides.append(LandingHeroSlide.model_validate(item).model_dump())
        except Exception:
            continue

    return slides or fallback


def serialize_landing_page_config(config: LandingPageConfig) -> LandingPageResponse:
    payload = build_legacy_payload(config)
    payload["hero_slides"] = get_serialized_slides(config)
    payload["id"] = config.id
    payload["created_at"] = config.created_at
    payload["updated_at"] = config.updated_at
    return LandingPageResponse.model_validate(payload)


def get_or_create_landing_page_config(db: Session) -> LandingPageConfig:
    config = db.query(LandingPageConfig).order_by(LandingPageConfig.id.asc()).first()
    if config:
        if not getattr(config, "hero_slider_json", None):
            config.hero_slider_json = json.dumps(
                build_default_hero_slides(build_legacy_payload(config)),
                ensure_ascii=True,
            )
            db.commit()
            db.refresh(config)
        return config

    config = LandingPageConfig(**build_default_landing_page_config())
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


@router.get("/", response_model=LandingPageResponse)
def get_landing_page(db: Session = Depends(get_db)):
    config = get_or_create_landing_page_config(db)
    return serialize_landing_page_config(config)


@router.put("/", response_model=LandingPageResponse)
def update_landing_page(
    data: LandingPageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    config = get_or_create_landing_page_config(db)

    payload = data.model_dump()
    slides = payload.pop("hero_slides", []) or build_default_hero_slides(payload)
    primary_slide = slides[0] if slides else {}

    title_lines = [
        segment.strip()
        for segment in (primary_slide.get("title") or "").splitlines()
        if segment.strip()
    ]
    payload["hero_title_line_1"] = title_lines[0] if title_lines else payload["hero_title_line_1"]
    payload["hero_title_line_2"] = " ".join(title_lines[1:]) if len(title_lines) > 1 else ""
    payload["hero_description"] = (
        primary_slide.get("description") or payload["hero_description"]
    )
    payload["hero_primary_button_label"] = (
        primary_slide.get("primary_button_label") or payload["hero_primary_button_label"]
    )
    payload["hero_secondary_button_label"] = (
        primary_slide.get("secondary_button_label") or payload["hero_secondary_button_label"]
    )

    for field, value in payload.items():
        setattr(config, field, value)
    config.hero_slider_json = json.dumps(slides, ensure_ascii=True)

    db.commit()
    db.refresh(config)
    return serialize_landing_page_config(config)
