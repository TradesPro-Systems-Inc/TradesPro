# backend/app/routes/projects.py
# Project Management Routes

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models import User, Project
from ..schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectList,
    PaginatedResponse, PaginationMeta
)
from ..services.project_service import ProjectService
from ..utils.security import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new project.
    """
    project = ProjectService.create_project(db, project_data, current_user.id)
    return project


@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    archived: Optional[bool] = Query(None, description="Filter by archived status (true=archived, false=active)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's projects with pagination.
    
    Supports search across name, description, location, and client_name.
    Supports filtering by archived status.
    """
    # Get projects
    projects = ProjectService.list_user_projects(
        db, current_user.id, skip, limit, search, archived
    )
    
    # Get total count (simplified - in production, use a separate count query)
    total = len(ProjectService.list_user_projects(db, current_user.id, 0, 10000, search, archived))
    
    # Create response
    return PaginatedResponse(
        items=[project.to_dict() for project in projects],
        meta=PaginationMeta.from_params(skip // limit + 1, limit, total)
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get project by ID.
    """
    project = ProjectService.get_project_by_id(db, project_id, current_user.id)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a project.
    """
    project = ProjectService.update_project(db, project_id, project_data, current_user.id)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a project.
    
    This will also delete all associated calculations.
    """
    ProjectService.delete_project(db, project_id, current_user.id)
    return None


