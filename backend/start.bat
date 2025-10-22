@echo off
REM backend/start.bat
REM TradesPro Backend 启动脚本 (Windows)

echo 🚀 启动 TradesPro Backend...
echo.

REM 检查虚拟环境
if not exist "venv\Scripts\activate.bat" (
    echo ⚠️  警告: 未找到虚拟环境
    echo 请先运行: python -m venv venv
    pause
    exit /b 1
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 检查 .env 文件
if not exist ".env" (
    echo ⚠️  警告: .env 文件不存在，使用默认配置
    echo 请复制 .env.example 为 .env 并修改配置
)

REM 设置默认环境变量
if not defined ENVIRONMENT set ENVIRONMENT=development
if not defined PORT set PORT=8000

echo ✨ 启动 FastAPI 应用...
echo    端口: %PORT%
echo    环境: %ENVIRONMENT%
echo.

REM 启动应用
if "%ENVIRONMENT%"=="development" (
    REM 开发模式：启用热重载
    uvicorn app.main:app --host 0.0.0.0 --port %PORT% --reload --log-level debug
) else (
    REM 生产模式
    uvicorn app.main:app --host 0.0.0.0 --port %PORT% --log-level info
)

pause