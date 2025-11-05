# 🔧 快速修复指南

## 问题
```
Uncaught SyntaxError: The requested module '/src/stores/index.ts' 
does not provide an export named 'default'
```

## 🚀 快速解决 (3步骤)

### 步骤1: 停止服务器
在运行 `quasar dev` 的终端中按 **Ctrl+C**

### 步骤2: 清除缓存
```powershell
cd D:\TradesProOld\tradespro\frontend

# 清除 Quasar 缓存
Remove-Item -Recurse -Force .quasar -ErrorAction SilentlyContinue

# 清除 Vite 缓存
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# 清除 dist
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

### 步骤3: 重新启动
```powershell
quasar dev
```

---

## ✅ 如果步骤1-3不行，完全重装

```powershell
cd D:\TradesProOld\tradespro\frontend

# 删除 node_modules
Remove-Item -Recurse -Force node_modules

# 删除锁文件
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 重新安装
npm install

# 启动
quasar dev
```

---

## 🔍 检查点

### 确认文件存在
```powershell
# 检查关键文件
Test-Path src\boot\pinia.ts
Test-Path src\stores\index.ts
Test-Path src\stores\user.ts
Test-Path src\stores\projects.ts
Test-Path src\stores\calculations.ts
Test-Path src\stores\settings.ts
Test-Path src\stores\ui.ts
```

所有应该返回 `True`

### 确认 pinia 已安装
```powershell
npm list pinia pinia-plugin-persistedstate
```

应该看到：
```
tradespro-frontend@1.0.0
├── pinia@2.x.x
└── pinia-plugin-persistedstate@3.x.x
```

---

## ⚡ 一键修复脚本

复制粘贴到 PowerShell 中：

```powershell
cd D:\TradesProOld\tradespro\frontend
Write-Host "停止服务器..." -ForegroundColor Yellow
# 确保已经手动停止 (Ctrl+C)

Write-Host "清除缓存..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .quasar -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

Write-Host "重新启动..." -ForegroundColor Green
quasar dev
```

---

## 📋 如果还是报错

### 1. 检查 Node 版本
```powershell
node -v
```
应该是 v16+ 或 v18+

### 2. 检查 Quasar 版本
```powershell
quasar -v
```

### 3. 查看完整错误
打开浏览器 Console (F12)，复制完整错误信息

### 4. 检查是否有语法错误
```powershell
npm run lint
```

---

## ✅ 成功标志

启动成功后应该看到：
```
 App • Opening default browser at http://localhost:9000/

  App • Running
  - Local:   http://localhost:9000
  - Network: http://192.168.x.x:9000
```

浏览器自动打开，显示计算器页面。

---

## 💡 预防措施

以后如果再遇到类似问题：

1. 先清除缓存
2. 重启开发服务器
3. 如果还不行，删除 node_modules 重装

---

**现在开始修复吧！** 🚀













