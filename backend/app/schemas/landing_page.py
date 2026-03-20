from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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
