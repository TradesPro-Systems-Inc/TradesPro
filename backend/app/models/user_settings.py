# backend/app/models/user_settings.py
# User Settings Model - Store user preferences

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class UserSettings(Base):
    """
    User settings model for storing user preferences.
    Syncs with frontend Pinia settings store.
    
    Relationships:
    - user: One-to-one with User
    """
    __tablename__ = "user_settings"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key (One-to-one relationship)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # UI Preferences
    language = Column(String(10), default="en-CA", nullable=False)  # "en-CA", "fr-CA", "zh-CN"
    theme = Column(String(20), default="auto", nullable=False)  # "light", "dark", "auto"
    font_size = Column(String(20), default="medium", nullable=False)  # "small", "medium", "large"
    
    # Application Settings
    auto_save = Column(Boolean, default=True, nullable=False)
    cec_version = Column(String(20), default="2024", nullable=False)  # Default CEC version
    default_voltage = Column(Integer, default=120, nullable=False)  # Default system voltage
    default_phase = Column(Integer, default=1, nullable=False)  # 1 or 3 phase
    
    # Notification Preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    calculation_reminders = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="settings")
    
    def __repr__(self):
        return f"<UserSettings(user_id={self.user_id}, language='{self.language}', theme='{self.theme}')>"
    
    def to_dict(self):
        """Convert settings to dictionary"""
        return {
            'user_id': self.user_id,
            'language': self.language,
            'theme': self.theme,
            'font_size': self.font_size,
            'auto_save': self.auto_save,
            'cec_version': self.cec_version,
            'default_voltage': self.default_voltage,
            'default_phase': self.default_phase,
            'email_notifications': self.email_notifications,
            'calculation_reminders': self.calculation_reminders,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }












