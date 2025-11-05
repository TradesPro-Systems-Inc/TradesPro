# 安全初始化数据库脚本 (PowerShell)
# 此脚本会先检查，然后只在需要时初始化
# 使用方法: .\init_db_safe.ps1 [容器名称]

param(
    [string]$ContainerName = "tradespro_postgres",
    [string]$User = "tradespro_user",
    [string]$Database = "tradespro",
    [string]$InitFile = "init.sql"
)

Write-Host "🔧 安全初始化数据库..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查容器
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

# 检查数据库连接
Write-Host "2️⃣  检查数据库连接..." -ForegroundColor Yellow
$testResult = docker exec $container psql -U $User -d $Database -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 数据库连接失败" -ForegroundColor Red
    Write-Host "   错误: $testResult" -ForegroundColor Gray
    exit 1
}
Write-Host "✅ 数据库连接成功" -ForegroundColor Green
Write-Host ""

# 检查表是否已存在
Write-Host "3️⃣  检查现有表..." -ForegroundColor Yellow
$tables = docker exec $container psql -U $User -d $Database -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'projects', 'calculations');" 2>&1
$existingTables = ($tables | Where-Object { $_ -match '\S' }) | ForEach-Object { $_.Trim() }

if ($existingTables.Count -ge 3) {
    Write-Host "✅ 数据库表已存在" -ForegroundColor Green
    Write-Host "   已存在的表: $($existingTables -join ', ')" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 数据库已初始化，无需重复初始化" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 如果遇到问题，可以:" -ForegroundColor Yellow
    Write-Host "   1. 运行 .\check_db_status.ps1 检查详细状态" -ForegroundColor Gray
    Write-Host "   2. 如果需要重新初始化，先删除表再运行此脚本" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "⚠️  表未完全初始化，需要执行初始化脚本" -ForegroundColor Yellow
Write-Host ""

# 检查初始化文件
Write-Host "4️⃣  检查初始化文件..." -ForegroundColor Yellow
if (-not (Test-Path $InitFile)) {
    Write-Host "❌ 初始化文件 '$InitFile' 不存在" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 初始化文件存在: $InitFile" -ForegroundColor Green
Write-Host ""

# 执行初始化
Write-Host "5️⃣  执行初始化脚本..." -ForegroundColor Yellow
Write-Host "   注意: 如果索引或触发器已存在，会显示错误信息，这是正常的" -ForegroundColor Gray
Write-Host ""

try {
    Get-Content $InitFile -Raw | docker exec -i $container psql -U $User -d $Database 2>&1 | ForEach-Object {
        if ($_ -match "ERROR|NOTICE|CREATE|INSERT|GRANT") {
            if ($_ -match "ERROR.*already exists") {
                Write-Host "   ⚠️  $_" -ForegroundColor Yellow -NoNewline
            } elseif ($_ -match "NOTICE.*already exists") {
                Write-Host "   ℹ️  $_" -ForegroundColor Cyan -NoNewline
            } elseif ($_ -match "CREATE|INSERT|GRANT") {
                Write-Host "   ✅ $_" -ForegroundColor Green -NoNewline
            } else {
                Write-Host "   $_" -ForegroundColor Gray -NoNewline
            }
        }
    }
} catch {
    Write-Host "❌ 初始化失败" -ForegroundColor Red
    Write-Host "   错误: $_" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# 验证初始化结果
Write-Host "6️⃣  验证初始化结果..." -ForegroundColor Yellow
$tables = docker exec $container psql -U $User -d $Database -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>&1
$tableList = ($tables | Where-Object { $_ -match '\S' }) | ForEach-Object { $_.Trim() }

$requiredTables = @("users", "projects", "calculations", "audit_logs", "calculation_jobs", "user_settings")
$allFound = $true

foreach ($table in $requiredTables) {
    if ($tableList -contains $table) {
        Write-Host "   ✅ $table" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $table (缺失)" -ForegroundColor Red
        $allFound = $false
    }
}

Write-Host ""

if ($allFound) {
    Write-Host "✅ 数据库初始化成功！" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分表缺失，请检查上面的输出" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ 初始化完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步:" -ForegroundColor Yellow
Write-Host "   启动后端服务: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""










