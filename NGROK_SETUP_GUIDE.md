# Ngrok 远程访问配置指南

**问题**: 通过 ngrok 访问时，前端无法连接到后端 API

---

## 🔍 问题分析

从日志可以看到：
1. ✅ CORS 配置正确（`https://aliza-blizzardy-breana.ngrok-free.dev` 已在允许列表中）
2. ❌ 前端 API baseURL 仍指向 `localhost:8000`（应该指向 ngrok 后端 URL）
3. ❌ 请求未携带 token（403 Forbidden）

---

## ✅ 解决方案

### 方案 1: 使用环境变量（推荐）

**创建或更新 `tradespro/frontend/.env.local`**:
```bash
# 后端通过 ngrok 暴露的 URL
VITE_API_BASE_URL=https://your-backend-ngrok-url.ngrok-free.dev/api
```

**或者如果后端和前端在同一 ngrok URL 但不同端口**:
```bash
# 如果前端在 https://xxx.ngrok-free.dev:3000
# 后端在 https://xxx.ngrok-free.dev:8000
VITE_API_BASE_URL=https://aliza-blizzardy-breana.ngrok-free.dev:8000/api
```

---

### 方案 2: 使用自动检测（已实现）

前端会自动检测 ngrok URL 并尝试推断后端地址：
- 如果前端在 `https://xxx.ngrok-free.dev`
- 会自动尝试 `https://xxx.ngrok-free.dev:8000/api`

**注意**: 这需要 ngrok 暴露多个端口（前端端口 3000 和后端端口 8000）

---

## 🚀 完整设置步骤

### 步骤 1: 启动后端并暴露到 ngrok

```bash
# 终端 1: 启动后端
cd tradespro/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 终端 2: 启动 ngrok 后端隧道（重要：添加 --host-header 选项）
ngrok http 8000 --host-header="localhost:8000"
# 或者使用配置文件（推荐）
ngrok http 8000 --host-header="localhost:8000" --region=us
# 复制生成的 URL，例如: https://backend-xxx.ngrok-free.dev
```

### 步骤 2: 启动前端并暴露到 ngrok

```bash
# 终端 3: 启动前端
cd tradespro/frontend
npm run dev
# 前端运行在 http://localhost:3000

# 终端 4: 启动 ngrok 前端隧道（重要：添加 --host-header 选项）
ngrok http 3000 --host-header="localhost:3000"
# 或者使用配置文件（推荐）
ngrok http 3000 --host-header="localhost:3000" --region=us
# 复制生成的 URL，例如: https://frontend-xxx.ngrok-free.dev
```

**⚠️ 重要**: `--host-header` 选项确保 ngrok 将原始 host header 传递给后端，这对于 Vite 开发服务器正确处理静态资源至关重要。

### 步骤 3: 配置前端环境变量

**创建 `tradespro/frontend/.env.local`**:
```bash
# 使用后端 ngrok URL
VITE_API_BASE_URL=https://backend-xxx.ngrok-free.dev/api
```

**或者如果使用同一 ngrok URL 的不同端口**:
```bash
# 如果使用 ngrok 的多个端口功能
VITE_API_BASE_URL=https://xxx.ngrok-free.dev:8000/api
```

### 步骤 4: 配置后端 CORS

**更新 `tradespro/backend/.env`**:
```bash
CORS_ORIGINS=http://localhost:3000,https://frontend-xxx.ngrok-free.dev,https://aliza-blizzardy-breana.ngrok-free.dev
```

### 步骤 5: 重启服务

```bash
# 重启前端（让环境变量生效）
# 按 Ctrl+C 停止，然后重新运行
cd tradespro/frontend
npm run dev

# 后端会自动重新加载（如果使用 --reload）
```

---

## 🔍 验证配置

### 1. 检查前端 API 配置

打开浏览器控制台，应该看到：
```
📡 API Configuration: {
  baseURL: "https://backend-xxx.ngrok-free.dev/api",
  env: "development",
  viteApiBaseUrl: "https://backend-xxx.ngrok-free.dev/api"
}
```

### 2. 检查后端 CORS 配置

查看后端启动日志：
```
INFO:app.main:CORS configured: 3 origin(s) allowed
INFO:app.main:CORS origins: http://localhost:3000, https://frontend-xxx.ngrok-free.dev, ...
```

### 3. 测试登录

1. 访问前端 ngrok URL: `https://frontend-xxx.ngrok-free.dev`
2. 尝试登录
3. 查看浏览器控制台：
   - ✅ 应该看到 `🔐 Request with auth:` 日志（登录后）
   - ❌ 不应该看到 `⚠️ Request without token:` 警告

---

## 🐛 常见问题

### 问题 1: 静态资源 403 Forbidden（最重要！）

**症状**: 看到类似错误：
```
GET https://xxx.ngrok-free.dev/node_modules/quasar/dist/quasar.css net::ERR_ABORTED 403 (Forbidden)
GET https://xxx.ngrok-free.dev/src/App.vue net::ERR_ABORTED 403 (Forbidden)
```

**原因**: ngrok 免费版的浏览器警告页面拦截了请求

**解决方案**:
1. 在启动 ngrok 时添加 `--host-header` 选项：
   ```bash
   ngrok http 3000 --host-header="localhost:3000"
   ```
2. 或者使用配置文件（见下面的"高级配置"部分）
3. 重启 ngrok 隧道
4. 刷新浏览器页面

---

### 问题 2: 仍显示 `localhost:8000`

**原因**: 环境变量未生效或前端未重启

**解决**:
1. 确认 `.env.local` 文件存在且格式正确
2. 重启前端开发服务器
3. 清除浏览器缓存并硬刷新（Ctrl+Shift+R）

### 问题 3: CORS 错误

**原因**: 前端 ngrok URL 未添加到后端 CORS 配置

**解决**:
1. 更新 `tradespro/backend/.env` 中的 `CORS_ORIGINS`
2. 重启后端服务

### 问题 4: 403 Forbidden（API 请求）

**原因**: Token 未正确发送或已过期

**解决**:
1. 清除浏览器 localStorage
2. 重新登录
3. 检查浏览器控制台中的 token 日志

### 问题 4: 静态资源 403 Forbidden 错误

**症状**: 所有 CSS、JS、Vue 文件返回 403 Forbidden

**原因**: ngrok 免费版的浏览器警告页面拦截了请求

**解决方案**:

#### 方案 A: 使用 --host-header 选项（推荐）

```bash
# 启动 ngrok 时添加 --host-header 选项
ngrok http 3000 --host-header="localhost:3000"
```

#### 方案 B: 配置 ngrok 配置文件

创建 `~/.ngrok2/ngrok.yml` (Mac/Linux) 或 `%USERPROFILE%\.ngrok2\ngrok.yml` (Windows):

```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN
tunnels:
  frontend:
    addr: 3000
    proto: http
    host_header: "localhost:3000"
    bind_tls: true
  backend:
    addr: 8000
    proto: http
    host_header: "localhost:8000"
    bind_tls: true
```

然后使用：
```bash
ngrok start frontend
ngrok start backend
```

#### 方案 C: 使用 ngrok 付费版

ngrok 付费版可以禁用浏览器警告页面。

#### 方案 D: 使用其他隧道服务

- **Cloudflare Tunnel** (免费，无浏览器警告)
- **localtunnel** (免费，有时有警告)
- **serveo.net** (免费，SSH 隧道)

---

### 问题 5: ngrok 免费版限制

**Ngrok 免费版限制**:
- 每次重启会生成新的 URL
- 有请求数量限制
- 需要 ngrok 账户
- 有浏览器警告页面（可以通过 --host-header 缓解）

**解决方案**:
- 使用 ngrok 付费版（固定域名，无浏览器警告）
- 或使用其他隧道服务（如 Cloudflare Tunnel, localtunnel）

---

## 📝 快速检查清单

- [ ] 后端 ngrok 隧道运行中
- [ ] 前端 ngrok 隧道运行中
- [ ] `tradespro/frontend/.env.local` 配置了 `VITE_API_BASE_URL`
- [ ] `tradespro/backend/.env` 配置了 `CORS_ORIGINS`（包含前端 ngrok URL）
- [ ] 前端已重启（环境变量生效）
- [ ] 浏览器控制台显示正确的 `baseURL`
- [ ] 可以成功登录

---

## 🔧 高级配置：使用 ngrok 配置文件

为了更稳定地运行 ngrok，建议使用配置文件：

### 创建配置文件

**Mac/Linux**: `~/.ngrok2/ngrok.yml`  
**Windows**: `%USERPROFILE%\.ngrok2\ngrok.yml`

```yaml
version: "2"
authtoken: YOUR_NGROK_AUTH_TOKEN  # 从 https://dashboard.ngrok.com/get-started/your-authtoken 获取

tunnels:
  frontend:
    addr: 3000
    proto: http
    host_header: "localhost:3000"
    bind_tls: true
    inspect: false  # 禁用 inspector（可选）
  
  backend:
    addr: 8000
    proto: http
    host_header: "localhost:8000"
    bind_tls: true
    inspect: false  # 禁用 inspector（可选）
```

### 使用配置文件启动

```bash
# 启动前端隧道
ngrok start frontend

# 启动后端隧道（在另一个终端）
ngrok start backend
```

### 获取 ngrok Auth Token

1. 访问 https://dashboard.ngrok.com/
2. 注册/登录账户
3. 在 "Your Authtoken" 部分复制 token
4. 运行: `ngrok config add-authtoken YOUR_TOKEN`
5. 将 token 添加到配置文件

---

## 📝 快速检查清单

- [ ] 后端 ngrok 隧道运行中（使用 `--host-header`）
- [ ] 前端 ngrok 隧道运行中（使用 `--host-header`）
- [ ] `tradespro/frontend/.env.local` 配置了 `VITE_API_BASE_URL`
- [ ] `tradespro/backend/.env` 配置了 `CORS_ORIGINS`（包含前端 ngrok URL）
- [ ] 前端已重启（环境变量生效）
- [ ] 浏览器控制台显示正确的 `baseURL`
- [ ] 静态资源正常加载（无 403 错误）
- [ ] 可以成功登录

---

**最后更新**: 2025-11-03  
**状态**: ✅ **配置指南已完成，包含静态资源 403 错误解决方案**

---

_如果仍有问题，请检查浏览器控制台和后端日志获取详细错误信息_

