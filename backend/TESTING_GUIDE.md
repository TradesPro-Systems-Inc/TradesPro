# TradesPro 后端测试指南

## 🚀 快速开始测试

### 步骤 1: 检查环境配置

#### 1.1 检查数据库连接（Docker PostgreSQL）

**如果使用 Docker PostgreSQL：**

```powershell
# 检查 Docker 容器是否运行
docker ps | findstr postgres

# 或者使用 docker-compose
docker-compose ps

# 如果容器未运行，启动它：
docker start tradespro_postgres
# 或
docker-compose up -d postgres

# 测试数据库连接（使用 Docker exec）
docker exec -it tradespro_postgres psql -U tradespro_user -d tradespro -c "SELECT version();"

# 检查端口映射
docker port tradespro_postgres
```

**如果使用本地 PostgreSQL：**

```powershell
# 检查 PostgreSQL 是否运行
Get-Service -Name "*postgres*"

# 或者尝试连接
psql -U tradespro_user -d tradespro -h localhost -p 5432
```

**详细说明：** 参考 `DOCKER_DATABASE_SETUP.md` 获取 Docker 数据库配置指南。

#### 1.2 设置环境变量（如需要）

创建 `.env` 文件（如果还没有）：

```bash
# backend/.env

# 数据库配置（Docker PostgreSQL - 使用 localhost）
DATABASE_URL=postgresql://tradespro_user:changeme@localhost:5432/tradespro

# 如果数据库在 Docker 网络中的其他容器，使用容器名称：
# DATABASE_URL=postgresql://tradespro_user:changeme@tradespro_postgres:5432/tradespro

SECRET_KEY=your-secret-key-here-change-in-production
ENVIRONMENT=development
PORT=8000
CORS_ORIGINS=http://localhost:9000,http://127.0.0.1:9000

# V4.1 Architecture: CI/CD 注入（开发环境使用默认值）
GIT_COMMIT=dev-local
GIT_COMMIT_SHORT=dev-local

# Bundle Signing Key
BUNDLE_SIGNING_KEY=your-signing-key-here-change-in-production
```

**注意：** Docker PostgreSQL 通常暴露在 `localhost:5432`，所以默认配置应该可以直接使用。

### 步骤 2: 初始化数据库（首次运行）

**如果使用 Docker PostgreSQL：**

```powershell
# 选项 A: 使用安全初始化脚本（推荐 - 会先检查是否已初始化）
.\init_db_safe.ps1

# 选项 B: 使用标准初始化脚本（直接执行）
.\init_db.ps1

# 选项 C: 手动执行（PowerShell 方式）
Get-Content init.sql -Raw | docker exec -i tradespro_postgres psql -U tradespro_user -d tradespro

# 注意: 如果看到 "ERROR: relation already exists" 或 "NOTICE: already exists"
# 这是正常的，说明数据库已经被初始化过了

# 选项 B: 进入容器执行
docker exec -it tradespro_postgres psql -U tradespro_user -d tradespro
# 然后复制粘贴 init.sql 内容

# 选项 C: 让应用自动创建（如果 init_db 已实现且模型已导入）
# 启动应用时会自动调用 init_db() 创建表
```

**如果使用本地 PostgreSQL：**

```powershell
# 确保在 venv 中
.\venv\Scripts\Activate.ps1

# 使用 psql 直接执行
psql -U tradespro_user -d tradespro -f init.sql

# 或让应用自动创建（如果 init_db 已实现）
# 启动应用时会自动创建表
```

**验证表是否已创建：**

```powershell
# Docker: 使用 docker exec 执行 psql 命令
docker exec -it tradespro_postgres psql -U tradespro_user -d tradespro -c "\dt"

# 或者只列出表名（更简洁）
docker exec -it tradespro_postgres psql -U tradespro_user -d tradespro -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# 或者使用检查脚本（推荐）
.\check_db_status.ps1

# 本地 PostgreSQL
psql -U tradespro_user -d tradespro -c "\dt"
```

### 步骤 3: 启动后端服务

```bash
# 确保在 venv 中
.\venv\Scripts\Activate.ps1

# 启动 FastAPI 应用
# 选项 A: 使用 uvicorn 直接启动
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 选项 B: 使用启动脚本（如果有）
# Windows:
.\start.bat

# Linux/Mac:
# ./start.sh
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

### 步骤 4: 验证后端运行

打开浏览器访问：
- **API 文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

**预期响应（/health）：**
```json
{
  "status": "healthy",
  "service": "tradespro-backend",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 🧪 测试端点

### 测试 1: 健康检查

```bash
# PowerShell
curl http://localhost:8000/health

# 或使用浏览器访问
# http://localhost:8000/health
```

### 测试 2: 用户注册（可选）

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "full_name": "Test User"
  }'
```

### 测试 3: 用户登录

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**保存 token**（后续测试需要）：
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"test123456"}'
$token = $response.access_token
Write-Host "Token: $token"
```

### 测试 4: 创建项目

```powershell
# 使用上面获取的 token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    name = "Test Project"
    description = "Test project for calculation"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/projects" -Method POST -Headers $headers -Body $body
```

**保存 project_id**（后续测试需要）：
```powershell
$project = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/projects" -Method POST -Headers $headers -Body $body
$projectId = $project.id
Write-Host "Project ID: $projectId"
```

### 测试 5: 执行计算（V4.1 规范端点）

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$calculationInputs = @{
    inputs = @{
        buildingType = "single-dwelling"
        livingArea_m2 = 155
        systemVoltage = 240
        phase = 1
        conductorMaterial = "Cu"
        terminationTempC = 75
        ambientTempC = 30
        numConductorsInRaceway = 3
        heatingLoadW = 2000
        coolingLoadW = 3000
        isHeatingAcInterlocked = $true
        hasElectricRange = $true
        electricRangeRatingKW = 15
        hasEVSE = $true
        evseRatingW = 5000
        waterHeaterType = "tankless"
        waterHeaterRatingW = 4000
        appliances = @(
            @{
                type = "other"
                name = "ww"
                watts = 3333
                isContinuous = $true
            }
        )
    }
    project_id = $projectId
} | ConvertTo-Json -Depth 10

# V4.1 Specification: POST /api/v1/calculations
$calculation = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/calculations" -Method POST -Headers $headers -Body $calculationInputs

# 检查结果
Write-Host "Calculation ID: $($calculation.id)"
Write-Host "Is Signed: $($calculation.is_signed)"
Write-Host "Steps Count: $($calculation.steps.Count)"
Write-Host "Bundle Hash: $($calculation.bundle_hash)"
```

### 测试 6: 查看计算结果详情

```powershell
# 使用上面获取的 calculation.id
$calcId = $calculation.id
$details = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/calculations/$calcId" -Method GET -Headers $headers

# 检查 CalculationStep 字段完整性（V4.1 规范）
Write-Host "`n=== V4.1 Compliance Check ==="
foreach ($step in $details.steps) {
    Write-Host "Step $($step.stepIndex): $($step.operationId)"
    Write-Host "  - Has inputs: $($step.inputs -ne $null)"
    Write-Host "  - Has outputs: $($step.outputs -ne $null)"
    Write-Host "  - Has justification: $($step.justification -ne $null -and $step.justification -ne '')"
}
```

### 测试 7: 签名计算包

```powershell
# V4.1 Specification: POST /api/v1/calculations/{id}/sign
$signedCalc = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/calculations/$calcId/sign" -Method POST -Headers $headers

Write-Host "Signed: $($signedCalc.is_signed)"
Write-Host "Signed At: $($signedCalc.signed_at)"
Write-Host "Signed By: $($signedCalc.signed_by)"
Write-Host "Signature: $($signedCalc.signature)"
```

---

## 🔍 前端集成测试

### 检查前端配置

确保前端配置了正确的后端 URL：

```typescript
// frontend/.env 或 frontend/.env.development
VITE_API_BASE_URL=http://localhost:8000/api
```

### 前端测试步骤

1. **打开前端应用**（应该已经在运行）：
   - http://localhost:9000 （或您的 Quasar 开发端口）

2. **登录测试**：
   - 使用注册的测试账号登录

3. **创建项目**：
   - 创建一个新项目

4. **执行计算**：
   - 填写计算表单
   - 点击"计算"（预览模式）
   - 点击"执行正式计算"（后端计算）
   - 检查是否返回 UnsignedBundle

5. **查看审计轨迹**：
   - 打开计算详情
   - 检查 AuditTrail 组件是否显示所有步骤
   - 验证每个步骤是否包含 `inputs`、`outputs`、`justification`

6. **签名测试**：
   - 查看未签名的计算结果
   - 点击"签名并发布"按钮
   - 验证是否成功签名

---

## 🐛 故障排除

### 问题 1: 数据库连接失败

**错误信息：**
```
psycopg.OperationalError: could not connect to server
```

**解决方案：**
1. 检查 PostgreSQL 是否运行
2. 检查 `DATABASE_URL` 环境变量
3. 确认数据库用户和密码正确

### 问题 2: 表不存在

**错误信息：**
```
relation "users" does not exist
```

**解决方案：**
```bash
# 运行初始化脚本
psql -U tradespro_user -d tradespro -f init.sql
```

### 问题 3: Node.js 计算引擎未找到

**错误信息：**
```
Failed to execute calculation engine
```

**解决方案：**
1. 检查 `packages/cec-calculator` 是否已构建
2. 运行 `npm run build` 在 `packages/cec-calculator` 目录

### 问题 4: CORS 错误

**错误信息：**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解决方案：**
1. 检查后端 `CORS_ORIGINS` 配置
2. 确保包含前端 URL（如 `http://localhost:9000`）

---

## 📝 测试清单

- [ ] 后端服务启动成功
- [ ] 数据库连接正常
- [ ] `/health` 端点响应正常
- [ ] 用户注册/登录成功
- [ ] 创建项目成功
- [ ] 执行计算（`POST /api/v1/calculations`）成功
- [ ] 返回的 CalculationStep 包含 `inputs`、`outputs`、`justification`
- [ ] 签名计算包（`POST /api/v1/calculations/{id}/sign`）成功
- [ ] 前端可以调用后端 API
- [ ] 前端显示审计轨迹正确
- [ ] 前端签名功能正常

---

## 🎯 下一步

测试通过后，您可以：
1. 查看 API 文档：http://localhost:8000/docs
2. 测试更多计算场景
3. 检查计算结果的准确性
4. 验证审计轨迹的完整性

