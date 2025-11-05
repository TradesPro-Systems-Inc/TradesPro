# backend/app/routes/__init__.py
# API Routes Package

from .auth import router as auth_router
from .projects import router as projects_router
from .calculations import router as calculations_router
from .feedback import router as feedback_router

__all__ = ['auth_router', 'projects_router', 'calculations_router', 'feedback_router']






