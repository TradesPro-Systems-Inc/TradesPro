# Cloudflare Tunnel 快速安装脚本
# 自动下载并安装 cloudflared

Write-Host "🚀 Cloudflare Tunnel 安装脚本" -ForegroundColor Cyan
Write-Host ""

# 检查是否已安装
$cloudflaredPath = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflaredPath) {
    Write-Host "✅ cloudflared 已安装: $($cloudflaredPath.Source)" -ForegroundColor Green
    Write-Host "版本信息:" -ForegroundColor Yellow
    & cloudflared --version
    exit 0
}

Write-Host "📦 开始安装 cloudflared..." -ForegroundColor Yellow

# 创建安装目录
$installDir = "C:\cloudflared"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Write-Host "✅ 创建目录: $installDir" -ForegroundColor Green
}

# 下载最新版本
Write-Host "📥 正在下载 cloudflared..." -ForegroundColor Yellow
$downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
$downloadPath = "$installDir\cloudflared.exe"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "✅ 下载完成: $downloadPath" -ForegroundColor Green
} catch {
    Write-Host "❌ 下载失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动下载:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://github.com/cloudflare/cloudflared/releases/latest" -ForegroundColor Cyan
    Write-Host "2. 下载: cloudflared-windows-amd64.exe" -ForegroundColor Cyan
    Write-Host "3. 重命名为 cloudflared.exe 并放到: $installDir" -ForegroundColor Cyan
    exit 1
}

# 添加到 PATH
Write-Host "🔧 添加到系统 PATH..." -ForegroundColor Yellow

$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installDir*") {
    try {
        [Environment]::SetEnvironmentVariable(
            "Path",
            "$currentPath;$installDir",
            "Machine"
        )
        Write-Host "✅ 已添加到系统 PATH" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  需要管理员权限才能添加到 PATH" -ForegroundColor Yellow
        Write-Host "请以管理员身份运行此脚本，或手动添加到 PATH:" -ForegroundColor Yellow
        Write-Host "   $installDir" -ForegroundColor Cyan
    }
} else {
    Write-Host "✅ PATH 中已存在 $installDir" -ForegroundColor Green
}

# 验证安装
Write-Host ""
Write-Host "🔍 验证安装..." -ForegroundColor Yellow

# 刷新 PATH（当前会话）
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

try {
    $version = & "$installDir\cloudflared.exe" --version
    Write-Host "✅ 安装成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "版本信息:" -ForegroundColor Cyan
    Write-Host $version
    Write-Host ""
    Write-Host "📝 下一步:" -ForegroundColor Yellow
    Write-Host "1. 重新打开 PowerShell（重要！）" -ForegroundColor Cyan
    Write-Host "2. 运行: cloudflared tunnel login" -ForegroundColor Cyan
    Write-Host "3. 运行: cloudflared tunnel create tradespro" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️  验证失败，但文件已下载" -ForegroundColor Yellow
    Write-Host "请重新打开 PowerShell 并运行:" -ForegroundColor Cyan
    Write-Host "   $installDir\cloudflared.exe --version" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✨ 安装完成！" -ForegroundColor Green








