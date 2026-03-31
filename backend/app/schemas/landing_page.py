from __future__ import annotations

import copy
import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


LANDING_PAGE_DEFAULTS = {
    "nav_home_label": "Inicio",
    "nav_about_label": "Quienes Somos",
    "nav_news_label": "Noticias",
    "login_button_label": "Ingresar",
    "hero_title_line_1": "Rompiendo barreras,",
    "hero_title_line_2": "impulsando aprendizajes",
    "hero_description": (
        "Con ABL Educacion, nuestros estudiantes acceden a nuevas actividades de "
        "matematica cada semana y pueden aprender incluso con conectividad limitada."
    ),
    "hero_primary_button_label": "Registrarme",
    "hero_secondary_button_label": "Descargar app",
    "about_chip_label": "Quienes Somos",
    "about_title": "Tecnologia educativa con foco en resultados reales",
    "about_description_1": (
        "ABL Educacion acompana a docentes, directivos y estudiantes con recursos, "
        "seguimiento y reportes para fortalecer el aprendizaje de matematica."
    ),
    "about_description_2": (
        "Combinamos actividades semanales, portal docente y analitica simple para "
        "tomar decisiones pedagogicas con informacion clara."
    ),
    "about_card_1_title": "Implementado por",
    "about_card_1_value": "ABL Educacion",
    "about_card_2_title": "Enfoque",
    "about_card_2_value": "Aprendizaje aplicado y divertido",
    "about_card_3_title": "Cobertura",
    "about_card_3_value": "Aulas, directivos y familias",
    "about_card_4_title": "Objetivo",
    "about_card_4_value": "Mejorar progreso y seguimiento",
    "steps_title": "ABL Educacion de manera divertida desde hoy",
    "steps_button_label": "Registrarme",
    "step_1_title": "Crea tus aulas e inscribe a tus estudiantes",
    "step_1_description": (
        "Registrate en ABL Educacion, ingresa al Portal Docente e inscribe a tus estudiantes."
    ),
    "step_2_title": "Descarguen e ingresen al aplicativo",
    "step_2_description": (
        "Comparte con tus estudiantes sus usuarios y contrasenas para empezar a aprender "
        "de manera divertida."
    ),
    "step_3_title": "Revisa recursos y reportes",
    "step_3_description": (
        "Accede a videos pedagogicos, fichas curriculares y reportes automaticos desde tu portal."
    ),
    "news_chip_label": "Noticias",
    "news_title": "Ultimas novedades de ABL Educacion",
    "news_description": (
        "Revisa anuncios, actividades destacadas y novedades recientes de ABL Educacion."
    ),
}

DEFAULT_HERO_SLIDES = [
    {
        "eyebrow": "Experiencia inmersiva ABL Educacion",
        "title": "Rompiendo barreras,\nimpulsando aprendizajes",
        "description": LANDING_PAGE_DEFAULTS["hero_description"],
        "primary_button_label": LANDING_PAGE_DEFAULTS["hero_primary_button_label"],
        "primary_button_url": "/register",
        "secondary_button_label": LANDING_PAGE_DEFAULTS["hero_secondary_button_label"],
        "secondary_button_url": "/login",
        "highlights": [
            LANDING_PAGE_DEFAULTS["about_card_2_value"],
            LANDING_PAGE_DEFAULTS["about_card_3_value"],
            LANDING_PAGE_DEFAULTS["about_card_4_value"],
        ],
        "media_type": "scene",
        "media_url": "",
        "poster_url": "",
        "accent_color": "#7CF4FF",
        "background_start": "#081B36",
        "background_end": "#1B8DFF",
        "overlay_color": "rgba(7, 17, 34, 0.58)",
    },
    {
        "eyebrow": "Aulas conectadas",
        "title": "Planifica,\ncoordina y comparte",
        "description": (
            "Convierte la portada en un tablero vivo para familias, docentes y estudiantes "
            "con contenidos listos para actuar."
        ),
        "primary_button_label": "Explorar noticias",
        "primary_button_url": "/inicio#noticias",
        "secondary_button_label": "Conocer mas",
        "secondary_button_url": "/inicio#quienes-somos",
        "highlights": [
            LANDING_PAGE_DEFAULTS["about_card_1_value"],
            LANDING_PAGE_DEFAULTS["about_card_2_value"],
            LANDING_PAGE_DEFAULTS["about_card_3_value"],
        ],
        "media_type": "image",
        "media_url": "",
        "poster_url": "",
        "accent_color": "#FFD166",
        "background_start": "#102246",
        "background_end": "#56CCF2",
        "overlay_color": "rgba(8, 19, 38, 0.52)",
    },
    {
        "eyebrow": "Seguimiento claro",
        "title": "Cada avance\nen una sola vista",
        "description": (
            "Destaca clases, reportes y novedades con una portada moderna que cambia slide "
            "por slide sin perder legibilidad."
        ),
        "primary_button_label": "Ingresar",
        "primary_button_url": "/login",
        "secondary_button_label": "Ver pasos",
        "secondary_button_url": "/inicio#pasos",
        "highlights": [
            LANDING_PAGE_DEFAULTS["step_1_title"],
            LANDING_PAGE_DEFAULTS["step_2_title"],
            LANDING_PAGE_DEFAULTS["step_3_title"],
        ],
        "media_type": "video",
        "media_url": "",
        "poster_url": "",
        "accent_color": "#FF8A5B",
        "background_start": "#160A2C",
        "background_end": "#8338EC",
        "overlay_color": "rgba(15, 8, 29, 0.5)",
    },
]


def build_default_hero_slides(source: Optional[dict] = None) -> List[dict]:
    base = {**LANDING_PAGE_DEFAULTS, **(source or {})}
    slides = copy.deepcopy(DEFAULT_HERO_SLIDES)
    slides[0]["title"] = (
        f"{base.get('hero_title_line_1', LANDING_PAGE_DEFAULTS['hero_title_line_1'])}\n"
        f"{base.get('hero_title_line_2', LANDING_PAGE_DEFAULTS['hero_title_line_2'])}"
    ).strip()
    slides[0]["description"] = base.get("hero_description", LANDING_PAGE_DEFAULTS["hero_description"])
    slides[0]["primary_button_label"] = base.get(
        "hero_primary_button_label",
        LANDING_PAGE_DEFAULTS["hero_primary_button_label"],
    )
    slides[0]["secondary_button_label"] = base.get(
        "hero_secondary_button_label",
        LANDING_PAGE_DEFAULTS["hero_secondary_button_label"],
    )
    slides[0]["highlights"] = [
        base.get("about_card_2_value", LANDING_PAGE_DEFAULTS["about_card_2_value"]),
        base.get("about_card_3_value", LANDING_PAGE_DEFAULTS["about_card_3_value"]),
        base.get("about_card_4_value", LANDING_PAGE_DEFAULTS["about_card_4_value"]),
    ]
    slides[1]["highlights"] = [
        base.get("about_card_1_value", LANDING_PAGE_DEFAULTS["about_card_1_value"]),
        base.get("about_card_2_value", LANDING_PAGE_DEFAULTS["about_card_2_value"]),
        base.get("about_card_3_value", LANDING_PAGE_DEFAULTS["about_card_3_value"]),
    ]
    slides[2]["highlights"] = [
        base.get("step_1_title", LANDING_PAGE_DEFAULTS["step_1_title"]),
        base.get("step_2_title", LANDING_PAGE_DEFAULTS["step_2_title"]),
        base.get("step_3_title", LANDING_PAGE_DEFAULTS["step_3_title"]),
    ]
    return slides


def build_default_landing_page_config() -> dict:
    payload = copy.deepcopy(LANDING_PAGE_DEFAULTS)
    payload["hero_slider_json"] = json.dumps(build_default_hero_slides(payload), ensure_ascii=True)
    return payload


class LandingHeroSlide(BaseModel):
    eyebrow: str = ""
    title: str
    description: str
    primary_button_label: str = ""
    primary_button_url: str = "/register"
    secondary_button_label: str = ""
    secondary_button_url: str = "/login"
    highlights: List[str] = Field(default_factory=list)
    media_type: str = "scene"
    media_url: str = ""
    poster_url: str = ""
    accent_color: str = "#7CF4FF"
    background_start: str = "#081B36"
    background_end: str = "#1B8DFF"
    overlay_color: str = "rgba(7, 17, 34, 0.58)"

    @field_validator("media_type")
    @classmethod
    def validate_media_type(cls, value: str) -> str:
        normalized = (value or "scene").strip().lower()
        if normalized in {"scene", "image", "video"}:
            return normalized
        return "scene"

    @field_validator("highlights")
    @classmethod
    def normalize_highlights(cls, values: List[str]) -> List[str]:
        if not values:
            return []

        cleaned: List[str] = []
        for item in values:
            text = (item or "").strip()
            if not text or text in cleaned:
                continue
            cleaned.append(text)
            if len(cleaned) == 4:
                break

        return cleaned


class LandingPageBase(BaseModel):
    nav_home_label: str
    nav_about_label: str
    nav_news_label: str
    login_button_label: str
    hero_title_line_1: str
    hero_title_line_2: str
    hero_description: str
    hero_primary_button_label: str
    hero_secondary_button_label: str
    hero_slides: List[LandingHeroSlide] = Field(default_factory=build_default_hero_slides)
    about_chip_label: str
    about_title: str
    about_description_1: str
    about_description_2: str
    about_card_1_title: str
    about_card_1_value: str
    about_card_2_title: str
    about_card_2_value: str
    about_card_3_title: str
    about_card_3_value: str
    about_card_4_title: str
    about_card_4_value: str
    steps_title: str
    steps_button_label: str
    step_1_title: str
    step_1_description: str
    step_2_title: str
    step_2_description: str
    step_3_title: str
    step_3_description: str
    news_chip_label: str
    news_title: str
    news_description: str


class LandingPageUpdate(LandingPageBase):
    pass


class LandingPageResponse(LandingPageBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
