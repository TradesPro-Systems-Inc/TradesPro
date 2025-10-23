# 🚀 Fly.io 部署 - 3步完成

**月费**: $4-6 | **时间**: 10分钟 | **难度**: ⭐⭐

---

## 📋 准备工作

### ✅ 您需要：
- ✅ 信用卡（验证身份，前$5免费）
- ✅ GitHub 账号（登录用）
- ✅ Windows PowerShell

---

## 🎯 3步部署

### 第1步：安装 Fly.io CLI (1分钟)

打开 PowerShell：

```powershell
# 安装 Fly.io CLI
iwr https://fly.io/install.ps1 -useb | iex

# 验证安装
flyctl version
```

---

### 第2步：登录并添加信用卡 (2分钟)

```powershell
# 登录（会打开浏览器）
fly auth login

# 添加信用卡（必需）
fly dashboard billing
```

在打开的浏览器中：
1. 用 GitHub 登录
2. 点击 "Add credit card"
3. 输入信用卡信息
4. ⚠️ 不用担心：前 $5/月免费，实际只需付 $4/月

---

### 第3步：一键部署 (5分钟)

```powershell
# 进入项目目录
cd d:\TradesProOld\tradespro

# 运行自动部署脚本
.\deploy-flyio.ps1
```

在脚本菜单中：
- 选择 `1` (部署所有服务)
- 等待 5-10 分钟

**完成！** 🎉

---

## 📊 您会得到什么

### 3个 URLs：

```
✅ 前端: https://tradespro-frontend.fly.dev
✅ 后端: https://tradespro-api.fly.dev  
✅ 计算: https://tradespro-calc.fly.dev
```

### 应用特性：

- ✅ **永不休眠** - 即时响应
- ✅ **全球 CDN** - 快速访问
- ✅ **自动 HTTPS** - 安全连接
- ✅ **自动扩展** - 应对流量增长

---

## 💰 成本明细

### 每月费用：

| 服务 | 配置 | 官方价 | 免费额度 | 实付 |
|-----|-----|-------|---------|------|
| 前端 | 256MB VM | $1.94 | -$1.94 | $0 |
| 后端 | 256MB VM | $1.94 | -$1.94 | $0 |
| 计算 | 256MB VM | $1.94 | -$1.12 | $0.82 |
| 流量 | 160GB | $0 | $0 | $0 |
| 额外 | 备用 | ~$3 | -$0 | ~$3 |
| **总计** | | **$5.82** | **-$5** | **~$4** |

💡 **实际支付**: 约 $4-6/月

---

## 🎮 部署后的操作

### 查看应用状态：

```powershell
# 查看所有应用
fly apps list

# 查看前端状态
fly status -a tradespro-frontend

# 查看日志
fly logs -a tradespro-frontend
```

### 访问仪表板：

```powershell
# 打开 Fly.io 仪表板
fly dashboard
```

在仪表板可以：
- 📊 查看资源使用
- 💰 查看费用明细
- 📈 查看访问统计
- 🔧 修改配置

---

## 🔄 如何更新应用

```powershell
# 1. 修改代码后，提交到 Git
git add .
git commit -m "Update"
git push origin main

# 2. 重新部署
cd d:\TradesProOld\tradespro
.\deploy-flyio.ps1

# 选择 1（部署所有服务）
```

**或者手动部署单个服务**：

```powershell
# 只更新前端
cd frontend
fly deploy

# 只更新后端
cd backend
fly deploy
```

---

## 🌐 配置自定义域名（可选）

### 如果您有域名（如 tradespro.com）：

```powershell
# 为前端添加域名
fly certs add tradespro.com -a tradespro-frontend
fly certs add www.tradespro.com -a tradespro-frontend

# 为后端添加域名
fly certs add api.tradespro.com -a tradespro-api
```

### 然后在域名 DNS 设置中添加：

```
类型: CNAME
名称: @
值: tradespro-frontend.fly.dev

类型: CNAME
名称: www
值: tradespro-frontend.fly.dev

类型: CNAME
名称: api
值: tradespro-api.fly.dev
```

**等待 5-30 分钟**，域名就生效了！

---

## 📈 性能监控

### 查看资源使用：

```powershell
# 查看 VM 状态
fly vm status -a tradespro-frontend

# 查看扩展历史
fly scale show -a tradespro-api
```

### 如果需要更多性能：

```powershell
# 升级到 512MB (更好的性能)
fly scale memory 512 -a tradespro-api

# 成本增加到 ~$4/月/服务
```

---

## 💡 省钱小贴士

1. **保持 256MB** - 对大多数应用足够
2. **单区域** - 只在一个区域运行
3. **监控使用量** - 定期检查 `fly dashboard billing`
4. **设置预算** - 在仪表板设置支出限制

---

## 🐛 常见问题

### Q1: 部署失败怎么办？

**查看日志**：
```powershell
fly logs -a tradespro-frontend
```

**重试部署**：
```powershell
cd frontend
fly deploy --verbose
```

### Q2: 应用无法访问？

**检查状态**：
```powershell
fly status -a tradespro-frontend
```

**重启应用**：
```powershell
fly apps restart tradespro-frontend
```

### Q3: CORS 错误？

**更新后端 CORS 设置**：
```powershell
fly secrets set CORS_ORIGINS="https://tradespro-frontend.fly.dev" -a tradespro-api
```

### Q4: 费用超出预期？

**查看明细**：
```powershell
fly dashboard billing
```

**降低配置**：
```powershell
fly scale memory 256 -a tradespro-api
```

---

## 🆘 获取帮助

### 官方资源：
- 📚 **文档**: https://fly.io/docs/
- 💬 **社区**: https://community.fly.io/
- 🐦 **Discord**: https://fly.io/discord

### 查看完整指南：
- 📄 `FLYIO_QUICK_START.md` - 详细步骤
- 📄 `FLY_IO_DEPLOYMENT.md` - 完整文档

---

## ✅ 检查清单

部署前：
- [ ] 已安装 Fly.io CLI
- [ ] 已登录 Fly.io
- [ ] 已添加信用卡
- [ ] 代码已提交到 Git

部署后：
- [ ] 所有服务已部署
- [ ] 前端可访问
- [ ] 后端响应正常
- [ ] 计算功能正常

优化：
- [ ] 已查看费用明细
- [ ] 已设置预算提醒
- [ ] 已测试所有功能
- [ ] （可选）已配置域名

---

## 🎉 完成！

您的 TradesPro 应用现在运行在 Fly.io 上了！

**享受快速、可靠的服务吧！** 🚀

---

## 📞 命令速查

```powershell
# 部署
.\deploy-flyio.ps1

# 查看状态
fly apps list
fly status -a tradespro-frontend

# 查看日志
fly logs -a tradespro-frontend

# 重启应用
fly apps restart tradespro-frontend

# 查看费用
fly dashboard billing

# 更新配置
fly secrets set KEY=VALUE -a tradespro-api

# 扩展资源
fly scale memory 512 -a tradespro-api
```

---

**准备好了吗？开始第1步：**

```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**TradesPro Team** ⚡

