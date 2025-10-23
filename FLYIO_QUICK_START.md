# 🚀 Fly.io 快速部署指南 - 10分钟上线

**最佳性价比方案**: $4-6/月，永不休眠，全球CDN

---

## ⚡ 超快速部署（5步）

### 1️⃣ 安装 Fly.io CLI (1分钟)

**Windows PowerShell**:
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**验证安装**:
```bash
flyctl version
```

---

### 2️⃣ 登录并添加信用卡 (2分钟)

```bash
# 登录（会打开浏览器）
fly auth login

# 添加信用卡（必需，但有免费额度）
fly dashboard billing
```

⚠️ **重要**: Fly.io 需要信用卡验证，但前 $5/月是免费的。

💰 **预计费用**: $4-6/月（扣除免费额度后）

---

### 3️⃣ 一键部署所有服务 (5分钟)

我们提供了自动化脚本！

```powershell
cd d:\TradesProOld\tradespro
.\deploy-flyio.ps1
```

**脚本会自动**:
- ✅ 检查 flyctl 是否安装
- ✅ 部署前端
- ✅ 部署后端
- ✅ 部署计算服务
- ✅ 配置环境变量
- ✅ 设置 secrets
- ✅ 显示所有 URLs

---

### 4️⃣ 测试应用 (1分钟)

脚本完成后会显示 URLs：

```
✅ 前端: https://tradespro-frontend.fly.dev
✅ 后端: https://tradespro-api.fly.dev
✅ 计算: https://tradespro-calc.fly.dev
```

访问前端 URL 测试所有功能。

---

### 5️⃣ 监控和管理 (1分钟)

```bash
# 查看所有应用
fly apps list

# 查看日志
fly logs -a tradespro-frontend

# 查看状态
fly status -a tradespro-api

# 访问仪表板
fly dashboard
```

**🎉 完成！您的应用已上线！**

---

## 💰 详细成本分析

### 免费额度（每月）
- ✅ 3 个共享 CPU VMs (256MB) = $5.04
- ✅ 160GB 出站流量
- ✅ 自动 HTTPS 证书

### 实际配置

| 服务 | 配置 | 月费 | 免费后 |
|-----|-----|-----|--------|
| 前端 | 256MB VM | $1.94 | $0 |
| 后端 | 256MB VM | $1.94 | $0 |
| 计算服务 | 256MB VM | $1.94 | $1.94 |
| 额外资源 | 如需升级 | ~$2 | ~$2 |
| **总计** | | **$5.82** | **~$4** |

💡 **实际支付**: 约 $4/月（扣除 $5 免费额度）

---

## 🆚 与免费方案对比

### 免费方案（Vercel + Render）
- ✅ 完全免费
- ⚠️ 后端15分钟休眠
- ⚠️ 唤醒需30秒
- ❌ 不适合生产

### Fly.io 方案 ($4/月)
- ✅ 永不休眠
- ✅ 全球 CDN
- ✅ 快速响应
- ✅ 适合生产环境
- ✅ 只需 $4/月

**结论**: 如果预算允许，强烈推荐 Fly.io！

---

## 📋 手动部署（如果不用脚本）

### 部署前端

```bash
cd d:\TradesProOld\tradespro\frontend

# 1. 创建应用
fly launch --name tradespro-frontend --region sea --no-deploy

# 2. 部署
fly deploy

# 3. 获取 URL
fly status -a tradespro-frontend
```

### 部署后端

```bash
cd d:\TradesProOld\tradespro\backend

# 1. 创建应用
fly launch --name tradespro-api --region sea --no-deploy

# 2. 设置 secrets
fly secrets set SECRET_KEY="your-super-secret-key-here" -a tradespro-api
fly secrets set CORS_ORIGINS="https://tradespro-frontend.fly.dev" -a tradespro-api

# 3. 部署
fly deploy

# 4. 获取 URL
fly status -a tradespro-api
```

### 部署计算服务

```bash
cd d:\TradesProOld\tradespro\services\calculation-service

# 1. 创建应用
fly launch --name tradespro-calc --region sea --no-deploy

# 2. 设置环境变量
fly secrets set CORS_ORIGINS="https://tradespro-frontend.fly.dev" -a tradespro-calc

# 3. 部署
fly deploy

# 4. 获取 URL
fly status -a tradespro-calc
```

---

## 🔧 配置环境变量

### 前端环境变量

```bash
cd frontend

# 方法1: 使用 fly.toml
# 编辑 fly.toml，添加:
[env]
  VITE_API_BASE_URL = "https://tradespro-api.fly.dev"
  VITE_CALCULATION_SERVICE_URL = "https://tradespro-calc.fly.dev"

# 重新部署
fly deploy
```

### 后端 Secrets

```bash
cd backend

fly secrets set \
  SECRET_KEY="your-super-secret-key-at-least-32-chars" \
  ALGORITHM="HS256" \
  ACCESS_TOKEN_EXPIRE_MINUTES="30" \
  CORS_ORIGINS="https://tradespro-frontend.fly.dev" \
  ENVIRONMENT="production" \
  DEBUG="false" \
  -a tradespro-api
```

### 计算服务环境变量

```bash
cd services/calculation-service

fly secrets set \
  NODE_ENV="production" \
  CORS_ORIGINS="https://tradespro-frontend.fly.dev" \
  -a tradespro-calc
```

---

## 📊 监控和管理

### 查看日志

```bash
# 实时日志
fly logs -a tradespro-frontend

# 后端日志
fly logs -a tradespro-api

# 计算服务日志
fly logs -a tradespro-calc
```

### 查看状态

```bash
# 查看所有应用
fly apps list

# 查看特定应用状态
fly status -a tradespro-frontend

# 查看资源使用
fly vm status -a tradespro-api
```

### 访问仪表板

```bash
# 打开 Fly.io 仪表板
fly dashboard

# 打开特定应用仪表板
fly dashboard tradespro-frontend
```

---

## 🔄 更新应用

```bash
# 1. 提交代码
git add .
git commit -m "Update"
git push origin main

# 2. 重新部署前端
cd frontend
fly deploy

# 3. 重新部署后端
cd ../backend
fly deploy

# 4. 重新部署计算服务
cd ../services/calculation-service
fly deploy
```

**或使用脚本**:
```powershell
.\deploy-flyio.ps1
```

---

## 🌐 配置自定义域名

### 添加域名

```bash
# 为前端添加域名
fly certs add tradespro.com -a tradespro-frontend
fly certs add www.tradespro.com -a tradespro-frontend

# 为后端添加域名
fly certs add api.tradespro.com -a tradespro-api

# 为计算服务添加域名
fly certs add calc.tradespro.com -a tradespro-calc
```

### 配置 DNS

在您的域名提供商添加以下记录：

```
# 前端
Type: CNAME
Name: @
Value: tradespro-frontend.fly.dev

Type: CNAME
Name: www
Value: tradespro-frontend.fly.dev

# 后端
Type: CNAME
Name: api
Value: tradespro-api.fly.dev

# 计算服务
Type: CNAME
Name: calc
Value: tradespro-calc.fly.dev
```

### 验证证书

```bash
fly certs show tradespro.com -a tradespro-frontend
```

---

## 🚀 性能优化

### 调整 VM 大小（如果需要）

```bash
# 升级到 512MB (更好的性能)
fly scale memory 512 -a tradespro-api

# 查看当前配置
fly scale show -a tradespro-api
```

💰 **成本**: 512MB VM = $3.88/月

### 多区域部署（可选）

```bash
# 添加更多区域（如东海岸）
fly regions add yyz -a tradespro-frontend

# 查看所有区域
fly regions list
```

### 自动扩展（高级）

编辑 `fly.toml`:
```toml
[http_service]
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 3  # 根据负载自动扩展
```

---

## 🐛 故障排除

### 问题1: 部署失败

**查看日志**:
```bash
fly logs -a tradespro-frontend
```

**重新部署**:
```bash
fly deploy --verbose
```

### 问题2: 应用无法访问

**检查状态**:
```bash
fly status -a tradespro-api
```

**检查健康检查**:
```bash
fly checks list -a tradespro-api
```

### 问题3: CORS 错误

**更新 secrets**:
```bash
fly secrets set CORS_ORIGINS="https://tradespro-frontend.fly.dev,https://tradespro.com" -a tradespro-api
```

### 问题4: 内存不足

**升级 VM**:
```bash
fly scale memory 512 -a tradespro-api
```

---

## 💡 高级功能

### 连接 PostgreSQL 数据库

```bash
# 创建数据库（额外费用）
fly postgres create --name tradespro-db

# 连接到应用
fly postgres attach tradespro-db -a tradespro-api

# 获取连接字符串
fly postgres connect -a tradespro-db
```

💰 **成本**: 小型数据库 ~$2/月起

### 设置 Redis 缓存

```bash
# 创建 Redis 实例
fly redis create --name tradespro-redis

# 连接到应用
fly redis attach tradespro-redis -a tradespro-api
```

### 配置 CI/CD

创建 `.github/workflows/fly-deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flyctl
        uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy Frontend
        run: |
          cd frontend
          flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Deploy Backend
        run: |
          cd backend
          flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## 📈 成本控制

### 监控使用量

```bash
# 查看当前月费用
fly dashboard billing

# 查看资源使用
fly vm status -a tradespro-api
```

### 优化成本

1. **使用共享 CPU**: 最便宜（已配置）
2. **最小内存**: 256MB 足够（已配置）
3. **单区域**: 只在一个区域运行
4. **自动暂停**: 低流量时自动暂停

### 设置预算提醒

在 Fly.io 仪表板:
1. Settings → Billing
2. Set spending limit: $10/月
3. Email notifications: 启用

---

## ✅ 部署检查清单

**准备阶段**:
- [ ] Fly.io CLI 已安装
- [ ] 已登录 Fly.io
- [ ] 已添加信用卡
- [ ] 代码已推送到 GitHub

**部署阶段**:
- [ ] 前端已部署
- [ ] 后端已部署
- [ ] 计算服务已部署
- [ ] 所有 secrets 已设置
- [ ] 环境变量已配置

**测试阶段**:
- [ ] 前端可访问
- [ ] 后端 API 响应
- [ ] 计算功能正常
- [ ] 多语言切换正常
- [ ] PDF 生成正常

**监控阶段**:
- [ ] 已查看日志
- [ ] 已设置预算提醒
- [ ] 已监控性能

---

## 🎯 推荐配置

### 小型项目（$4/月）
```
前端: 256MB VM
后端: 256MB VM
计算: 256MB VM
区域: 1个
```

### 中型项目（$8/月）
```
前端: 512MB VM
后端: 512MB VM
计算: 256MB VM
区域: 2个
```

### 大型项目（$15/月）
```
前端: 512MB VM × 2
后端: 1GB VM
计算: 512MB VM
数据库: PostgreSQL
区域: 3个
```

---

## 🆘 获取帮助

### 文档
- **Fly.io 文档**: https://fly.io/docs/
- **快速开始**: https://fly.io/docs/getting-started/
- **定价**: https://fly.io/docs/about/pricing/

### 社区
- **Community Forum**: https://community.fly.io/
- **Discord**: https://fly.io/discord
- **Twitter**: @flydotio

### 支持
- **Email**: support@fly.io
- **在仪表板提交工单**

---

## 📚 相关文档

- **完整指南**: `FLY_IO_DEPLOYMENT.md`
- **免费方案**: `QUICK_START_FREE.md`
- **方案对比**: `HOSTING_COMPARISON.md`

---

## 🎉 开始部署！

### 最快方式（使用脚本）

```powershell
# 1. 安装 Fly.io CLI
iwr https://fly.io/install.ps1 -useb | iex

# 2. 登录
fly auth login

# 3. 一键部署
cd d:\TradesProOld\tradespro
.\deploy-flyio.ps1
```

### 手动方式

按照上面的"手动部署"章节操作。

---

**准备好了吗？** 🚀

```powershell
# 第一步：安装 Fly.io CLI
iwr https://fly.io/install.ps1 -useb | iex

# 第二步：登录
fly auth login

# 就这么简单！
```

---

**TradesPro Team** ⚡

*Better hosting, better performance, better price.*

