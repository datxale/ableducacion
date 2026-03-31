from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.activity import Activity
from app.models.activity_submission import ActivitySubmission, ActivitySubmissionStatus
from app.models.progress import Progress, ProgressStatus
from app.models.user import User, UserRole
from app.models.notification import NotificationType
from app.schemas.activity_submission import (
    ActivitySubmissionCreate,
    ActivitySubmissionGrade,
    ActivitySubmissionResponse,
)
from app.services.notifications import create_notification

router = APIRouter(prefix="/api/activity-submissions", tags=["Entregas"])


def _serialize_submission(submission: ActivitySubmission) -> ActivitySubmissionResponse:
    payload = ActivitySubmissionResponse.model_validate(submission).model_dump()
    payload["student_name"] = submission.student.full_name if submission.student else None
    payload["activity_title"] = submission.activity.title if submission.activity else None
    payload["grader_name"] = submission.grader.full_name if submission.grader else None
    return ActivitySubmissionResponse(**payload)


def _ensure_activity_access_for_student(activity: Activity, student: User):
    subject = activity.week.subject if activity.week else None
    if not subject or subject.grade_id != student.grade_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La actividad no pertenece al grado del estudiante.",
        )
    return subject


def _ensure_teacher_can_manage_activity(activity: Activity, current_user: User) -> None:
    if current_user.role == UserRole.docente and activity.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para gestionar esta actividad.",
        )


@router.get("/", response_model=List[ActivitySubmissionResponse])
def list_submissions(
    activity_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    week_id: Optional[int] = Query(None),
    submission_status: Optional[ActivitySubmissionStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ActivitySubmission)

    if current_user.role == UserRole.estudiante:
        query = query.filter(ActivitySubmission.student_id == current_user.id)
    elif current_user.role == UserRole.docente:
        query = query.join(Activity).filter(Activity.created_by == current_user.id)

    if activity_id is not None:
        query = query.filter(ActivitySubmission.activity_id == activity_id)
    if student_id is not None:
        if current_user.role == UserRole.estudiante and student_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puede ver entregas de otros estudiantes.",
            )
        query = query.filter(ActivitySubmission.student_id == student_id)
    if week_id is not None:
        query = query.filter(ActivitySubmission.activity.has(Activity.week_id == week_id))
    if submission_status is not None:
        query = query.filter(ActivitySubmission.status == submission_status)

    submissions = (
        query.order_by(
            ActivitySubmission.submitted_at.desc().nullslast(),
            ActivitySubmission.created_at.desc(),
        )
        .all()
    )
    return [_serialize_submission(submission) for submission in submissions]


@router.post("/", response_model=ActivitySubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_submission(
    submission_data: ActivitySubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.estudiante:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los estudiantes pueden enviar entregas.",
        )

    if not (submission_data.response_text or submission_data.attachment_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe enviar una respuesta escrita o un archivo adjunto.",
        )

    activity = db.query(Activity).filter(Activity.id == submission_data.activity_id).first()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada.",
        )
    if activity.learning_format == "material":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta actividad no requiere entrega.",
        )

    _ensure_activity_access_for_student(activity, current_user)

    now = datetime.now(timezone.utc)
    if activity.due_at and activity.due_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha limite de entrega ya vencio.",
        )

    submission = (
        db.query(ActivitySubmission)
        .filter(
            ActivitySubmission.activity_id == submission_data.activity_id,
            ActivitySubmission.student_id == current_user.id,
        )
        .first()
    )

    if submission:
        submission.response_text = submission_data.response_text
        submission.attachment_url = submission_data.attachment_url
        submission.status = ActivitySubmissionStatus.submitted
        submission.submitted_at = now
        submission.score = None
        submission.feedback = None
        submission.graded_at = None
        submission.graded_by = None
    else:
        submission = ActivitySubmission(
            activity_id=submission_data.activity_id,
            student_id=current_user.id,
            response_text=submission_data.response_text,
            attachment_url=submission_data.attachment_url,
            status=ActivitySubmissionStatus.submitted,
            submitted_at=now,
        )
        db.add(submission)

    progress = (
        db.query(Progress)
        .filter(
            Progress.student_id == current_user.id,
            Progress.activity_id == activity.id,
        )
        .first()
    )
    if progress:
        progress.status = ProgressStatus.completed
        progress.completed_at = now
    else:
        db.add(
            Progress(
                student_id=current_user.id,
                activity_id=activity.id,
                status=ProgressStatus.completed,
                completed_at=now,
            )
        )

    if activity.created_by != current_user.id:
        create_notification(
            db,
            user_id=activity.created_by,
            title="Nueva entrega recibida",
            message=f"{current_user.full_name} envio una entrega para {activity.title}.",
            notification_type=NotificationType.submission,
            link="/teaching/activities",
        )

    db.commit()
    db.refresh(submission)
    return _serialize_submission(submission)


@router.put("/{submission_id}/grade", response_model=ActivitySubmissionResponse)
def grade_submission(
    submission_id: int,
    grade_data: ActivitySubmissionGrade,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    submission = db.query(ActivitySubmission).filter(ActivitySubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega no encontrada.",
        )

    activity = submission.activity
    _ensure_teacher_can_manage_activity(activity, current_user)

    if (
        grade_data.score is not None
        and activity.max_score is not None
        and grade_data.score > activity.max_score
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La nota no puede superar {activity.max_score}.",
        )

    now = datetime.now(timezone.utc)
    submission.score = grade_data.score
    submission.feedback = grade_data.feedback
    submission.status = ActivitySubmissionStatus.graded
    submission.graded_at = now
    submission.graded_by = current_user.id

    progress = (
        db.query(Progress)
        .filter(
            Progress.student_id == submission.student_id,
            Progress.activity_id == submission.activity_id,
        )
        .first()
    )
    if progress:
        progress.status = ProgressStatus.completed
        progress.score = grade_data.score
        progress.completed_at = progress.completed_at or now
    else:
        db.add(
            Progress(
                student_id=submission.student_id,
                activity_id=submission.activity_id,
                status=ProgressStatus.completed,
                score=grade_data.score,
                completed_at=now,
            )
        )

    create_notification(
        db,
        user_id=submission.student_id,
        title="Tu entrega fue revisada",
        message=f"Ya puedes ver la revision de {activity.title}.",
        notification_type=NotificationType.grade,
        link="/progress",
    )

    db.commit()
    db.refresh(submission)
    return _serialize_submission(submission)
