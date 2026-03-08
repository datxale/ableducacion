from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.grade import Grade
from app.schemas.grade import GradeCreate, GradeUpdate, GradeResponse
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/grades", tags=["Grados"])


@router.get("/", response_model=List[GradeResponse])
def list_grades(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Grade).order_by(Grade.id).all()


@router.get("/{grade_id}", response_model=GradeResponse)
def get_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    return grade


@router.post("/", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def create_grade(
    grade_data: GradeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    existing = db.query(Grade).filter(Grade.name == grade_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un grado con ese nombre",
        )
    grade = Grade(**grade_data.model_dump())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.put("/{grade_id}", response_model=GradeResponse)
def update_grade(
    grade_id: int,
    grade_data: GradeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    for field, value in grade_data.model_dump(exclude_unset=True).items():
        setattr(grade, field, value)
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    db.delete(grade)
    db.commit()
