# backend/app/models/audit_log.py
# Audit Log Model - Track user actions and system events

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class AuditLog(Base):
    """
    Audit log model for tracking user actions and system events.
    
    This model stores audit trails for security and compliance purposes.
    
    Relationships:
    - user: Many-to-one with User (optional, can be null for system events)
    """
    __tablename__ = "audit_logs"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Action Details
    action = Column(String(100), nullable=False, index=True)  # e.g., "user.login", "project.create", "calculation.delete"
    resource_type = Column(String(50), nullable=True, index=True)  # e.g., "project", "calculation", "user"
    resource_id = Column(String(100), nullable=True, index=True)  # ID of the affected resource
    
    # Request Metadata
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Additional Context
    details = Column(JSONB, nullable=True)  # Additional context data
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action='{self.action}', user_id={self.user_id}, created_at='{self.created_at}')>"
    
    def to_dict(self):
        """Convert audit log to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'ip_address': str(self.ip_address) if self.ip_address else None,
            'user_agent': self.user_agent,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }










