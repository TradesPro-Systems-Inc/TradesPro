# 🔧 Quasar CLI 问题修复方案

## 问题描述

安装vue-i18n后，Quasar CLI无法正常运行：
```
'quasar' is not recognized as an internal or external command
```

## 根本原因

npm workspaces导致@quasar/app-vite没有正确安装到node_modules。

## 解决方案

### 方案1: 使用完整路径（推荐）✅

已更新 `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "node node_modules/@quasar/app-vite/bin/quasar dev",
    "build": "node node_modules/@quasar/app-vite/bin/quasar build"
  }
}
```

### 方案2: 安装全局Quasar CLI

```bash
npm install -g @quasar/cli
cd frontend
quasar dev
```

### 方案3: 禁用workspaces（临时）

在 `tradespro/package.json` 中注释掉workspaces:

```json
{
  // "workspaces": [
  //   "services/calculation-engine",
  //   "services/calculation-service",
  //   "frontend"
  // ]
}
```

然后在frontend目录独立安装：

```bash
cd frontend
npm install
npm run dev
```

### 方案4: 清理并重新安装

```bash
# 在根目录
cd D:\TradesProOld\tradespro

# 清理所有依赖
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
cd frontend
Remove-Item -Recurse -Force node_modules  
Remove-Item -Force package-lock.json
cd ..

# 重新安装
npm install
cd frontend
npm install --legacy-peer-deps
```

## 立即测试

由于已经更新了package.json，现在应该可以直接运行：

```bash
cd D:\TradesProOld\tradespro
npm run dev:frontend
```

或者直接在frontend目录：

```bash
cd D:\TradesProOld\tradespro\frontend
npm run dev
```

## 验证安装

检查@quasar/app-vite是否存在：

```bash
# 检查根目录
ls D:\TradesProOld\tradespro\node_modules\@quasar

# 检查frontend目录
ls D:\TradesProOld\tradespro\frontend\node_modules\@quasar
```

应该看到：
- extras/
- app-vite/ ← 这个是关键！

## 如果还是不行

尝试方案3（禁用workspaces），然后：

```bash
cd frontend
npm install @quasar/app-vite@latest @quasar/extras@latest quasar@latest vue@latest vue-router@latest --save
npm install @types/node typescript sass --save-dev
npm run dev
```

## 预期结果

运行 `npm run dev` 后应该看到：

```
 »  App • Opening default browser at http://localhost:9000/
 »  App • Compiled successfully in XXXms
```

然后浏览器自动打开 http://localhost:9000 或 http://localhost:3000

## 如果成功

i18n功能应该正常工作：
1. 顶部工具栏有语言切换器
2. 可以切换英语/法语/中文
3. 刷新页面语言保持

---

**当前状态**: package.json已更新为使用完整路径，应该可以直接运行。


