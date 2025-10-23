# Fly.io 部署指南 - TradesPro 🚀

## 💰 成本估算：~$4/月

- 前端: $1.94/月 (256MB VM)
- 后端API: $1.94/月 (256MB VM)  
- 计算服务: 免费额度

**总计: ~$4/月** (最便宜的方案！)

---

## 📋 准备工作

### 1. 安装 Fly.io CLI

**Windows (PowerShell)**:
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**或者用 Scoop**:
```bash
scoop install flyctl
```

### 2. 登录 Fly.io

```bash
fly auth login
```

这会打开浏览器，使用GitHub登录即可。

---

## 🚀 部署步骤

### 步骤 1: 部署前端

```bash
cd d:\TradesProOld\tradespro\frontend

# 初始化 Fly.io 应用
fly launch --name tradespro-frontend --no-deploy

# 这会创建 fly.toml 配置文件
```

创建 `frontend/fly.toml`:

```toml
app = "tradespro-frontend"
primary_region = "sea"  # 或 "yyz" (Toronto) for Canada

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

部署:
```bash
fly deploy
```

获取URL:
```bash
fly status
# 您会得到类似 https://tradespro-frontend.fly.dev 的URL
```

---

### 步骤 2: 部署后端 API

```bash
cd d:\TradesProOld\tradespro\backend

fly launch --name tradespro-api --no-deploy
```

创建 `backend/fly.toml`:

```toml
app = "tradespro-api"
primary_region = "sea"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"
  ENVIRONMENT = "production"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

设置环境变量:
```bash
# 设置密钥
fly secrets set SECRET_KEY="your-super-secret-key-here"

# CORS设置
fly secrets set CORS_ORIGINS="https://tradespro-frontend.fly.dev,https://your-domain.com"
```

部署:
```bash
fly deploy
```

---

### 步骤 3: 部署计算服务

```bash
cd d:\TradesProOld\tradespro\services\calculation-service

fly launch --name tradespro-calc --no-deploy
```

创建 `services/calculation-service/fly.toml`:

```toml
app = "tradespro-calc"
primary_region = "sea"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3000"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

设置环境变量:
```bash
fly secrets set CORS_ORIGINS="https://tradespro-frontend.fly.dev,https://your-domain.com"
```

部署:
```bash
fly deploy
```

---

### 步骤 4: 添加 PostgreSQL (可选)

```bash
# 创建数据库 (最小配置: $1.94/月)
fly postgres create --name tradespro-db

# 连接到API应用
fly postgres attach --app tradespro-api tradespro-db
```

这会自动设置 `DATABASE_URL` 环境变量。

---

## 🌐 配置自定义域名

### 1. 添加域名到Fly.io

**前端**:
```bash
cd frontend
fly certs create tradespro.com
fly certs create www.tradespro.com
```

**后端API**:
```bash
cd backend
fly certs create api.tradespro.com
```

**计算服务**:
```bash
cd services/calculation-service
fly certs create calc.tradespro.com
```

### 2. 配置DNS

在您的域名注册商添加以下记录：

```
# 前端
A    @     66.241.124.124  (Fly.io Anycast IP)
A    www   66.241.124.124

# 或使用 CNAME
CNAME @     tradespro-frontend.fly.dev
CNAME www   tradespro-frontend.fly.dev

# 后端
CNAME api   tradespro-api.fly.dev
CNAME calc  tradespro-calc.fly.dev
```

---

## 📊 监控和管理

### 查看应用状态

```bash
# 查看所有应用
fly apps list

# 查看某个应用状态
fly status -a tradespro-frontend

# 查看日志
fly logs -a tradespro-frontend

# 实时日志
fly logs -a tradespro-frontend -f
```

### 扩展资源

```bash
# 增加内存到512MB
fly scale memory 512 -a tradespro-api

# 增加CPU
fly scale count 2 -a tradespro-api
```

### 查看成本

```bash
# 查看当前账单
fly dashboard billing
```

---

## 🔧 环境变量管理

### 设置环境变量

```bash
# 设置单个变量
fly secrets set KEY=VALUE -a tradespro-api

# 从文件导入
fly secrets import -a tradespro-api < .env.production
```

### 查看已设置的环境变量

```bash
fly secrets list -a tradespro-api
```

---

## 🔄 CI/CD 自动部署

### 使用 GitHub Actions

创建 `.github/workflows/deploy-fly.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./frontend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-calc-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./services/calculation-service
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

获取 API Token:
```bash
fly auth token
```

然后在 GitHub 仓库添加 Secret: `FLY_API_TOKEN`

---

## 🐛 故障排查

### 应用无法启动

```bash
# 查看详细日志
fly logs -a tradespro-frontend

# 查看应用事件
fly status -a tradespro-frontend --all

# SSH 进入容器调试
fly ssh console -a tradespro-frontend
```

### 内存不足

```bash
# 增加内存
fly scale memory 512 -a tradespro-api
```

### 端口问题

确保 Dockerfile 中的 EXPOSE 端口与 fly.toml 中的 internal_port 一致。

---

## 💡 优化建议

### 1. 使用 Fly.io 内部网络

三个服务可以通过内部网络通信，不产生外部流量费用：

```bash
# 后端调用计算服务使用内部URL
http://tradespro-calc.internal:3000
```

### 2. 启用自动扩展

```toml
[http_service]
  min_machines_running = 1
  max_machines_running = 3
  
[[services.concurrency]]
  type = "requests"
  soft_limit = 200
  hard_limit = 250
```

### 3. 添加健康检查

在 `fly.toml` 中:

```toml
[checks]
  [checks.alive]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/health"
    port = 8080
    timeout = "5s"
```

---

## 📋 完整部署检查清单

- [ ] 安装 Fly.io CLI
- [ ] 登录 Fly.io 账号
- [ ] 创建并配置所有 Dockerfile
- [ ] 部署前端应用
- [ ] 部署后端API
- [ ] 部署计算服务
- [ ] 设置所有环境变量
- [ ] 配置自定义域名
- [ ] 添加DNS记录
- [ ] 测试所有服务
- [ ] 设置监控和告警
- [ ] 配置自动部署

---

## 🆚 Fly.io vs Railway 对比

| 特性 | Fly.io | Railway |
|------|--------|---------|
| **价格** | $4/月 | $20/月 |
| **配置** | 需要Dockerfile | 自动检测 |
| **全球CDN** | ✅ 内置 | ✅ 内置 |
| **自动扩展** | ✅ | ✅ |
| **数据库** | PostgreSQL $1.94/月 | PostgreSQL $5/月 |
| **学习曲线** | 中等 | 简单 |

**结论**: 
- **预算紧张** → 选 Fly.io
- **快速上手** → 选 Railway

---

## 🚀 快速开始命令总结

```bash
# 1. 安装CLI
iwr https://fly.io/install.ps1 -useb | iex

# 2. 登录
fly auth login

# 3. 部署前端
cd frontend
fly launch --name tradespro-frontend
fly deploy

# 4. 部署后端
cd ../backend
fly launch --name tradespro-api
fly secrets set SECRET_KEY="your-secret"
fly deploy

# 5. 部署计算服务
cd ../services/calculation-service
fly launch --name tradespro-calc
fly deploy

# 6. 查看所有应用
fly apps list
```

---

## 📞 需要帮助？

- 官方文档: https://fly.io/docs/
- 社区论坛: https://community.fly.io/
- 状态页面: https://status.flyio.net/

---

**准备好开始部署了吗？** 🚀

只需运行上面的命令，您的应用就可以在几分钟内上线！

