# Localhost 开发设置指南

如果您在前端本地运行（`localhost`），需要确保前端连接到本地后端，而不是 ngrok URL。

---

## ✅ 快速修复

### 步骤 1: 创建或更新 `.env.local` 文件

在 `tradespro/frontend/` 目录下创建或编辑 `.env.local` 文件：

```bash
# 使用本地后端
VITE_API_BASE_URL=http://localhost:8000/api
```

### 步骤 2: 确保后端运行在 localhost:8000

```bash
cd tradespro/backend

# 激活虚拟环境（如果有）
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# 启动后端
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 步骤 3: 重启前端服务

```bash
cd tradespro/frontend

# 停止当前服务 (Ctrl+C)

# 重新启动
npm run dev
# 或
quasar dev
```

### 步骤 4: 验证配置

1. **打开浏览器开发者工具** (F12) -> Console
2. **查看 API 配置日志**，应该看到：
   ```
   📡 API Configuration: {
     baseURL: "http://localhost:8000/api",
     ...
   }
   ```

3. **测试后端连接**:
   - 在浏览器访问: http://localhost:8000/docs
   - 应该看到 FastAPI Swagger 文档页面

---

## 🔍 检查当前配置

### 检查环境变量

打开浏览器开发者工具 (F12) -> Console，查找：
```
📡 API Configuration: {
  baseURL: "...",
  viteApiBaseUrl: "...",
  ...
}
```

**如果 `baseURL` 显示 ngrok URL**:
- ❌ 环境变量可能指向了 ngrok
- ✅ 解决方案: 创建 `.env.local` 文件覆盖它（见步骤 1）

**如果 `baseURL` 显示 `http://localhost:8000/api`**:
- ✅ 配置正确！

---

## 🚨 常见问题

### 问题 1: 仍然连接到 ngrok

**原因**: 可能有多个环境变量文件，或者浏览器缓存了旧的配置

**解决**:
1. 检查是否有 `.env`、`.env.production` 等文件也设置了 `VITE_API_BASE_URL`
2. 确保 `.env.local` 存在并且正确设置
3. **完全重启前端服务**（关闭终端，重新打开，重新运行）
4. **清除浏览器缓存**（Ctrl+Shift+Delete 或硬刷新 Ctrl+F5）

### 问题 2: 后端连接失败

**检查清单**:
- [ ] 后端服务正在运行（终端显示 "Uvicorn running"）
- [ ] 后端运行在端口 8000
- [ ] 可以访问 http://localhost:8000/docs
- [ ] 防火墙未阻止端口 8000

**测试后端**:
```powershell
# PowerShell
curl http://localhost:8000/health

# 或直接在浏览器访问
http://localhost:8000/health
```

### 问题 3: CORS 错误

如果看到 CORS 错误，确保后端 CORS 配置允许 `http://localhost:9000`（或您的前端端口）。

检查 `tradespro/backend/app/main.py` 中的 CORS 配置应该包含：
```python
CORS_ORIGINS = [
    "http://localhost:9000",
    "http://localhost:3000",
    "http://localhost:8080",
]
```

---

## 📋 完整检查清单

- [ ] `.env.local` 文件存在且包含 `VITE_API_BASE_URL=http://localhost:8000/api`
- [ ] 后端服务正在运行在 `localhost:8000`
- [ ] 前端服务已重启（环境变量更改后必须重启）
- [ ] 浏览器 Console 显示 `baseURL: "http://localhost:8000/api"`
- [ ] 可以访问 http://localhost:8000/docs
- [ ] 浏览器缓存已清除

---

## 💡 提示

### 文件优先级

Vite 环境变量优先级（从高到低）:
1. `.env.local` ← **推荐使用这个**
2. `.env.[mode].local` (如 `.env.development.local`)
3. `.env.[mode]` (如 `.env.development`)
4. `.env`

### 本地开发最佳实践

1. **使用 `.env.local`** - 这个文件不会被 Git 跟踪，适合本地配置
2. **不要提交敏感信息** - `.env.local` 应该在 `.gitignore` 中
3. **重启服务** - 修改环境变量后必须重启前端服务才能生效

---

## 🔄 切换回 ngrok（如果需要远程访问）

如果以后需要远程访问，只需更新 `.env.local`:

```bash
# 更新为 ngrok URL
VITE_API_BASE_URL=https://your-ngrok-url.ngrok-free.dev:8000/api
```

然后重启前端服务。

---

**最后更新**: 2025-11-03  
**状态**: ✅ **本地开发配置指南**






