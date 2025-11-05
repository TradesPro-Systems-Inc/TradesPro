# backend/app/schemas/feedback.py
# Feedback Pydantic Schemas

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class AuthorInfo(BaseModel):
    """Author information for posts and replies"""
    id: int
    full_name: Optional[str] = None
    email: str
    company: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class FeedbackReplyBase(BaseModel):
    """Base schema for feedback reply"""
    content: str = Field(..., min_length=1, max_length=10000)


class FeedbackReplyUpdate(BaseModel):
    """Schema for updating a reply"""
    content: str = Field(..., min_length=1, max_length=10000)


class FeedbackReplyCreate(FeedbackReplyBase):
    """Schema for creating a reply"""
    parent_reply_id: Optional[int] = None  # For nested replies


class FeedbackReplyResponse(FeedbackReplyBase):
    """Schema for reply response"""
    id: int
    post_id: int
    user_id: int
    parent_reply_id: Optional[int] = None
    is_edited: bool
    like_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[AuthorInfo] = None
    replies: Optional[List['FeedbackReplyResponse']] = None  # Nested replies
    
    model_config = ConfigDict(from_attributes=True)


class FeedbackPostBase(BaseModel):
    """Base schema for feedback post"""
    title: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1, max_length=10000)
    category: str = Field(default="general", pattern="^(general|feature_request|bug_report|question|feedback)$")


class FeedbackPostCreate(FeedbackPostBase):
    """Schema for creating a post"""
    pass


class FeedbackPostUpdate(BaseModel):
    """Schema for updating a post"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    category: Optional[str] = Field(None, pattern="^(general|feature_request|bug_report|question|feedback)$")
    is_resolved: Optional[bool] = None


class FeedbackPostResponse(FeedbackPostBase):
    """Schema for post response"""
    id: int
    user_id: int
    is_pinned: bool
    is_locked: bool
    is_resolved: bool
    view_count: int
    like_count: int
    reply_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[AuthorInfo] = None
    replies: Optional[List[FeedbackReplyResponse]] = None
    user_has_liked: Optional[bool] = None  # Whether current user has liked this post
    
    model_config = ConfigDict(from_attributes=True)


class FeedbackPostListResponse(BaseModel):
    """Schema for post list response (without full replies)"""
    id: int
    user_id: int
    title: str
    content: str
    category: str
    is_pinned: bool
    is_locked: bool
    is_resolved: bool
    view_count: int
    like_count: int
    reply_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: Optional[AuthorInfo] = None
    user_has_liked: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class FeedbackPostList(BaseModel):
    """Paginated list of posts"""
    items: List[FeedbackPostListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

