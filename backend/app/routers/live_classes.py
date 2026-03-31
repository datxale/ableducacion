import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.academic_group import AcademicGroup
from app.models.live_class import LiveClass
from app.models.live_class_attendance import AttendanceStatus, LiveClassAttendance
from app.models.grade import Grade
from app.models.month import Month
from app.models.notification import NotificationType
from app.models.subject import Subject
from app.schemas.live_class_attendance import LiveClassAttendanceResponse
from app.schemas.live_class import LiveClassCreate, LiveClassUpdate, LiveClassResponse
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.user import User, UserRole
from app.services.google_meet import (
    GoogleMeetIntegrationError,
    create_google_meet_event,
    delete_google_meet_event,
    download_google_drive_recording,
    extract_google_meeting_code,
    get_google_calendar_embed_url,
    get_google_calendar_public_url,
    google_meet_auto_recording_is_enabled,
    google_meet_is_configured,
    update_google_meet_event,
)
from app.services.live_class_recordings import (
    should_auto_sync_live_class_recording,
    sync_live_class_recording_metadata,
)
from app.services.notifications import notify_grade_students

router = APIRouter(prefix="/api/live-classes", tags=["Clases en Vivo"])
logger = logging.getLogger(__name__)


@router.get("/config/status")
def get_live_class_config_status(
    current_user: User = Depends(get_current_user),
):
    return {
        "google_meet_enabled": google_meet_is_configured(),
        "auto_recording_enabled": google_meet_auto_recording_is_enabled(),
        "calendar_embed_url": get_google_calendar_embed_url(),
        "calendar_public_url": get_google_calendar_public_url(),
    }


def _ensure_live_class_access(live_class: LiveClass, current_user: User) -> None:
    if current_user.role == UserRole.docente and live_class.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para acceder a esta clase",
        )
    if current_user.role == UserRole.estudiante and current_user.grade_id != live_class.grade_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene acceso a esta clase.",
        )
    if (
        current_user.role == UserRole.estudiante
        and live_class.group_id is not None
        and current_user.group_id != live_class.group_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene acceso a las clases de otra seccion.",
        )


def _apply_google_meet_data(live_class: LiveClass, meeting_data: dict) -> None:
    live_class.meeting_url = meeting_data["meeting_url"]
    live_class.external_event_id = meeting_data["event_id"]
    live_class.meeting_code = meeting_data.get("meeting_code")
    live_class.meet_space_name = meeting_data.get("meet_space_name")
    live_class.recording_status = meeting_data.get("recording_status")
    live_class.recording_file_id = None
    live_class.recording_resource_name = None
    live_class.recording_url = None
    live_class.recording_started_at = None
    live_class.recording_ended_at = None
    live_class.recording_synced_at = None


def _clear_google_meet_data(live_class: LiveClass) -> None:
    live_class.meeting_code = None
    live_class.meet_space_name = None
    live_class.recording_status = None
    live_class.recording_file_id = None
    live_class.recording_resource_name = None
    live_class.recording_url = None
    live_class.recording_started_at = None
    live_class.recording_ended_at = None
    live_class.recording_synced_at = None


def _sync_recording_metadata(db: Session, live_class: LiveClass) -> LiveClass:
    if live_class.meeting_provider != "google_meet":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo las clases con Google Meet pueden sincronizar grabaciones.",
        )

    meeting_code = live_class.meeting_code or extract_google_meeting_code(live_class.meeting_url)
    if not meeting_code and not live_class.meet_space_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La clase no tiene un codigo de reunion de Google Meet para sincronizar grabaciones.",
        )
    sync_live_class_recording_metadata(db, live_class, notify_users=False)
    return live_class


def _resolve_live_class_month_id(
    db: Session,
    scheduled_at: datetime,
    month_id: Optional[int],
) -> Optional[int]:
    if month_id is not None:
        return month_id

    month = db.query(Month).filter(Month.number == scheduled_at.month).first()
    return month.id if month else None


def _validate_live_class_metadata(
    db: Session,
    grade_id: int,
    subject_id: int,
    group_id: Optional[int],
    month_id: Optional[int],
    week_number: Optional[int],
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )
    if subject.grade_id != grade_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La asignatura seleccionada no pertenece al grado indicado.",
        )

    if group_id is not None:
        group = db.query(AcademicGroup).filter(AcademicGroup.id == group_id).first()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seccion no encontrada",
            )
        if group.grade_id != grade_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La seccion seleccionada no pertenece al grado indicado.",
            )

    if month_id is not None:
        month = db.query(Month).filter(Month.id == month_id).first()
        if not month:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mes no encontrado",
            )

    if week_number is not None and week_number <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La semana debe ser mayor que cero.",
        )

    return grade, subject


def _apply_live_class_scope(
    query,
    current_user: User,
    grade_id: Optional[int],
    teacher_id: Optional[int],
    group_id: Optional[int],
):
    if current_user.role == UserRole.estudiante:
        if grade_id is not None and current_user.grade_id != grade_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene acceso a las clases de otro grado.",
            )
        if group_id is not None and current_user.group_id != group_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene acceso a las clases de otra seccion.",
            )
        scoped_query = query.filter(LiveClass.grade_id == current_user.grade_id)
        if current_user.group_id is not None:
            scoped_query = scoped_query.filter(
                or_(LiveClass.group_id.is_(None), LiveClass.group_id == current_user.group_id)
            )
        else:
            scoped_query = scoped_query.filter(LiveClass.group_id.is_(None))
        return scoped_query

    if current_user.role == UserRole.docente:
        if teacher_id is not None and teacher_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Los docentes solo pueden consultar sus propias clases",
            )
        return query.filter(LiveClass.teacher_id == current_user.id)

    return query


def _auto_sync_live_classes(db: Session, live_classes: list[LiveClass]) -> None:
    if not google_meet_is_configured():
        return

    for live_class in live_classes:
        if not should_auto_sync_live_class_recording(live_class):
            continue
        try:
            sync_live_class_recording_metadata(db, live_class)
            db.commit()
            db.refresh(live_class)
        except GoogleMeetIntegrationError:
            db.rollback()
        except Exception:
            db.rollback()
            logger.exception(
                "Fallo inesperado al sincronizar la grabacion de la clase %s durante el listado",
                live_class.id,
            )


def _iter_stream(response):
    try:
        for chunk in response.iter_content(chunk_size=1024 * 256):
            if chunk:
                yield chunk
    finally:
        response.close()


@router.post("/{class_id}/recording/sync", response_model=LiveClassResponse)
def sync_live_class_recording(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    _ensure_live_class_access(live_class, current_user)

    try:
        _sync_recording_metadata(db, live_class)
        db.commit()
        db.refresh(live_class)
        return live_class
    except GoogleMeetIntegrationError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{class_id}/recording/stream")
def stream_live_class_recording(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    _ensure_live_class_access(live_class, current_user)

    try:
        if not live_class.recording_file_id:
            _sync_recording_metadata(db, live_class)
            db.commit()
            db.refresh(live_class)
        if not live_class.recording_file_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La grabacion aun no esta disponible para esta clase.",
            )

        drive_file = download_google_drive_recording(live_class.recording_file_id)
        metadata = drive_file["metadata"]
        media_response = drive_file["response"]
        headers = {}
        if metadata.get("name"):
            headers["Content-Disposition"] = f'inline; filename="{metadata["name"]}"'
        return StreamingResponse(
            _iter_stream(media_response),
            media_type=metadata.get("mimeType") or media_response.headers.get("Content-Type") or "application/octet-stream",
            headers=headers,
        )
    except GoogleMeetIntegrationError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=List[LiveClassResponse])
def list_live_classes(
    grade_id: Optional[int] = Query(None),
    group_id: Optional[int] = Query(None),
    month_id: Optional[int] = Query(None),
    week_number: Optional[int] = Query(None, ge=1),
    subject_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LiveClass)
    query = _apply_live_class_scope(query, current_user, grade_id, teacher_id, group_id)
    if grade_id is not None:
        query = query.filter(LiveClass.grade_id == grade_id)
    if group_id is not None:
        query = query.filter(LiveClass.group_id == group_id)
    if month_id is not None:
        query = query.filter(LiveClass.month_id == month_id)
    if week_number is not None:
        query = query.filter(LiveClass.week_number == week_number)
    if subject_id is not None:
        query = query.filter(LiveClass.subject_id == subject_id)
    if teacher_id is not None:
        query = query.filter(LiveClass.teacher_id == teacher_id)
    if from_date is not None:
        query = query.filter(LiveClass.scheduled_at >= from_date)
    if to_date is not None:
        query = query.filter(LiveClass.scheduled_at <= to_date)
    live_classes = query.order_by(LiveClass.scheduled_at).offset(skip).limit(limit).all()
    _auto_sync_live_classes(db, live_classes)
    return live_classes


@router.get("/{class_id}", response_model=LiveClassResponse)
def get_live_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    _ensure_live_class_access(live_class, current_user)
    if should_auto_sync_live_class_recording(live_class):
        try:
            sync_live_class_recording_metadata(db, live_class)
            db.commit()
            db.refresh(live_class)
        except GoogleMeetIntegrationError:
            db.rollback()
    return live_class


@router.post("/", response_model=LiveClassResponse, status_code=status.HTTP_201_CREATED)
def create_live_class(
    class_data: LiveClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    if class_data.meeting_provider != "google_meet" and not class_data.meeting_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las clases manuales o Zoom requieren una URL de reunion.",
        )

    payload = class_data.model_dump()
    payload["month_id"] = _resolve_live_class_month_id(db, class_data.scheduled_at, payload.get("month_id"))
    grade, subject = _validate_live_class_metadata(
        db,
        payload["grade_id"],
        payload["subject_id"],
        payload.get("group_id"),
        payload.get("month_id"),
        payload.get("week_number"),
    )

    live_class = LiveClass(**payload, teacher_id=current_user.id)
    db.add(live_class)
    db.flush()

    created_external_event_id = None
    try:
        if class_data.meeting_provider == "google_meet":
            meeting_data = create_google_meet_event(
                title=live_class.title,
                description=live_class.description,
                scheduled_at=live_class.scheduled_at,
                grade_name=grade.name,
                subject_name=subject.name,
                class_type=live_class.class_type.value,
            )
            created_external_event_id = meeting_data["event_id"]
            _apply_google_meet_data(live_class, meeting_data)

        db.commit()
        db.refresh(live_class)
        notify_grade_students(
            db,
            grade_id=live_class.grade_id,
            group_id=live_class.group_id,
            title="Nueva clase programada",
            message=f"Tienes una clase en vivo: {live_class.title}.",
            notification_type=NotificationType.live_class,
            link="/live-classes",
        )
        db.commit()
        db.refresh(live_class)
        return live_class
    except GoogleMeetIntegrationError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception:
        db.rollback()
        if created_external_event_id:
            try:
                delete_google_meet_event(created_external_event_id)
            except GoogleMeetIntegrationError:
                pass
        raise


@router.put("/{class_id}", response_model=LiveClassResponse)
def update_live_class(
    class_id: int,
    class_data: LiveClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    if current_user.role == UserRole.docente and live_class.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para actualizar esta clase",
        )

    update_data = class_data.model_dump(exclude_unset=True)
    next_scheduled_at = update_data.get("scheduled_at", live_class.scheduled_at)
    next_month_id = _resolve_live_class_month_id(
        db,
        next_scheduled_at,
        update_data.get("month_id", live_class.month_id),
    )
    grade, subject = _validate_live_class_metadata(
        db,
        update_data.get("grade_id", live_class.grade_id),
        update_data.get("subject_id", live_class.subject_id),
        update_data.get("group_id", live_class.group_id),
        next_month_id,
        update_data.get("week_number", live_class.week_number),
    )
    update_data["month_id"] = next_month_id
    next_meeting_provider = update_data.get("meeting_provider", live_class.meeting_provider)
    next_meeting_url = update_data.get("meeting_url", live_class.meeting_url)

    if (
        next_meeting_provider != "google_meet"
        and not next_meeting_url
        and ("meeting_provider" in update_data or "meeting_url" in update_data)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las clases manuales o Zoom requieren una URL de reunion.",
        )

    previous_provider = live_class.meeting_provider
    previous_event_id = live_class.external_event_id

    for field, value in update_data.items():
        setattr(live_class, field, value)

    try:
        if live_class.meeting_provider == "google_meet":
            meeting_data = (
                update_google_meet_event(
                    event_id=live_class.external_event_id,
                    title=live_class.title,
                    description=live_class.description,
                    scheduled_at=live_class.scheduled_at,
                    grade_name=grade.name if grade else None,
                    subject_name=subject.name if subject else None,
                    class_type=live_class.class_type.value,
                )
                if live_class.external_event_id
                else create_google_meet_event(
                    title=live_class.title,
                    description=live_class.description,
                    scheduled_at=live_class.scheduled_at,
                    grade_name=grade.name if grade else None,
                    subject_name=subject.name if subject else None,
                    class_type=live_class.class_type.value,
                )
            )
            _apply_google_meet_data(live_class, meeting_data)
        elif previous_provider == "google_meet":
            if previous_event_id:
                delete_google_meet_event(previous_event_id)
            live_class.external_event_id = None
            _clear_google_meet_data(live_class)

        db.commit()
        db.refresh(live_class)
        return live_class
    except GoogleMeetIntegrationError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_live_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    if current_user.role == UserRole.docente and live_class.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar esta clase",
        )
    try:
        if live_class.meeting_provider == "google_meet" and live_class.external_event_id:
            delete_google_meet_event(live_class.external_event_id)
    except GoogleMeetIntegrationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    (
        db.query(LiveClassAttendance)
        .filter(LiveClassAttendance.live_class_id == live_class.id)
        .delete(synchronize_session=False)
    )
    db.delete(live_class)
    db.commit()


@router.post("/{class_id}/attendance/join", response_model=LiveClassAttendanceResponse)
def mark_attendance(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.estudiante:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los estudiantes pueden registrar asistencia.",
        )

    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    if current_user.grade_id != live_class.grade_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene acceso a esta clase.",
        )
    if live_class.group_id is not None and current_user.group_id != live_class.group_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene acceso a las clases de otra seccion.",
        )

    attendance = (
        db.query(LiveClassAttendance)
        .filter(
            LiveClassAttendance.live_class_id == class_id,
            LiveClassAttendance.student_id == current_user.id,
        )
        .first()
    )

    now = datetime.now(timezone.utc)
    tolerance = live_class.scheduled_at + timedelta(minutes=10)
    next_status = AttendanceStatus.late if now > tolerance else AttendanceStatus.present

    if attendance:
        attendance.status = next_status
        attendance.joined_at = attendance.joined_at or now
    else:
        attendance = LiveClassAttendance(
            live_class_id=class_id,
            student_id=current_user.id,
            status=next_status,
            joined_at=now,
        )
        db.add(attendance)

    db.commit()
    db.refresh(attendance)
    payload = LiveClassAttendanceResponse.model_validate(attendance).model_dump()
    payload["student_name"] = current_user.full_name
    return LiveClassAttendanceResponse(**payload)


@router.get("/{class_id}/attendance", response_model=List[LiveClassAttendanceResponse])
def list_attendance(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    live_class = db.query(LiveClass).filter(LiveClass.id == class_id).first()
    if not live_class:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clase en vivo no encontrada",
        )
    if current_user.role == UserRole.docente and live_class.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver la asistencia de esta clase",
        )

    records = (
        db.query(LiveClassAttendance)
        .filter(LiveClassAttendance.live_class_id == class_id)
        .order_by(LiveClassAttendance.joined_at.asc())
        .all()
    )
    response = []
    for record in records:
        payload = LiveClassAttendanceResponse.model_validate(record).model_dump()
        payload["student_name"] = record.student.full_name if record.student else None
        response.append(LiveClassAttendanceResponse(**payload))
    return response
