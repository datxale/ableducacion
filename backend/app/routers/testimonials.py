from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.testimonial import Testimonial
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate, TestimonialResponse
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/api/testimonials", tags=["Testimonios"])


@router.get("/", response_model=List[TestimonialResponse])
def list_testimonials(db: Session = Depends(get_db)):
    """Public endpoint - returns active testimonials for the landing page."""
    return db.query(Testimonial).filter(Testimonial.is_active == True).order_by(Testimonial.created_at.desc()).all()


@router.get("/all", response_model=List[TestimonialResponse])
def list_all_testimonials(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin endpoint - returns all testimonials including inactive."""
    return db.query(Testimonial).order_by(Testimonial.created_at.desc()).all()


@router.post("/", response_model=TestimonialResponse, status_code=status.HTTP_201_CREATED)
def create_testimonial(
    data: TestimonialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    testimonial = Testimonial(**data.model_dump())
    db.add(testimonial)
    db.commit()
    db.refresh(testimonial)
    return testimonial


@router.put("/{testimonial_id}", response_model=TestimonialResponse)
def update_testimonial(
    testimonial_id: int,
    data: TestimonialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonio no encontrado",
        )
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(testimonial, field, value)
    db.commit()
    db.refresh(testimonial)
    return testimonial


@router.delete("/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimonio no encontrado",
        )
    db.delete(testimonial)
    db.commit()
