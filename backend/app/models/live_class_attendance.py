from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class AttendanceStatus(str, enum.Enum):
    present = "present"
    late = "late"


class LiveClassAttendance(Base):
    __tablename__ = "live_class_attendance"
    __table_args__ = (
        UniqueConstraint("live_class_id", "student_id", name="uq_live_class_attendance_student"),
    )

    id = Column(Integer, primary_key=True, index=True)
    live_class_id = Column(Integer, ForeignKey("live_classes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.present)
    joined_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    live_class = relationship("LiveClass", back_populates="attendance_records")
    student = relationship("User", back_populates="attendance_records")

    def __repr__(self):
        return (
            f"<LiveClassAttendance(id={self.id}, live_class_id={self.live_class_id}, "
            f"student_id={self.student_id}, status={self.status})>"
        )
