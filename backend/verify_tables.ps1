# 快速验证数据库表的脚本
# 使用方法: .\verify_tables.ps1 [容器名称]

param(
    [string]$ContainerName = "tradespro_postgres",
    [string]$User = "tradespro_user",
    [string]$Database = "tradespro"
)

Write-Host "📋 验证数据库表..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查容器
$container = docker ps --filter "name=$ContainerName" --format "{{.Names}}"
if (-not $container) {
    Write-Host "❌ 容器 '$ContainerName' 未运行" -ForegroundColor Red
    exit 1
}

# 列出所有表
Write-Host "📊 数据库表列表:" -ForegroundColor Yellow
Write-Host ""

$tables = docker exec $container psql -U $User -d $Database -t -c "\dt" 2>&1

if ($LASTEXITCODE -eq 0) {
    $tableLines = $tables | Where-Object { $_ -match '\S' }
    
    if ($tableLines.Count -gt 0) {
        $tableLines | ForEach-Object {
            if ($_ -match 'public\s+\|\s+(\w+)') {
                $tableName = $matches[1]
                Write-Host "   ✅ $tableName" -ForegroundColor Green
            } else {
                Write-Host "   $_" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "   ⚠️  未找到任何表" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ 无法查询表列表" -ForegroundColor Red
    Write-Host "   错误: $tables" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# 检查必需的表
Write-Host "🔍 检查必需的表..." -ForegroundColor Yellow
Write-Host ""

$requiredTables = @("users", "projects", "calculations", "audit_logs", "calculation_jobs", "user_settings")
$tableList = docker exec $container psql -U $User -d $Database -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>&1
$existingTables = ($tableList | Where-Object { $_ -match '\S' }) | ForEach-Object { $_.Trim() }

$allFound = $true
foreach ($table in $requiredTables) {
    if ($existingTables -contains $table) {
        Write-Host "   ✅ $table" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $table (缺失)" -ForegroundColor Red
        $allFound = $false
    }
}

Write-Host ""

if ($allFound) {
    Write-Host "✅ 所有必需的表都已创建！" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分表缺失，需要初始化数据库" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 运行初始化:" -ForegroundColor Yellow
    Write-Host "   .\init_db_safe.ps1" -ForegroundColor Gray
}

Write-Host ""










