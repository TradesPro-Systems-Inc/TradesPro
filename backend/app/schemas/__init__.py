# backend/app/schemas/__init__.py
# Pydantic Schemas Package

from .user import UserCreate, UserLogin, UserResponse, UserUpdate, Token, TokenData
from .project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectList
from .calculation import CalculationCreate, CalculationResponse, CalculationList, CalculationListItem
from .feedback import (
    FeedbackPostCreate, FeedbackPostUpdate, FeedbackPostResponse, FeedbackPostListResponse,
    FeedbackPostList, FeedbackReplyCreate, FeedbackReplyUpdate, FeedbackReplyResponse
)
from .common import PaginatedResponse, ErrorResponse, SuccessResponse, PaginationMeta

__all__ = [
    # User schemas
    'UserCreate', 'UserLogin', 'UserResponse', 'UserUpdate', 'Token', 'TokenData',
    # Project schemas
    'ProjectCreate', 'ProjectUpdate', 'ProjectResponse', 'ProjectList',
    # Calculation schemas
    'CalculationCreate', 'CalculationResponse', 'CalculationList',
    # Feedback schemas
    'FeedbackPostCreate', 'FeedbackPostUpdate', 'FeedbackPostResponse', 'FeedbackPostListResponse',
    'FeedbackPostList', 'FeedbackReplyCreate', 'FeedbackReplyResponse',
    # Common schemas
    'PaginatedResponse', 'ErrorResponse', 'SuccessResponse',
]






