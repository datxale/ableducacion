from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Enum, Text
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
    age = Column(Integer, nullable=True)
    birth_date = Column(Date, nullable=True)
    document_id = Column(String(40), nullable=True)
    professions = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    grade_id = Column(Integer, ForeignKey("grades.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("academic_groups.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    grade = relationship("Grade", back_populates="students")
    group = relationship("AcademicGroup", back_populates="students", foreign_keys=[group_id])
    groups_led = relationship("AcademicGroup", back_populates="teacher", foreign_keys="AcademicGroup.teacher_id")
    activities_created = relationship("Activity", back_populates="creator")
    live_classes_taught = relationship("LiveClass", back_populates="teacher")
    enrollments = relationship("Enrollment", back_populates="student", foreign_keys="Enrollment.student_id")
    progress_records = relationship("Progress", back_populates="student")
    activity_submissions = relationship(
        "ActivitySubmission",
        foreign_keys="ActivitySubmission.student_id",
        back_populates="student",
    )
    graded_activity_submissions = relationship(
        "ActivitySubmission",
        foreign_keys="ActivitySubmission.graded_by",
        back_populates="grader",
    )
    attendance_records = relationship("LiveClassAttendance", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    messages_sent = relationship(
        "ChatMessage",
        foreign_keys="ChatMessage.sender_id",
        back_populates="sender",
    )
    messages_received = relationship(
        "ChatMessage",
        foreign_keys="ChatMessage.recipient_id",
        back_populates="recipient",
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
