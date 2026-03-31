from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class ActivitySubmissionStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    graded = "graded"


class ActivitySubmission(Base):
    __tablename__ = "activity_submissions"
    __table_args__ = (
        UniqueConstraint("activity_id", "student_id", name="uq_activity_submission_student"),
    )

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    response_text = Column(Text, nullable=True)
    attachment_url = Column(String(500), nullable=True)
    status = Column(
        Enum(ActivitySubmissionStatus),
        nullable=False,
        default=ActivitySubmissionStatus.submitted,
    )
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)
    graded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    activity = relationship("Activity", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id], back_populates="activity_submissions")
    grader = relationship("User", foreign_keys=[graded_by], back_populates="graded_activity_submissions")

    def __repr__(self):
        return (
            f"<ActivitySubmission(id={self.id}, activity_id={self.activity_id}, "
            f"student_id={self.student_id}, status={self.status})>"
        )
