# TradesPro Backend API 测试脚本 (PowerShell)
# 使用方法: .\test_endpoints.ps1

$baseUrl = "http://localhost:8000"
$apiUrl = "$baseUrl/api/v1"

Write-Host "🧪 TradesPro Backend API 测试" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 测试 1: 健康检查
Write-Host "1️⃣  测试健康检查端点..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ 健康检查通过" -ForegroundColor Green
    Write-Host "   状态: $($health.status)"
    Write-Host "   版本: $($health.version)"
    Write-Host ""
} catch {
    Write-Host "❌ 健康检查失败: $_" -ForegroundColor Red
    exit 1
}

# 测试 2: 用户注册
Write-Host "2️⃣  测试用户注册..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$testPassword = "test123456"

try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        full_name = "Test User"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    Write-Host "✅ 用户注册成功" -ForegroundColor Green
    Write-Host "   邮箱: $testEmail"
    Write-Host ""
} catch {
    Write-Host "⚠️  用户注册失败（可能已存在）: $_" -ForegroundColor Yellow
    Write-Host ""
}

# 测试 3: 用户登录
Write-Host "3️⃣  测试用户登录..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.access_token
    Write-Host "✅ 登录成功" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ 登录失败: $_" -ForegroundColor Red
    Write-Host "   响应: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    exit 1
}

# 设置请求头
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 测试 4: 创建项目
Write-Host "4️⃣  测试创建项目..." -ForegroundColor Yellow
try {
    $projectBody = @{
        name = "测试项目 - $(Get-Date -Format 'HH:mm:ss')"
        description = "V4.1 规范测试项目"
    } | ConvertTo-Json

    $project = Invoke-RestMethod -Uri "$apiUrl/projects" -Method POST -Headers $headers -Body $projectBody
    $projectId = $project.id
    Write-Host "✅ 项目创建成功" -ForegroundColor Green
    Write-Host "   项目 ID: $projectId"
    Write-Host "   项目名称: $($project.name)"
    Write-Host ""
} catch {
    Write-Host "❌ 创建项目失败: $_" -ForegroundColor Red
    Write-Host "   响应: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    exit 1
}

# 测试 5: 执行计算（V4.1 规范）
Write-Host "5️⃣  测试执行计算 (V4.1 规范端点)..." -ForegroundColor Yellow
try {
    $calculationInputs = @{
        inputs = @{
            buildingType = "single-dwelling"
            livingArea_m2 = 155
            systemVoltage = 240
            phase = 1
            conductorMaterial = "Cu"
            terminationTempC = 75
            ambientTempC = 30
            numConductorsInRaceway = 3
            heatingLoadW = 2000
            coolingLoadW = 3000
            isHeatingAcInterlocked = $true
            hasElectricRange = $true
            electricRangeRatingKW = 15
            hasEVSE = $true
            evseRatingW = 5000
            waterHeaterType = "tankless"
            waterHeaterRatingW = 4000
            appliances = @(
                @{
                    type = "other"
                    name = "ww"
                    watts = 3333
                    isContinuous = $true
                }
            )
        }
        project_id = $projectId
    } | ConvertTo-Json -Depth 10

    # V4.1 Specification: POST /api/v1/calculations
    $calculation = Invoke-RestMethod -Uri "$apiUrl/calculations" -Method POST -Headers $headers -Body $calculationInputs
    $calcId = $calculation.id
    
    Write-Host "✅ 计算执行成功" -ForegroundColor Green
    Write-Host "   计算 ID: $calcId"
    Write-Host "   是否已签名: $($calculation.is_signed)"
    Write-Host "   步骤数量: $($calculation.steps.Count)"
    Write-Host "   Bundle Hash: $($calculation.bundle_hash)"
    Write-Host ""
    
    # V4.1 规范检查：验证 CalculationStep 字段
    Write-Host "   📋 V4.1 规范检查:" -ForegroundColor Cyan
    $stepsWithInputs = ($calculation.steps | Where-Object { $_.inputs -ne $null }).Count
    $stepsWithOutputs = ($calculation.steps | Where-Object { $_.outputs -ne $null }).Count
    $stepsWithJustification = ($calculation.steps | Where-Object { $_.justification -ne $null -and $_.justification -ne '' }).Count
    
    Write-Host "      包含 inputs: $stepsWithInputs/$($calculation.steps.Count)"
    Write-Host "      包含 outputs: $stepsWithOutputs/$($calculation.steps.Count)"
    Write-Host "      包含 justification: $stepsWithJustification/$($calculation.steps.Count)"
    
    if ($stepsWithInputs -eq $calculation.steps.Count -and 
        $stepsWithOutputs -eq $calculation.steps.Count -and 
        $stepsWithJustification -eq $calculation.steps.Count) {
        Write-Host "      ✅ V4.1 规范完全符合！" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  V4.1 规范部分符合" -ForegroundColor Yellow
    }
    Write-Host ""
    
} catch {
    Write-Host "❌ 计算执行失败: $_" -ForegroundColor Red
    Write-Host "   响应: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   详细错误: $responseBody" -ForegroundColor Gray
    }
    exit 1
}

# 测试 6: 获取计算详情
Write-Host "6️⃣  测试获取计算详情..." -ForegroundColor Yellow
try {
    $details = Invoke-RestMethod -Uri "$apiUrl/calculations/$calcId" -Method GET -Headers $headers
    Write-Host "✅ 获取计算详情成功" -ForegroundColor Green
    Write-Host "   计算负载: $($details.results.chosenCalculatedLoad_W) W"
    Write-Host "   服务电流: $($details.results.serviceCurrentA) A"
    Write-Host "   导体尺寸: $($details.results.conductorSize)"
    Write-Host ""
} catch {
    Write-Host "❌ 获取计算详情失败: $_" -ForegroundColor Red
}

# 测试 7: 签名计算包（V4.1 规范）
Write-Host "7️⃣  测试签名计算包 (V4.1 规范)..." -ForegroundColor Yellow
try {
    # V4.1 Specification: POST /api/v1/calculations/{id}/sign
    $signedCalc = Invoke-RestMethod -Uri "$apiUrl/calculations/$calcId/sign" -Method POST -Headers $headers
    
    Write-Host "✅ 计算包签名成功" -ForegroundColor Green
    Write-Host "   是否已签名: $($signedCalc.is_signed)"
    Write-Host "   签名时间: $($signedCalc.signed_at)"
    Write-Host "   签名人: $($signedCalc.signed_by)"
    Write-Host ""
    
    if ($signedCalc.signature) {
        $sigInfo = $signedCalc.signature | ConvertTo-Json -Compress
        Write-Host "   签名信息: $sigInfo" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ 签名失败: $_" -ForegroundColor Red
    Write-Host "   响应: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

# 测试 8: 列出计算
Write-Host "8️⃣  测试列出计算..." -ForegroundColor Yellow
try {
    $calculations = Invoke-RestMethod -Uri "$apiUrl/calculations?limit=10" -Method GET -Headers $headers
    Write-Host "✅ 列出计算成功" -ForegroundColor Green
    Write-Host "   总数量: $($calculations.total)"
    Write-Host "   返回数量: $($calculations.calculations.Count)"
    Write-Host ""
} catch {
    Write-Host "❌ 列出计算失败: $_" -ForegroundColor Red
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ 所有测试完成！" -ForegroundColor Green
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "   - 查看 API 文档: http://localhost:8000/docs"
Write-Host "   - 查看计算详情: http://localhost:8000/api/v1/calculations/$calcId"
Write-Host ""










