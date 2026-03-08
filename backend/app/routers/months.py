from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.month import Month
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/months", tags=["Meses"])


class MonthBase(BaseModel):
    name: str
    number: int


class MonthCreate(MonthBase):
    pass


class MonthUpdate(BaseModel):
    name: Optional[str] = None
    number: Optional[int] = None


class MonthResponse(MonthBase):
    id: int

    model_config = {"from_attributes": True}


@router.get("/", response_model=List[MonthResponse])
def list_months(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Month).order_by(Month.number).all()


@router.get("/{month_id}", response_model=MonthResponse)
def get_month(
    month_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    month = db.query(Month).filter(Month.id == month_id).first()
    if not month:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mes no encontrado",
        )
    return month


@router.post("/", response_model=MonthResponse, status_code=status.HTTP_201_CREATED)
def create_month(
    month_data: MonthCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    if month_data.number not in range(1, 13):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de mes debe estar entre 1 y 12",
        )
    existing_name = db.query(Month).filter(Month.name == month_data.name).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un mes con ese nombre",
        )
    existing_number = db.query(Month).filter(Month.number == month_data.number).first()
    if existing_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un mes con ese número",
        )
    month = Month(**month_data.model_dump())
    db.add(month)
    db.commit()
    db.refresh(month)
    return month


@router.put("/{month_id}", response_model=MonthResponse)
def update_month(
    month_id: int,
    month_data: MonthUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    month = db.query(Month).filter(Month.id == month_id).first()
    if not month:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mes no encontrado",
        )
    for field, value in month_data.model_dump(exclude_unset=True).items():
        setattr(month, field, value)
    db.commit()
    db.refresh(month)
    return month


@router.delete("/{month_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_month(
    month_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    month = db.query(Month).filter(Month.id == month_id).first()
    if not month:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mes no encontrado",
        )
    db.delete(month)
    db.commit()
