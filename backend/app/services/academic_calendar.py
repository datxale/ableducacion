from sqlalchemy.orm import Session

from app.models.month import Month
from app.models.subject import Subject
from app.models.week import Week

DEFAULT_MONTHS = [
    (1, "Enero"),
    (2, "Febrero"),
    (3, "Marzo"),
    (4, "Abril"),
    (5, "Mayo"),
    (6, "Junio"),
    (7, "Julio"),
    (8, "Agosto"),
    (9, "Septiembre"),
    (10, "Octubre"),
    (11, "Noviembre"),
    (12, "Diciembre"),
]
DEFAULT_WEEKS_PER_MONTH = 4


def ensure_default_months(db: Session) -> list[Month]:
    months_by_number = {
        month.number: month for month in db.query(Month).order_by(Month.number).all()
    }

    for number, name in DEFAULT_MONTHS:
        if number in months_by_number:
            continue
        month = Month(number=number, name=name)
        db.add(month)
        db.flush()
        months_by_number[number] = month

    return [months_by_number[number] for number, _ in DEFAULT_MONTHS if number in months_by_number]


def ensure_default_weeks_for_subject(
    db: Session,
    subject: Subject,
    *,
    months: list[Month] | None = None,
    weeks_per_month: int = DEFAULT_WEEKS_PER_MONTH,
) -> int:
    if subject.id is None:
        return 0

    month_items = months or ensure_default_months(db)
    existing_pairs = set(
        db.query(Week.month_id, Week.number)
        .filter(Week.subject_id == subject.id)
        .all()
    )

    created = 0
    for month in month_items:
        for week_number in range(1, weeks_per_month + 1):
            if (month.id, week_number) in existing_pairs:
                continue
            db.add(Week(subject_id=subject.id, month_id=month.id, number=week_number))
            existing_pairs.add((month.id, week_number))
            created += 1

    if created:
        db.flush()

    return created


def ensure_default_weeks_for_month(
    db: Session,
    month: Month,
    *,
    weeks_per_month: int = DEFAULT_WEEKS_PER_MONTH,
) -> int:
    if month.id is None:
        return 0

    subject_ids = [subject_id for (subject_id,) in db.query(Subject.id).all()]
    if not subject_ids:
        return 0

    existing_pairs = set(
        db.query(Week.subject_id, Week.number)
        .filter(Week.month_id == month.id)
        .all()
    )

    created = 0
    for subject_id in subject_ids:
        for week_number in range(1, weeks_per_month + 1):
            if (subject_id, week_number) in existing_pairs:
                continue
            db.add(Week(subject_id=subject_id, month_id=month.id, number=week_number))
            existing_pairs.add((subject_id, week_number))
            created += 1

    if created:
        db.flush()

    return created


def ensure_default_academic_calendar(db: Session) -> tuple[int, int]:
    existing_month_count = db.query(Month).count()
    months = ensure_default_months(db)
    created_months = max(len(months) - existing_month_count, 0)
    created_weeks = 0

    for subject in db.query(Subject).all():
        created_weeks += ensure_default_weeks_for_subject(db, subject, months=months)

    return created_months, created_weeks
