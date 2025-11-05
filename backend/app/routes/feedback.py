# backend/app/routes/feedback.py
# Feedback/Forum Routes

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from typing import Optional, List

from ..database import get_db
from ..models import User, FeedbackPost, FeedbackReply, FeedbackPostLike, FeedbackReplyLike
from ..schemas.feedback import (
    FeedbackPostCreate, FeedbackPostUpdate, FeedbackPostResponse, FeedbackPostListResponse,
    FeedbackPostList, FeedbackReplyCreate, FeedbackReplyUpdate, FeedbackReplyResponse
)
from ..schemas.common import SuccessResponse
from ..utils.security import get_current_user, get_current_user_optional

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.get("/posts", response_model=FeedbackPostList)
async def get_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("newest", pattern="^(newest|oldest|most_liked|most_replies)$"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get list of feedback posts with pagination.
    
    Supports filtering by category, search, and sorting.
    """
    query = db.query(FeedbackPost)
    
    # Filter by category
    if category:
        query = query.filter(FeedbackPost.category == category)
    
    # Search in title and content
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                FeedbackPost.title.ilike(search_term),
                FeedbackPost.content.ilike(search_term)
            )
        )
    
    # Sorting
    if sort == "newest":
        query = query.order_by(desc(FeedbackPost.is_pinned), desc(FeedbackPost.created_at))
    elif sort == "oldest":
        query = query.order_by(desc(FeedbackPost.is_pinned), FeedbackPost.created_at)
    elif sort == "most_liked":
        query = query.order_by(desc(FeedbackPost.is_pinned), desc(FeedbackPost.like_count))
    elif sort == "most_replies":
        query = query.order_by(desc(FeedbackPost.is_pinned), desc(FeedbackPost.reply_count))
    
    # Get total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    posts = query.offset(offset).limit(page_size).all()
    
    # Convert to response format
    items = []
    for post in posts:
        post_dict = post.to_dict()
        # Check if current user has liked this post
        if current_user:
            like = db.query(FeedbackPostLike).filter(
                FeedbackPostLike.post_id == post.id,
                FeedbackPostLike.user_id == current_user.id
            ).first()
            post_dict['user_has_liked'] = like is not None
        else:
            post_dict['user_has_liked'] = False
        items.append(FeedbackPostListResponse(**post_dict))
    
    total_pages = (total + page_size - 1) // page_size
    
    return FeedbackPostList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/posts/{post_id}", response_model=FeedbackPostResponse)
async def get_post(
    post_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get a single post with all replies.
    
    Increments view count.
    """
    post = db.query(FeedbackPost).filter(FeedbackPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Increment view count
    post.view_count += 1
    db.commit()
    
    # Get post with replies
    post_dict = post.to_dict(include_replies=True)
    
    # Check if current user has liked this post
    if current_user:
        like = db.query(FeedbackPostLike).filter(
            FeedbackPostLike.post_id == post.id,
            FeedbackPostLike.user_id == current_user.id
        ).first()
        post_dict['user_has_liked'] = like is not None
    else:
        post_dict['user_has_liked'] = False
    
    return FeedbackPostResponse(**post_dict)


@router.post("/posts", response_model=FeedbackPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: FeedbackPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new feedback post.
    
    Requires authentication.
    """
    post = FeedbackPost(
        user_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        category=post_data.category
    )
    
    db.add(post)
    db.commit()
    db.refresh(post)
    
    post_dict = post.to_dict()
    post_dict['user_has_liked'] = False
    
    return FeedbackPostResponse(**post_dict)


@router.put("/posts/{post_id}", response_model=FeedbackPostResponse)
async def update_post(
    post_id: int,
    post_data: FeedbackPostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a post.
    
    Only the author or superuser can update.
    """
    post = db.query(FeedbackPost).filter(FeedbackPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if post.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    # Update fields
    if post_data.title is not None:
        post.title = post_data.title
    if post_data.content is not None:
        post.content = post_data.content
    if post_data.category is not None:
        post.category = post_data.category
    if post_data.is_resolved is not None:
        post.is_resolved = post_data.is_resolved
    
    db.commit()
    db.refresh(post)
    
    post_dict = post.to_dict()
    # Check if current user has liked
    like = db.query(FeedbackPostLike).filter(
        FeedbackPostLike.post_id == post.id,
        FeedbackPostLike.user_id == current_user.id
    ).first()
    post_dict['user_has_liked'] = like is not None
    
    return FeedbackPostResponse(**post_dict)


@router.delete("/posts/{post_id}", response_model=SuccessResponse)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a post.
    
    Only the author or superuser can delete.
    """
    post = db.query(FeedbackPost).filter(FeedbackPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check permissions
    if post.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    db.delete(post)
    db.commit()
    
    return SuccessResponse(success=True, message="Post deleted successfully")


@router.post("/posts/{post_id}/like", response_model=SuccessResponse)
async def toggle_post_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle like on a post.
    
    If already liked, removes the like. Otherwise, adds a like.
    """
    post = db.query(FeedbackPost).filter(FeedbackPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if already liked
    existing_like = db.query(FeedbackPostLike).filter(
        FeedbackPostLike.post_id == post_id,
        FeedbackPostLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Remove like
        db.delete(existing_like)
        post.like_count = max(0, post.like_count - 1)
        db.commit()
        return SuccessResponse(success=True, message="Like removed")
    else:
        # Add like
        like = FeedbackPostLike(post_id=post_id, user_id=current_user.id)
        db.add(like)
        post.like_count += 1
        db.commit()
        return SuccessResponse(success=True, message="Post liked")


@router.post("/posts/{post_id}/replies", response_model=FeedbackReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(
    post_id: int,
    reply_data: FeedbackReplyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a reply to a post.
    
    Can also reply to another reply (nested replies).
    """
    # Verify post exists
    post = db.query(FeedbackPost).filter(FeedbackPost.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.is_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This post is locked and cannot be replied to"
        )
    
    # If replying to another reply, verify it exists and belongs to the same post
    if reply_data.parent_reply_id:
        parent_reply = db.query(FeedbackReply).filter(
            FeedbackReply.id == reply_data.parent_reply_id,
            FeedbackReply.post_id == post_id
        ).first()
        
        if not parent_reply:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent reply not found"
            )
    
    # Create reply
    reply = FeedbackReply(
        post_id=post_id,
        user_id=current_user.id,
        content=reply_data.content,
        parent_reply_id=reply_data.parent_reply_id
    )
    
    db.add(reply)
    post.reply_count += 1
    db.commit()
    db.refresh(reply)
    
    return FeedbackReplyResponse(**reply.to_dict())


@router.put("/replies/{reply_id}", response_model=FeedbackReplyResponse)
async def update_reply(
    reply_id: int,
    reply_data: FeedbackReplyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a reply.
    
    Only the author can update.
    """
    reply = db.query(FeedbackReply).filter(FeedbackReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check permissions
    if reply.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this reply"
        )
    
    reply.content = reply_data.content
    reply.is_edited = True
    db.commit()
    db.refresh(reply)
    
    return FeedbackReplyResponse(**reply.to_dict())


@router.delete("/replies/{reply_id}", response_model=SuccessResponse)
async def delete_reply(
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a reply.
    
    Only the author or superuser can delete.
    """
    reply = db.query(FeedbackReply).filter(FeedbackReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check permissions
    if reply.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this reply"
        )
    
    # Decrement reply count on post
    post = db.query(FeedbackPost).filter(FeedbackPost.id == reply.post_id).first()
    if post:
        post.reply_count = max(0, post.reply_count - 1)
    
    db.delete(reply)
    db.commit()
    
    return SuccessResponse(success=True, message="Reply deleted successfully")


@router.post("/replies/{reply_id}/like", response_model=SuccessResponse)
async def toggle_reply_like(
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle like on a reply.
    """
    reply = db.query(FeedbackReply).filter(FeedbackReply.id == reply_id).first()
    
    if not reply:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reply not found"
        )
    
    # Check if already liked
    existing_like = db.query(FeedbackReplyLike).filter(
        FeedbackReplyLike.reply_id == reply_id,
        FeedbackReplyLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        # Remove like
        db.delete(existing_like)
        reply.like_count = max(0, reply.like_count - 1)
        db.commit()
        return SuccessResponse(success=True, message="Like removed")
    else:
        # Add like
        like = FeedbackReplyLike(reply_id=reply_id, user_id=current_user.id)
        db.add(like)
        reply.like_count += 1
        db.commit()
        return SuccessResponse(success=True, message="Reply liked")


@router.get("/categories", response_model=List[dict])
async def get_categories():
    """
    Get available post categories.
    """
    return [
        {"value": "general", "label": "General Discussion"},
        {"value": "feature_request", "label": "Feature Request"},
        {"value": "bug_report", "label": "Bug Report"},
        {"value": "question", "label": "Question"},
        {"value": "feedback", "label": "Feedback"}
    ]

