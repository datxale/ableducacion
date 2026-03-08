from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)

    # Relationships
    grade = relationship("Grade", back_populates="subjects")
    weeks = relationship("Week", back_populates="subject")
    live_classes = relationship("LiveClass", back_populates="subject")

    def __repr__(self):
        return f"<Subject(id={self.id}, name={self.name}, grade_id={self.grade_id})>"
