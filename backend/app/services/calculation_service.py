# backend/app/services/calculation_service.py
# Calculation Service - Business logic for calculation record management

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime

from ..models import Calculation, Project
from ..schemas import CalculationCreate


class CalculationService:
    """Calculation business logic service"""
    
    @staticmethod
    def create_calculation(db: Session, calc_data: CalculationCreate, user_id: int) -> Calculation:
        """
        Create a calculation record.
        
        Note: This service does NOT perform calculations.
        It only stores the bundle_data from the frontend or Node.js microservice.
        The calculation logic is in @tradespro/calculation-engine.
        
        Args:
            db: Database session
            calc_data: Calculation creation data
            user_id: User ID for ownership verification
            
        Returns:
            Created Calculation object
            
        Raises:
            HTTPException: If project not found or access denied
        """
        # Verify project ownership
        project = db.query(Project).filter(Project.id == calc_data.project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        if project.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Legacy endpoint: Extract data from bundle_data if provided
        # For backward compatibility with old frontend that sends complete bundle
        bundle_data = calc_data.bundle_data if hasattr(calc_data, 'bundle_data') else {}
        bundle_id = calc_data.bundle_id if hasattr(calc_data, 'bundle_id') else None
        
        # Extract separated fields from bundle_data (if legacy format)
        inputs = bundle_data.get('inputs', {}) if isinstance(bundle_data, dict) else {}
        results = bundle_data.get('results', {}) if isinstance(bundle_data, dict) else {}
        steps = bundle_data.get('steps', []) if isinstance(bundle_data, dict) else []
        warnings = bundle_data.get('warnings', []) if isinstance(bundle_data, dict) else []
        building_type = bundle_data.get('building_type', 'single-dwelling') if isinstance(bundle_data, dict) else 'single-dwelling'
        
        # Check if bundle_id already exists
        if bundle_id:
            existing = db.query(Calculation).filter(Calculation.id == bundle_id).first()
            if existing:
                # Update existing record
                existing.inputs = inputs
                existing.results = results
                existing.steps = steps
                existing.warnings = warnings
                existing.notes = calc_data.notes
                existing.tags = calc_data.tags
                existing.calculation_type = calc_data.calculation_type
                existing.code_edition = calc_data.code_edition
                existing.code_type = calc_data.code_type
                existing.building_type = building_type
                db.commit()
                db.refresh(existing)
                return existing
        
        # Generate new bundle ID if not provided
        import uuid
        if not bundle_id:
            bundle_id = str(uuid.uuid4())
        
        # Create new calculation record (legacy sync endpoint)
        calculation = Calculation(
            id=bundle_id,
            project_id=calc_data.project_id,
            building_type=building_type,
            calculation_type=calc_data.calculation_type,
            code_edition=calc_data.code_edition or '2024',
            code_type=calc_data.code_type or 'cec',
            inputs=inputs,
            results=results,
            steps=steps,
            warnings=warnings,
        )
        
        db.add(calculation)
        db.commit()
        db.refresh(calculation)
        
        return calculation
    
    @staticmethod
    def get_calculation_by_id(db: Session, calc_id: str, user_id: int) -> Calculation:
        """
        Get calculation by ID (bundle ID).
        
        Args:
            db: Database session
            calc_id: Calculation bundle ID (VARCHAR(36))
            user_id: User ID for ownership verification
            
        Returns:
            Calculation object
            
        Raises:
            HTTPException: If not found or access denied
        """
        calculation = db.query(Calculation).filter(Calculation.id == calc_id).first()
        
        if not calculation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Calculation not found"
            )
        
        # Verify ownership through project
        project = db.query(Project).filter(Project.id == calculation.project_id).first()
        if project.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        return calculation
    
    @staticmethod
    def get_calculation_by_bundle_id(db: Session, bundle_id: str, user_id: int) -> Calculation:
        """
        Get calculation by bundle_id.
        
        Args:
            db: Database session
            bundle_id: Calculation bundle ID
            user_id: User ID for ownership verification
            
        Returns:
            Calculation object
            
        Raises:
            HTTPException: If not found or access denied
        """
        calculation = db.query(Calculation).filter(Calculation.id == bundle_id).first()
        
        if not calculation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Calculation not found"
            )
        
        # Verify ownership through project
        project = db.query(Project).filter(Project.id == calculation.project_id).first()
        if project.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        return calculation
    
    @staticmethod
    def list_project_calculations(
        db: Session,
        project_id: int,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Calculation]:
        """
        List calculations for a project.
        
        Args:
            db: Database session
            project_id: Project ID
            user_id: User ID for ownership verification
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of Calculation objects (without full bundle_data)
            
        Raises:
            HTTPException: If project not found or access denied
        """
        # Verify project ownership
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        if project.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Get calculations (exclude soft-deleted)
        calculations = db.query(Calculation).filter(
            Calculation.project_id == project_id,
            Calculation.deleted_at.is_(None)  # Exclude soft-deleted
        ).order_by(desc(Calculation.created_at)).offset(skip).limit(limit).all()
        
        return calculations
    
    @staticmethod
    def delete_calculation(db: Session, calc_id: str, user_id: int) -> bool:
        """
        Delete a calculation (soft delete).
        
        Args:
            db: Database session
            calc_id: Calculation bundle ID (VARCHAR(36))
            user_id: User ID for ownership verification
            
        Returns:
            True if successful
            
        Raises:
            HTTPException: If not found or access denied
        """
        calculation = CalculationService.get_calculation_by_id(db, calc_id, user_id)
        
        # Soft delete (update deleted_at timestamp)
        calculation.deleted_at = datetime.utcnow()
        db.commit()
        
        return True



