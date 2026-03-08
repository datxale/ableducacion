from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Week(Base):
    __tablename__ = "weeks"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)
    month_id = Column(Integer, ForeignKey("months.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    # Relationships
    month = relationship("Month", back_populates="weeks")
    subject = relationship("Subject", back_populates="weeks")
    activities = relationship("Activity", back_populates="week")

    def __repr__(self):
        return f"<Week(id={self.id}, number={self.number}, month_id={self.month_id})>"
