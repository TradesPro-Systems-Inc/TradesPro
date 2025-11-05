# backend/app/models/project.py
# Project Model - Project Management

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Project(Base):
    """
    Project model for organizing calculations.
    
    Relationships:
    - owner: Many-to-one with User
    - calculations: One-to-many with Calculation
    """
    __tablename__ = "projects"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Project Information
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    location = Column(String(200), nullable=True)
    client_name = Column(String(200), nullable=True, index=True)
    
    # Project Status
    is_archived = Column(Boolean, default=False, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    calculations = relationship("Calculation", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', is_archived={self.is_archived})>"
    
    def to_dict(self):
        """Convert project to dictionary"""
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'description': self.description,
            'location': self.location,
            'client_name': self.client_name,
            'is_archived': self.is_archived,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'calculation_count': len(self.calculations) if self.calculations else 0,
        }



