import logging
import threading
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.live_class import LiveClass
from app.models.notification import NotificationType
from app.services.google_meet import (
    GoogleMeetIntegrationError,
    extract_google_meeting_code,
    sync_google_meet_recording,
)
from app.services.notifications import create_notification, notify_grade_students


logger = logging.getLogger(__name__)
AUTO_SYNC_RECORDING_STATUSES = {None, "pending", "recording", "processing"}


def _normalize_datetime(value):
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def should_auto_sync_live_class_recording(live_class: LiveClass, *, now: datetime | None = None) -> bool:
    if live_class.meeting_provider != "google_meet":
        return False
    if live_class.recording_status == "available" and live_class.recording_file_id:
        return False

    now = _normalize_datetime(now) or datetime.now(timezone.utc)
    scheduled_at = _normalize_datetime(live_class.scheduled_at)
    if not scheduled_at:
        return False

    if now < scheduled_at - timedelta(minutes=15):
        return False

    last_synced_at = _normalize_datetime(live_class.recording_synced_at)
    if last_synced_at:
        interval = timedelta(seconds=max(settings.google_meet_recording_sync_interval_seconds, 30))
        if now - last_synced_at < interval:
            return False

    return live_class.recording_status in AUTO_SYNC_RECORDING_STATUSES or not live_class.recording_file_id


def sync_live_class_recording_metadata(
    db: Session,
    live_class: LiveClass,
    *,
    notify_users: bool = True,
) -> bool:
    if live_class.meeting_provider != "google_meet":
        return False

    previous_status = live_class.recording_status
    previous_file_id = live_class.recording_file_id

    meeting_code = live_class.meeting_code or extract_google_meeting_code(live_class.meeting_url)
    if not meeting_code and not live_class.meet_space_name:
        return False

    recording_data = sync_google_meet_recording(
        meeting_code=meeting_code,
        space_name=live_class.meet_space_name,
    )

    live_class.meeting_code = meeting_code or live_class.meeting_code
    live_class.meet_space_name = recording_data.get("space_name") or live_class.meet_space_name
    live_class.recording_status = recording_data.get("recording_status")
    live_class.recording_file_id = recording_data.get("recording_file_id")
    live_class.recording_resource_name = recording_data.get("recording_resource_name")
    live_class.recording_url = recording_data.get("recording_url")
    live_class.recording_started_at = recording_data.get("recording_started_at")
    live_class.recording_ended_at = recording_data.get("recording_ended_at")
    live_class.recording_synced_at = datetime.now(timezone.utc)

    changed = any(
        [
            previous_status != live_class.recording_status,
            previous_file_id != live_class.recording_file_id,
        ]
    )

    just_became_available = (
        live_class.recording_status == "available"
        and live_class.recording_file_id
        and (previous_status != "available" or previous_file_id != live_class.recording_file_id)
    )

    if notify_users and just_became_available:
        title = "Grabacion disponible"
        message = f"La grabacion de la clase {live_class.title} ya esta lista para verla en la plataforma."
        create_notification(
            db,
            user_id=live_class.teacher_id,
            title=title,
            message=message,
            notification_type=NotificationType.live_class,
            link="/live-classes",
        )
        notify_grade_students(
            db,
            grade_id=live_class.grade_id,
            title=title,
            message=message,
            notification_type=NotificationType.live_class,
            link="/live-classes",
        )

    return changed


def sync_due_live_class_recordings(*, limit: int = 20) -> int:
    synced_count = 0
    db = SessionLocal()
    try:
        candidates = (
            db.query(LiveClass)
            .filter(LiveClass.meeting_provider == "google_meet")
            .order_by(LiveClass.scheduled_at.desc())
            .limit(limit)
            .all()
        )

        for live_class in candidates:
            if not should_auto_sync_live_class_recording(live_class):
                continue

            try:
                changed = sync_live_class_recording_metadata(db, live_class)
                db.commit()
                if changed:
                    synced_count += 1
            except GoogleMeetIntegrationError as exc:
                db.rollback()
                logger.warning(
                    "No se pudo sincronizar la grabacion de la clase %s (%s): %s",
                    live_class.id,
                    live_class.title,
                    exc,
                )
            except Exception:
                db.rollback()
                logger.exception(
                    "Fallo inesperado al sincronizar la grabacion de la clase %s",
                    live_class.id,
                )
        return synced_count
    finally:
        db.close()


def start_live_class_recording_sync_loop(stop_event: threading.Event) -> threading.Thread:
    interval_seconds = max(settings.google_meet_recording_sync_interval_seconds, 30)

    def _runner():
        logger.info(
            "Poller de grabaciones de clases en vivo iniciado cada %s segundos",
            interval_seconds,
        )
        while not stop_event.is_set():
            try:
                sync_due_live_class_recordings()
            except Exception:
                logger.exception("Fallo el poller de grabaciones de clases en vivo")

            if stop_event.wait(interval_seconds):
                break

        logger.info("Poller de grabaciones de clases en vivo detenido")

    thread = threading.Thread(
        target=_runner,
        name="live-class-recording-sync",
        daemon=True,
    )
    thread.start()
    return thread
