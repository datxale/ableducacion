from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class ClassType(str, enum.Enum):
    regular = "regular"
    refuerzo = "refuerzo"


class LiveClass(Base):
    __tablename__ = "live_classes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    meeting_provider = Column(String(30), nullable=False, default="manual", server_default="manual")
    meeting_url = Column(String(500), nullable=True)
    external_event_id = Column(String(255), nullable=True)
    meeting_code = Column(String(32), nullable=True)
    meet_space_name = Column(String(255), nullable=True)
    recording_status = Column(String(40), nullable=True)
    recording_file_id = Column(String(255), nullable=True)
    recording_resource_name = Column(String(255), nullable=True)
    recording_url = Column(String(500), nullable=True)
    recording_started_at = Column(DateTime(timezone=True), nullable=True)
    recording_ended_at = Column(DateTime(timezone=True), nullable=True)
    recording_synced_at = Column(DateTime(timezone=True), nullable=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_type = Column(Enum(ClassType), nullable=False, default=ClassType.regular)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    grade = relationship("Grade", back_populates="live_classes")
    subject = relationship("Subject", back_populates="live_classes")
    teacher = relationship("User", back_populates="live_classes_taught")
    attendance_records = relationship("LiveClassAttendance", back_populates="live_class")

    def __repr__(self):
        return f"<LiveClass(id={self.id}, title={self.title}, scheduled_at={self.scheduled_at})>"
