# backend/app/models/feedback_post.py
# Feedback Post Model - User feedback and discussion posts

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class FeedbackPost(Base):
    """
    Feedback/Forum Post Model
    
    Allows users to post feedback, feature requests, and discuss app features.
    Other users can reply and react to posts.
    """
    __tablename__ = "feedback_posts"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Post Content
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="general", nullable=False, index=True)
    # Categories: general, feature_request, bug_report, question, feedback
    
    # Status and Moderation
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)  # For bug reports / feature requests
    
    # Engagement Metrics
    view_count = Column(Integer, default=0, nullable=False)
    like_count = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    author = relationship("User", back_populates="feedback_posts")
    replies = relationship("FeedbackReply", back_populates="post", cascade="all, delete-orphan", order_by="FeedbackReply.created_at")
    likes = relationship("FeedbackPostLike", back_populates="post", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<FeedbackPost(id={self.id}, title='{self.title[:50]}...', user_id={self.user_id})>"
    
    def to_dict(self, include_replies=False):
        """Convert post to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'is_pinned': self.is_pinned,
            'is_locked': self.is_locked,
            'is_resolved': self.is_resolved,
            'view_count': self.view_count,
            'like_count': self.like_count,
            'reply_count': self.reply_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if self.author:
            data['author'] = {
                'id': self.author.id,
                'full_name': self.author.full_name,
                'email': self.author.email,
                'company': self.author.company,
            }
        
        if include_replies and self.replies:
            data['replies'] = [reply.to_dict() for reply in self.replies]
        
        return data


class FeedbackPostLike(Base):
    """
    Post Likes Model - Track which users liked which posts
    """
    __tablename__ = "feedback_post_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("feedback_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    post = relationship("FeedbackPost", back_populates="likes")
    user = relationship("User")
    
    # Unique constraint: one like per user per post
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )







