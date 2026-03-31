from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class PlanningType(str, enum.Enum):
    horario = "horario"
    guia = "guia"
    planificador = "planificador"


class Planning(Base):
    __tablename__ = "plannings"

    id = Column(Integer, primary_key=True, index=True)
    planning_type = Column(Enum(PlanningType), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    source_file_url = Column(String(500), nullable=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    month_id = Column(Integer, ForeignKey("months.id"), nullable=True)
    unit_number = Column(String(50), nullable=True)
    unit_title = Column(String(255), nullable=True)
    situation_context = Column(Text, nullable=True)
    learning_challenge = Column(Text, nullable=True)
    structured_content_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    grade = relationship("Grade", back_populates="plannings")
    month = relationship("Month", back_populates="plannings")

    def __repr__(self):
        return f"<Planning(id={self.id}, title={self.title}, type={self.planning_type})>"
