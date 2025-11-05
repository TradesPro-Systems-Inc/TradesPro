@echo off
REM TradesPro Backend 启动脚本 (Windows)
REM 使用方法: 双击此文件或从命令行运行

echo ========================================
echo  TradesPro Backend 启动脚本
echo ========================================
echo.

REM 检查 venv 是否存在
if not exist "venv\Scripts\activate.bat" (
    echo [错误] venv 未找到！
    echo 请先运行: python -m venv venv
    echo 然后安装依赖: .\venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

REM 激活 venv
echo [1/3] 激活 Python 虚拟环境...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [错误] 无法激活 venv
    pause
    exit /b 1
)
echo [OK] 虚拟环境已激活
echo.

REM 检查依赖
echo [2/3] 检查依赖...
python -c "import fastapi, uvicorn" 2>nul
if errorlevel 1 (
    echo [警告] 依赖可能未安装，尝试安装...
    pip install -r requirements.txt
)
echo [OK] 依赖检查完成
echo.

REM 设置环境变量（可选）
if not exist ".env" (
    echo [提示] .env 文件不存在，使用默认配置
    echo 如果需要自定义配置，请创建 .env 文件
    echo.
)

REM 启动服务
echo [3/3] 启动 FastAPI 服务...
echo.
echo ========================================
echo  后端服务将运行在: http://localhost:8000
echo  API 文档: http://localhost:8000/docs
echo  健康检查: http://localhost:8000/health
echo ========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

REM 启动 uvicorn
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause










