from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class ActivityType(str, enum.Enum):
    ficha = "ficha"
    video = "video"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    activity_type = Column(Enum(ActivityType), nullable=False)
    file_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    week_id = Column(Integer, ForeignKey("weeks.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    week = relationship("Week", back_populates="activities")
    creator = relationship("User", back_populates="activities_created")
    progress_records = relationship("Progress", back_populates="activity")

    def __repr__(self):
        return f"<Activity(id={self.id}, title={self.title}, type={self.activity_type})>"
