# backend/app/schemas/project.py
# Project Pydantic Schemas

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class ProjectBase(BaseModel):
    """Base project schema"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)
    client_name: Optional[str] = Field(None, max_length=200)


class ProjectCreate(ProjectBase):
    """Schema for creating a new project"""
    is_archived: bool = False


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)
    client_name: Optional[str] = Field(None, max_length=200)
    is_archived: Optional[bool] = None


class ProjectResponse(ProjectBase):
    """Schema for project response"""
    id: int
    owner_id: int
    is_archived: bool
    created_at: datetime
    updated_at: Optional[datetime] = None  # Allow None if not set, will default to created_at
    calculation_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)
    
    def model_post_init(self, __context) -> None:
        """Set updated_at to created_at if None"""
        if self.updated_at is None:
            self.updated_at = self.created_at


class ProjectList(BaseModel):
    """Schema for project list response"""
    projects: List[ProjectResponse]
    total: int



