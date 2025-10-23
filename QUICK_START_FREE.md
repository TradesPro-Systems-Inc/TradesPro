# 🚀 TradesPro 免费部署 - 5分钟快速开始

**目标**: 5分钟内让您的应用上线！

---

## ⚡ 超快速部署（3步）

### 1️⃣ 部署前端到 Vercel (2分钟)

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录（会打开浏览器）
vercel login

# 进入前端目录并部署
cd d:\TradesProOld\tradespro\frontend
vercel --prod
```

**就这样！** 您会得到一个 URL: `https://tradespro-xxxx.vercel.app`

---

### 2️⃣ 部署后端到 Render (2分钟)

1. **访问**: https://render.com/signup （用 GitHub 登录）

2. **点击**: `New` → `Web Service`

3. **选择**: 您的 `TradesPro` 仓库

4. **填写**:
   ```
   Name: tradespro-api
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

5. **点击**: `Create Web Service`

**完成！** 5-10分钟后您的后端就上线了。

---

### 3️⃣ 连接前端和后端 (1分钟)

1. **复制** Render 给您的 URL: `https://tradespro-api.onrender.com`

2. **访问** Vercel 项目: https://vercel.com/dashboard

3. **进入**: 您的项目 → `Settings` → `Environment Variables`

4. **添加**:
   ```
   VITE_API_BASE_URL = https://tradespro-api.onrender.com
   ```

5. **重新部署**:
   ```bash
   cd d:\TradesProOld\tradespro\frontend
   vercel --prod
   ```

**🎉 完成！访问您的应用！**

---

## 📋 可选：部署计算服务 (2分钟)

如果需要独立的计算服务：

1. Render → `New` → `Web Service`
2. 填写:
   ```
   Name: tradespro-calc
   Root Directory: services/calculation-service
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```
3. 在 Vercel 添加环境变量:
   ```
   VITE_CALCULATION_SERVICE_URL = https://tradespro-calc.onrender.com
   ```

---

## ⚠️ 重要提示

### 免费版限制

**Render 免费版**:
- ✅ 完全免费
- ⚠️ **15分钟不活动会休眠**
- ⚠️ **首次唤醒需要30秒**

**适合**:
- ✅ 个人项目
- ✅ 测试和演示
- ✅ 低流量网站

**不适合**:
- ❌ 需要快速响应的生产环境
- ❌ 高流量网站

---

## 💡 避免休眠的免费方法

### 使用 UptimeRobot (推荐)

1. 注册: https://uptimerobot.com/ (免费)
2. 添加监控:
   - URL: `https://tradespro-api.onrender.com/health`
   - 间隔: 5分钟
3. 完成！您的服务不会再休眠

---

## 🔄 如何更新代码

```bash
# 1. 提交到 GitHub
git add .
git commit -m "Update"
git push origin main

# 2. Render 自动重新部署

# 3. 重新部署 Vercel
cd frontend
vercel --prod
```

---

## 🐛 快速故障排除

### 问题1: "Application failed to respond"

**解决**: Render 服务可能在休眠，等待30秒后重试。

### 问题2: CORS 错误

**解决**: 在 Render 环境变量添加:
```
CORS_ORIGINS = https://your-vercel-url.vercel.app
```

### 问题3: 前端连接不上后端

**检查**:
1. Render 服务是否在运行（绿色）
2. Vercel 环境变量是否正确
3. 刷新浏览器缓存 (Ctrl+Shift+R)

---

## 📊 监控您的应用

### Vercel 仪表板
https://vercel.com/dashboard
- 查看访问统计
- 查看部署历史
- 查看错误日志

### Render 仪表板  
https://dashboard.render.com/
- 查看服务状态
- 查看日志
- 监控资源使用

---

## 💰 升级选项

当您需要更好的性能时：

**Render 付费版**: $7/月/服务
- ✅ 永不休眠
- ✅ 更多资源
- ✅ 更快响应

**Fly.io**: $4/月全部服务
- ✅ 更便宜
- ✅ 全球部署
- ✅ 更快速度

---

## ✅ 部署检查清单

- [ ] Vercel CLI 已安装
- [ ] 前端已部署到 Vercel
- [ ] 后端已部署到 Render
- [ ] 环境变量已配置
- [ ] 前端能访问后端
- [ ] 所有功能测试通过
- [ ] （可选）UptimeRobot 已设置

---

## 🎯 一键部署脚本

我们提供了自动化脚本：

```bash
# Windows
.\deploy-vercel.ps1

# 然后按照提示操作
```

---

## 📚 详细文档

需要更多帮助？查看完整指南：

- **免费方案详细指南**: `FREE_DEPLOYMENT_GUIDE.md`
- **付费方案对比**: `HOSTING_COMPARISON.md`
- **Fly.io 部署**: `FLY_IO_DEPLOYMENT.md`
- **完整部署指南**: `DEPLOYMENT_GUIDE.md`

---

## 🆘 需要帮助？

**常见问题**: 查看 `FREE_DEPLOYMENT_GUIDE.md` 的"常见问题"部分

**社区支持**:
- Vercel: https://github.com/vercel/vercel/discussions
- Render: https://community.render.com/

---

## 🎉 恭喜！

您的 TradesPro 应用现在已经免费部署并上线了！

**享受您的应用吧！** 🚀

---

**准备开始了吗？运行第一个命令：**

```bash
npm install -g vercel
vercel login
```

