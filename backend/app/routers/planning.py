from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.planning import Planning
from app.models.grade import Grade
from app.models.month import Month
from app.schemas.planning import PlanningCreate, PlanningUpdate, PlanningResponse
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.planning import PlanningType
from app.models.notification import NotificationType
from app.services.notifications import notify_grade_students

router = APIRouter(prefix="/api/planning", tags=["Planificación"])


@router.get("/", response_model=List[PlanningResponse])
def list_plannings(
    grade_id: Optional[int] = Query(None),
    month_id: Optional[int] = Query(None),
    planning_type: Optional[PlanningType] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Planning)
    if grade_id is not None:
        query = query.filter(Planning.grade_id == grade_id)
    if month_id is not None:
        query = query.filter(Planning.month_id == month_id)
    if planning_type is not None:
        query = query.filter(Planning.planning_type == planning_type)
    return query.offset(skip).limit(limit).all()


@router.get("/{planning_id}", response_model=PlanningResponse)
def get_planning(
    planning_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    planning = db.query(Planning).filter(Planning.id == planning_id).first()
    if not planning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planificación no encontrada",
        )
    return planning


@router.post("/", response_model=PlanningResponse, status_code=status.HTTP_201_CREATED)
def create_planning(
    planning_data: PlanningCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_docente),
):
    grade = db.query(Grade).filter(Grade.id == planning_data.grade_id).first()
    if not grade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grado no encontrado",
        )
    if planning_data.month_id is not None:
        month = db.query(Month).filter(Month.id == planning_data.month_id).first()
        if not month:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mes no encontrado",
            )
    planning = Planning(**planning_data.model_dump())
    db.add(planning)
    db.commit()
    db.refresh(planning)
    notify_grade_students(
        db,
        grade_id=planning.grade_id,
        title="Nuevo recurso de planificacion",
        message=f"Se publico {planning.title} para tu grado.",
        notification_type=NotificationType.planning,
        link="/planning",
    )
    db.commit()
    return planning


@router.put("/{planning_id}", response_model=PlanningResponse)
def update_planning(
    planning_id: int,
    planning_data: PlanningUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_docente),
):
    planning = db.query(Planning).filter(Planning.id == planning_id).first()
    if not planning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planificación no encontrada",
        )
    if planning_data.grade_id is not None:
        grade = db.query(Grade).filter(Grade.id == planning_data.grade_id).first()
        if not grade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grado no encontrado",
            )
    if planning_data.month_id is not None:
        month = db.query(Month).filter(Month.id == planning_data.month_id).first()
        if not month:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mes no encontrado",
            )
    for field, value in planning_data.model_dump(exclude_unset=True).items():
        setattr(planning, field, value)
    db.commit()
    db.refresh(planning)
    return planning


@router.delete("/{planning_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planning(
    planning_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_docente),
):
    planning = db.query(Planning).filter(Planning.id == planning_id).first()
    if not planning:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planificación no encontrada",
        )
    db.delete(planning)
    db.commit()
