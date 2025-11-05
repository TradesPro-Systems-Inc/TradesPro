# backend/app/routes/auth.py
# Authentication Routes

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, UserUpdate, Token, SuccessResponse
from ..services.user_service import UserService
from ..utils.security import get_current_user, create_access_token

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    
    Creates a new user account and returns an access token.
    """
    user = UserService.create_user(db, user_data)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 15 * 60
    }


@router.post("/token", response_model=Token)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login user and get access token.
    """
    result = UserService.login_for_access_token(db, credentials.email, credentials.password)
    return result


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information.
    
    Returns the authenticated user's profile.
    """
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    """
    updated_user = UserService.update_user(db, current_user, user_data)
    return updated_user


@router.post("/change-password", response_model=SuccessResponse)
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password.
    """
    from ..schemas.user import UserChangePassword
    
    UserService.change_password(db, current_user, old_password, new_password)
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }


