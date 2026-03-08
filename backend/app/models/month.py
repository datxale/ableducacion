from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Month(Base):
    __tablename__ = "months"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    number = Column(Integer, unique=True, nullable=False)

    # Relationships
    weeks = relationship("Week", back_populates="month")
    plannings = relationship("Planning", back_populates="month")

    def __repr__(self):
        return f"<Month(id={self.id}, name={self.name}, number={self.number})>"
