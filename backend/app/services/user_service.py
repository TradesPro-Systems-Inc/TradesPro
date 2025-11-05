# backend/app/services/user_service.py
# User Service - Business logic for user management

from sqlalchemy.orm import Session
from typing import Optional
from fastapi import HTTPException, status
from datetime import datetime

from ..models import User, UserSettings
from ..schemas import UserCreate, UserUpdate
from ..utils.security import get_password_hash, verify_password, create_access_token
from ..database import get_db


class UserService:
    """User business logic service"""
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """
        Create a new user with hashed password.
        
        Args:
            db: Database session
            user_data: User creation data
            
        Returns:
            Created User object
            
        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user with hashed password
        hashed_password = get_password_hash(user_data.password)
        # Let SQLAlchemy handle created_at via server_default
        # But explicitly set updated_at to ensure it's never None
        now = datetime.utcnow()
        user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            company=user_data.company,
            license_number=user_data.license_number,
            phone=user_data.phone,
            bio=user_data.bio,
            is_active=True,
            updated_at=now,  # Explicitly set updated_at on creation to avoid NULL
        )
        
        db.add(user)
        db.flush()  # Flush to get user.id
        
        # Create default user settings
        settings = UserSettings(
            user_id=user.id,
            language="en-CA",
            theme="auto",
            font_size="medium",
            auto_save=True,
            cec_version="2024",
            default_voltage=120,
            default_phase=1,
        )
        db.add(settings)
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user with email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User object if authentication successful, None otherwise
        """
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled"
            )
        
        # Update last login
        user.last_login_at = datetime.utcnow()  # Fix: should be last_login_at, not last_login
        db.commit()
        
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def update_user(db: Session, user: User, user_data: UserUpdate) -> User:
        """
        Update user profile.
        
        Args:
            db: Database session
            user: User object to update
            user_data: Update data
            
        Returns:
            Updated User object
        """
        update_data = user_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def change_password(db: Session, user: User, old_password: str, new_password: str) -> bool:
        """
        Change user password.
        
        Args:
            db: Database session
            user: User object
            old_password: Current password
            new_password: New password
            
        Returns:
            True if successful
            
        Raises:
            HTTPException: If old password is incorrect
        """
        if not verify_password(old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect password"
            )
        
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        
        return True
    
    @staticmethod
    def login_for_access_token(db: Session, email: str, password: str) -> dict:
        """
        Login user and return access token.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            Dictionary with access_token and token info
            
        Raises:
            HTTPException: If credentials invalid
        """
        user = UserService.authenticate_user(db, email, password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 15 * 60,  # 15 minutes in seconds
            "user": user.to_dict()
        }




