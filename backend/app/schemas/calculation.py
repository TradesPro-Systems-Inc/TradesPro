# backend/app/schemas/calculation.py
# Calculation Pydantic Schemas

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class CalculationBase(BaseModel):
    """Base calculation schema"""
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CalculationCreate(CalculationBase):
    """Schema for creating a calculation record"""
    project_id: int
    bundle_id: str
    bundle_data: Dict[str, Any]  # The complete UnsignedBundle
    calculation_type: str = "single-dwelling"
    code_edition: Optional[str] = None
    code_type: str = "cec"


class CalculationResponse(CalculationBase):
    """Schema for calculation response (full bundle included) - V4.1 Architecture"""
    id: str  # Bundle ID (VARCHAR(36))
    project_id: int
    building_type: str
    calculation_type: str
    code_edition: Optional[str] = None
    code_type: str
    inputs: Dict[str, Any]  # Separated JSONB field
    results: Dict[str, Any]  # Separated JSONB field
    steps: List[Dict[str, Any]]  # Trusted audit trail from backend coordinator
    warnings: Optional[List[Any]] = None
    engine_version: Optional[str] = None
    engine_commit: Optional[str] = None
    bundle_hash: Optional[str] = None
    is_signed: bool = False
    signed_at: Optional[datetime] = None
    signed_by: Optional[str] = None
    created_at: datetime
    calculation_time_ms: Optional[int] = None
    deleted_at: Optional[datetime] = None
    
    # Legacy fields for backward compatibility (denormalized from results)
    calculated_load_w: Optional[int] = None
    service_amperage: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class CalculationListItem(BaseModel):
    """Schema for calculation list item (bundle excluded for performance)"""
    id: int
    project_id: int
    bundle_id: str
    calculation_type: str
    code_edition: Optional[str] = None
    code_type: str
    calculated_load_w: Optional[int] = None
    service_amperage: Optional[int] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CalculationList(BaseModel):
    """Schema for calculation list response"""
    calculations: List[CalculationListItem]
    total: int



