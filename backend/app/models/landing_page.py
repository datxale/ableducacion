from sqlalchemy import Column, DateTime, Integer, Text
from sqlalchemy.sql import func

from app.database import Base


class LandingPageConfig(Base):
    __tablename__ = "landing_page_config"

    id = Column(Integer, primary_key=True, index=True)
    nav_home_label = Column(Text, nullable=False)
    nav_about_label = Column(Text, nullable=False)
    nav_news_label = Column(Text, nullable=False)
    login_button_label = Column(Text, nullable=False)
    hero_title_line_1 = Column(Text, nullable=False)
    hero_title_line_2 = Column(Text, nullable=False)
    hero_description = Column(Text, nullable=False)
    hero_primary_button_label = Column(Text, nullable=False)
    hero_secondary_button_label = Column(Text, nullable=False)
    hero_slider_json = Column(Text, nullable=True)
    about_chip_label = Column(Text, nullable=False)
    about_title = Column(Text, nullable=False)
    about_description_1 = Column(Text, nullable=False)
    about_description_2 = Column(Text, nullable=False)
    about_card_1_title = Column(Text, nullable=False)
    about_card_1_value = Column(Text, nullable=False)
    about_card_2_title = Column(Text, nullable=False)
    about_card_2_value = Column(Text, nullable=False)
    about_card_3_title = Column(Text, nullable=False)
    about_card_3_value = Column(Text, nullable=False)
    about_card_4_title = Column(Text, nullable=False)
    about_card_4_value = Column(Text, nullable=False)
    steps_title = Column(Text, nullable=False)
    steps_button_label = Column(Text, nullable=False)
    step_1_title = Column(Text, nullable=False)
    step_1_description = Column(Text, nullable=False)
    step_2_title = Column(Text, nullable=False)
    step_2_description = Column(Text, nullable=False)
    step_3_title = Column(Text, nullable=False)
    step_3_description = Column(Text, nullable=False)
    news_chip_label = Column(Text, nullable=False)
    news_title = Column(Text, nullable=False)
    news_description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True,
    )

    def __repr__(self):
        return f"<LandingPageConfig(id={self.id})>"
