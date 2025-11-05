# 检查数据库状态脚本
# 使用方法: .\check_db_status.ps1 [容器名称]

param(
    [string]$ContainerName = "tradespro_postgres",
    [string]$User = "tradespro_user",
    [string]$Database = "tradespro"
)

Write-Host "🔍 检查数据库状态..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查容器
Write-Host "1️⃣  检查容器..." -ForegroundColor Yellow
$container = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $container) {
    Write-Host "❌ 容器 '$ContainerName' 未运行" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 容器 '$container' 运行中" -ForegroundColor Green
Write-Host ""

# 检查数据库连接
Write-Host "2️⃣  检查数据库连接..." -ForegroundColor Yellow
$testResult = docker exec $container psql -U $User -d $Database -c "SELECT version();" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 数据库连接失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 数据库连接成功" -ForegroundColor Green
Write-Host ""

# 检查表
Write-Host "3️⃣  检查数据库表..." -ForegroundColor Yellow
$tables = docker exec $container psql -U $User -d $Database -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>&1
$tableList = ($tables | Where-Object { $_ -match '\S' }) | ForEach-Object { $_.Trim() }

$requiredTables = @("users", "projects", "calculations", "audit_logs", "calculation_jobs", "user_settings")
$foundTables = @()

foreach ($table in $requiredTables) {
    if ($tableList -contains $table) {
        $foundTables += $table
        Write-Host "   ✅ $table" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $table (缺失)" -ForegroundColor Red
    }
}

Write-Host ""

if ($foundTables.Count -eq $requiredTables.Count) {
    Write-Host "✅ 所有必需的表都已创建" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分表缺失，需要初始化数据库" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 运行初始化:" -ForegroundColor Yellow
    Write-Host "   .\init_db.ps1" -ForegroundColor Gray
    exit 1
}

# 检查索引
Write-Host ""
Write-Host "4️⃣  检查索引..." -ForegroundColor Yellow
$indexCount = docker exec $container psql -U $User -d $Database -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>&1
$indexCount = ($indexCount | Where-Object { $_ -match '\d+' }) | ForEach-Object { [int]($_ -replace '\D', '') }
Write-Host "   📊 索引数量: $indexCount" -ForegroundColor Gray

# 检查触发器
Write-Host ""
Write-Host "5️⃣  检查触发器..." -ForegroundColor Yellow
$triggerCount = docker exec $container psql -U $User -d $Database -t -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'update_%_updated_at';" 2>&1
$triggerCount = ($triggerCount | Where-Object { $_ -match '\d+' }) | ForEach-Object { [int]($_ -replace '\D', '') }
Write-Host "   📊 自动更新触发器: $triggerCount" -ForegroundColor Gray

# 检查示例数据
Write-Host ""
Write-Host "6️⃣  检查示例数据..." -ForegroundColor Yellow
$userCount = docker exec $container psql -U $User -d $Database -t -c "SELECT COUNT(*) FROM users;" 2>&1
$userCount = ($userCount | Where-Object { $_ -match '\d+' }) | ForEach-Object { [int]($_ -replace '\D', '') }
Write-Host "   👤 用户数量: $userCount" -ForegroundColor Gray

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ 数据库状态检查完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 总结:" -ForegroundColor Yellow
Write-Host "   数据库已正确初始化" -ForegroundColor Green
Write-Host "   所有必需的表已创建" -ForegroundColor Green
Write-Host "   可以启动后端服务" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 下一步:" -ForegroundColor Yellow
Write-Host "   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""










