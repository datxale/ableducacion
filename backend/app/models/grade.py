from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    students = relationship("User", back_populates="grade")
    subjects = relationship("Subject", back_populates="grade")
    plannings = relationship("Planning", back_populates="grade")
    live_classes = relationship("LiveClass", back_populates="grade")
    enrollments = relationship("Enrollment", back_populates="grade")
    groups = relationship("AcademicGroup", back_populates="grade")

    def __repr__(self):
        return f"<Grade(id={self.id}, name={self.name})>"
