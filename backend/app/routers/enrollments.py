from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.user import User, UserRole
from app.models.grade import Grade
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse
from app.middleware.auth import get_current_user, require_admin, require_admin_or_docente

router = APIRouter(prefix="/api/enrollments", tags=["Inscripciones"])


@router.get("/", response_model=List[EnrollmentResponse])
def list_enrollments(
    student_id: Optional[int] = Query(None),
    grade_id: Optional[int] = Query(None),
    academic_year: Optional[str] = Query(None),
    enrollment_status: Optional[EnrollmentStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    query = db.query(Enrollment)
    if student_id is not None:
        query = query.filter(Enrollment.student_id == student_id)
    if grade_id is not None:
        query = query.filter(Enrollment.grade_id == grade_id)
    if academic_year is not None:
        query = query.filter(Enrollment.academic_year == academic_year)
    if enrollment_status is not None:
        query = query.filter(Enrollment.status == enrollment_status)
    return query.offset(skip).limit(limit).all()


@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada",
        )
    return enrollment


@router.post("/", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_docente),
):
    student = db.query(User).filter(
        User.id == enrollment_data.student_id,
        User.role == UserRole.estudiante,
    ).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )
    grade = db.query(Grade).filter(Grade.id == enrollment_data.grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == enrollment_data.student_id,
        Enrollment.academic_year == enrollment_data.academic_year,
        Enrollment.status == EnrollmentStatus.active,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El estudiante ya tiene una inscripción activa para ese año académico",
        )
    enrollment = Enrollment(
        student_id=enrollment_data.student_id,
        grade_id=enrollment_data.grade_id,
        academic_year=enrollment_data.academic_year,
        status=EnrollmentStatus.active,
    )
    student.grade_id = enrollment_data.grade_id
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
def update_enrollment(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada",
        )
    if enrollment_data.grade_id is not None:
        grade = db.query(Grade).filter(Grade.id == enrollment_data.grade_id).first()
        if not grade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grado no encontrado",
            )
    for field, value in enrollment_data.model_dump(exclude_unset=True).items():
        setattr(enrollment, field, value)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscripción no encontrada",
        )
    db.delete(enrollment)
    db.commit()
