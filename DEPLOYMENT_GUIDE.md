# TradesPro 生产环境部署指南 🚀

**部署目标**: 
- 前端 → Vercel
- 后端API → Render
- Email → Zoho Mail
- 域名 → 您的注册域名

---

## 📋 目录

1. [准备工作](#1-准备工作)
2. [部署前端到Vercel](#2-部署前端到vercel)
3. [部署后端到Render](#3-部署后端到render)
4. [配置域名DNS](#4-配置域名dns)
5. [设置Email (Zoho Mail)](#5-设置email-zoho-mail)
6. [环境变量配置](#6-环境变量配置)
7. [测试和验证](#7-测试和验证)

---

## 1. 准备工作

### 1.1 需要的账号

- [ ] **Vercel账号** (免费): https://vercel.com/signup
- [ ] **Render账号** (免费): https://render.com/signup
- [ ] **Zoho Mail账号**: https://www.zoho.com/mail/
- [ ] **GitHub账号** (用于代码托管)
- [ ] **域名注册商账号** (您已有)

### 1.2 域名信息

**您的域名**: `_______________.com` (请填写)

### 1.3 代码准备

#### a) 创建 GitHub 仓库

```bash
cd d:\TradesProOld\tradespro

# 初始化 git (如果还没有)
git init

# 添加 .gitignore
```

创建 `.gitignore` 文件：

```gitignore
# Dependencies
node_modules/
venv/
*/node_modules/
*/venv/

# Build outputs
dist/
build/
.quasar/
frontend/dist/
services/calculation-service/dist/

# Environment files
.env
.env.local
.env.production
*.env
.env.*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Python
__pycache__/
*.py[cod]
*$py.class
*.so

# Database
*.db
*.sqlite
*.sqlite3

# Temporary files
*.tmp
*.temp
*.cache
.cache/
```

#### b) 推送代码到 GitHub

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - TradesPro CEC Load Calculator"

# 创建 GitHub 仓库后，添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/tradespro.git

# 推送
git branch -M main
git push -u origin main
```

---

## 2. 部署前端到Vercel

### 2.1 准备前端配置

#### a) 创建 `frontend/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/spa"
      }
    }
  ],
  "routes": [
    {
      "src": "/.*",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### b) 修改 `frontend/package.json`

添加 build 脚本：

```json
{
  "scripts": {
    "dev": "quasar dev",
    "build": "quasar build",
    "vercel-build": "quasar build -m spa"
  }
}
```

#### c) 创建环境变量文件模板 `frontend/.env.production.example`

```bash
# API Configuration
VITE_API_BASE_URL=https://your-api.onrender.com
VITE_CALCULATION_SERVICE_URL=https://your-calc-service.onrender.com

# App Configuration
VITE_APP_NAME=TradesPro
VITE_APP_VERSION=1.0.0
```

### 2.2 在 Vercel 上部署

#### 方法 A: 通过 Vercel CLI (推荐)

```bash
# 安装 Vercel CLI
npm install -g vercel

# 在 frontend 目录下
cd frontend

# 登录 Vercel
vercel login

# 部署
vercel

# 跟随提示：
# - Set up and deploy "frontend"? [Y/n] Y
# - Which scope? 选择您的账号
# - Link to existing project? [y/N] N
# - What's your project's name? tradespro
# - In which directory is your code located? ./
# - Want to override the settings? [y/N] N

# 部署到生产环境
vercel --prod
```

#### 方法 B: 通过 Vercel 网站

1. 访问 https://vercel.com/new
2. 导入您的 GitHub 仓库
3. 配置项目：
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `quasar build -m spa`
   - **Output Directory**: `dist/spa`
   - **Install Command**: `npm install`

4. 添加环境变量（在 Settings → Environment Variables）：
   ```
   VITE_API_BASE_URL=https://tradespro-api.onrender.com
   VITE_CALCULATION_SERVICE_URL=https://tradespro-calc.onrender.com
   ```

5. 点击 **Deploy**

### 2.3 记录 Vercel 部署信息

部署完成后，您会得到：
- **Vercel URL**: `https://tradespro-xxxx.vercel.app`
- **Project ID**: (在项目设置中)

---

## 3. 部署后端到Render

### 3.1 准备后端配置

#### a) 后端 API (FastAPI)

创建 `backend/render.yaml`

```yaml
services:
  # FastAPI Backend
  - type: web
    name: tradespro-api
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: CORS_ORIGINS
        value: https://your-domain.com,https://tradespro-xxxx.vercel.app
      - key: PYTHON_VERSION
        value: 3.11.0
```

#### b) 计算服务 (Node.js)

创建 `services/calculation-service/render.yaml`

```yaml
services:
  - type: web
    name: tradespro-calc-service
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: CORS_ORIGINS
        value: https://your-domain.com,https://tradespro-xxxx.vercel.app
```

创建 `services/calculation-service/package.json` 的 start 脚本：

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  }
}
```

### 3.2 在 Render 上部署

#### 部署后端 API

1. 访问 https://dashboard.render.com/
2. 点击 **New → Web Service**
3. 连接您的 GitHub 仓库
4. 配置：
   - **Name**: `tradespro-api`
   - **Region**: Oregon (或离您最近的)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. 添加环境变量：
   ```
   DATABASE_URL=postgresql://...  (如果使用数据库)
   SECRET_KEY=your-secret-key-here
   CORS_ORIGINS=https://your-domain.com
   ```

6. 点击 **Create Web Service**

#### 部署计算服务

1. 再次点击 **New → Web Service**
2. 配置：
   - **Name**: `tradespro-calc-service`
   - **Root Directory**: `services/calculation-service`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. 添加环境变量：
   ```
   NODE_ENV=production
   CORS_ORIGINS=https://your-domain.com
   ```

4. 点击 **Create Web Service**

### 3.3 记录 Render 部署信息

部署完成后，您会得到：
- **API URL**: `https://tradespro-api.onrender.com`
- **Calc Service URL**: `https://tradespro-calc-service.onrender.com`

⚠️ **重要**: Render 免费版会在15分钟无活动后休眠，第一次请求需要30秒启动。

---

## 4. 配置域名DNS

假设您的域名是 `tradespro.com`

### 4.1 在域名注册商配置DNS记录

登录您的域名注册商（如 GoDaddy, Namecheap, 阿里云等），添加以下DNS记录：

#### a) Vercel (前端)

**A记录方式**:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

```
Type: A
Name: www
Value: 76.76.21.21
TTL: 3600
```

**或 CNAME 方式** (推荐):
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### b) Render (后端API)

```
Type: CNAME
Name: api
Value: tradespro-api.onrender.com
TTL: 3600
```

```
Type: CNAME
Name: calc
Value: tradespro-calc-service.onrender.com
TTL: 3600
```

#### c) Zoho Mail

```
Type: MX
Priority: 10
Value: mx.zoho.com
TTL: 3600
```

```
Type: MX  
Priority: 20
Value: mx2.zoho.com
TTL: 3600
```

```
Type: MX
Priority: 50
Value: mx3.zoho.com
TTL: 3600
```

```
Type: TXT
Name: @
Value: "v=spf1 include:zoho.com ~all"
TTL: 3600
```

### 4.2 在 Vercel 添加自定义域名

1. 进入 Vercel 项目 → **Settings** → **Domains**
2. 添加域名：
   - `tradespro.com`
   - `www.tradespro.com`
3. Vercel 会自动生成 SSL 证书
4. 等待 DNS 传播（可能需要24-48小时）

### 4.3 在 Render 添加自定义域名

#### 后端 API:
1. 进入 `tradespro-api` 服务 → **Settings** → **Custom Domains**
2. 添加 `api.tradespro.com`
3. Render 会提供 CNAME 值（通常是您的服务地址）
4. 确认 DNS 记录已添加

#### 计算服务:
1. 进入 `tradespro-calc-service` → **Settings** → **Custom Domains**
2. 添加 `calc.tradespro.com`
3. 同样配置 CNAME

---

## 5. 设置Email (Zoho Mail)

### 5.1 注册 Zoho Mail

1. 访问 https://www.zoho.com/mail/zohomail-pricing.html
2. 选择免费计划（最多5个用户）
3. 使用您的域名注册

### 5.2 验证域名

在 Zoho Mail 控制台：
1. 添加您的域名 `tradespro.com`
2. 按照指示添加 TXT 验证记录到您的 DNS：
   ```
   Type: TXT
   Name: zb12345678  (Zoho提供)
   Value: zoho-verification=xxxxx.zoho.com
   ```

### 5.3 配置MX记录

已在 DNS 配置中添加（见 4.1.c）

### 5.4 创建邮箱账号

在 Zoho Mail 控制台创建邮箱：
- `admin@tradespro.com`
- `support@tradespro.com`
- `noreply@tradespro.com`

### 5.5 设置SPF和DKIM

#### SPF (已在4.1.c添加)
```
v=spf1 include:zoho.com ~all
```

#### DKIM
Zoho 会提供 DKIM 记录，添加到 DNS：
```
Type: TXT
Name: zoho._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSq...  (Zoho提供)
```

#### DMARC (可选，提高邮件可信度)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@tradespro.com
```

---

## 6. 环境变量配置

### 6.1 前端环境变量 (Vercel)

在 Vercel 项目 Settings → Environment Variables 添加：

```bash
# API Configuration
VITE_API_BASE_URL=https://api.tradespro.com
VITE_CALCULATION_SERVICE_URL=https://calc.tradespro.com

# App Configuration
VITE_APP_NAME=TradesPro CEC Load Calculator
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

### 6.2 后端环境变量 (Render)

#### API Service:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=https://tradespro.com,https://www.tradespro.com

# Email (Zoho SMTP)
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=noreply@tradespro.com
SMTP_PASSWORD=your-zoho-app-password
SMTP_FROM=noreply@tradespro.com
SMTP_FROM_NAME=TradesPro

# Environment
ENVIRONMENT=production
DEBUG=false
```

#### Calculation Service:
```bash
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://tradespro.com,https://www.tradespro.com
LOG_LEVEL=info
```

---

## 7. 测试和验证

### 7.1 DNS 传播检查

使用工具检查 DNS 是否生效：
- https://dnschecker.org/
- https://www.whatsmydns.net/

检查记录：
- `tradespro.com` → Vercel IP
- `api.tradespro.com` → Render CNAME
- `calc.tradespro.com` → Render CNAME
- MX记录 → Zoho Mail

### 7.2 SSL证书验证

访问：
- `https://tradespro.com` - 应显示🔒安全
- `https://api.tradespro.com` - 应显示🔒安全
- `https://calc.tradespro.com` - 应显示🔒安全

### 7.3 功能测试

#### 前端测试:
```bash
# 访问首页
https://tradespro.com

# 测试页面:
https://tradespro.com/calculator
https://tradespro.com/projects
https://tradespro.com/settings
```

#### API测试:
```bash
# 健康检查
curl https://api.tradespro.com/health

# 计算服务测试
curl https://calc.tradespro.com/api/v1/health
```

#### Email测试:
1. 登录 Zoho Mail: https://mail.zoho.com
2. 发送测试邮件到自己
3. 检查发件人显示为 `noreply@tradespro.com`

### 7.4 性能测试

使用工具测试网站性能：
- **Lighthouse**: Chrome DevTools → Lighthouse
- **GTmetrix**: https://gtmetrix.com/
- **WebPageTest**: https://www.webpagetest.org/

目标：
- Performance > 90
- Accessibility > 90
- Best Practices > 90
- SEO > 90

---

## 8. 部署后配置更新

### 8.1 更新前端环境变量

在本地 `frontend/.env.production`:
```bash
VITE_API_BASE_URL=https://api.tradespro.com
VITE_CALCULATION_SERVICE_URL=https://calc.tradespro.com
```

### 8.2 更新CORS配置

在后端 `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://tradespro.com",
        "https://www.tradespro.com",
        "http://localhost:3000",  # 开发环境
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 8.3 重新部署

```bash
# 提交更改
git add .
git commit -m "Update production configuration"
git push origin main

# Vercel 和 Render 会自动重新部署
```

---

## 9. 监控和维护

### 9.1 设置监控

#### Vercel Analytics (免费):
- 在 Vercel 项目中启用 Analytics
- 查看访问量、性能指标

#### Render Metrics:
- 查看服务状态、响应时间
- 设置服务健康检查

#### UptimeRobot (可选):
- 免费监控服务: https://uptimerobot.com/
- 添加监控URL：
  - `https://tradespro.com`
  - `https://api.tradespro.com/health`
  - `https://calc.tradespro.com/api/v1/health`

### 9.2 日志管理

- **Vercel**: 在项目 → Deployments → 查看构建和运行日志
- **Render**: 在服务 → Logs → 实时查看日志

### 9.3 备份策略

- **代码**: GitHub 自动备份
- **数据库**: Render 提供每日自动备份（付费计划）
- **配置**: 保存所有环境变量到安全位置

---

## 10. 常见问题

### Q1: DNS 更改多久生效？
**A**: 通常1-24小时，最长48小时。使用 `dnschecker.org` 检查。

### Q2: Render 免费服务为什么第一次访问慢？
**A**: 免费服务会休眠。考虑：
- 使用 UptimeRobot 每5分钟ping一次保持活跃
- 升级到付费计划($7/月)

### Q3: Vercel 部署失败怎么办？
**A**: 
1. 检查构建日志
2. 确保 `quasar build -m spa` 在本地能成功
3. 检查 `vercel.json` 配置

### Q4: CORS错误怎么办？
**A**: 
1. 确保后端CORS包含前端域名
2. 重新部署后端服务
3. 清除浏览器缓存

### Q5: Email发不出去？
**A**: 
1. 验证DNS记录正确（MX, SPF, DKIM）
2. 使用Zoho的应用专用密码（不是账号密码）
3. 检查SMTP配置

---

## 11. 成本估算

| 服务 | 免费额度 | 付费价格 |
|------|---------|---------|
| Vercel | 100GB带宽/月 | $20/月 (Pro) |
| Render (Web Service) | 750小时/月 | $7/月/服务 |
| Render (Database) | 无免费 | $7/月 (256MB) |
| Zoho Mail | 5用户 | $1/用户/月 |
| 域名 | - | $10-15/年 |
| **总计(免费方案)** | $0/月 | 仅域名费用 |
| **总计(基础付费)** | - | ~$35/月 |

---

## 12. 快速检查清单

部署前：
- [ ] GitHub 仓库已创建并推送代码
- [ ] `.gitignore` 已配置
- [ ] 环境变量模板已创建

Vercel：
- [ ] 项目已导入并部署
- [ ] 自定义域名已添加
- [ ] 环境变量已配置
- [ ] SSL 证书已生成

Render：
- [ ] 后端API已部署
- [ ] 计算服务已部署
- [ ] 自定义域名已添加
- [ ] 环境变量已配置

DNS：
- [ ] A/CNAME记录指向Vercel
- [ ] CNAME记录指向Render服务
- [ ] MX记录指向Zoho
- [ ] SPF/DKIM/DMARC已配置
- [ ] DNS传播已完成

Email：
- [ ] Zoho Mail账号已创建
- [ ] 域名已验证
- [ ] 邮箱账号已创建
- [ ] SMTP配置已测试

测试：
- [ ] 前端可访问
- [ ] API可访问
- [ ] 计算功能正常
- [ ] Email可发送
- [ ] SSL证书有效

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误截图
2. 浏览器控制台日志
3. 服务器日志
4. DNS配置截图

**准备好开始了吗？告诉我您的域名，我们开始第一步！** 🚀

