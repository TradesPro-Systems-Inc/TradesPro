# TradesPro Vercel 部署脚本
# 使用方法: .\deploy-vercel.ps1

$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   TradesPro Vercel 部署脚本" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Vercel CLI
Write-Host "检查 Vercel CLI..." -ForegroundColor Yellow
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI 未安装" -ForegroundColor Red
    Write-Host "正在安装..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI 已安装" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI 已安装" -ForegroundColor Green
}

Write-Host ""

# 进入前端目录
Write-Host "进入前端目录..." -ForegroundColor Yellow
Set-Location -Path ".\frontend"

# 检查 vercel.json
Write-Host "检查配置文件..." -ForegroundColor Yellow
if (-not (Test-Path "vercel.json")) {
    Write-Host "⚠️ 创建 vercel.json" -ForegroundColor Yellow
    @"
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist/spa",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
"@ | Out-File -FilePath "vercel.json" -Encoding UTF8
    Write-Host "✅ vercel.json 已创建" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "选择部署选项:" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 开发环境预览部署 (Development)" -ForegroundColor White
Write-Host "2. 生产环境部署 (Production)" -ForegroundColor Green
Write-Host "3. 查看部署列表" -ForegroundColor Yellow
Write-Host "4. 查看日志" -ForegroundColor Yellow
Write-Host "5. 退出" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "请选择 (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 开始开发环境部署..." -ForegroundColor Yellow
        Write-Host ""
        vercel
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 开始生产环境部署..." -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️ 这将部署到生产环境！" -ForegroundColor Yellow
        $confirm = Read-Host "确认继续? (y/n)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            vercel --prod
        } else {
            Write-Host "❌ 已取消" -ForegroundColor Red
            exit
        }
    }
    "3" {
        Write-Host ""
        Write-Host "📋 部署列表:" -ForegroundColor Yellow
        Write-Host ""
        vercel ls
    }
    "4" {
        Write-Host ""
        Write-Host "📋 最近的日志:" -ForegroundColor Yellow
        Write-Host ""
        vercel logs
    }
    "5" {
        Write-Host ""
        Write-Host "👋 退出" -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host ""
        Write-Host "❌ 无效的选择" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   部署完成！" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 下一步:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 访问您的部署 URL" -ForegroundColor White
Write-Host "2. 测试所有功能" -ForegroundColor White
Write-Host "3. 配置环境变量（如果需要）" -ForegroundColor White
Write-Host "4. 在 Vercel 控制台配置自定义域名（可选）" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示: 使用 'vercel --help' 查看更多命令" -ForegroundColor Cyan
Write-Host ""

# 返回根目录
Set-Location -Path ".."

