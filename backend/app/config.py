from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


class Settings(BaseSettings):
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://ableducacion:ableducacion123@localhost:5432/ableducacion"
    )
    secret_key: str = os.getenv("SECRET_KEY", "changethiskey-ableducacion-2024-secure")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    google_meet_enabled: bool = os.getenv("GOOGLE_MEET_ENABLED", "false").lower() == "true"
    google_service_account_json: str = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    google_service_account_file: str = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE", "")
    google_oauth_client_id: str = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")
    google_oauth_client_secret: str = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "")
    google_oauth_refresh_token: str = os.getenv("GOOGLE_OAUTH_REFRESH_TOKEN", "")
    google_workspace_impersonated_user: str = os.getenv("GOOGLE_WORKSPACE_IMPERSONATED_USER", "")
    google_meet_calendar_id: str = os.getenv("GOOGLE_MEET_CALENDAR_ID", "")
    google_meet_auto_recording_enabled: bool = os.getenv("GOOGLE_MEET_AUTO_RECORDING_ENABLED", "true").lower() == "true"
    google_meet_auto_transcription_enabled: bool = os.getenv("GOOGLE_MEET_AUTO_TRANSCRIPTION_ENABLED", "false").lower() == "true"
    google_meet_timezone: str = os.getenv("GOOGLE_MEET_TIMEZONE", "America/Lima")
    google_meet_duration_minutes: int = int(os.getenv("GOOGLE_MEET_DURATION_MINUTES", "60"))
    google_meet_recording_sync_interval_seconds: int = int(
        os.getenv("GOOGLE_MEET_RECORDING_SYNC_INTERVAL_SECONDS", "180")
    )
    upload_dir: str = os.getenv("UPLOAD_DIR", "uploads")

    class Config:
        env_file = str(BACKEND_DIR / ".env")
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
