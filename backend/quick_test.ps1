# TradesPro Backend 快速测试脚本
# 使用方法: .\quick_test.ps1

Write-Host "🧪 TradesPro Backend 快速测试" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 测试 1: 健康检查
Write-Host "1️⃣  测试健康检查..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -ErrorAction Stop
    Write-Host "✅ 健康检查通过" -ForegroundColor Green
    Write-Host "   状态: $($health.status)"
    Write-Host "   版本: $($health.version)"
    Write-Host "   环境: $($health.environment)"
    Write-Host ""
} catch {
    Write-Host "❌ 后端服务未运行或无法访问" -ForegroundColor Red
    Write-Host "   错误: $_" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 请先启动后端服务：" -ForegroundColor Yellow
    Write-Host "   cd tradespro\backend" -ForegroundColor Gray
    Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Gray
    Write-Host "   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# 测试 2: 检查 API 文档
Write-Host "2️⃣  检查 API 文档..." -ForegroundColor Yellow
Write-Host "   📖 API 文档: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   📄 ReDoc: http://localhost:8000/redoc" -ForegroundColor Cyan
Write-Host ""

# 测试 3: 用户注册（可选）
Write-Host "3️⃣  测试用户注册（可选）..." -ForegroundColor Yellow
Write-Host "   如需测试完整流程，请运行: .\test_endpoints.ps1" -ForegroundColor Gray
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ 快速测试完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步：" -ForegroundColor Yellow
Write-Host "   1. 运行完整测试: .\test_endpoints.ps1" -ForegroundColor Gray
Write-Host "   2. 查看测试指南: .\TESTING_GUIDE.md" -ForegroundColor Gray
Write-Host "   3. 在前端测试集成" -ForegroundColor Gray
Write-Host ""










