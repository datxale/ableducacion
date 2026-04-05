from typing import List, Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.academic_group import AcademicGroup
from app.models.activity import Activity, ActivityType
from app.models.activity_resource import ActivityResource
from app.models.activity_submission import ActivitySubmission
from app.models.live_class import LiveClass
from app.models.notification import NotificationType
from app.models.progress import Progress
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.models.week import Week
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.services.notifications import notify_grade_students

router = APIRouter(prefix="/api/activities", tags=["Actividades"])


def _allowed_scope_for_teacher(db: Session, teacher_id: int) -> tuple[set[int], set[int]]:
    groups = db.query(AcademicGroup).filter(AcademicGroup.teacher_id == teacher_id).all()
    allowed_group_ids = {group.id for group in groups}
    allowed_grade_ids = {group.grade_id for group in groups}
    live_class_grade_ids = {
        item.grade_id
        for item in db.query(LiveClass).filter(LiveClass.teacher_id == teacher_id).all()
    }
    return allowed_grade_ids | live_class_grade_ids, allowed_group_ids


def _derive_filename_from_url(url: str) -> Optional[str]:
    path = urlparse(url).path
    if not path:
        return None
    filename = path.rsplit("/", 1)[-1].strip()
    return filename or None


def _resource_attr(resource, name: str):
    if isinstance(resource, dict):
        return resource.get(name)
    return getattr(resource, name, None)


def _activity_resources_data(activity: Activity) -> list[dict]:
    if activity.resources:
        return [
            {
                "id": resource.id,
                "url": resource.url,
                "filename": resource.filename,
                "content_type": resource.content_type,
                "order_index": resource.order_index,
                "created_at": resource.created_at,
            }
            for resource in sorted(activity.resources, key=lambda item: (item.order_index, item.id))
        ]

    if activity.file_url:
        return [
            {
                "id": None,
                "url": activity.file_url,
                "filename": _derive_filename_from_url(activity.file_url),
                "content_type": None,
                "order_index": 0,
                "created_at": None,
            }
        ]

    return []


def _normalize_resources(
    file_url: Optional[str],
    resources: Optional[list],
) -> list[dict]:
    resource_items = list(resources or [])
    normalized: list[dict] = []
    seen_urls: set[str] = set()

    legacy_file_url = (file_url or "").strip()
    if legacy_file_url:
        matching_resource = next(
            (
                resource
                for resource in resource_items
                if (_resource_attr(resource, "url") or "").strip() == legacy_file_url
            ),
            None,
        )
        normalized.append(
            {
                "url": legacy_file_url,
                "filename": (_resource_attr(matching_resource, "filename") or "").strip()
                or _derive_filename_from_url(legacy_file_url),
                "content_type": (_resource_attr(matching_resource, "content_type") or "").strip()
                or None,
            }
        )
        seen_urls.add(legacy_file_url)

    for resource in resource_items:
        url = (_resource_attr(resource, "url") or "").strip()
        if not url or url in seen_urls:
            continue
        filename = (_resource_attr(resource, "filename") or "").strip() or _derive_filename_from_url(url)
        content_type = (_resource_attr(resource, "content_type") or "").strip() or None
        normalized.append(
            {
                "url": url,
                "filename": filename,
                "content_type": content_type,
            }
        )
        seen_urls.add(url)

    for index, resource in enumerate(normalized):
        resource["order_index"] = index

    return normalized


def _sync_activity_resources(activity: Activity, resources: list[dict]) -> None:
    activity.resources.clear()
    for resource in resources:
        activity.resources.append(
            ActivityResource(
                url=resource["url"],
                filename=resource.get("filename"),
                content_type=resource.get("content_type"),
                order_index=resource["order_index"],
            )
        )


def _validate_activity_content(
    *,
    activity_type: ActivityType,
    video_url: Optional[str],
    resources: list[dict],
) -> None:
    if activity_type == ActivityType.video:
        if not (video_url or "").strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los videos deben tener un video_url",
            )
        return

    if not resources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los archivos o recursos deben tener al menos un archivo adjunto.",
        )


def _serialize_activity(activity: Activity, current_user: User, db: Session) -> ActivityResponse:
    payload = ActivityResponse.model_validate(activity).model_dump()
    payload["group_name"] = activity.group.name if activity.group else None
    payload["resources"] = _activity_resources_data(activity)
    payload["submission_count"] = len(activity.submissions or [])
    payload["my_submission"] = None

    if current_user.role == UserRole.estudiante:
        submission = (
            db.query(ActivitySubmission)
            .filter(
                ActivitySubmission.activity_id == activity.id,
                ActivitySubmission.student_id == current_user.id,
            )
            .first()
        )
        payload["my_submission"] = submission

    return ActivityResponse(**payload)


def _validate_week_and_group(
    db: Session,
    week_id: int,
    group_id: Optional[int],
) -> tuple[Week, Subject, Optional[AcademicGroup]]:
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semana no encontrada",
        )

    subject = db.query(Subject).filter(Subject.id == week.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )

    selected_group = None
    if group_id is not None:
        selected_group = db.query(AcademicGroup).filter(AcademicGroup.id == group_id).first()
        if not selected_group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seccion no encontrada",
            )
        if selected_group.grade_id != subject.grade_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La seccion seleccionada no pertenece al grado de la asignatura.",
            )

    return week, subject, selected_group


def _ensure_teacher_can_manage_activity(
    db: Session,
    current_user: User,
    *,
    subject_grade_id: int,
    group: Optional[AcademicGroup],
) -> None:
    if current_user.role != UserRole.docente:
        return

    allowed_grade_ids, allowed_group_ids = _allowed_scope_for_teacher(db, current_user.id)

    if group is not None:
        if group.id not in allowed_group_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para publicar actividades en esta seccion.",
            )
        return

    if subject_grade_id not in allowed_grade_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para publicar actividades en este grado.",
        )


def _ensure_user_can_access_activity(
    db: Session,
    current_user: User,
    activity: Activity,
) -> None:
    subject = activity.week.subject if activity.week else None
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )

    if current_user.role == UserRole.admin:
        return

    if current_user.role == UserRole.estudiante:
        if current_user.grade_id != subject.grade_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene acceso a actividades de otro grado.",
            )
        if activity.group_id is not None and current_user.group_id != activity.group_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene acceso a actividades de otra seccion.",
            )
        return

    allowed_grade_ids, allowed_group_ids = _allowed_scope_for_teacher(db, current_user.id)
    if activity.group_id is not None:
        if activity.group_id not in allowed_group_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene acceso a actividades de otra seccion.",
            )
        return

    if subject.grade_id not in allowed_grade_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene acceso a actividades de otro grado.",
        )


@router.get("/", response_model=List[ActivityResponse])
def list_activities(
    week_id: Optional[int] = Query(None),
    created_by: Optional[int] = Query(None),
    group_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Activity)
        .options(
            selectinload(Activity.resources),
            selectinload(Activity.group),
            selectinload(Activity.submissions),
            selectinload(Activity.week).selectinload(Week.subject),
        )
        .join(Activity.week)
        .join(Week.subject)
    )

    if current_user.role == UserRole.estudiante:
        if current_user.grade_id is None:
            return []

        query = query.filter(Subject.grade_id == current_user.grade_id)
        if group_id is not None:
            if current_user.group_id != group_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tiene acceso a actividades de otra seccion.",
                )
            query = query.filter(or_(Activity.group_id.is_(None), Activity.group_id == group_id))
        elif current_user.group_id is not None:
            query = query.filter(
                or_(Activity.group_id.is_(None), Activity.group_id == current_user.group_id)
            )
        else:
            query = query.filter(Activity.group_id.is_(None))

    elif current_user.role == UserRole.docente:
        allowed_grade_ids, allowed_group_ids = _allowed_scope_for_teacher(db, current_user.id)
        if not allowed_grade_ids and not allowed_group_ids:
            return []

        query = query.filter(Subject.grade_id.in_(allowed_grade_ids or {-1}))

        if created_by is not None and created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Los docentes solo pueden consultar sus propias actividades.",
            )

        if group_id is not None:
            if group_id not in allowed_group_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tiene permisos para consultar actividades de esta seccion.",
                )
            query = query.filter(or_(Activity.group_id.is_(None), Activity.group_id == group_id))
        elif allowed_group_ids:
            query = query.filter(
                or_(Activity.group_id.is_(None), Activity.group_id.in_(allowed_group_ids))
            )
        else:
            query = query.filter(Activity.group_id.is_(None))

    if week_id is not None:
        query = query.filter(Activity.week_id == week_id)
    if created_by is not None:
        query = query.filter(Activity.created_by == created_by)
    if group_id is not None and current_user.role == UserRole.admin:
        query = query.filter(or_(Activity.group_id.is_(None), Activity.group_id == group_id))

    activities = (
        query.order_by(Activity.created_at.desc(), Activity.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_activity(activity, current_user, db) for activity in activities]


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = (
        db.query(Activity)
        .options(
            selectinload(Activity.resources),
            selectinload(Activity.group),
            selectinload(Activity.submissions),
            selectinload(Activity.week).selectinload(Week.subject),
        )
        .filter(Activity.id == activity_id)
        .first()
    )
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )
    _ensure_user_can_access_activity(db, current_user, activity)
    return _serialize_activity(activity, current_user, db)


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    _, subject, selected_group = _validate_week_and_group(
        db,
        activity_data.week_id,
        activity_data.group_id,
    )
    _ensure_teacher_can_manage_activity(
        db,
        current_user,
        subject_grade_id=subject.grade_id,
        group=selected_group,
    )

    normalized_resources = _normalize_resources(
        activity_data.file_url,
        activity_data.resources,
    )
    _validate_activity_content(
        activity_type=activity_data.activity_type,
        video_url=activity_data.video_url,
        resources=normalized_resources,
    )

    payload = activity_data.model_dump(exclude={"resources"})
    payload["file_url"] = (
        normalized_resources[0]["url"]
        if normalized_resources
        else None
    )
    payload["video_url"] = (
        (activity_data.video_url or "").strip() or None
        if activity_data.activity_type == ActivityType.video
        else None
    )

    activity = Activity(
        **payload,
        created_by=current_user.id,
    )
    db.add(activity)
    db.flush()
    _sync_activity_resources(activity, normalized_resources)
    db.commit()
    db.refresh(activity)

    notification_message = (
        f"Se publico {activity.title} en {subject.name} para tu seccion."
        if activity.group_id is not None
        else f"Se publico {activity.title} en {subject.name}."
    )
    notify_grade_students(
        db,
        grade_id=subject.grade_id,
        group_id=activity.group_id,
        title="Nueva actividad disponible",
        message=notification_message,
        notification_type=NotificationType.activity,
        link=f"/subjects/{subject.id}",
    )
    db.commit()
    db.refresh(activity)
    return _serialize_activity(activity, current_user, db)


@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    activity_data: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    activity = (
        db.query(Activity)
        .options(
            selectinload(Activity.resources),
            selectinload(Activity.group),
            selectinload(Activity.submissions),
            selectinload(Activity.week).selectinload(Week.subject),
        )
        .filter(Activity.id == activity_id)
        .first()
    )
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    if current_user.role == UserRole.docente and activity.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para actualizar esta actividad",
        )

    fields_set = activity_data.model_fields_set
    next_week_id = activity_data.week_id if "week_id" in fields_set else activity.week_id
    next_group_id = activity_data.group_id if "group_id" in fields_set else activity.group_id
    _, subject, selected_group = _validate_week_and_group(db, next_week_id, next_group_id)
    _ensure_teacher_can_manage_activity(
        db,
        current_user,
        subject_grade_id=subject.grade_id,
        group=selected_group,
    )

    update_data = activity_data.model_dump(exclude_unset=True, exclude={"resources"})
    next_activity_type = activity_data.activity_type or activity.activity_type
    next_video_url = activity_data.video_url if "video_url" in fields_set else activity.video_url
    next_file_url = activity_data.file_url if "file_url" in fields_set else activity.file_url
    next_resources_source = (
        activity_data.resources
        if "resources" in fields_set
        else _activity_resources_data(activity)
    )
    normalized_resources = _normalize_resources(next_file_url, next_resources_source)
    _validate_activity_content(
        activity_type=next_activity_type,
        video_url=next_video_url,
        resources=normalized_resources,
    )

    for field, value in update_data.items():
        setattr(activity, field, value)

    if next_activity_type == ActivityType.video:
        activity.file_url = normalized_resources[0]["url"] if normalized_resources else None
        activity.video_url = (next_video_url or "").strip() or None
        _sync_activity_resources(activity, normalized_resources)
    else:
        activity.video_url = None
        activity.file_url = normalized_resources[0]["url"] if normalized_resources else None
        _sync_activity_resources(activity, normalized_resources)

    db.commit()
    db.refresh(activity)
    return _serialize_activity(activity, current_user, db)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    activity = (
        db.query(Activity)
        .options(
            selectinload(Activity.resources),
            selectinload(Activity.group),
            selectinload(Activity.submissions),
            selectinload(Activity.week).selectinload(Week.subject),
        )
        .filter(Activity.id == activity_id)
        .first()
    )
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    if current_user.role == UserRole.docente and activity.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para eliminar esta actividad",
        )

    _ensure_user_can_access_activity(db, current_user, activity)

    (
        db.query(ActivitySubmission)
        .filter(ActivitySubmission.activity_id == activity.id)
        .delete(synchronize_session=False)
    )
    (
        db.query(Progress)
        .filter(Progress.activity_id == activity.id)
        .delete(synchronize_session=False)
    )
    db.delete(activity)
    db.commit()
