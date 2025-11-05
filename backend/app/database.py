# backend/app/database.py
# Database Configuration and Connection Management

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
load_dotenv()

# Get database URL from environment variable
# Note: We use psycopg3 (psycopg package), so URL must use postgresql+psycopg://
# SQLAlchemy 2.0+ supports psycopg3, but we must explicitly specify it in the URL
DATABASE_URL_RAW = os.getenv(
    "DATABASE_URL",
    "postgresql://tradespro_user:changeme@localhost:5432/tradespro"
)

# Convert to psycopg3 URL format (required for psycopg3)
# psycopg3 uses postgresql+psycopg:// prefix
if DATABASE_URL_RAW.startswith("postgresql://"):
    # Convert to psycopg3 format
    DATABASE_URL = DATABASE_URL_RAW.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL_RAW.startswith("postgresql+psycopg://"):
    # Already in correct format
    DATABASE_URL = DATABASE_URL_RAW
elif "+" in DATABASE_URL_RAW:
    # Has other driver prefix, keep it
    DATABASE_URL = DATABASE_URL_RAW
else:
    # Default to psycopg3
    DATABASE_URL = DATABASE_URL_RAW.replace("postgresql://", "postgresql+psycopg://", 1) if "://" in DATABASE_URL_RAW else DATABASE_URL_RAW

# Create database engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connection before use
    pool_size=20,        # Connection pool size
    max_overflow=40,     # Maximum overflow connections
    echo=os.getenv("ENVIRONMENT") == "development"  # Show SQL in development mode
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base class
Base = declarative_base()

# Dependency injection: Get database session
def get_db():
    """
    FastAPI dependency injection function.
    
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize database
def init_db():
    """Create all tables and run migrations"""
    # Import all models to ensure they are registered with Base.metadata
    from app.models import (
        User, Project, Calculation, UserSettings, AuditLog, CalculationJob,
        FeedbackPost, FeedbackPostLike, FeedbackReply, FeedbackReplyLike
    )  # noqa: F401
    
    # Create all tables defined by models
    Base.metadata.create_all(bind=engine)
    
    # Run migrations (update bundle_hash column length if needed)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check if bundle_hash column exists and has length 64
            result = conn.execute(
                text("""
                    SELECT character_maximum_length 
                    FROM information_schema.columns 
                    WHERE table_name = 'calculations' 
                    AND column_name = 'bundle_hash'
                """)
            )
            row = result.fetchone()
            if row and row[0] == 64:
                # Update column length to 128
                conn.execute(
                    text("""
                        ALTER TABLE calculations 
                        ALTER COLUMN bundle_hash TYPE VARCHAR(128)
                    """)
                )
                conn.commit()
                print("✅ Migrated bundle_hash column from VARCHAR(64) to VARCHAR(128)")
    except Exception as e:
        # Migration failed, but continue (column might not exist yet or already updated)
        print(f"⚠️ Migration check skipped: {e}")

# Drop all tables (for testing only!)
def drop_all_tables():
    """Dangerous operation: Drop all tables"""
    Base.metadata.drop_all(bind=engine)