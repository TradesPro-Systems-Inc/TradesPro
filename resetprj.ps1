# -------------------------------
# 清理并重建 Quasar/Vite 项目
# -------------------------------

Write-Host "🚀 开始清理项目..." -ForegroundColor Cyan

# 删除 node_modules
if (Test-Path node_modules) {
    Write-Host "删除 node_modules..."
    Remove-Item -Recurse -Force node_modules
} else {
    Write-Host "node_modules 不存在，跳过"
}

# 删除锁文件
$lockFiles = @("package-lock.json", "yarn.lock", "pnpm-lock.yaml")
foreach ($file in $lockFiles) {
    if (Test-Path $file) {
        Write-Host "删除 $file ..."
        Remove-Item -Force $file
    }
}

# 删除 Quasar 缓存目录
if (Test-Path ".quasar") {
    Write-Host "删除 .quasar 缓存目录..."
    Remove-Item -Recurse -Force .quasar
}

# 删除 Vite 缓存目录
if (Test-Path ".vite") {
    Write-Host "删除 .vite 缓存目录..."
    Remove-Item -Recurse -Force .vite
}

Write-Host "📦 安装依赖..." -ForegroundColor Cyan
npm install
# 或者使用 yarn / pnpm
# yarn install
# pnpm install

Write-Host "✅ 清理并重建完成！" -ForegroundColor Green
Write-Host "你现在可以运行： npx quasar dev" -ForegroundColor Yellow
