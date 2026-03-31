from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.activity import Activity
from app.models.activity_submission import ActivitySubmission
from app.models.notification import NotificationType
from app.models.progress import Progress
from app.models.subject import Subject
from app.models.week import Week
from app.schemas.activity import ActivityCreate, ActivityResponse, ActivityUpdate
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.user import User, UserRole
from app.services.notifications import notify_grade_students

router = APIRouter(prefix="/api/activities", tags=["Actividades"])


def _serialize_activity(activity: Activity, current_user: User, db: Session) -> ActivityResponse:
    payload = ActivityResponse.model_validate(activity).model_dump()
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


@router.get("/", response_model=List[ActivityResponse])
def list_activities(
    week_id: Optional[int] = Query(None),
    created_by: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Activity)
    if week_id is not None:
        query = query.filter(Activity.week_id == week_id)
    if created_by is not None:
        if current_user.role == UserRole.docente and created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Los docentes solo pueden consultar sus propias actividades",
            )
        query = query.filter(Activity.created_by == created_by)
    activities = (
        query.order_by(Activity.created_at.desc())
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
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )
    return _serialize_activity(activity, current_user, db)


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def create_activity(
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    week = db.query(Week).filter(Week.id == activity_data.week_id).first()
    if not week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semana no encontrada",
        )
    subject = db.query(Subject).filter(Subject.id == week.subject_id).first()
    activity = Activity(
        **activity_data.model_dump(),
        created_by=current_user.id,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    if subject:
        notify_grade_students(
            db,
            grade_id=subject.grade_id,
            title="Nueva actividad disponible",
            message=f"Se publico {activity.title} en {subject.name}.",
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
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
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
    if activity_data.week_id is not None:
        week = db.query(Week).filter(Week.id == activity_data.week_id).first()
        if not week:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Semana no encontrada",
            )
    for field, value in activity_data.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    return _serialize_activity(activity, current_user, db)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
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
