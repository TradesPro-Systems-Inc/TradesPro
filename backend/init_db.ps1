# 初始化数据库脚本 (PowerShell)
# 使用方法: .\init_db.ps1 [容器名称]

param(
    [string]$ContainerName = "tradespro_postgres",
    [string]$User = "tradespro_user",
    [string]$Database = "tradespro",
    [string]$InitFile = "init.sql"
)

Write-Host "🔧 初始化数据库..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查容器是否存在
Write-Host "1️⃣  检查容器..." -ForegroundColor Yellow
$container = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $container) {
    Write-Host "❌ 容器 '$ContainerName' 未运行" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 启动容器:" -ForegroundColor Yellow
    Write-Host "   docker start $ContainerName" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
Write-Host "✅ 容器 '$container' 运行中" -ForegroundColor Green
Write-Host ""

# 检查初始化文件是否存在
Write-Host "2️⃣  检查初始化文件..." -ForegroundColor Yellow
if (-not (Test-Path $InitFile)) {
    Write-Host "❌ 初始化文件 '$InitFile' 不存在" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 请确保在 backend 目录下运行此脚本" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
Write-Host "✅ 初始化文件存在: $InitFile" -ForegroundColor Green
Write-Host ""

# 测试数据库连接
Write-Host "3️⃣  测试数据库连接..." -ForegroundColor Yellow
$testResult = docker exec $container psql -U $User -d $Database -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 数据库连接失败" -ForegroundColor Red
    Write-Host "   错误: $testResult" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 检查:" -ForegroundColor Yellow
    Write-Host "   1. 容器是否运行" -ForegroundColor Gray
    Write-Host "   2. 数据库用户名/密码是否正确" -ForegroundColor Gray
    Write-Host "   3. 数据库名称是否存在" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
Write-Host "✅ 数据库连接成功" -ForegroundColor Green
Write-Host ""

# 执行初始化脚本
Write-Host "4️⃣  执行初始化脚本..." -ForegroundColor Yellow
Write-Host "   文件: $InitFile" -ForegroundColor Gray
Write-Host "   容器: $container" -ForegroundColor Gray
Write-Host "   数据库: $Database" -ForegroundColor Gray
Write-Host ""

try {
    # PowerShell 方式：使用 Get-Content 和管道
    Get-Content $InitFile -Raw | docker exec -i $container psql -U $User -d $Database
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 数据库初始化成功" -ForegroundColor Green
    } else {
        Write-Host "⚠️  初始化可能有问题，检查上面的输出" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 初始化失败" -ForegroundColor Red
    Write-Host "   错误: $_" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""

# 验证表是否创建
Write-Host "5️⃣  验证表是否创建..." -ForegroundColor Yellow
$tables = docker exec $container psql -U $User -d $Database -t -c "\dt" 2>&1
if ($tables -match "users|projects|calculations") {
    Write-Host "✅ 数据库表已创建" -ForegroundColor Green
    Write-Host "   表列表:" -ForegroundColor Gray
    $tables | ForEach-Object {
        if ($_ -match '\S') {
            Write-Host "   $_" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "⚠️  未找到预期的表" -ForegroundColor Yellow
    Write-Host "   输出: $tables" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ 初始化完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步:" -ForegroundColor Yellow
Write-Host "   启动后端服务: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""










