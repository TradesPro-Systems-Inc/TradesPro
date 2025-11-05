# backend/app/main.py
# TradesPro FastAPI Backend - Optional Online Services
# V4.1 Architecture Compliant - User authentication, data sync, PDF generation

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging

# Import routes
from .routes import auth_router, projects_router, calculations_router, feedback_router
from .utils.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Application lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown operations"""
    logger.info("TradesPro Backend Starting...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {'Configured' if settings.DATABASE_URL else 'Not configured'}")
    
    # Initialize database tables
    try:
        from .database import init_db
        init_db()
        logger.info("Database initialized (tables ensured)")
    except Exception as e:
        logger.warning(f"Database initialization skipped or failed: {e}")
    
    yield
    
    # Cleanup resources
    logger.info("TradesPro Backend Shutting down...")

# Create FastAPI application
app = FastAPI(
    title="TradesPro CEC Calculation API",
    description="V4.1 Architecture - Optional online services: user auth, data sync, PDF generation",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# Handle wildcard (*) for development - allow all origins
if "*" in settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,  # Cannot use credentials with wildcard
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
# Log CORS configuration for debugging
logger.info(f"CORS configured: {len(settings.CORS_ORIGINS)} origin(s) allowed")
if settings.CORS_ORIGINS:
    logger.info(f"CORS origins: {', '.join(settings.CORS_ORIGINS[:3])}{'...' if len(settings.CORS_ORIGINS) > 3 else ''}")

# Include routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(projects_router, prefix=settings.API_V1_PREFIX)
app.include_router(calculations_router, prefix=settings.API_V1_PREFIX)
app.include_router(feedback_router, prefix=settings.API_V1_PREFIX)

# Health Check Endpoint

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "tradespro-backend",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "features": {
            "database": bool(settings.DATABASE_URL),
            "redis": bool(settings.REDIS_URL),
            "authentication": True,
            "cloud_sync": True,
            "v41_compliant": True
        }
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "TradesPro Backend API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health",
        "api_prefix": settings.API_V1_PREFIX,
        "note": "Frontend can work completely offline. This backend provides optional online features.",
        "architecture": "V4.1 - Shared calculation engine"
    }

# Legacy Endpoints (kept for backward compatibility)

@app.get("/api/v1/stats")
async def get_statistics():
    """Basic statistics aggregated from database (best-effort)."""
    try:
        from sqlalchemy import func
        from .database import SessionLocal
        from .models.project import Project
        from .models.calculation import Calculation

        db = SessionLocal()
        try:
            total_projects = db.query(func.count(Project.id)).scalar() or 0
            total_calculations = db.query(func.count(Calculation.id)).scalar() or 0

            # Current month calculations
            from datetime import datetime
            now = datetime.utcnow()
            start_month = datetime(now.year, now.month, 1)
            calculations_this_month = (
                db.query(func.count(Calculation.id))
                .filter(Calculation.created_at >= start_month)
                .scalar() or 0
            )

            return {
                "total_projects": int(total_projects),
                "total_calculations": int(total_calculations),
                "calculations_this_month": int(calculations_this_month),
            }
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Stats aggregation unavailable: {e}")
        return {
            "total_projects": 0,
            "total_calculations": 0,
            "calculations_this_month": 0,
        }

# Exception Handlers

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error"
            }
        }
    )

# Development Endpoint

if settings.ENVIRONMENT == "development":
    @app.get("/api/v1/debug/info")
    async def debug_info():
        """Debug information (development only)"""
        return {
            "environment_variables": {
                "DATABASE_URL": bool(settings.DATABASE_URL),
                "REDIS_URL": bool(settings.REDIS_URL),
                "SECRET_KEY": bool(settings.SECRET_KEY),
            },
            "cors_origins": settings.CORS_ORIGINS,
            "python_version": os.sys.version
        }

# Application Entry Point

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )