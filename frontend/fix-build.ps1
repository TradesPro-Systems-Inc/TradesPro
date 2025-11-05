# TradesPro Frontend - Build Fix Script
# 修复 Quasar 编译错误

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   TradesPro Frontend 修复脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 确保在正确的目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "当前目录: $PWD" -ForegroundColor Yellow
Write-Host ""

# 步骤1: 清除所有缓存
Write-Host "步骤1: 清除缓存和编译文件..." -ForegroundColor Green
$filesToRemove = @(".quasar", "dist", "node_modules\.vite", "node_modules\.cache")
foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Write-Host "  删除: $file" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $file -ErrorAction SilentlyContinue
    } else {
        Write-Host "  跳过: $file (不存在)" -ForegroundColor Gray
    }
}
Write-Host "✓ 缓存清除完成" -ForegroundColor Green
Write-Host ""

# 步骤2: 检查关键文件
Write-Host "步骤2: 检查关键文件..." -ForegroundColor Green
$requiredFiles = @(
    "src\boot\pinia.ts",
    "src\boot\i18n.ts",
    "src\stores\index.ts",
    "src\stores\user.ts",
    "src\stores\projects.ts",
    "src\stores\calculations.ts",
    "src\stores\settings.ts",
    "src\stores\ui.ts",
    "src\stores\types.ts"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (缺失)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "错误: 有文件缺失，请检查！" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 所有文件存在" -ForegroundColor Green
Write-Host ""

# 步骤3: 检查 package.json 依赖
Write-Host "步骤3: 检查依赖..." -ForegroundColor Green
$packageJson = Get-Content package.json | ConvertFrom-Json
$requiredDeps = @("pinia", "pinia-plugin-persistedstate", "quasar", "vue")
foreach ($dep in $requiredDeps) {
    if ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
        $version = $packageJson.dependencies.$dep
        Write-Host "  ✓ $dep $version" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $dep (缺失)" -ForegroundColor Red
    }
}
Write-Host ""

# 步骤4: 重新安装 node_modules (可选)
Write-Host "步骤4: 是否需要重新安装 node_modules? (y/n)" -ForegroundColor Yellow
$response = Read-Host "  输入选择"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "  删除 node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Remove-Item package-lock.json -ErrorAction SilentlyContinue
    
    Write-Host "  运行 npm install..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 安装完成" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 安装失败" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  跳过重新安装" -ForegroundColor Gray
}
Write-Host ""

# 步骤5: 启动开发服务器
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "修复完成！准备启动开发服务器..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "运行命令: quasar dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键启动，或 Ctrl+C 退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "启动中..." -ForegroundColor Green
quasar dev













