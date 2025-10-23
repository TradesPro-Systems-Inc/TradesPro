# TradesPro Fly.io 快速部署脚本
# Windows PowerShell 版本

Write-Host "🚀 TradesPro Fly.io 部署脚本" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查 flyctl 是否安装
if (!(Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly.io CLI 未安装" -ForegroundColor Red
    Write-Host "正在安装..." -ForegroundColor Yellow
    iwr https://fly.io/install.ps1 -useb | iex
    Write-Host "✅ 安装完成，请重新打开 PowerShell 并运行此脚本" -ForegroundColor Green
    exit
}

Write-Host "✅ Fly.io CLI 已安装" -ForegroundColor Green

# 检查是否已登录
Write-Host ""
Write-Host "检查登录状态..." -ForegroundColor Yellow
$authStatus = flyctl auth whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "请登录 Fly.io..." -ForegroundColor Yellow
    flyctl auth login
}

Write-Host "✅ 已登录" -ForegroundColor Green
Write-Host ""

# 询问部署选项
Write-Host "选择要部署的服务:" -ForegroundColor Cyan
Write-Host "1. 前端 (Frontend)"
Write-Host "2. 后端API (Backend)"
Write-Host "3. 计算服务 (Calculation Service)"
Write-Host "4. 全部部署"
Write-Host ""
$choice = Read-Host "请输入选择 (1-4)"

function Deploy-Frontend {
    Write-Host ""
    Write-Host "📦 部署前端..." -ForegroundColor Cyan
    Set-Location frontend
    
    if (!(Test-Path "fly.toml")) {
        Write-Host "初始化 Fly.io 应用..." -ForegroundColor Yellow
        flyctl launch --name tradespro-frontend --no-deploy
    }
    
    Write-Host "部署中..." -ForegroundColor Yellow
    flyctl deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 前端部署成功!" -ForegroundColor Green
        flyctl status
    } else {
        Write-Host "❌ 前端部署失败" -ForegroundColor Red
    }
    
    Set-Location ..
}

function Deploy-Backend {
    Write-Host ""
    Write-Host "📦 部署后端API..." -ForegroundColor Cyan
    Set-Location backend
    
    if (!(Test-Path "fly.toml")) {
        Write-Host "初始化 Fly.io 应用..." -ForegroundColor Yellow
        flyctl launch --name tradespro-api --no-deploy
        
        Write-Host ""
        Write-Host "设置环境变量..." -ForegroundColor Yellow
        $secretKey = Read-Host "请输入 SECRET_KEY (至少32字符)"
        flyctl secrets set SECRET_KEY="$secretKey"
        
        $corsOrigins = Read-Host "请输入 CORS_ORIGINS (用逗号分隔)"
        flyctl secrets set CORS_ORIGINS="$corsOrigins"
    }
    
    Write-Host "部署中..." -ForegroundColor Yellow
    flyctl deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 后端API部署成功!" -ForegroundColor Green
        flyctl status
    } else {
        Write-Host "❌ 后端API部署失败" -ForegroundColor Red
    }
    
    Set-Location ..
}

function Deploy-CalcService {
    Write-Host ""
    Write-Host "📦 部署计算服务..." -ForegroundColor Cyan
    Set-Location services\calculation-service
    
    if (!(Test-Path "fly.toml")) {
        Write-Host "初始化 Fly.io 应用..." -ForegroundColor Yellow
        flyctl launch --name tradespro-calc --no-deploy
    }
    
    Write-Host "部署中..." -ForegroundColor Yellow
    flyctl deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 计算服务部署成功!" -ForegroundColor Green
        flyctl status
    } else {
        Write-Host "❌ 计算服务部署失败" -ForegroundColor Red
    }
    
    Set-Location ..\..
}

# 执行部署
switch ($choice) {
    "1" { Deploy-Frontend }
    "2" { Deploy-Backend }
    "3" { Deploy-CalcService }
    "4" { 
        Deploy-Frontend
        Deploy-Backend
        Deploy-CalcService
    }
    default {
        Write-Host "❌ 无效选择" -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🎉 部署完成!" -ForegroundColor Green
Write-Host ""
Write-Host "查看所有应用:" -ForegroundColor Yellow
flyctl apps list
Write-Host ""
Write-Host "查看应用URL:" -ForegroundColor Yellow
Write-Host "  前端: flyctl status -a tradespro-frontend"
Write-Host "  后端: flyctl status -a tradespro-api"
Write-Host "  计算: flyctl status -a tradespro-calc"
Write-Host ""

