from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.activity import Activity
from app.models.week import Week
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.user import User

router = APIRouter(prefix="/api/activities", tags=["Actividades"])


@router.get("/", response_model=List[ActivityResponse])
def list_activities(
    week_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Activity)
    if week_id is not None:
        query = query.filter(Activity.week_id == week_id)
    return query.offset(skip).limit(limit).all()


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
    return activity


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
    activity = Activity(
        **activity_data.model_dump(),
        created_by=current_user.id,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


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
    return activity


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
    db.delete(activity)
    db.commit()
