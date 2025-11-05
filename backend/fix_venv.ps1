# 修复 venv 路径问题脚本
# 使用方法: .\fix_venv.ps1

Write-Host "🔧 修复 venv 路径问题..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $PSScriptRoot "."
$venvPath = Join-Path $backendDir "venv"

Write-Host "📁 检查目录结构..." -ForegroundColor Yellow
Write-Host "   后端目录: $backendDir" -ForegroundColor Gray
Write-Host "   venv 路径: $venvPath" -ForegroundColor Gray
Write-Host ""

# 检查 venv 是否存在
if (Test-Path $venvPath) {
    Write-Host "✅ venv 目录存在" -ForegroundColor Green
    
    $pythonExe = Join-Path $venvPath "Scripts\python.exe"
    if (Test-Path $pythonExe) {
        Write-Host "✅ Python 可执行文件存在" -ForegroundColor Green
        Write-Host "   Python 路径: $pythonExe" -ForegroundColor Gray
        
        # 测试 Python
        $pythonVersion = & $pythonExe --version 2>&1
        Write-Host "   Python 版本: $pythonVersion" -ForegroundColor Gray
        Write-Host ""
        
        # 检查 uvicorn 是否安装
        Write-Host "📦 检查依赖..." -ForegroundColor Yellow
        $hasUvicorn = & $pythonExe -c "import uvicorn; print('OK')" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ uvicorn 已安装" -ForegroundColor Green
        } else {
            Write-Host "⚠️  uvicorn 未安装" -ForegroundColor Yellow
            Write-Host "   需要安装依赖..." -ForegroundColor Gray
            Write-Host ""
            Write-Host "💡 运行以下命令安装依赖:" -ForegroundColor Yellow
            Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
            Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Python 可执行文件不存在" -ForegroundColor Red
        Write-Host "   venv 可能损坏，需要重新创建" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 重新创建 venv:" -ForegroundColor Yellow
        Write-Host "   Remove-Item -Recurse -Force venv" -ForegroundColor Gray
        Write-Host "   python -m venv venv" -ForegroundColor Gray
        Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
        Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ venv 目录不存在" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 创建 venv:" -ForegroundColor Yellow
    Write-Host "   python -m venv venv" -ForegroundColor Gray
    Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
    Write-Host "   pip install -r requirements.txt" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📝 启动后端服务的正确方法:" -ForegroundColor Yellow
Write-Host ""
Write-Host "方法 1: 使用启动脚本（推荐）" -ForegroundColor Green
Write-Host "   .\start_backend.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "方法 2: 手动激活 venv 后启动" -ForegroundColor Green
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host "   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "方法 3: 直接使用 venv 中的 Python" -ForegroundColor Green
Write-Host "   .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""










