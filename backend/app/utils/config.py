# backend/app/utils/config.py
# Application Configuration

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "TradesPro Backend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://tradespro_user:changeme@localhost:5432/tradespro"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-in-production-very-long-secret-key")
    JWT_SECRET: str = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Bundle Signing (V4.1 Architecture)
    BUNDLE_SIGNING_KEY: str = os.getenv("BUNDLE_SIGNING_KEY", SECRET_KEY)  # Dedicated key for bundle signing
    
    # V4.1 Architecture: Engine Metadata (CI/CD injection)
    GIT_COMMIT: str = os.getenv("GIT_COMMIT", "dev-local")  # Must be injected by CI/CD pipeline
    GIT_COMMIT_SHORT: str = os.getenv("GIT_COMMIT_SHORT", GIT_COMMIT[:8] if len(GIT_COMMIT) > 8 else GIT_COMMIT)
    
    # CORS - Strip whitespace from origins and support wildcard patterns
    _cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:9000,http://localhost:8080,http://localhost:3000")
    CORS_ORIGINS: list = [
        origin.strip() 
        for origin in _cors_origins_raw.split(",") 
        if origin.strip()  # Filter out empty strings
    ]
    
    # If CORS_ORIGINS contains "*", allow all origins (development only)
    # In production, always specify exact origins
    if "*" in CORS_ORIGINS:
        import warnings
        warnings.warn(
            "CORS_ORIGINS contains '*', allowing all origins. "
            "This should only be used in development!"
        )
    
    # External Services
    CALCULATION_SERVICE_URL: str = os.getenv("CALCULATION_SERVICE_URL", "http://calc-service:3001")
    
    # API Versioning
    API_V1_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

