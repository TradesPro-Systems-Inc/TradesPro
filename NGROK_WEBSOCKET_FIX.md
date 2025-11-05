# Ngrok WebSocket 和 429 错误 - 解决方案

**问题**: 
1. Vite HMR WebSocket 连接失败
2. ngrok 免费版 429 Too Many Requests 限制

---

## 🔍 问题分析

### 问题 1: WebSocket HMR 连接失败

**症状**:
```
WebSocket connection to 'wss://aliza-blizzardy-breana.ngrok-free.dev/?token=...' failed
[vite] failed to connect to websocket
```

**原因**: 
- Vite 的 HMR (Hot Module Replacement) 需要 WebSocket 连接
- ngrok 免费版对 WebSocket 支持有限
- 浏览器在 ngrok URL 上，但 WebSocket 尝试连接到 localhost

**影响**: 
- 开发时热重载不工作
- 需要手动刷新页面（F5）才能看到更改
- **不影响生产环境** - 这只是开发时的便利功能

---

### 问题 2: 429 Too Many Requests

**症状**:
```
GET https://xxx.ngrok-free.dev/node_modules/.../font.woff net::ERR_ABORTED 429 (Too Many Requests)
```

**原因**: 
- ngrok 免费版有请求速率限制
- 加载多个静态资源（字体、CSS、JS）会快速达到限制
- 这是 ngrok 免费版的正常限制

**影响**: 
- 某些资源可能无法加载
- 刷新页面后通常可以解决（限制会重置）

---

## ✅ 解决方案

### 方案 1: 禁用 HMR（推荐用于 ngrok 免费版）

**创建或更新 `tradespro/frontend/.env.local`**:
```bash
# 禁用 HMR WebSocket（避免 ngrok WebSocket 错误）
DISABLE_HMR=true
```

**然后重启前端服务**:
```bash
cd tradespro/frontend
npm run dev
```

**效果**: 
- ✅ 不再有 WebSocket 连接错误
- ⚠️ 需要手动刷新页面（F5）才能看到更改
- ✅ 完全不影响功能

---

### 方案 2: 配置 Vite HMR 使用 ngrok URL

如果必须使用 HMR，可以尝试配置：

**更新 `tradespro/frontend/.env.local`**:
```bash
# 配置 ngrok HMR（可能不工作，取决于 ngrok 配置）
NGROK_HOST=aliza-blizzardy-breana.ngrok-free.dev
NGROK_PORT=443
```

**然后重启前端服务**

**注意**: 这个方案可能仍然不工作，因为 ngrok 免费版对 WebSocket 支持有限。

---

### 方案 3: 使用 ngrok 付费版

ngrok 付费版支持更好的 WebSocket 连接，但需要付费。

---

## 🎯 针对 429 错误的解决方案

### 方案 A: 等待并重试（最简单）

429 错误是临时的，通常：
1. 等待几秒钟
2. 刷新页面（F5）
3. 资源应该可以正常加载

### 方案 B: 减少静态资源请求

**优化建议**:
- 使用生产构建（`npm run build`）而不是开发模式
- 生产构建会合并和压缩资源，减少请求数量
- 但这样就没有热重载了

### 方案 C: 使用 ngrok 付费版

付费版有更高的请求限制。

---

## 📝 推荐配置（ngrok 免费版）

### `.env.local` 配置

```bash
# API Base URL
VITE_API_BASE_URL=https://aliza-blizzardy-breana.ngrok-free.dev:8000/api

# 禁用 HMR（避免 WebSocket 错误）
DISABLE_HMR=true
```

### 开发工作流

1. **启动服务**:
   ```bash
   # 后端
   cd tradespro/backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # 后端 ngrok
   ngrok http 8000 --host-header="localhost:8000"
   
   # 前端
   cd tradespro/frontend
   npm run dev
   
   # 前端 ngrok
   ngrok http 3000 --host-header="localhost:3000"
   ```

2. **开发时**:
   - 修改代码后，按 **F5** 刷新页面查看更改
   - 热重载不工作，但功能完全正常

3. **如果遇到 429 错误**:
   - 等待几秒
   - 刷新页面
   - 或使用本地开发（不使用 ngrok）

---

## ✅ 已实施的修复

1. ✅ **优化项目获取** - `projectsStore.fetchProjects()` 现在会检查用户认证状态
2. ✅ **优化 CalculatorPage** - 只在用户已认证时获取项目
3. ✅ **配置 HMR 选项** - 支持通过环境变量禁用 HMR

---

## 🎯 总结

**对于 ngrok 免费版**:
- ✅ 功能完全正常（只是开发体验略有影响）
- ⚠️ HMR 不工作（需要手动刷新）
- ⚠️ 偶尔有 429 错误（等待并刷新即可）

**最佳实践**:
- 本地开发时使用 `localhost`（HMR 工作正常）
- 远程访问/演示时使用 ngrok（禁用 HMR）
- 生产环境不受影响

---

**最后更新**: 2025-11-03  
**状态**: ✅ **解决方案已实施**

---

_这些是 ngrok 免费版的正常限制，不影响应用的核心功能_








