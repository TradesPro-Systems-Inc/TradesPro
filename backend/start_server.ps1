# 启动后端服务脚本 (PowerShell)
# 使用方法: .\start_server.ps1

Write-Host "🚀 启动 TradesPro Backend..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = $PSScriptRoot
$venvPath = Join-Path $backendDir "venv"
$pythonExe = Join-Path $venvPath "Scripts\python.exe"

# 检查 venv
if (-not (Test-Path $pythonExe)) {
    Write-Host "❌ venv 未找到或 Python 不可用" -ForegroundColor Red
    Write-Host "   venv 路径: $venvPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 解决方案:" -ForegroundColor Yellow
    Write-Host "   1. 检查 venv 是否存在" -ForegroundColor Gray
    Write-Host "   2. 运行 .\fix_venv.ps1 检查问题" -ForegroundColor Gray
    Write-Host "   3. 如果 venv 不存在，创建它:" -ForegroundColor Gray
    Write-Host "      python -m venv venv" -ForegroundColor Gray
    Write-Host "      .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
    Write-Host "      pip install -r requirements.txt" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "✅ venv 检查通过" -ForegroundColor Green
Write-Host "   Python: $pythonExe" -ForegroundColor Gray
Write-Host ""

# 检查依赖
Write-Host "📦 检查依赖..." -ForegroundColor Yellow
$hasUvicorn = & $pythonExe -c "import uvicorn; print('OK')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  uvicorn 未安装，正在安装依赖..." -ForegroundColor Yellow
    & $pythonExe -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ 依赖检查通过" -ForegroundColor Green
Write-Host ""

# 启动服务
Write-Host "✨ 启动 FastAPI 服务..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   后端服务: http://localhost:8000" -ForegroundColor Green
Write-Host "   API 文档: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "   健康检查: http://localhost:8000/health" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Gray
Write-Host ""

# 使用 venv 中的 Python 直接启动
& $pythonExe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload










