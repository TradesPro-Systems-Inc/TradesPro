# Ngrok 远程访问问题 - 快速修复指南

**常见问题**:
1. 静态资源 403 Forbidden 错误
2. API baseURL 使用占位符文本
3. Vue i18n 初始化错误

---

## ⚡ 快速解决方案

### 立即修复（1分钟）

**停止当前的 ngrok 进程，然后使用以下命令重新启动**:

```bash
# 前端 ngrok（在运行前端的终端）
ngrok http 3000 --host-header="localhost:3000"

# 后端 ngrok（在运行后端的终端）
ngrok http 8000 --host-header="localhost:8000"
```

**关键**: `--host-header` 选项告诉 ngrok 保持原始 host header，这样 Vite 开发服务器才能正确处理静态资源请求。

---

## 🔍 为什么会出现这个问题？

ngrok 免费版有一个浏览器警告页面，它会拦截所有请求。当使用默认配置时，ngrok 会修改请求的 host header，导致 Vite 开发服务器无法正确识别请求并返回 403。

`--host-header` 选项确保原始 host header (`localhost:3000`) 被传递给后端，这样 Vite 才能正确处理请求。

---

## ✅ 验证修复

重新启动 ngrok 后：

1. **刷新浏览器页面**（Ctrl+Shift+R 硬刷新）
2. **检查浏览器控制台** - 不应该再看到 403 错误
3. **检查 Network 标签** - 所有 CSS、JS 文件应该返回 200 OK

---

## 📋 完整命令示例

### 终端 1: 后端
```bash
cd tradespro/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 终端 2: 后端 ngrok
```bash
ngrok http 8000 --host-header="localhost:8000"
```

### 终端 3: 前端
```bash
cd tradespro/frontend
npm run dev
```

### 终端 4: 前端 ngrok（重要：添加 --host-header）
```bash
ngrok http 3000 --host-header="localhost:3000"
```

---

## 🎯 如果仍然有问题

1. **确认 ngrok 版本**:
   ```bash
   ngrok version
   ```
   确保使用最新版本（2.x 或 3.x）

2. **检查 ngrok 启动日志**:
   应该看到类似：
   ```
   Forwarding  https://xxx.ngrok-free.dev -> http://localhost:3000
   ```

3. **清除浏览器缓存**:
   - Chrome: Ctrl+Shift+Delete
   - 或使用无痕模式测试

4. **检查 Vite 配置**:
   确保 `quasar.config.js` 中的 `devServer.host` 设置为 `0.0.0.0`（已配置）

---

## 🔧 问题 2: API baseURL 使用占位符文本

**症状**: 控制台显示：
```
baseURL: 'https://your-backend-ngrok-url.ngrok-free.dev:8000/api'
```

**原因**: `.env.local` 文件不存在或使用了示例文本

**解决方案**:

1. **创建或更新 `tradespro/frontend/.env.local`**:
   ```bash
   # 替换为你的实际后端 ngrok URL
   VITE_API_BASE_URL=https://aliza-blizzardy-breana.ngrok-free.dev:8000/api
   ```
   
   或者如果后端在不同的 ngrok URL:
   ```bash
   VITE_API_BASE_URL=https://your-backend-ngrok-url.ngrok-free.dev/api
   ```

2. **重启前端服务**:
   ```bash
   # 按 Ctrl+C 停止，然后重新运行
   cd tradespro/frontend
   npm run dev
   ```

3. **验证配置**:
   查看控制台，应该看到：
   ```
   📡 API Configuration: {
     baseURL: "https://aliza-blizzardy-breana.ngrok-free.dev:8000/api",
     ...
     note: "✅ API URL configured"
   }
   ```

---

## 🔧 问题 3: Vue i18n 初始化错误

**症状**: 
```
Uncaught SyntaxError: Must be called at the top of a `setup` function
```

**原因**: `useI18n()` 在 `onMounted` 钩子中调用，而不是在 setup 函数顶层

**解决方案**: ✅ **已修复** - `App.vue` 已更新，`useI18n()` 现在在 setup 函数顶层调用

如果错误仍然存在：
1. 清除浏览器缓存
2. 重启前端服务
3. 硬刷新页面（Ctrl+Shift+R）

---

**最后更新**: 2025-11-03  
**状态**: ✅ **快速修复指南（包含所有常见问题）**

---

_如果问题仍然存在，请查看完整的 `NGROK_SETUP_GUIDE.md` 获取更多解决方案_

