# backend/app/services/project_service.py
# Project Service - Business logic for project management

from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime, timezone

from ..models import Project
from ..schemas import ProjectCreate, ProjectUpdate


class ProjectService:
    """Project business logic service"""
    
    @staticmethod
    def create_project(db: Session, project_data: ProjectCreate, user_id: int) -> Project:
        """
        Create a new project.
        
        Args:
            db: Database session
            project_data: Project creation data
            user_id: ID of the project owner
            
        Returns:
            Created Project object
        """
        # Ensure updated_at is set on creation
        now = datetime.now(timezone.utc)
        project = Project(
            name=project_data.name,
            description=project_data.description,
            location=project_data.location,
            client_name=project_data.client_name,
            is_archived=project_data.is_archived,
            owner_id=user_id,
            updated_at=now  # Explicitly set updated_at on creation to ensure it's never None
        )
        
        db.add(project)
        db.commit()
        db.refresh(project)
        
        return project
    
    @staticmethod
    def get_project_by_id(db: Session, project_id: int, user_id: Optional[int] = None) -> Optional[Project]:
        """
        Get project by ID.
        
        Args:
            db: Database session
            project_id: Project ID
            user_id: Optional user ID to verify ownership
            
        Returns:
            Project object if found and accessible
            
        Raises:
            HTTPException: If project not found or access denied
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Verify ownership if user_id provided
        if user_id and project.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        return project
    
    @staticmethod
    def list_user_projects(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        archived_filter: Optional[bool] = None
    ) -> List[Project]:
        """
        List projects for a user.
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            search: Optional search string
            archived_filter: Optional filter for archived status (True=archived, False=active, None=all)
            
        Returns:
            List of Project objects
        """
        query = db.query(Project).filter(Project.owner_id == user_id)
        
        # Apply search filter
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Project.name.ilike(search_pattern),
                    Project.description.ilike(search_pattern),
                    Project.location.ilike(search_pattern),
                    Project.client_name.ilike(search_pattern),
                )
            )
        
        # Apply archived filter
        if archived_filter is not None:
            query = query.filter(Project.is_archived == archived_filter)
        
        # Order by most recent
        query = query.order_by(desc(Project.created_at))
        
        # Apply pagination
        projects = query.offset(skip).limit(limit).all()
        
        return projects
    
    @staticmethod
    def update_project(db: Session, project_id: int, project_data: ProjectUpdate, user_id: int) -> Project:
        """
        Update a project.
        
        Args:
            db: Database session
            project_id: Project ID
            project_data: Update data
            user_id: User ID for ownership verification
            
        Returns:
            Updated Project object
            
        Raises:
            HTTPException: If project not found or access denied
        """
        project = ProjectService.get_project_by_id(db, project_id, user_id)
        
        # Update fields
        update_data = project_data.model_dump(exclude_unset=True)
        
        # Update all fields
        for field, value in update_data.items():
            setattr(project, field, value)
        
        db.commit()
        db.refresh(project)
        
        return project
    
    @staticmethod
    def delete_project(db: Session, project_id: int, user_id: int) -> bool:
        """
        Delete a project.
        
        Args:
            db: Database session
            project_id: Project ID
            user_id: User ID for ownership verification
            
        Returns:
            True if successful
            
        Raises:
            HTTPException: If project not found or access denied
        """
        project = ProjectService.get_project_by_id(db, project_id, user_id)
        
        db.delete(project)
        db.commit()
        
        return True



