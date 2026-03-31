from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AcademicGroup(Base):
    __tablename__ = "academic_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    grade = relationship("Grade", back_populates="groups")
    teacher = relationship("User", back_populates="groups_led", foreign_keys=[teacher_id])
    students = relationship("User", back_populates="group", foreign_keys="User.group_id")

    def __repr__(self):
        return f"<AcademicGroup(id={self.id}, name={self.name}, grade_id={self.grade_id})>"
