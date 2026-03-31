from collections import defaultdict
from typing import Dict, List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import require_admin_or_docente
from app.models.activity import Activity
from app.models.activity_submission import ActivitySubmission, ActivitySubmissionStatus
from app.models.grade import Grade
from app.models.live_class import LiveClass
from app.models.live_class_attendance import LiveClassAttendance
from app.models.notification import Notification
from app.models.progress import Progress, ProgressStatus
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.models.week import Week
from app.schemas.report import (
    ReportOverviewResponse,
    ReportStudentItem,
    ReportSubjectItem,
)

router = APIRouter(prefix="/api/reports", tags=["Reportes"])


def _resolve_allowed_grade_ids(db: Session, current_user: User) -> Set[int]:
    if current_user.role == UserRole.admin:
        return {grade.id for grade in db.query(Grade).all()}

    activity_grade_ids = {
        activity.week.subject.grade_id
        for activity in db.query(Activity).filter(Activity.created_by == current_user.id).all()
        if activity.week and activity.week.subject
    }
    class_grade_ids = {
        live_class.grade_id
        for live_class in db.query(LiveClass).filter(LiveClass.teacher_id == current_user.id).all()
    }
    return activity_grade_ids | class_grade_ids


@router.get("/overview", response_model=ReportOverviewResponse)
def get_reports_overview(
    grade_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    allowed_grade_ids = _resolve_allowed_grade_ids(db, current_user)
    if grade_id is not None and grade_id not in allowed_grade_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver ese grado.",
        )

    scoped_grade_ids = {grade_id} if grade_id is not None else allowed_grade_ids
    if not scoped_grade_ids:
        return ReportOverviewResponse(
            total_students=0,
            total_activities=0,
            total_tasks_and_exams=0,
            total_live_classes=0,
            total_attendance_records=0,
            pending_grading=0,
            unread_notifications=0,
            average_completion_rate=0,
            top_students=[],
            students_needing_attention=[],
            subject_summary=[],
            grade_name=None,
        )

    students = (
        db.query(User)
        .filter(
            User.role == UserRole.estudiante,
            User.grade_id.in_(scoped_grade_ids),
            User.is_active.is_(True),
        )
        .all()
    )
    student_ids = [student.id for student in students]

    activities_query = db.query(Activity).join(Activity.week).join(Week.subject).filter(Subject.grade_id.in_(scoped_grade_ids))
    if current_user.role == UserRole.docente:
        activities_query = activities_query.filter(Activity.created_by == current_user.id)
    activities = activities_query.all()
    activity_ids = [activity.id for activity in activities]

    live_classes_query = db.query(LiveClass).filter(LiveClass.grade_id.in_(scoped_grade_ids))
    if current_user.role == UserRole.docente:
        live_classes_query = live_classes_query.filter(LiveClass.teacher_id == current_user.id)
    live_classes = live_classes_query.all()
    live_class_ids = [live_class.id for live_class in live_classes]

    progress_records = (
        db.query(Progress)
        .filter(
            Progress.student_id.in_(student_ids or [-1]),
            Progress.activity_id.in_(activity_ids or [-1]),
        )
        .all()
    )

    submissions = (
        db.query(ActivitySubmission)
        .filter(ActivitySubmission.activity_id.in_(activity_ids or [-1]))
        .all()
    )
    attendance_records = (
        db.query(LiveClassAttendance)
        .filter(LiveClassAttendance.live_class_id.in_(live_class_ids or [-1]))
        .all()
    )

    unread_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
        .count()
    )

    progress_by_student: Dict[int, List[Progress]] = defaultdict(list)
    for record in progress_records:
        progress_by_student[record.student_id].append(record)

    submissions_by_student: Dict[int, List[ActivitySubmission]] = defaultdict(list)
    for submission in submissions:
        submissions_by_student[submission.student_id].append(submission)

    attendance_by_student: Dict[int, List[LiveClassAttendance]] = defaultdict(list)
    for attendance in attendance_records:
        attendance_by_student[attendance.student_id].append(attendance)

    student_rows: List[ReportStudentItem] = []
    for student in students:
        student_progress = progress_by_student.get(student.id, [])
        total = len(student_progress)
        completed = len([item for item in student_progress if item.status == ProgressStatus.completed])
        pending = max(total - completed, 0)
        completion_rate = round((completed / total) * 100, 2) if total else 0.0
        graded_submissions = len(
            [
                submission
                for submission in submissions_by_student.get(student.id, [])
                if submission.status == ActivitySubmissionStatus.graded
            ]
        )
        student_rows.append(
            ReportStudentItem(
                student_id=student.id,
                student_name=student.full_name,
                completion_rate=completion_rate,
                pending_activities=pending,
                graded_submissions=graded_submissions,
                attendance_count=len(attendance_by_student.get(student.id, [])),
            )
        )

    average_completion = round(
        sum(item.completion_rate for item in student_rows) / len(student_rows),
        2,
    ) if student_rows else 0

    subject_map: Dict[int, dict] = {}
    for activity in activities:
        subject = activity.week.subject if activity.week else None
        if not subject:
            continue
        subject_map.setdefault(
            subject.id,
            {
                "subject_id": subject.id,
                "subject_name": subject.name,
                "activities": 0,
                "live_classes": 0,
                "submissions_pending_grading": 0,
            },
        )
        subject_map[subject.id]["activities"] += 1
        if activity.learning_format in {"tarea", "examen"}:
            subject_map[subject.id]["submissions_pending_grading"] += len(
                [
                    submission
                    for submission in activity.submissions
                    if submission.status == ActivitySubmissionStatus.submitted
                ]
            )

    for live_class in live_classes:
        subject_map.setdefault(
            live_class.subject_id,
            {
                "subject_id": live_class.subject_id,
                "subject_name": live_class.subject.name if live_class.subject else f"Materia {live_class.subject_id}",
                "activities": 0,
                "live_classes": 0,
                "submissions_pending_grading": 0,
            },
        )
        subject_map[live_class.subject_id]["live_classes"] += 1

    grade_name = None
    if grade_id is not None:
        grade = db.query(Grade).filter(Grade.id == grade_id).first()
        grade_name = grade.name if grade else None

    return ReportOverviewResponse(
        total_students=len(students),
        total_activities=len(activities),
        total_tasks_and_exams=len(
            [activity for activity in activities if activity.learning_format in {"tarea", "examen"}]
        ),
        total_live_classes=len(live_classes),
        total_attendance_records=len(attendance_records),
        pending_grading=len(
            [submission for submission in submissions if submission.status == ActivitySubmissionStatus.submitted]
        ),
        unread_notifications=unread_notifications,
        average_completion_rate=average_completion,
        top_students=sorted(student_rows, key=lambda item: item.completion_rate, reverse=True)[:5],
        students_needing_attention=sorted(
            [item for item in student_rows if item.completion_rate < 50 or item.pending_activities > 2],
            key=lambda item: (item.completion_rate, -item.pending_activities),
        )[:5],
        subject_summary=[
            ReportSubjectItem(**item)
            for item in sorted(subject_map.values(), key=lambda item: item["subject_name"])
        ],
        grade_name=grade_name,
    )
