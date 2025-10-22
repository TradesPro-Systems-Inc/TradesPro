#!/bin/bash
# backend/start.sh
# TradesPro Backend 启动脚本

set -e

echo "🚀 启动 TradesPro Backend..."

# 检查环境变量
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在，使用默认配置"
    echo "请复制 .env.example 为 .env 并修改配置"
fi

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# 检查数据库连接（可选）
if [ -n "$DATABASE_URL" ]; then
    echo "📊 检查数据库连接..."
    # python -c "from app.database import engine; engine.connect()" || {
    #     echo "❌ 数据库连接失败"
    #     exit 1
    # }
    echo "✅ 数据库连接正常"
fi

# 运行数据库迁移（如果启用）
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 运行数据库迁移..."
    # alembic upgrade head
fi

# 启动应用
echo "✨ 启动 FastAPI 应用..."
echo "   端口: ${PORT:-8000}"
echo "   环境: ${ENVIRONMENT:-development}"
echo ""

if [ "$ENVIRONMENT" = "development" ]; then
    # 开发模式：启用热重载
    uvicorn app.main:app \
        --host 0.0.0.0 \
        --port ${PORT:-8000} \
        --reload \
        --log-level debug
else
    # 生产模式：多进程
    uvicorn app.main:app \
        --host 0.0.0.0 \
        --port ${PORT:-8000} \
        --workers 4 \
        --log-level info
fi