# backend/app/database.py
# 数据库配置和连接管理

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 从环境变量获取数据库 URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://tradespro_user:changeme@localhost:5432/tradespro"
)

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 连接前验证
    pool_size=20,        # 连接池大小
    max_overflow=40,     # 最大溢出连接数
    echo=os.getenv("ENVIRONMENT") == "development"  # 开发模式下显示 SQL
)

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 声明式基类
Base = declarative_base()

# 依赖注入：获取数据库会话
def get_db():
    """
    FastAPI 依赖注入函数
    用法: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库
def init_db():
    """创建所有表"""
    Base.metadata.create_all(bind=engine)

# 删除所有表（仅用于测试！）
def drop_all_tables():
    """危险操作：删除所有表"""
    Base.metadata.drop_all(bind=engine)