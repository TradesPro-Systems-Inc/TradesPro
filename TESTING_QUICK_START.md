# TradesPro 测试快速入门指南

## ✅ 前提条件检查

### 已完成的步骤：
- ✅ 前端 Quasar dev 已运行
- ✅ 后端依赖已安装
- ✅ Python venv 已激活
- ✅ **数据库 PostgreSQL 在 Docker 中运行**

---

## 🐳 步骤 0: 检查 Docker 数据库（如果使用 Docker）

```powershell
# 运行 Docker 数据库检查脚本
cd tradespro\backend
.\check_docker_db.ps1
```

**或者手动检查：**

```powershell
# 检查容器是否运行
docker ps | findstr postgres

# 如果未运行，启动容器（根据您的容器名称）
docker start <容器名称>

# 测试连接
docker exec -it <容器名称> psql -U tradespro_user -d tradespro -c "SELECT version();"
```

**详细说明：** 参考 `backend/DOCKER_DATABASE_SETUP.md` 获取 Docker 数据库配置指南。

---

## 🚀 步骤 1: 启动后端服务

在 **后端目录** 下执行：

```powershell
# 1. 进入后端目录
cd tradespro\backend

# 2. 激活 venv（如果还没激活）
.\venv\Scripts\Activate.ps1

# 3. 检查环境变量（可选，如果有 .env 文件会自动加载）
# 如果没有 .env，使用默认配置即可（Docker 数据库在 localhost:5432）

# 4. 启动 FastAPI 服务
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**预期输出：**
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     TradesPro Backend Starting...
INFO:     Environment: development
INFO:     Database: Configured
INFO:     Database initialized (tables ensured)
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**注意：** 如果看到 "Database initialized (tables ensured)"，说明表已自动创建。

如果看到警告或错误，请参考 `backend/DOCKER_DATABASE_SETUP.md` 的故障排除部分。

---

## ✅ 步骤 2: 验证后端运行

打开浏览器访问：
- **健康检查**: http://localhost:8000/health
- **API 文档**: http://localhost:8000/docs

如果看到 JSON 响应或 Swagger 文档，说明后端运行正常！

---

## 🧪 步骤 3: 运行自动化测试

### 选项 A: 使用 PowerShell 测试脚本（推荐）

```powershell
# 在后端目录下
cd tradespro\backend

# 运行测试脚本
.\test_endpoints.ps1
```

这个脚本会自动测试：
1. ✅ 健康检查
2. ✅ 用户注册
3. ✅ 用户登录
4. ✅ 创建项目
5. ✅ 执行计算（V4.1 规范端点）
6. ✅ V4.1 规范检查（CalculationStep 字段完整性）
7. ✅ 签名计算包
8. ✅ 列出计算

### 选项 B: 快速测试

```powershell
# 在后端目录下
.\quick_test.ps1
```

这只是快速检查后端是否运行。

### 选项 C: 手动测试

参考 `backend/TESTING_GUIDE.md` 进行逐步手动测试。

---

## 🌐 步骤 4: 前端集成测试

### 4.1 检查前端配置

确保前端正确配置了后端 URL：

```typescript
// frontend/.env.development 或 frontend/.env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 4.2 测试前端功能

1. **登录/注册**
   - 访问前端应用（通常是 http://localhost:9000）
   - 注册一个新账号或使用现有账号登录

2. **创建项目**
   - 创建一个测试项目

3. **执行计算**
   - 在计算器页面填写输入数据
   - 点击"计算"（预览模式）
   - 点击"执行正式计算"（调用后端 `POST /api/v1/calculations`）
   - 验证返回的 UnsignedBundle

4. **查看审计轨迹**
   - 打开计算结果
   - 查看 AuditTrail 组件
   - 验证每个 CalculationStep 是否包含：
     - ✅ `inputs` 字段
     - ✅ `outputs` 字段
     - ✅ `justification` 字段

5. **签名计算包**
   - 查看未签名的计算结果
   - 点击"签名并发布"按钮
   - 调用后端 `POST /api/v1/calculations/{id}/sign`
   - 验证签名成功

---

## 🐛 常见问题排查

### 问题 1: Docker 数据库连接失败

**错误信息：**
```
psycopg.OperationalError: could not connect to server
```

**解决方案：**

1. **检查容器是否运行：**
   ```powershell
   docker ps | findstr postgres
   ```

2. **检查端口映射：**
   ```powershell
   docker port <容器名称>
   # 应该显示: 5432/tcp -> 0.0.0.0:5432
   ```

3. **检查数据库连接字符串（.env 文件）：**
   ```env
   # 确保使用 localhost（不是容器名称）
   DATABASE_URL=postgresql://tradespro_user:changeme@localhost:5432/tradespro
   ```

4. **测试容器内部连接：**
   ```powershell
   docker exec -it <容器名称> psql -U tradespro_user -d tradespro
   ```

### 问题 2: 表不存在

**错误信息：**
```
relation "users" does not exist
```

**解决方案：**

```powershell
# 检查表是否存在
docker exec -it <容器名称> psql -U tradespro_user -d tradespro -c "\dt"

# 如果表不存在，手动初始化
cd tradespro\backend

# 选项 1: 使用初始化脚本（推荐）
.\init_db.ps1

# 选项 2: 手动执行（PowerShell）
Get-Content init.sql -Raw | docker exec -i <容器名称> psql -U tradespro_user -d tradespro

# 或者让应用自动创建（如果 init_db 已实现）
# 重启后端服务即可
```

### 问题 3: 后端启动失败

**检查：**
```powershell
# 检查端口是否被占用
netstat -ano | findstr :8000

# 检查数据库连接
cd tradespro\backend
.\check_docker_db.ps1
```

### 问题 4: 计算执行失败

**可能原因：**
- Node.js 计算引擎未构建
- 计算引擎路径不正确

**解决方案：**
```powershell
# 构建计算引擎
cd tradespro\packages\cec-calculator
npm install
npm run build
```

---

## 📋 测试清单

完成以下测试以确认系统正常工作：

### 后端测试
- [ ] Docker 数据库容器运行中
- [ ] 后端服务启动成功（端口 8000）
- [ ] `/health` 端点响应正常
- [ ] 用户注册/登录成功
- [ ] 创建项目成功
- [ ] 执行计算成功（返回 UnsignedBundle）
- [ ] CalculationStep 包含 `inputs`、`outputs`、`justification`
- [ ] 签名计算包成功

### 前端测试
- [ ] 前端可以连接到后端
- [ ] 用户认证功能正常
- [ ] 可以创建项目
- [ ] 可以执行正式计算（不是预览）
- [ ] 审计轨迹正确显示
- [ ] 签名功能正常

---

## 🎯 下一步

测试通过后：
1. ✅ 验证计算结果准确性
2. ✅ 测试更多计算场景
3. ✅ 检查审计轨迹完整性
4. ✅ 验证签名功能

---

## 📞 需要帮助？

如果遇到问题：
1. 运行 `backend/check_docker_db.ps1` 检查数据库
2. 查看后端日志（控制台输出）
3. 查看浏览器控制台（F12）
4. 检查 API 文档：http://localhost:8000/docs
5. 参考 `backend/TESTING_GUIDE.md` 获取详细故障排除指南
6. 参考 `backend/DOCKER_DATABASE_SETUP.md` 获取 Docker 数据库配置指南
