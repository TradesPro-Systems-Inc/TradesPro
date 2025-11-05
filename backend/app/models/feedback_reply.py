# backend/app/models/feedback_reply.py
# Feedback Reply Model - Replies to feedback posts

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class FeedbackReply(Base):
    """
    Feedback Reply Model
    
    Replies to feedback posts. Users can reply to posts and to other replies (threaded).
    """
    __tablename__ = "feedback_replies"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Keys
    post_id = Column(Integer, ForeignKey("feedback_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_reply_id = Column(Integer, ForeignKey("feedback_replies.id", ondelete="CASCADE"), nullable=True, index=True)
    # parent_reply_id allows nested replies (reply to a reply)
    
    # Reply Content
    content = Column(Text, nullable=False)
    
    # Moderation
    is_edited = Column(Boolean, default=False, nullable=False)
    
    # Engagement
    like_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    post = relationship("FeedbackPost", back_populates="replies")
    author = relationship("User", back_populates="feedback_replies")
    parent_reply = relationship("FeedbackReply", remote_side=[id], backref="child_replies")
    likes = relationship("FeedbackReplyLike", back_populates="reply", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<FeedbackReply(id={self.id}, post_id={self.post_id}, user_id={self.user_id})>"
    
    def to_dict(self, include_children=False):
        """Convert reply to dictionary"""
        data = {
            'id': self.id,
            'post_id': self.post_id,
            'user_id': self.user_id,
            'parent_reply_id': self.parent_reply_id,
            'content': self.content,
            'is_edited': self.is_edited,
            'like_count': self.like_count,
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
        
        if include_children and self.child_replies:
            data['replies'] = [reply.to_dict(include_children=True) for reply in self.child_replies]
        
        return data


class FeedbackReplyLike(Base):
    """
    Reply Likes Model - Track which users liked which replies
    """
    __tablename__ = "feedback_reply_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    reply_id = Column(Integer, ForeignKey("feedback_replies.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    reply = relationship("FeedbackReply", back_populates="likes")
    user = relationship("User")
    
    # Unique constraint: one like per user per reply
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )







