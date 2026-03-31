import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin_or_docente
from app.models.grade import Grade
from app.models.month import Month
from app.models.notification import NotificationType
from app.models.planning import Planning, PlanningType
from app.schemas.planning import PlanningCreate, PlanningResponse, PlanningUpdate
from app.services.notifications import notify_grade_students

router = APIRouter(prefix="/api/planning", tags=["Planificacion"])


def _parse_structured_content(raw_value: Optional[str]) -> list[dict]:
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
    except (TypeError, ValueError):
        return []

    return parsed if isinstance(parsed, list) else []


def _serialize_planning(planning: Planning) -> PlanningResponse:
    payload = {
        "id": planning.id,
        "planning_type": planning.planning_type,
        "title": planning.title,
        "description": planning.description,
        "file_url": planning.file_url,
        "source_file_url": planning.source_file_url,
        "grade_id": planning.grade_id,
        "month_id": planning.month_id,
        "unit_number": planning.unit_number,
        "unit_title": planning.unit_title,
        "situation_context": planning.situation_context,
        "learning_challenge": planning.learning_challenge,
        "structured_content": _parse_structured_content(planning.structured_content_json),
        "created_at": planning.created_at,
        "updated_at": planning.updated_at,
    }
    return PlanningResponse.model_validate(payload)


def _validate_grade_and_month(db: Session, grade_id: Optional[int], month_id: Optional[int]) -> None:
    if grade_id is not None:
        grade = db.query(Grade).filter(Grade.id == grade_id).first()
        if not grade:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Grado no encontrado",
            )

    if month_id is not None:
        month = db.query(Month).filter(Month.id == month_id).first()
        if not month:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mes no encontrado",
            )


def _validate_planificador_payload(data: dict) -> None:
    missing_fields: list[str] = []

    if not data.get("unit_number"):
        missing_fields.append("unidad")
    if not data.get("unit_title"):
        missing_fields.append("titulo de la unidad")
    if not data.get("situation_context"):
        missing_fields.append("situacion significativa")
    if not data.get("learning_challenge"):
        missing_fields.append("reto")

    structured_content = data.get("structured_content") or []
    if len(structured_content) == 0:
        missing_fields.append("semanas del planificador")

    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Faltan campos obligatorios del planificador: {', '.join(missing_fields)}",
        )


def _apply_planning_payload(planning: Planning, data: dict) -> None:
    structured_content = data.pop("structured_content", None)

    for field, value in data.items():
        setattr(planning, field, value)

    if structured_content is not None:
        planning.structured_content_json = json.dumps(structured_content, ensure_ascii=False)


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

    items = (
        query.order_by(Planning.created_at.desc(), Planning.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_planning(item) for item in items]


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
            detail="Planificacion no encontrada",
        )
    return _serialize_planning(planning)


@router.post("/", response_model=PlanningResponse, status_code=status.HTTP_201_CREATED)
def create_planning(
    planning_data: PlanningCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_docente),
):
    payload = planning_data.model_dump()
    _validate_grade_and_month(db, payload.get("grade_id"), payload.get("month_id"))

    if payload.get("planning_type") == PlanningType.planificador:
        _validate_planificador_payload(payload)

    planning = Planning()
    _apply_planning_payload(planning, payload)
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
    db.refresh(planning)
    return _serialize_planning(planning)


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
            detail="Planificacion no encontrada",
        )

    update_data = planning_data.model_dump(exclude_unset=True)
    next_payload = {
        "planning_type": update_data.get("planning_type", planning.planning_type),
        "title": update_data.get("title", planning.title),
        "description": update_data.get("description", planning.description),
        "file_url": update_data.get("file_url", planning.file_url),
        "source_file_url": update_data.get("source_file_url", planning.source_file_url),
        "grade_id": update_data.get("grade_id", planning.grade_id),
        "month_id": update_data.get("month_id", planning.month_id),
        "unit_number": update_data.get("unit_number", planning.unit_number),
        "unit_title": update_data.get("unit_title", planning.unit_title),
        "situation_context": update_data.get("situation_context", planning.situation_context),
        "learning_challenge": update_data.get("learning_challenge", planning.learning_challenge),
        "structured_content": update_data.get(
            "structured_content",
            _parse_structured_content(planning.structured_content_json),
        ),
    }

    _validate_grade_and_month(db, next_payload.get("grade_id"), next_payload.get("month_id"))

    if next_payload.get("planning_type") == PlanningType.planificador:
        _validate_planificador_payload(next_payload)

    _apply_planning_payload(planning, update_data)
    db.commit()
    db.refresh(planning)
    return _serialize_planning(planning)


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
            detail="Planificacion no encontrada",
        )
    db.delete(planning)
    db.commit()
