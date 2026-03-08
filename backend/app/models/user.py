from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    docente = "docente"
    estudiante = "estudiante"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.estudiante)
    phone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    grade = relationship("Grade", back_populates="students")
    activities_created = relationship("Activity", back_populates="creator")
    live_classes_taught = relationship("LiveClass", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student", foreign_keys="Enrollment.student_id")
    progress_records = relationship("Progress", back_populates="student")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
