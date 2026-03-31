from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from app.database import get_db
from app.models.progress import Progress, ProgressStatus
from app.models.user import User, UserRole
from app.models.activity import Activity
from app.models.enrollment import Enrollment
from app.models.grade import Grade
from app.schemas.progress import (
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse,
    StudentProgressSummary,
    GradeProgressSummary,
)
from app.middleware.auth import get_current_user, require_admin_or_docente

router = APIRouter(prefix="/api/progress", tags=["Progreso"])


@router.get("/student/{student_id}", response_model=List[ProgressResponse])
def get_student_progress(
    student_id: int,
    activity_id: Optional[int] = Query(None),
    progress_status: Optional[ProgressStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.estudiante and current_user.id != student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver el progreso de otro estudiante",
        )
    student = db.query(User).filter(
        User.id == student_id, User.role == UserRole.estudiante
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )
    query = db.query(Progress).filter(Progress.student_id == student_id)
    if activity_id is not None:
        query = query.filter(Progress.activity_id == activity_id)
    if progress_status is not None:
        query = query.filter(Progress.status == progress_status)
    return (
        query.order_by(Progress.updated_at.desc(), Progress.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/grade/{grade_id}", response_model=GradeProgressSummary)
def get_grade_progress(
    grade_id: int,
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    enrollment_query = db.query(Enrollment).filter(
        Enrollment.grade_id == grade_id,
        Enrollment.status == "active",
    )
    if academic_year:
        enrollment_query = enrollment_query.filter(
            Enrollment.academic_year == academic_year
        )
    enrollments = enrollment_query.all()
    students_progress = []
    for enrollment in enrollments:
        student = db.query(User).filter(User.id == enrollment.student_id).first()
        if not student:
            continue
        total = db.query(Progress).filter(
            Progress.student_id == student.id
        ).count()
        completed = db.query(Progress).filter(
            Progress.student_id == student.id,
            Progress.status == ProgressStatus.completed,
        ).count()
        in_progress = db.query(Progress).filter(
            Progress.student_id == student.id,
            Progress.status == ProgressStatus.in_progress,
        ).count()
        pending = db.query(Progress).filter(
            Progress.student_id == student.id,
            Progress.status == ProgressStatus.pending,
        ).count()
        avg_score_row = db.query(func.avg(Progress.score)).filter(
            Progress.student_id == student.id,
            Progress.score.isnot(None),
        ).scalar()
        avg_score = round(float(avg_score_row), 2) if avg_score_row else None
        completion_rate = round((completed / total * 100), 2) if total > 0 else 0.0
        students_progress.append(
            StudentProgressSummary(
                student_id=student.id,
                student_name=student.full_name,
                total_activities=total,
                completed=completed,
                in_progress=in_progress,
                pending=pending,
                average_score=avg_score,
                completion_rate=completion_rate,
            )
        )
    return GradeProgressSummary(
        grade_id=grade.id,
        grade_name=grade.name,
        total_students=len(enrollments),
        students_progress=students_progress,
    )


@router.get("/{progress_id}", response_model=ProgressResponse)
def get_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress = db.query(Progress).filter(Progress.id == progress_id).first()
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de progreso no encontrado",
        )
    if (
        current_user.role == UserRole.estudiante
        and progress.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver este progreso",
        )
    return progress


@router.post("/", response_model=ProgressResponse, status_code=status.HTTP_201_CREATED)
def create_progress(
    progress_data: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (
        current_user.role == UserRole.estudiante
        and progress_data.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los estudiantes solo pueden registrar su propio progreso",
        )
    student = db.query(User).filter(
        User.id == progress_data.student_id,
        User.role == UserRole.estudiante,
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )
    activity = db.query(Activity).filter(
        Activity.id == progress_data.activity_id
    ).first()
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )
    existing = db.query(Progress).filter(
        Progress.student_id == progress_data.student_id,
        Progress.activity_id == progress_data.activity_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un registro de progreso para este estudiante y actividad",
        )
    progress_payload = progress_data.model_dump()
    if (
        progress_payload.get("status") == ProgressStatus.completed
        and not progress_payload.get("completed_at")
    ):
        progress_payload["completed_at"] = datetime.now(timezone.utc)

    progress = Progress(**progress_payload)
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress


@router.put("/{progress_id}", response_model=ProgressResponse)
def update_progress(
    progress_id: int,
    progress_data: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress = db.query(Progress).filter(Progress.id == progress_id).first()
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de progreso no encontrado",
        )
    if (
        current_user.role == UserRole.estudiante
        and progress.student_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para actualizar este progreso",
        )
    update_data = progress_data.model_dump(exclude_unset=True)
    if (
        "status" in update_data
        and update_data["status"] == ProgressStatus.completed
        and not progress.completed_at
    ):
        update_data["completed_at"] = datetime.now(timezone.utc)
    elif (
        "status" in update_data
        and update_data["status"] != ProgressStatus.completed
    ):
        update_data["completed_at"] = None
    for field, value in update_data.items():
        setattr(progress, field, value)
    db.commit()
    db.refresh(progress)
    return progress


@router.delete("/{progress_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_progress(
    progress_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    progress = db.query(Progress).filter(Progress.id == progress_id).first()
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro de progreso no encontrado",
        )
    db.delete(progress)
    db.commit()
