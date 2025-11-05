# backend/app/schemas/common.py
# Common Pydantic Schemas

from pydantic import BaseModel
from typing import List, Generic, TypeVar, Optional

T = TypeVar('T')


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    message: Optional[str] = None
    details: Optional[dict] = None


class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int
    page_size: int
    total: int
    total_pages: int
    
    @classmethod
    def from_params(cls, page: int, page_size: int, total: int):
        """Create pagination meta from parameters"""
        return cls(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=(total + page_size - 1) // page_size  # Ceiling division
        )


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    items: List[T]
    meta: PaginationMeta












