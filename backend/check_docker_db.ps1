# 检查 Docker PostgreSQL 数据库连接脚本
# 使用方法: .\check_docker_db.ps1

Write-Host "🔍 检查 Docker PostgreSQL 数据库..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
Write-Host "1️⃣  检查 Docker 是否运行..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker 已安装" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker 未安装或未在 PATH 中" -ForegroundColor Red
    exit 1
}

# 检查 PostgreSQL 容器是否运行
Write-Host ""
Write-Host "2️⃣  检查 PostgreSQL 容器..." -ForegroundColor Yellow
$containers = docker ps --filter "name=postgres" --format "{{.Names}}"
if ($containers) {
    Write-Host "✅ PostgreSQL 容器运行中:" -ForegroundColor Green
    $containers | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠️  未找到运行中的 PostgreSQL 容器" -ForegroundColor Yellow
    Write-Host "   尝试查找所有容器..." -ForegroundColor Gray
    $allContainers = docker ps -a --format "{{.Names}}"
    if ($allContainers) {
        Write-Host "   已停止的容器:" -ForegroundColor Gray
        $allContainers | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
        Write-Host ""
        Write-Host "💡 提示: 运行以下命令启动容器:" -ForegroundColor Yellow
        Write-Host "   docker start <容器名称>" -ForegroundColor Gray
    }
    exit 1
}

# 检查端口映射
Write-Host ""
Write-Host "3️⃣  检查端口映射..." -ForegroundColor Yellow
$portMapping = docker port ($containers -split "`n")[0] 2>$null
if ($portMapping -match "5432") {
    Write-Host "✅ 端口 5432 已映射" -ForegroundColor Green
    Write-Host "   $portMapping" -ForegroundColor Gray
} else {
    Write-Host "⚠️  未找到端口 5432 映射" -ForegroundColor Yellow
    Write-Host "   当前端口映射:" -ForegroundColor Gray
    Write-Host "   $portMapping" -ForegroundColor Gray
}

# 测试数据库连接
Write-Host ""
Write-Host "4️⃣  测试数据库连接..." -ForegroundColor Yellow
$containerName = ($containers -split "`n")[0]
try {
    $result = docker exec $containerName psql -U tradespro_user -d tradespro -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 数据库连接成功" -ForegroundColor Green
        Write-Host "   PostgreSQL 版本:" -ForegroundColor Gray
        $result | Select-Object -First 1 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    } else {
        Write-Host "❌ 数据库连接失败" -ForegroundColor Red
        Write-Host "   错误信息:" -ForegroundColor Gray
        Write-Host "   $result" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 可能的原因:" -ForegroundColor Yellow
        Write-Host "   1. 数据库用户名/密码不正确" -ForegroundColor Gray
        Write-Host "   2. 数据库名称不存在" -ForegroundColor Gray
        Write-Host "   3. 容器内部配置问题" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 无法执行数据库测试" -ForegroundColor Red
    Write-Host "   错误: $_" -ForegroundColor Gray
}

# 检查数据库表
Write-Host ""
Write-Host "5️⃣  检查数据库表..." -ForegroundColor Yellow
try {
    $tables = docker exec $containerName psql -U tradespro_user -d tradespro -t -c "\dt" 2>&1
    if ($tables -match "users|projects|calculations") {
        Write-Host "✅ 数据库表已创建" -ForegroundColor Green
        Write-Host "   表列表:" -ForegroundColor Gray
        $tables | ForEach-Object {
            if ($_ -match '\S') {
                Write-Host "   $_" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "⚠️  数据库表未创建或为空" -ForegroundColor Yellow
        Write-Host "   需要初始化数据库" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 运行初始化脚本:" -ForegroundColor Yellow
        Write-Host "   docker exec -i $containerName psql -U tradespro_user -d tradespro < init.sql" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  无法检查数据库表" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ 检查完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步:" -ForegroundColor Yellow
Write-Host "   如果所有检查通过，可以启动后端服务" -ForegroundColor Gray
Write-Host "   参考: TESTING_GUIDE.md 或 TESTING_QUICK_START.md" -ForegroundColor Gray
Write-Host ""










