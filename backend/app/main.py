# backend/app/main.py
# TradesPro FastAPI Backend - Optional Online Services
# 提供用户认证、数据同步、PDF生成等在线功能

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Optional, List
import os
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 应用生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动和关闭时的操作"""
    logger.info("🚀 TradesPro Backend 启动中...")
    logger.info(f"环境: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"数据库: {'配置完成' if os.getenv('DATABASE_URL') else '未配置'}")
    
    # 这里可以添加数据库连接、缓存初始化等
    # await init_db()
    
    yield
    
    # 清理资源
    logger.info("👋 TradesPro Backend 关闭中...")
    # await close_db()

# 创建 FastAPI 应用
app = FastAPI(
    title="TradesPro CEC Calculation API",
    description="可选的在线服务：用户认证、数据同步、PDF生成",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 配置
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:9000,http://localhost:8080").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# 健康检查
# ============================================

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "tradespro-backend",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "features": {
            "database": bool(os.getenv("DATABASE_URL")),
            "redis": bool(os.getenv("REDIS_URL")),
            "authentication": True,
            "cloud_sync": True
        }
    }

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "TradesPro Backend API",
        "docs": "/docs",
        "health": "/health",
        "note": "前端应用可完全离线工作，此后端仅提供可选的在线功能"
    }

# ============================================
# 认证相关（简化版本）
# ============================================

from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

@app.post("/api/v1/auth/register", response_model=Token)
async def register_user(user: UserRegister):
    """用户注册"""
    # TODO: 实现真实的用户注册逻辑
    # - 检查邮箱是否已存在
    # - 密码哈希
    # - 保存到数据库
    # - 返回 JWT token
    
    logger.info(f"注册请求: {user.email}")
    
    # 临时返回模拟 token
    return {
        "access_token": "mock_token_for_" + user.email,
        "token_type": "bearer"
    }

@app.post("/api/v1/auth/token", response_model=Token)
async def login(credentials: UserLogin):
    """用户登录"""
    # TODO: 实现真实的登录逻辑
    # - 验证邮箱和密码
    # - 生成 JWT token
    
    logger.info(f"登录请求: {credentials.email}")
    
    # 临时返回模拟 token
    return {
        "access_token": "mock_token_for_" + credentials.email,
        "token_type": "bearer"
    }

@app.get("/api/v1/auth/me")
async def get_current_user(request: Request):
    """获取当前用户信息"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证令牌"
        )
    
    # TODO: 验证 JWT token
    token = auth_header.replace("Bearer ", "")
    
    # 临时返回模拟用户信息
    return {
        "id": 1,
        "email": "user@example.com",
        "full_name": "测试用户",
        "is_active": True
    }

# ============================================
# 项目管理
# ============================================

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    location: Optional[str] = None
    client_name: Optional[str] = None

class Project(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    client_name: Optional[str]
    owner_id: int
    created_at: str
    
    class Config:
        from_attributes = True

@app.post("/api/v1/projects", response_model=Project)
async def create_project(project: ProjectCreate, request: Request):
    """创建项目"""
    # TODO: 验证用户认证
    # TODO: 保存到数据库
    
    logger.info(f"创建项目: {project.name}")
    
    # 临时返回模拟数据
    from datetime import datetime
    return {
        "id": 1,
        "name": project.name,
        "description": project.description,
        "location": project.location,
        "client_name": project.client_name,
        "owner_id": 1,
        "created_at": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/projects", response_model=List[Project])
async def list_projects(
    request: Request,
    skip: int = 0,
    limit: int = 100
):
    """获取项目列表"""
    # TODO: 从数据库查询
    
    logger.info("获取项目列表")
    
    # 临时返回空列表
    return []

@app.get("/api/v1/projects/{project_id}", response_model=Project)
async def get_project(project_id: int, request: Request):
    """获取项目详情"""
    # TODO: 从数据库查询
    
    logger.info(f"获取项目: {project_id}")
    
    # 临时返回模拟数据
    from datetime import datetime
    return {
        "id": project_id,
        "name": "示例项目",
        "description": None,
        "location": None,
        "client_name": None,
        "owner_id": 1,
        "created_at": datetime.utcnow().isoformat()
    }

# ============================================
# 计算记录管理（云端同步）
# ============================================

from typing import Any, Dict

class CalculationSyncRequest(BaseModel):
    project_id: int
    bundle: Dict[str, Any]

class CalculationResponse(BaseModel):
    id: str
    success: bool
    message: str

@app.post("/api/v1/calculations", response_model=CalculationResponse)
async def sync_calculation(data: CalculationSyncRequest, request: Request):
    """
    同步计算到云端
    注意：前端已经完成了计算，这里只是存储结果
    """
    # TODO: 验证用户认证
    # TODO: 保存 bundle 到数据库
    
    bundle_id = data.bundle.get("id", "unknown")
    logger.info(f"同步计算记录: {bundle_id}")
    
    # 临时返回成功响应
    return {
        "id": bundle_id,
        "success": True,
        "message": "计算已同步到云端"
    }

@app.get("/api/v1/calculations/{calculation_id}")
async def get_calculation(calculation_id: str, request: Request):
    """获取计算记录"""
    # TODO: 从数据库查询
    
    logger.info(f"获取计算记录: {calculation_id}")
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="计算记录未找到"
    )

@app.get("/api/v1/projects/{project_id}/calculations")
async def list_project_calculations(
    project_id: int,
    request: Request,
    skip: int = 0,
    limit: int = 100
):
    """获取项目的所有计算"""
    # TODO: 从数据库查询
    
    logger.info(f"获取项目 {project_id} 的计算列表")
    
    return []

# ============================================
# PDF 生成（服务器端）
# ============================================

from fastapi.responses import StreamingResponse
import io

@app.get("/api/v1/calculations/{calculation_id}/report")
async def generate_pdf_report(calculation_id: str, request: Request):
    """生成 PDF 报告"""
    # TODO: 
    # 1. 从数据库获取计算 bundle
    # 2. 使用 ReportLab 或其他库生成 PDF
    # 3. 返回 PDF 文件
    
    logger.info(f"生成 PDF 报告: {calculation_id}")
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="PDF 生成功能开发中，请使用前端的客户端生成功能"
    )

# ============================================
# 统计信息
# ============================================

@app.get("/api/v1/stats")
async def get_statistics(request: Request):
    """获取用户统计信息"""
    # TODO: 从数据库聚合统计数据
    
    return {
        "total_projects": 0,
        "total_calculations": 0,
        "calculations_this_month": 0,
        "most_used_building_type": "single-dwelling"
    }

# ============================================
# 错误处理
# ============================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 异常处理"""
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
    """通用异常处理"""
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "服务器内部错误"
            }
        }
    )

# ============================================
# 开发工具端点
# ============================================

if os.getenv("ENVIRONMENT") == "development":
    @app.get("/api/v1/debug/info")
    async def debug_info():
        """调试信息（仅开发环境）"""
        return {
            "environment_variables": {
                "DATABASE_URL": bool(os.getenv("DATABASE_URL")),
                "REDIS_URL": bool(os.getenv("REDIS_URL")),
                "SECRET_KEY": bool(os.getenv("SECRET_KEY")),
            },
            "cors_origins": CORS_ORIGINS,
            "python_version": os.sys.version
        }

# ============================================
# 应用入口
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development",
        log_level="info"
    )