# TradesPro 免费部署指南 🆓

**完全免费方案**: Vercel (前端) + Render (后端)

⚠️ **注意**: 免费版后端会在15分钟无活动后休眠，首次访问需要30秒唤醒。

---

## 📋 部署步骤总览

1. ✅ 部署前端到 Vercel (5分钟)
2. ✅ 部署后端到 Render (10分钟)
3. ✅ 部署计算服务到 Render (10分钟)
4. ✅ 配置环境变量
5. ✅ 测试

**总时间: 约30分钟**

---

## 🎨 第一步：部署前端到 Vercel

### 方法A: 使用 Vercel CLI（推荐）

```bash
# 1. 进入前端目录
cd d:\TradesProOld\tradespro\frontend

# 2. 登录 Vercel
vercel login

# 3. 部署（首次部署）
vercel

# 跟随提示：
# - Set up and deploy? [Y/n] Y
# - Which scope? 选择您的账号
# - Link to existing project? [y/N] N  
# - What's your project's name? tradespro-frontend
# - In which directory is your code located? ./
# - Want to modify these settings? [y/N] N

# 4. 部署到生产环境
vercel --prod
```

您会得到一个URL，类似：`https://tradespro-frontend-xxxx.vercel.app`

### 方法B: 使用 Vercel 网站

1. 访问 https://vercel.com/new
2. 导入您的 GitHub 仓库 `TradesPro-Systems-Inc/TradesPro`
3. 配置项目：

```
Framework Preset: Other
Root Directory: frontend
Build Command: npm run vercel-build
Output Directory: dist/spa
Install Command: npm install
```

4. 点击 **Deploy**

5. 等待构建完成（约2-3分钟）

---

## 🔧 第二步：部署后端到 Render

### 1. 注册 Render 账号

访问 https://render.com/signup

### 2. 创建 Web Service

1. 点击 **New** → **Web Service**
2. 连接 GitHub 仓库：`TradesPro-Systems-Inc/TradesPro`
3. 配置服务：

```
Name: tradespro-api
Region: Oregon (或离您最近的)
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

### 3. 添加环境变量

在 **Environment** 标签添加：

```bash
SECRET_KEY=your-super-secret-key-at-least-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://tradespro-frontend-xxxx.vercel.app
ENVIRONMENT=production
DEBUG=false
```

4. 点击 **Create Web Service**

5. 等待部署完成（约5-10分钟）

您会得到URL：`https://tradespro-api.onrender.com`

---

## ⚙️ 第三步：部署计算服务到 Render

### 1. 创建另一个 Web Service

1. 再次点击 **New** → **Web Service**
2. 选择相同的 GitHub 仓库
3. 配置：

```
Name: tradespro-calc
Region: Oregon
Branch: main
Root Directory: services/calculation-service
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### 2. 添加环境变量

```bash
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://tradespro-frontend-xxxx.vercel.app
```

3. 点击 **Create Web Service**

您会得到URL：`https://tradespro-calc.onrender.com`

---

## 🔗 第四步：连接前端和后端

### 1. 更新 Vercel 环境变量

回到 Vercel 项目：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加：

```bash
VITE_API_BASE_URL=https://tradespro-api.onrender.com
VITE_CALCULATION_SERVICE_URL=https://tradespro-calc.onrender.com
```

3. 点击 **Save**

### 2. 重新部署前端

```bash
# 在本地
cd d:\TradesProOld\tradespro\frontend
vercel --prod
```

或在 Vercel 网站点击 **Redeploy**

---

## ✅ 第五步：测试部署

### 1. 测试前端

访问您的 Vercel URL：`https://tradespro-frontend-xxxx.vercel.app`

应该能看到：
- ✅ 页面正常加载
- ✅ 多语言切换正常
- ✅ 界面显示正确

### 2. 测试后端API

```bash
# 测试健康检查
curl https://tradespro-api.onrender.com/health

# 应该返回 {"status": "healthy"}
```

⚠️ **首次访问**: 如果后端休眠了，可能需要等待30秒唤醒。

### 3. 测试计算功能

1. 在前端页面填写计算数据
2. 点击"计算"按钮
3. 查看结果

---

## 📊 监控和管理

### Vercel 仪表板

访问 https://vercel.com/dashboard

可以查看：
- 部署历史
- 访问统计
- 构建日志
- 域名管理

### Render 仪表板

访问 https://dashboard.render.com/

可以查看：
- 服务状态
- 日志
- 资源使用
- 部署历史

---

## 🌐 配置自定义域名（可选）

### 在 Vercel 添加域名

1. 进入项目 → **Settings** → **Domains**
2. 添加域名：`tradespro.com`
3. 按照提示配置 DNS：

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 在 Render 添加域名

1. 进入服务 → **Settings** → **Custom Domains**
2. 添加：
   - `api.tradespro.com` (后端)
   - `calc.tradespro.com` (计算服务)

3. 配置 DNS：

```
Type: CNAME
Name: api
Value: tradespro-api.onrender.com

Type: CNAME  
Name: calc
Value: tradespro-calc.onrender.com
```

---

## ⚠️ 免费版限制

### Vercel 免费额度

- ✅ 100GB 带宽/月
- ✅ 无限部署
- ✅ 自动 HTTPS
- ✅ 全球 CDN

**通常足够小型项目使用**

### Render 免费额度

- ✅ 750 小时/月（单个服务）
- ⚠️ **15分钟无活动后休眠**
- ⚠️ **唤醒需要30秒**
- ✅ 自动 HTTPS
- ✅ 512MB RAM

**限制**:
- 用户首次访问或长时间未访问后会遇到30秒延迟
- 不适合需要快速响应的生产环境

---

## 🔄 如何避免休眠（免费方法）

### 方法1: 使用 UptimeRobot

1. 注册 https://uptimerobot.com/（免费）
2. 添加监控：
   - URL: `https://tradespro-api.onrender.com/health`
   - 间隔: 5分钟
3. 这样后端每5分钟被ping一次，不会休眠

### 方法2: 使用 GitHub Actions

创建 `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Render Services Alive

on:
  schedule:
    # 每5分钟运行一次
    - cron: '*/5 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend API
        run: curl https://tradespro-api.onrender.com/health
      
      - name: Ping Calculation Service
        run: curl https://tradespro-calc.onrender.com/health
```

⚠️ **注意**: GitHub Actions 免费账户每月有限额（2000分钟），这个方法每月会用约300分钟。

---

## 💡 升级到付费的时机

考虑升级如果：

1. **用户抱怨慢**: 首次访问30秒太久
2. **流量增长**: 超过免费额度
3. **需要数据库**: Render 免费版不含数据库
4. **需要专业形象**: 休眠影响用户体验

**升级选项**:
- **Render 付费**: $7/月/服务 = $14/月（永不休眠）
- **升级到 Fly.io**: $4/月全部服务
- **升级到 Railway**: $20/月全功能

---

## 📋 快速命令参考

### Vercel 常用命令

```bash
# 登录
vercel login

# 开发环境部署
vercel

# 生产环境部署
vercel --prod

# 查看部署列表
vercel ls

# 查看日志
vercel logs

# 删除部署
vercel rm <deployment-url>
```

### 更新代码后重新部署

```bash
# 1. 提交代码到 GitHub
git add .
git commit -m "Update code"
git push origin main

# 2. Render 会自动重新部署

# 3. 手动重新部署 Vercel
cd frontend
vercel --prod
```

---

## 🐛 常见问题

### Q1: Vercel 部署失败？

**检查**:
1. `package.json` 中有 `vercel-build` 脚本
2. `vercel.json` 配置正确
3. 查看构建日志找错误

**解决**:
```bash
# 本地测试构建
cd frontend
npm run build:spa

# 如果成功，再部署到 Vercel
vercel --prod
```

### Q2: Render 显示 "Application failed to respond"?

**原因**: 
- 端口配置错误
- 启动命令错误
- 依赖安装失败

**解决**:
1. 检查 Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. 查看 Render 日志
3. 确保 `requirements.txt` 正确

### Q3: CORS 错误？

**解决**: 在 Render 环境变量中添加：
```
CORS_ORIGINS=https://your-vercel-url.vercel.app
```

### Q4: 前端无法连接后端？

**检查**:
1. Vercel 环境变量中的 API URL 正确
2. Render 服务正在运行
3. 浏览器控制台查看错误

### Q5: 后端休眠太频繁？

**解决**: 使用 UptimeRobot 或 GitHub Actions 保活（见上文）

---

## 🎯 部署检查清单

前端 (Vercel):
- [ ] 代码推送到 GitHub
- [ ] Vercel CLI 已安装
- [ ] 登录 Vercel
- [ ] 项目已部署
- [ ] 环境变量已设置
- [ ] 前端可访问
- [ ] SSL 证书有效

后端 (Render):
- [ ] Render 账号已创建
- [ ] API 服务已创建
- [ ] 环境变量已设置
- [ ] 服务正在运行
- [ ] 健康检查通过

计算服务 (Render):
- [ ] 计算服务已创建
- [ ] 环境变量已设置
- [ ] 服务正在运行

集成测试:
- [ ] 前端能访问后端
- [ ] 计算功能正常
- [ ] 多语言切换正常
- [ ] PDF 生成正常

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志**:
   - Vercel: 项目 → Deployments → 点击部署 → View Function Logs
   - Render: 服务 → Logs

2. **检查状态**:
   - Vercel: https://vercel-status.com/
   - Render: https://status.render.com/

3. **社区支持**:
   - Vercel: https://github.com/vercel/vercel/discussions
   - Render: https://community.render.com/

---

## 🎉 完成！

您的 TradesPro 应用现在已经完全免费部署了！

**您的 URLs**:
- 前端: `https://tradespro-frontend-xxxx.vercel.app`
- 后端: `https://tradespro-api.onrender.com`
- 计算: `https://tradespro-calc.onrender.com`

**下一步**:
1. 测试所有功能
2. 配置自定义域名（可选）
3. 设置 UptimeRobot 避免休眠
4. 监控使用情况

---

**准备好开始了吗？运行第一个命令：**

```bash
cd d:\TradesProOld\tradespro\frontend
vercel login
```

