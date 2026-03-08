from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.week import Week
from app.models.month import Month
from app.models.subject import Subject
from app.middleware.auth import get_current_user, require_admin_or_docente

router = APIRouter(prefix="/api/weeks", tags=["Semanas"])


class WeekBase(BaseModel):
    number: int
    month_id: int
    subject_id: int


class WeekCreate(WeekBase):
    pass


class WeekUpdate(BaseModel):
    number: Optional[int] = None
    month_id: Optional[int] = None
    subject_id: Optional[int] = None


class WeekResponse(WeekBase):
    id: int

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[WeekResponse])
def list_weeks(
    month_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Week)
    if month_id is not None:
        query = query.filter(Week.month_id == month_id)
    if subject_id is not None:
        query = query.filter(Week.subject_id == subject_id)
    return query.order_by(Week.month_id, Week.number).all()


@router.get("/{week_id}", response_model=WeekResponse)
def get_week(
    week_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semana no encontrada",
        )
    return week


@router.post("/", response_model=WeekResponse, status_code=status.HTTP_201_CREATED)
def create_week(
    week_data: WeekCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_docente),
):
    month = db.query(Month).filter(Month.id == week_data.month_id).first()
    if not month:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mes no encontrado",
        )
    subject = db.query(Subject).filter(Subject.id == week_data.subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada",
        )
    if week_data.number not in range(1, 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de semana debe estar entre 1 y 4",
        )
    existing = db.query(Week).filter(
        Week.month_id == week_data.month_id,
        Week.subject_id == week_data.subject_id,
        Week.number == week_data.number,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe esa semana para ese mes y asignatura",
        )
    week = Week(**week_data.model_dump())
    db.add(week)
    db.commit()
    db.refresh(week)
    return week


@router.put("/{week_id}", response_model=WeekResponse)
def update_week(
    week_id: int,
    week_data: WeekUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_docente),
):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semana no encontrada",
        )
    if week_data.month_id is not None:
        month = db.query(Month).filter(Month.id == week_data.month_id).first()
        if not month:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mes no encontrado",
            )
    if week_data.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == week_data.subject_id).first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asignatura no encontrada",
            )
    for field, value in week_data.model_dump(exclude_unset=True).items():
        setattr(week, field, value)
    db.commit()
    db.refresh(week)
    return week


@router.delete("/{week_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_week(
    week_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_docente),
):
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Semana no encontrada",
        )
    db.delete(week)
    db.commit()
