# PowerShell script to fix NULL updated_at values in users table

$ErrorActionPreference = "Stop"

Write-Host "🔄 修复 users 表中 updated_at 为 NULL 的记录..." -ForegroundColor Cyan

# Check if Docker container is running
$containerName = "tradespro_postgres"
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Status}}" 2>&1

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerStatus)) {
    Write-Host "❌ Docker container '$containerName' is not running!" -ForegroundColor Red
    Write-Host "   Please start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker container '$containerName' is running" -ForegroundColor Green

# SQL fix script
$fixSQL = @"
-- Fix NULL updated_at values in users table
UPDATE users
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Show affected records
SELECT id, email, created_at, updated_at
FROM users
WHERE updated_at IS NOT NULL
ORDER BY id;
"@

# Execute fix
Write-Host "📝 执行修复..." -ForegroundColor Cyan
$fixSQL | docker exec -i $containerName psql -U tradespro_user -d tradespro

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 修复完成!" -ForegroundColor Green
} else {
    Write-Host "❌ 修复失败!" -ForegroundColor Red
    exit 1
}









