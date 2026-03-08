from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class EnrollmentStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    graduated = "graduated"


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(Enum(EnrollmentStatus), nullable=False, default=EnrollmentStatus.active)

    # Relationships
    student = relationship("User", back_populates="enrollments", foreign_keys=[student_id])
    grade = relationship("Grade", back_populates="enrollments")

    def __repr__(self):
        return f"<Enrollment(id={self.id}, student_id={self.student_id}, grade_id={self.grade_id})>"
