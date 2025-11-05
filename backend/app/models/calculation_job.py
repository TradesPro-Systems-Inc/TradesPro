# backend/app/models/calculation_job.py
# Calculation Job Model - Track async calculation jobs

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..database import Base


class CalculationJobStatus(str):
    """Calculation job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CalculationJob(Base):
    """
    Calculation job model for tracking async calculation jobs.
    
    This model tracks the status of background calculation jobs,
    allowing for async processing and job monitoring.
    
    Relationships:
    - user: Many-to-one with User
    - project: Many-to-one with Project (optional)
    - calculation: Many-to-one with Calculation (when completed)
    """
    __tablename__ = "calculation_jobs"
    
    # Primary Key (UUID)
    job_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Job Status
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, processing, completed, failed, cancelled
    
    # Inputs and Result
    inputs = Column(JSONB, nullable=False)  # Calculation inputs
    result_id = Column(String(36), ForeignKey("calculations.id", ondelete="SET NULL"), nullable=True)  # Reference to calculation result
    error = Column(Text, nullable=True)  # Error message if failed
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    estimated_time_ms = Column(Integer, nullable=True)  # Estimated or actual processing time
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    project = relationship("Project", foreign_keys=[project_id])
    calculation = relationship("Calculation", foreign_keys=[result_id])
    
    def __repr__(self):
        return f"<CalculationJob(job_id={self.job_id}, status='{self.status}', user_id={self.user_id})>"
    
    def to_dict(self):
        """Convert calculation job to dictionary"""
        return {
            'job_id': str(self.job_id),
            'user_id': self.user_id,
            'project_id': self.project_id,
            'status': self.status,
            'result_id': self.result_id,
            'error': self.error,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'estimated_time_ms': self.estimated_time_ms,
        }










