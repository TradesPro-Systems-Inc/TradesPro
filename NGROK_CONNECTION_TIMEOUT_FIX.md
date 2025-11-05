# Ngrok 连接超时问题 - 解决方案

**问题**: 
```
ERR_CONNECTION_TIMED_OUT
POST https://aliza-blizzardy-breana.ngrok-free.dev:8000/api/v1/calculations?project_id=2
Network Error - Backend not reachable
```

---

## 🔍 问题诊断

### 步骤 1: 检查 ngrok 隧道状态

**在运行 ngrok 的终端检查**:
```bash
# ngrok 终端应该显示类似：
Forwarding  https://aliza-blizzardy-breana.ngrok-free.dev -> http://localhost:8000
Session Status: online
```

**如果显示 `Session expired` 或 `offline`**:
- ❌ ngrok 隧道已断开
- ✅ 解决方案: 重启 ngrok（见步骤 2）

### 步骤 2: 检查后端服务状态

**在运行后端的终端检查**:
```bash
# 应该看到类似：
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**如果没有运行**:
- ❌ 后端服务未启动
- ✅ 解决方案: 启动后端（见步骤 3）

### 步骤 3: 测试本地后端连接

**在浏览器中访问**:
```
http://localhost:8000/health
```

**或使用 curl**:
```powershell
curl http://localhost:8000/health
```

**如果本地连接失败**:
- ❌ 后端服务未正确启动
- ✅ 解决方案: 检查后端日志和配置

### 步骤 4: 测试 ngrok 连接

**在浏览器中访问 ngrok URL**:
```
https://aliza-blizzardy-breana.ngrok-free.dev:8000/health
```

**或者**:
```
https://aliza-blizzardy-breana.ngrok-free.dev/health
```

**注意**: ngrok 免费版 URL 会定期过期（通常几小时），需要重新启动 ngrok 获取新 URL。

---

## ✅ 解决方案

### 方案 1: 重启 ngrok 隧道（最常见）

**步骤**:

1. **停止当前 ngrok 进程**:
   - 在 ngrok 终端按 `Ctrl+C`

2. **重新启动 ngrok**:
   ```bash
   # 如果后端在端口 8000
   ngrok http 8000 --host-header="localhost:8000"
   
   # 或者使用配置文件
   ngrok http 8000 --host-header="localhost:8000" --region=us
   ```

3. **复制新的 ngrok URL**:
   ```
   Forwarding  https://NEW-URL.ngrok-free.dev -> http://localhost:8000
   ```

4. **更新前端环境变量**:
   
   创建或更新 `tradespro/frontend/.env.local`:
   ```bash
   VITE_API_BASE_URL=https://NEW-URL.ngrok-free.dev:8000/api
   ```

5. **重启前端服务**:
   ```bash
   cd tradespro/frontend
   # 停止当前服务 (Ctrl+C)
   npm run dev
   ```

6. **清除浏览器缓存并刷新页面**

---

### 方案 2: 检查后端是否运行

**启动后端**:
```bash
cd tradespro/backend

# 如果有虚拟环境，先激活
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# 启动后端
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**验证后端运行**:
- 打开 http://localhost:8000/docs
- 应该看到 FastAPI Swagger 文档页面

---

### 方案 3: 检查 URL 配置

**检查前端 API 配置**:

1. **查看当前配置**:
   打开浏览器开发者工具 (F12) -> Console，应该看到：
   ```
   📡 API Configuration: {
     baseURL: "https://aliza-blizzardy-breana.ngrok-free.dev:8000/api",
     ...
   }
   ```

2. **如果 URL 不正确，更新 `.env.local`**:
   ```bash
   # tradespro/frontend/.env.local
   VITE_API_BASE_URL=https://YOUR-NGROK-URL.ngrok-free.dev:8000/api
   ```

3. **确保 URL 格式正确**:
   - ✅ 正确: `https://xxx.ngrok-free.dev:8000/api`
   - ✅ 正确: `https://xxx.ngrok-free.dev/api` (如果没有端口)
   - ❌ 错误: `http://xxx.ngrok-free.dev:8000/api` (应该是 https)
   - ❌ 错误: `https://xxx.ngrok-free.dev:8000` (缺少 /api)

---

### 方案 4: 增加超时时间（临时解决方案）

**更新 API 配置以增加超时**:

编辑 `tradespro/frontend/src/services/api.ts`:
```typescript
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 60000, // 增加到 60 秒（默认是 0，即无超时）
});
```

**注意**: 这只是临时解决方案，根本问题是连接无法建立。

---

### 方案 5: 使用 ngrok 持久域名（推荐用于开发）

**使用 ngrok 账号和持久域名**:

1. **注册 ngrok 账号**（免费）:
   - 访问 https://dashboard.ngrok.com/signup
   - 创建账号并获取 authtoken

2. **配置 ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

3. **启动 ngrok 使用持久域名**:
   ```bash
   ngrok http 8000 --domain=your-persistent-domain.ngrok-free.dev
   ```

4. **URL 不会改变**，无需每次更新环境变量

---

### 方案 6: 检查防火墙和网络

**Windows 防火墙**:
```powershell
# 检查端口 8000 是否被阻止
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8000*"}
```

**如果端口被阻止**:
```powershell
# 允许端口 8000
New-NetFirewallRule -DisplayName "Allow Port 8000" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

---

## 🚨 紧急解决方案：使用本地开发

如果 ngrok 问题无法快速解决，可以临时使用本地开发：

### 步骤 1: 更新环境变量使用 localhost

**创建或更新 `tradespro/frontend/.env.local`**:
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

### 步骤 2: 确保后端运行在 localhost:8000

```bash
cd tradespro/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 步骤 3: 前端访问 localhost

```bash
cd tradespro/frontend
npm run dev
# 访问 http://localhost:9000 (或配置的端口)
```

**注意**: 这只适用于本地开发，不能用于远程访问。

---

## 📋 快速检查清单

- [ ] ngrok 终端显示 "Session Status: online"
- [ ] 后端服务正在运行（终端显示 "Uvicorn running"）
- [ ] 本地测试 `http://localhost:8000/health` 成功
- [ ] ngrok URL 测试 `https://xxx.ngrok-free.dev:8000/health` 成功
- [ ] 前端 `.env.local` 中的 `VITE_API_BASE_URL` 正确
- [ ] 前端服务已重启（环境变量更改后）
- [ ] 浏览器缓存已清除
- [ ] 防火墙未阻止端口 8000

---

## 🔍 调试技巧

### 查看完整请求 URL

在浏览器开发者工具 -> Network 标签:
1. 找到失败的请求（红色）
2. 查看 Request URL
3. 确认 URL 是否正确

### 查看 ngrok 请求日志

在 ngrok 终端可以看到所有请求:
```
GET  /health                     200 OK
POST /api/v1/calculations        200 OK
```

如果没有请求到达 ngrok，说明前端配置有问题。

### 测试 API 连接

**使用 curl 测试**:
```powershell
# 测试本地
curl http://localhost:8000/health

# 测试 ngrok
curl https://aliza-blizzardy-breana.ngrok-free.dev:8000/health
```

**使用 Postman 或浏览器**:
直接访问 `https://your-ngrok-url.ngrok-free.dev:8000/docs` 查看 API 文档

---

## 💡 预防措施

1. **使用 ngrok 持久域名**（需要免费账号）
2. **监控 ngrok 会话状态**（定期检查）
3. **使用脚本自动重启 ngrok**（见下）

### 自动重启 ngrok 脚本（Windows PowerShell）

**创建 `restart-ngrok.ps1`**:
```powershell
# 停止现有 ngrok 进程
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

# 等待 2 秒
Start-Sleep -Seconds 2

# 启动新的 ngrok 隧道
Start-Process ngrok -ArgumentList "http","8000","--host-header=localhost:8000"
```

**运行**:
```powershell
.\restart-ngrok.ps1
```

---

## 📞 如果问题仍然存在

如果以上方案都无法解决，请提供以下信息：

1. **ngrok 终端输出**（完整）
2. **后端终端输出**（完整）
3. **浏览器 Console 错误**（完整）
4. **Network 标签中的失败请求详情**
5. **`tradespro/frontend/.env.local` 内容**（隐藏敏感信息）
6. **本地测试结果** (`http://localhost:8000/health`)

---

**最后更新**: 2025-11-03  
**状态**: ✅ **完整解决方案文档**






