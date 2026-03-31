from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from app.models import (  # noqa: F401
        user, academic_group, chat_message, grade, subject, month, week,
        activity, planning, live_class, enrollment, progress,
        testimonial, activity_submission, notification, live_class_attendance,
        news, landing_page
    )
    Base.metadata.create_all(bind=engine)


def apply_safe_schema_updates():
    with engine.begin() as connection:
        connection.execute(
            text(
                """
                ALTER TABLE landing_page_config
                ADD COLUMN IF NOT EXISTS hero_slider_json TEXT
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS meeting_provider VARCHAR(30) NOT NULL DEFAULT 'manual'
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS external_event_id VARCHAR(255)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS meeting_code VARCHAR(32)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS meet_space_name VARCHAR(255)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS recording_status VARCHAR(40)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS recording_file_id VARCHAR(255)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS recording_resource_name VARCHAR(255)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS recording_url VARCHAR(500)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS recording_started_at TIMESTAMPTZ
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS recording_ended_at TIMESTAMPTZ
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE live_classes
                ADD COLUMN IF NOT EXISTS recording_synced_at TIMESTAMPTZ
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE activities
                ADD COLUMN IF NOT EXISTS learning_format VARCHAR(20) NOT NULL DEFAULT 'material'
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE activities
                ADD COLUMN IF NOT EXISTS instructions TEXT
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE activities
                ADD COLUMN IF NOT EXISTS max_score INTEGER
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE activities
                ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS age INTEGER
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS birth_date DATE
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS document_id VARCHAR(40)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS professions TEXT
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS group_id INTEGER
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE news_posts
                ADD COLUMN IF NOT EXISTS news_type VARCHAR(30) NOT NULL DEFAULT 'noticia'
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE news_posts
                ADD COLUMN IF NOT EXISTS link_url VARCHAR(500)
                """
            )
        )
        connection.execute(
            text(
                """
                ALTER TABLE academic_groups
                ALTER COLUMN name TYPE VARCHAR(120)
                """
            )
        )
