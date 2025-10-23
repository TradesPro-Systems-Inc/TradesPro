# TradesPro Fly.io 自动部署脚本
# 使用方法: .\deploy-flyio.ps1

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   TradesPro Fly.io 自动部署脚本" -ForegroundColor Cyan
Write-Host "   估计月费: $4-6" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 检查 flyctl 是否安装
Write-Host "检查 Fly.io CLI..." -ForegroundColor Yellow
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly.io CLI 未安装" -ForegroundColor Red
    Write-Host ""
    Write-Host "请运行以下命令安装:" -ForegroundColor Yellow
    Write-Host "iwr https://fly.io/install.ps1 -useb | iex" -ForegroundColor White
    Write-Host ""
    Write-Host "安装后重新运行此脚本。" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Fly.io CLI 已安装" -ForegroundColor Green

# 检查登录状态
Write-Host "检查登录状态..." -ForegroundColor Yellow
try {
    $authCheck = flyctl auth whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 未登录 Fly.io" -ForegroundColor Red
        Write-Host ""
        Write-Host "请先登录:" -ForegroundColor Yellow
        Write-Host "fly auth login" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    Write-Host "✅ 已登录 Fly.io" -ForegroundColor Green
} catch {
    Write-Host "❌ 请先登录: fly auth login" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   部署选项" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 部署所有服务 (前端 + 后端 + 计算)" -ForegroundColor White
Write-Host "2. 仅部署前端" -ForegroundColor White
Write-Host "3. 仅部署后端 API" -ForegroundColor White
Write-Host "4. 仅部署计算服务" -ForegroundColor White
Write-Host "5. 查看现有应用状态" -ForegroundColor Yellow
Write-Host "6. 查看日志" -ForegroundColor Yellow
Write-Host "7. 删除所有应用" -ForegroundColor Red
Write-Host "8. 退出" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "请选择 (1-8)"

Write-Host ""

# 定义应用名称
$FRONTEND_APP = "tradespro-frontend"
$BACKEND_APP = "tradespro-api"
$CALC_APP = "tradespro-calc"
$REGION = "sea"  # Seattle, 可以改为 "yyz" (Toronto) 或其他

# 生成随机 SECRET_KEY
function Generate-SecretKey {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# 部署前端
function Deploy-Frontend {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   部署前端到 Fly.io" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Set-Location -Path ".\frontend"
    
    # 检查是否已存在应用
    Write-Host "检查应用是否存在..." -ForegroundColor Yellow
    $appExists = flyctl apps list 2>&1 | Select-String -Pattern $FRONTEND_APP -Quiet
    
    if (-not $appExists) {
        Write-Host "创建新应用: $FRONTEND_APP" -ForegroundColor Yellow
        flyctl launch --name $FRONTEND_APP --region $REGION --no-deploy --copy-config --yes
    } else {
        Write-Host "应用已存在: $FRONTEND_APP" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "部署前端..." -ForegroundColor Yellow
    flyctl deploy --remote-only
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 前端部署成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "前端 URL: https://$FRONTEND_APP.fly.dev" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ 前端部署失败" -ForegroundColor Red
    }
    
    Set-Location -Path ".."
}

# 部署后端
function Deploy-Backend {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   部署后端 API 到 Fly.io" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Set-Location -Path ".\backend"
    
    # 检查是否已存在应用
    Write-Host "检查应用是否存在..." -ForegroundColor Yellow
    $appExists = flyctl apps list 2>&1 | Select-String -Pattern $BACKEND_APP -Quiet
    
    if (-not $appExists) {
        Write-Host "创建新应用: $BACKEND_APP" -ForegroundColor Yellow
        flyctl launch --name $BACKEND_APP --region $REGION --no-deploy --copy-config --yes
        
        # 设置 secrets
        Write-Host ""
        Write-Host "设置后端 secrets..." -ForegroundColor Yellow
        $secretKey = Generate-SecretKey
        
        flyctl secrets set `
            SECRET_KEY="$secretKey" `
            ALGORITHM="HS256" `
            ACCESS_TOKEN_EXPIRE_MINUTES="30" `
            CORS_ORIGINS="https://$FRONTEND_APP.fly.dev" `
            ENVIRONMENT="production" `
            DEBUG="false" `
            -a $BACKEND_APP
    } else {
        Write-Host "应用已存在: $BACKEND_APP" -ForegroundColor Green
        Write-Host "⚠️ 如需更新 CORS_ORIGINS，请手动运行:" -ForegroundColor Yellow
        Write-Host "flyctl secrets set CORS_ORIGINS='https://$FRONTEND_APP.fly.dev' -a $BACKEND_APP" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "部署后端..." -ForegroundColor Yellow
    flyctl deploy --remote-only
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 后端部署成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "后端 URL: https://$BACKEND_APP.fly.dev" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ 后端部署失败" -ForegroundColor Red
    }
    
    Set-Location -Path ".."
}

# 部署计算服务
function Deploy-CalcService {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   部署计算服务到 Fly.io" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Set-Location -Path ".\services\calculation-service"
    
    # 检查是否已存在应用
    Write-Host "检查应用是否存在..." -ForegroundColor Yellow
    $appExists = flyctl apps list 2>&1 | Select-String -Pattern $CALC_APP -Quiet
    
    if (-not $appExists) {
        Write-Host "创建新应用: $CALC_APP" -ForegroundColor Yellow
        flyctl launch --name $CALC_APP --region $REGION --no-deploy --copy-config --yes
        
        # 设置环境变量
        Write-Host ""
        Write-Host "设置环境变量..." -ForegroundColor Yellow
        flyctl secrets set `
            NODE_ENV="production" `
            CORS_ORIGINS="https://$FRONTEND_APP.fly.dev" `
            -a $CALC_APP
    } else {
        Write-Host "应用已存在: $CALC_APP" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "部署计算服务..." -ForegroundColor Yellow
    flyctl deploy --remote-only
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 计算服务部署成功！" -ForegroundColor Green
        Write-Host ""
        Write-Host "计算服务 URL: https://$CALC_APP.fly.dev" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ 计算服务部署失败" -ForegroundColor Red
    }
    
    Set-Location -Path "..\..\"
}

# 查看应用状态
function Show-Status {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   应用状态" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "所有应用:" -ForegroundColor Yellow
    flyctl apps list
    
    Write-Host ""
    Write-Host "前端状态:" -ForegroundColor Yellow
    flyctl status -a $FRONTEND_APP 2>&1
    
    Write-Host ""
    Write-Host "后端状态:" -ForegroundColor Yellow
    flyctl status -a $BACKEND_APP 2>&1
    
    Write-Host ""
    Write-Host "计算服务状态:" -ForegroundColor Yellow
    flyctl status -a $CALC_APP 2>&1
}

# 查看日志
function Show-Logs {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   查看日志" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. 前端日志" -ForegroundColor White
    Write-Host "2. 后端日志" -ForegroundColor White
    Write-Host "3. 计算服务日志" -ForegroundColor White
    Write-Host "4. 所有日志" -ForegroundColor White
    Write-Host ""
    
    $logChoice = Read-Host "选择 (1-4)"
    
    Write-Host ""
    
    switch ($logChoice) {
        "1" {
            Write-Host "前端日志 (Ctrl+C 退出):" -ForegroundColor Yellow
            flyctl logs -a $FRONTEND_APP
        }
        "2" {
            Write-Host "后端日志 (Ctrl+C 退出):" -ForegroundColor Yellow
            flyctl logs -a $BACKEND_APP
        }
        "3" {
            Write-Host "计算服务日志 (Ctrl+C 退出):" -ForegroundColor Yellow
            flyctl logs -a $CALC_APP
        }
        "4" {
            Write-Host "所有日志 (Ctrl+C 退出):" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "--- 前端 ---" -ForegroundColor Cyan
            flyctl logs -a $FRONTEND_APP --lines 20
            Write-Host ""
            Write-Host "--- 后端 ---" -ForegroundColor Cyan
            flyctl logs -a $BACKEND_APP --lines 20
            Write-Host ""
            Write-Host "--- 计算服务 ---" -ForegroundColor Cyan
            flyctl logs -a $CALC_APP --lines 20
        }
    }
}

# 删除所有应用
function Delete-AllApps {
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "   ⚠️ 删除所有应用" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "这将删除以下应用:" -ForegroundColor Yellow
    Write-Host "- $FRONTEND_APP" -ForegroundColor White
    Write-Host "- $BACKEND_APP" -ForegroundColor White
    Write-Host "- $CALC_APP" -ForegroundColor White
    Write-Host ""
    
    $confirm = Read-Host "确认删除? 输入 'DELETE' 确认"
    
    if ($confirm -eq "DELETE") {
        Write-Host ""
        Write-Host "删除应用..." -ForegroundColor Yellow
        
        flyctl apps destroy $FRONTEND_APP --yes 2>&1
        flyctl apps destroy $BACKEND_APP --yes 2>&1
        flyctl apps destroy $CALC_APP --yes 2>&1
        
        Write-Host ""
        Write-Host "✅ 所有应用已删除" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ 已取消" -ForegroundColor Yellow
    }
}

# 主逻辑
switch ($choice) {
    "1" {
        Write-Host "🚀 开始部署所有服务..." -ForegroundColor Green
        Write-Host ""
        
        Deploy-Frontend
        Write-Host ""
        
        Deploy-Backend
        Write-Host ""
        
        Deploy-CalcService
        Write-Host ""
        
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host "   ✅ 所有服务部署完成！" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "您的应用 URLs:" -ForegroundColor Yellow
        Write-Host "前端:     https://$FRONTEND_APP.fly.dev" -ForegroundColor Cyan
        Write-Host "后端:     https://$BACKEND_APP.fly.dev" -ForegroundColor Cyan
        Write-Host "计算服务: https://$CALC_APP.fly.dev" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💰 预计月费: $4-6" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 下一步:" -ForegroundColor Yellow
        Write-Host "1. 访问前端 URL 测试应用" -ForegroundColor White
        Write-Host "2. 配置自定义域名（可选）" -ForegroundColor White
        Write-Host "3. 设置预算提醒: fly dashboard billing" -ForegroundColor White
        Write-Host ""
    }
    "2" {
        Deploy-Frontend
    }
    "3" {
        Deploy-Backend
    }
    "4" {
        Deploy-CalcService
    }
    "5" {
        Show-Status
    }
    "6" {
        Show-Logs
    }
    "7" {
        Delete-AllApps
    }
    "8" {
        Write-Host "👋 退出" -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "❌ 无效的选择" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   完成！" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "- 查看仪表板: fly dashboard" -ForegroundColor White
Write-Host "- 查看日志: fly logs -a $FRONTEND_APP" -ForegroundColor White
Write-Host "- 查看状态: fly status -a $FRONTEND_APP" -ForegroundColor White
Write-Host "- 查看费用: fly dashboard billing" -ForegroundColor White
Write-Host ""

