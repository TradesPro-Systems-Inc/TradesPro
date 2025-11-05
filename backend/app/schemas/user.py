# backend/app/schemas/user.py
# User Pydantic Schemas

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    full_name: Optional[str] = None
    company: Optional[str] = None
    license_number: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = None
    company: Optional[str] = None
    license_number: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None


class UserChangePassword(BaseModel):
    """Schema for changing password"""
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    """Schema for user response (excluding sensitive data)"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None  # Allow None for backward compatibility
    last_login_at: Optional[datetime] = None  # Match User model field name
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until expiration


class TokenData(BaseModel):
    """Data extracted from JWT token"""
    user_id: Optional[int] = None
    email: Optional[str] = None




