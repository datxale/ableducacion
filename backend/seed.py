"""
Script de seed para poblar la base de datos con datos iniciales.
Ejecutar: python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, create_tables
from app.models.user import User, UserRole
from app.models.grade import Grade
from app.models.subject import Subject
from app.models.month import Month
from app.services.auth import hash_password


def seed_grades(db):
    grades_data = [
        {"name": "1° Grado", "description": "Primer grado de primaria (6-7 años)"},
        {"name": "2° Grado", "description": "Segundo grado de primaria (7-8 años)"},
        {"name": "3° Grado", "description": "Tercer grado de primaria (8-9 años)"},
        {"name": "4° Grado", "description": "Cuarto grado de primaria (9-10 años)"},
        {"name": "5° Grado", "description": "Quinto grado de primaria (10-11 años)"},
        {"name": "6° Grado", "description": "Sexto grado de primaria (11-12 años)"},
    ]
    created = []
    for g in grades_data:
        existing = db.query(Grade).filter(Grade.name == g["name"]).first()
        if not existing:
            grade = Grade(**g)
            db.add(grade)
            db.flush()
            created.append(grade)
            print(f"  Grado creado: {g['name']}")
        else:
            created.append(existing)
    return created


def seed_subjects(db, grades):
    subjects_per_grade = [
        "Matemática",
        "Comunicación",
        "Ciencia y Tecnología",
        "Personal Social",
        "Arte y Cultura",
        "Educación Física",
        "Educación Religiosa",
        "Inglés",
    ]
    for grade in grades:
        for subject_name in subjects_per_grade:
            existing = db.query(Subject).filter(
                Subject.name == subject_name,
                Subject.grade_id == grade.id,
            ).first()
            if not existing:
                subject = Subject(name=subject_name, grade_id=grade.id)
                db.add(subject)
                print(f"  Asignatura creada: {subject_name} - {grade.name}")


def seed_months(db):
    months_data = [
        {"name": "Enero", "number": 1},
        {"name": "Febrero", "number": 2},
        {"name": "Marzo", "number": 3},
        {"name": "Abril", "number": 4},
        {"name": "Mayo", "number": 5},
        {"name": "Junio", "number": 6},
        {"name": "Julio", "number": 7},
        {"name": "Agosto", "number": 8},
        {"name": "Septiembre", "number": 9},
        {"name": "Octubre", "number": 10},
        {"name": "Noviembre", "number": 11},
        {"name": "Diciembre", "number": 12},
    ]
    for m in months_data:
        existing = db.query(Month).filter(Month.number == m["number"]).first()
        if not existing:
            month = Month(**m)
            db.add(month)
            print(f"  Mes creado: {m['name']}")


def seed_admin_user(db):
    existing = db.query(User).filter(User.email == "admin@ableducacion.pe").first()
    if not existing:
        admin = User(
            email="admin@ableducacion.pe",
            password_hash=hash_password("Admin123!"),
            full_name="Administrador ABLEducacion",
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        print("  Usuario admin creado: admin@ableducacion.pe / Admin123!")
    else:
        print("  Usuario admin ya existe")


def seed_demo_teacher(db):
    existing = db.query(User).filter(User.email == "docente@ableducacion.pe").first()
    if not existing:
        teacher = User(
            email="docente@ableducacion.pe",
            password_hash=hash_password("Docente123!"),
            full_name="Docente Demo",
            role=UserRole.docente,
            phone="999000001",
            whatsapp="999000001",
            is_active=True,
        )
        db.add(teacher)
        print("  Docente demo creado: docente@ableducacion.pe / Docente123!")
    else:
        print("  Docente demo ya existe")


def seed_demo_student(db, grades):
    existing = db.query(User).filter(User.email == "estudiante@ableducacion.pe").first()
    if not existing:
        first_grade = grades[0] if grades else None
        student = User(
            email="estudiante@ableducacion.pe",
            password_hash=hash_password("Estudiante123!"),
            full_name="Estudiante Demo",
            role=UserRole.estudiante,
            grade_id=first_grade.id if first_grade else None,
            is_active=True,
        )
        db.add(student)
        print("  Estudiante demo creado: estudiante@ableducacion.pe / Estudiante123!")
    else:
        print("  Estudiante demo ya existe")


def main():
    print("Iniciando seed de base de datos...")
    create_tables()
    db = SessionLocal()
    try:
        print("\n[1/5] Creando grados...")
        grades = seed_grades(db)
        db.flush()

        print("\n[2/5] Creando asignaturas...")
        seed_subjects(db, grades)
        db.flush()

        print("\n[3/5] Creando meses...")
        seed_months(db)
        db.flush()

        print("\n[4/5] Creando usuario administrador...")
        seed_admin_user(db)
        db.flush()

        print("\n[5/5] Creando usuarios demo...")
        seed_demo_teacher(db)
        seed_demo_student(db, grades)

        db.commit()
        print("\nSeed completado exitosamente.")
        print("\nCredenciales de acceso:")
        print("  Admin:      admin@ableducacion.pe     / Admin123!")
        print("  Docente:    docente@ableducacion.pe   / Docente123!")
        print("  Estudiante: estudiante@ableducacion.pe / Estudiante123!")
    except Exception as e:
        db.rollback()
        print(f"\nError durante el seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
