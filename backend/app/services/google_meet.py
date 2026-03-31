import json
import re
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import quote_plus
from uuid import uuid4
from zoneinfo import ZoneInfo

from google.auth.transport.requests import AuthorizedSession, Request
from google.oauth2 import service_account
from google.oauth2.credentials import Credentials as UserCredentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.config import settings


GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar"
GOOGLE_MEET_SPACE_READONLY_SCOPE = "https://www.googleapis.com/auth/meetings.space.readonly"
GOOGLE_MEET_SPACE_SETTINGS_SCOPE = "https://www.googleapis.com/auth/meetings.space.settings"
GOOGLE_DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly"
GOOGLE_MEET_API_BASE = "https://meet.googleapis.com/v2"
GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3"
MEETING_CODE_PATTERN = re.compile(r"([a-z]{3}-[a-z]{4}-[a-z]{3})")


class GoogleMeetIntegrationError(Exception):
    pass


def google_meet_is_configured() -> bool:
    return settings.google_meet_enabled


def google_meet_auto_recording_is_enabled() -> bool:
    return settings.google_meet_enabled and settings.google_meet_auto_recording_enabled


def get_google_calendar_public_url() -> Optional[str]:
    if not settings.google_meet_enabled:
        return None
    return "https://calendar.google.com/calendar/u/0/r/week"


def get_google_calendar_embed_url() -> Optional[str]:
    if not settings.google_meet_enabled:
        return None

    try:
        calendar_id = _get_calendar_id()
    except GoogleMeetIntegrationError:
        return None

    timezone_name = settings.google_meet_timezone or "America/Lima"
    return (
        "https://calendar.google.com/calendar/u/0/embed"
        f"?src={quote_plus(calendar_id)}"
        f"&ctz={quote_plus(timezone_name)}"
        "&mode=WEEK"
        "&showTitle=0"
        "&showNav=1"
        "&showDate=1"
        "&showPrint=0"
        "&showTabs=0"
        "&showCalendars=0"
        "&showTz=0"
    )


def create_google_meet_event(
    *,
    title: str,
    description: Optional[str],
    scheduled_at,
    grade_name: Optional[str] = None,
    subject_name: Optional[str] = None,
    class_type: Optional[str] = None,
):
    service = _build_calendar_service()
    body = _build_event_payload(
        title=title,
        description=description,
        scheduled_at=scheduled_at,
        grade_name=grade_name,
        subject_name=subject_name,
        class_type=class_type,
        existing_conference_data=None,
    )
    event = (
        service.events()
        .insert(
            calendarId=_get_calendar_id(),
            body=body,
            conferenceDataVersion=1,
            sendUpdates="none",
        )
        .execute()
    )
    meeting_url = _extract_meeting_url(event)
    space_data = _ensure_google_meet_space_configuration(meeting_url)
    return {
        "event_id": event.get("id"),
        "meeting_url": meeting_url,
        "meeting_code": space_data.get("meeting_code"),
        "meet_space_name": space_data.get("space_name"),
        "recording_status": "pending" if google_meet_auto_recording_is_enabled() else None,
    }


def update_google_meet_event(
    *,
    event_id: str,
    title: str,
    description: Optional[str],
    scheduled_at,
    grade_name: Optional[str] = None,
    subject_name: Optional[str] = None,
    class_type: Optional[str] = None,
):
    service = _build_calendar_service()

    try:
        existing_event = (
            service.events()
            .get(calendarId=_get_calendar_id(), eventId=event_id)
            .execute()
        )
    except HttpError as exc:
        if exc.resp.status == 404:
            return create_google_meet_event(
                title=title,
                description=description,
                scheduled_at=scheduled_at,
                grade_name=grade_name,
                subject_name=subject_name,
                class_type=class_type,
            )
        raise GoogleMeetIntegrationError(_format_google_http_error("Google Calendar", exc)) from exc

    body = _build_event_payload(
        title=title,
        description=description,
        scheduled_at=scheduled_at,
        grade_name=grade_name,
        subject_name=subject_name,
        class_type=class_type,
        existing_conference_data=existing_event.get("conferenceData"),
    )
    event = (
        service.events()
        .patch(
            calendarId=_get_calendar_id(),
            eventId=event_id,
            body=body,
            conferenceDataVersion=1,
            sendUpdates="none",
        )
        .execute()
    )
    meeting_url = _extract_meeting_url(event)
    space_data = _ensure_google_meet_space_configuration(meeting_url)
    return {
        "event_id": event.get("id"),
        "meeting_url": meeting_url,
        "meeting_code": space_data.get("meeting_code"),
        "meet_space_name": space_data.get("space_name"),
        "recording_status": "pending" if google_meet_auto_recording_is_enabled() else None,
    }


def delete_google_meet_event(event_id: str) -> None:
    if not event_id:
        return

    service = _build_calendar_service()
    try:
        (
            service.events()
            .delete(
                calendarId=_get_calendar_id(),
                eventId=event_id,
                sendUpdates="none",
            )
            .execute()
        )
    except HttpError as exc:
        if exc.resp.status == 404:
            return
        raise GoogleMeetIntegrationError(_format_google_http_error("Google Calendar", exc)) from exc


def extract_google_meeting_code(meeting_url: Optional[str]) -> Optional[str]:
    if not meeting_url:
        return None
    match = MEETING_CODE_PATTERN.search(meeting_url)
    return match.group(1) if match else None


def sync_google_meet_recording(
    *,
    meeting_code: Optional[str] = None,
    space_name: Optional[str] = None,
):
    if not meeting_code and not space_name:
        raise GoogleMeetIntegrationError(
            "Falta el codigo de reunion o el nombre del espacio para sincronizar grabaciones."
        )

    filter_expression = (
        f'space.name = "{space_name}"'
        if space_name
        else f'space.meeting_code = "{meeting_code}"'
    )
    payload = _meet_api_request(
        "GET",
        "conferenceRecords",
        scopes=[GOOGLE_MEET_SPACE_READONLY_SCOPE],
        params={"filter": filter_expression, "pageSize": 10},
    )
    conference_records = payload.get("conferenceRecords") or []
    if not conference_records:
        return {
            "meeting_code": meeting_code,
            "space_name": space_name,
            "recording_status": "pending",
            "recording_file_id": None,
            "recording_resource_name": None,
            "recording_url": None,
            "recording_started_at": None,
            "recording_ended_at": None,
        }

    conference_record = sorted(
        conference_records,
        key=lambda item: item.get("startTime") or "",
        reverse=True,
    )[0]
    recordings_payload = _meet_api_request(
        "GET",
        f"{conference_record['name']}/recordings",
        scopes=[GOOGLE_MEET_SPACE_READONLY_SCOPE],
        params={"pageSize": 10},
    )
    recordings = recordings_payload.get("recordings") or []
    if not recordings:
        return {
            "meeting_code": meeting_code or extract_google_meeting_code_from_space(space_name),
            "space_name": conference_record.get("space", {}).get("name") or space_name,
            "recording_status": "processing" if conference_record.get("endTime") else "recording",
            "recording_file_id": None,
            "recording_resource_name": None,
            "recording_url": None,
            "recording_started_at": None,
            "recording_ended_at": None,
        }

    recording = sorted(
        recordings,
        key=lambda item: item.get("startTime") or "",
        reverse=True,
    )[0]
    drive_destination = recording.get("driveDestination") or {}

    return {
        "meeting_code": meeting_code or extract_google_meeting_code_from_space(space_name),
        "space_name": conference_record.get("space", {}).get("name") or space_name,
        "recording_status": _map_recording_state(recording.get("state")),
        "recording_file_id": drive_destination.get("file"),
        "recording_resource_name": recording.get("name"),
        "recording_url": drive_destination.get("exportUri"),
        "recording_started_at": _parse_google_datetime(recording.get("startTime")),
        "recording_ended_at": _parse_google_datetime(recording.get("endTime")),
    }


def download_google_drive_recording(file_id: str):
    if not file_id:
        raise GoogleMeetIntegrationError("La grabacion no tiene un archivo asociado en Drive.")

    session = _authorized_session([GOOGLE_DRIVE_READONLY_SCOPE])
    metadata_response = session.get(
        f"{GOOGLE_DRIVE_API_BASE}/files/{file_id}",
        params={"fields": "id,name,mimeType"},
        timeout=30,
    )
    if not metadata_response.ok:
        raise GoogleMeetIntegrationError(_format_http_response_error("Google Drive", metadata_response))

    media_response = session.get(
        f"{GOOGLE_DRIVE_API_BASE}/files/{file_id}",
        params={"alt": "media"},
        stream=True,
        timeout=60,
    )
    if not media_response.ok:
        raise GoogleMeetIntegrationError(_format_http_response_error("Google Drive", media_response))

    return {
        "metadata": metadata_response.json(),
        "response": media_response,
    }


def _build_calendar_service():
    credentials_source = _build_google_credentials([GOOGLE_CALENDAR_SCOPE])
    return build("calendar", "v3", credentials=credentials_source, cache_discovery=False)


def _build_google_credentials(scopes: list[str]):
    if not settings.google_meet_enabled:
        raise GoogleMeetIntegrationError(
            "La integracion de Google Meet no esta habilitada en el servidor."
        )

    credentials_source = None
    if settings.google_service_account_json:
        try:
            credentials_source = service_account.Credentials.from_service_account_info(
                json.loads(settings.google_service_account_json),
                scopes=scopes,
            )
        except json.JSONDecodeError as exc:
            raise GoogleMeetIntegrationError(
                "GOOGLE_SERVICE_ACCOUNT_JSON no contiene un JSON valido."
            ) from exc
    elif settings.google_service_account_file:
        credentials_source = service_account.Credentials.from_service_account_file(
            settings.google_service_account_file,
            scopes=scopes,
        )
    elif (
        settings.google_oauth_client_id
        and settings.google_oauth_client_secret
        and settings.google_oauth_refresh_token
    ):
        credentials_source = UserCredentials(
            token=None,
            refresh_token=settings.google_oauth_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_oauth_client_id,
            client_secret=settings.google_oauth_client_secret,
            scopes=scopes,
        )
    else:
        raise GoogleMeetIntegrationError(
            "Falta configurar credenciales de Google. Use service account o GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET y GOOGLE_OAUTH_REFRESH_TOKEN."
        )

    if (
        isinstance(credentials_source, service_account.Credentials)
        and settings.google_workspace_impersonated_user
    ):
        credentials_source = credentials_source.with_subject(
            settings.google_workspace_impersonated_user
        )

    return credentials_source


def _authorized_session(scopes: list[str]) -> AuthorizedSession:
    credentials = _build_google_credentials(scopes)
    if not credentials.valid:
        credentials.refresh(Request())
    return AuthorizedSession(credentials)


def _meet_api_request(
    method: str,
    path: str,
    *,
    scopes: list[str],
    params: Optional[dict] = None,
    body: Optional[dict] = None,
):
    session = _authorized_session(scopes)
    response = session.request(
        method,
        f"{GOOGLE_MEET_API_BASE}/{path}",
        params=params,
        json=body,
        timeout=30,
    )
    if not response.ok:
        raise GoogleMeetIntegrationError(_format_http_response_error("Google Meet", response))
    if not response.content:
        return {}
    return response.json()


def _ensure_google_meet_space_configuration(meeting_url: str):
    meeting_code = extract_google_meeting_code(meeting_url)
    if not meeting_code:
        return {"meeting_code": None, "space_name": None}

    space = _meet_api_request(
        "GET",
        f"spaces/{meeting_code}",
        scopes=[GOOGLE_MEET_SPACE_READONLY_SCOPE],
    )
    space_name = space.get("name")

    artifact_config = {}
    update_fields: list[str] = []
    if settings.google_meet_auto_recording_enabled:
        artifact_config["recordingConfig"] = {"autoRecordingGeneration": "ON"}
        update_fields.append("config.artifactConfig.recordingConfig.autoRecordingGeneration")
    if settings.google_meet_auto_transcription_enabled:
        artifact_config["transcriptionConfig"] = {"autoTranscriptionGeneration": "ON"}
        update_fields.append("config.artifactConfig.transcriptionConfig.autoTranscriptionGeneration")

    if space_name and update_fields:
        _meet_api_request(
            "PATCH",
            space_name,
            scopes=[GOOGLE_MEET_SPACE_SETTINGS_SCOPE],
            params={"updateMask": ",".join(update_fields)},
            body={"config": {"artifactConfig": artifact_config}},
        )

    return {"meeting_code": meeting_code, "space_name": space_name}


def _build_event_payload(
    *,
    title: str,
    description: Optional[str],
    scheduled_at,
    grade_name: Optional[str],
    subject_name: Optional[str],
    class_type: Optional[str],
    existing_conference_data,
):
    scheduled_start = scheduled_at
    if scheduled_start.tzinfo is None:
        scheduled_start = scheduled_start.replace(tzinfo=timezone.utc)

    timezone_name = settings.google_meet_timezone or "America/Lima"
    zone = ZoneInfo(timezone_name)
    start_at = scheduled_start.astimezone(zone)
    end_at = start_at + timedelta(minutes=settings.google_meet_duration_minutes)

    description_lines = [line for line in [description] if line]
    metadata = []
    if grade_name:
        metadata.append(f"Grado: {grade_name}")
    if subject_name:
        metadata.append(f"Materia: {subject_name}")
    if class_type:
        metadata.append(f"Tipo: {class_type}")
    if metadata:
        description_lines.append("")
        description_lines.extend(metadata)

    payload = {
        "summary": title,
        "description": "\n".join(description_lines) if description_lines else None,
        "start": {
            "dateTime": start_at.isoformat(),
            "timeZone": timezone_name,
        },
        "end": {
            "dateTime": end_at.isoformat(),
            "timeZone": timezone_name,
        },
    }

    if existing_conference_data:
        payload["conferenceData"] = existing_conference_data
    else:
        payload["conferenceData"] = {
            "createRequest": {
                "requestId": str(uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        }

    return payload


def _extract_meeting_url(event: dict) -> str:
    if event.get("hangoutLink"):
        return event["hangoutLink"]

    conference_data = event.get("conferenceData") or {}
    for entry in conference_data.get("entryPoints", []):
        if entry.get("entryPointType") == "video" and entry.get("uri"):
            return entry["uri"]

    raise GoogleMeetIntegrationError(
        "Google no devolvio un enlace de Meet para el evento creado."
    )


def _get_calendar_id() -> str:
    calendar_id = settings.google_meet_calendar_id or settings.google_workspace_impersonated_user
    if not calendar_id and settings.google_oauth_refresh_token:
        calendar_id = "primary"
    if not calendar_id:
        raise GoogleMeetIntegrationError(
            "Falta configurar GOOGLE_MEET_CALENDAR_ID. Con Google Workspace tambien puede usar GOOGLE_WORKSPACE_IMPERSONATED_USER."
        )
    return calendar_id


def _map_recording_state(state: Optional[str]) -> str:
    if state == "FILE_GENERATED":
        return "available"
    if state == "STARTED":
        return "recording"
    if state == "ENDED":
        return "processing"
    return "pending"


def _parse_google_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def extract_google_meeting_code_from_space(space_name: Optional[str]) -> Optional[str]:
    return None if not space_name else extract_google_meeting_code(space_name)


def _format_http_response_error(service_name: str, response) -> str:
    try:
        payload = response.json()
        detail = payload.get("error", {}).get("message")
        if detail:
            return f"{service_name} respondio: {detail}"
    except Exception:
        pass
    return f"No se pudo completar la operacion con {service_name}."


def _format_google_http_error(service_name: str, exc: HttpError) -> str:
    try:
        payload = json.loads(exc.content.decode("utf-8"))
        detail = payload.get("error", {}).get("message")
        if detail:
            return f"{service_name} respondio: {detail}"
    except Exception:
        pass
    return f"No se pudo completar la operacion con {service_name}."
