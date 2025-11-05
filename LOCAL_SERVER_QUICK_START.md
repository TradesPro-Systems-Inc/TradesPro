# 本地 Web 服务器 - 快速开始指南

**目标**: 在本地运行 TradesPro，通过互联网访问（使用 Telus 动态 IP）

---

## ⚡ 最快方案：Cloudflare Tunnel（推荐）

### 为什么选择 Cloudflare Tunnel？

- ✅ **不需要配置路由器**（适合无法访问路由器的情况）
- ✅ **自动 HTTPS**（安全）
- ✅ **完全免费**
- ✅ **不暴露端口**（更安全）
- ✅ **5 分钟设置完成**

---

## 🚀 5 分钟快速设置

### 步骤 1: 安装 cloudflared（2 分钟）

**Windows**:
```powershell
# 使用 Chocolatey（如果已安装）
choco install cloudflared

# 或手动下载
# 访问: https://github.com/cloudflare/cloudflared/releases
# 下载 cloudflared-windows-amd64.exe
# 重命名为 cloudflared.exe 并放到 PATH
```

**验证安装**:
```powershell
cloudflared --version
```

---

### 步骤 2: 登录 Cloudflare（1 分钟）

```powershell
cloudflared tunnel login
```

这会打开浏览器，登录 Cloudflare 账户（如果没有，先注册免费账户）。

---

### 步骤 3: 创建隧道（30 秒）

```powershell
cloudflared tunnel create tradespro
```

这会创建一个名为 `tradespro` 的隧道。

---

### 步骤 4: 配置隧道（1 分钟）

**创建配置文件**: `%USERPROFILE%\.cloudflared\config.yml`

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: %USERPROFILE%\.cloudflared\YOUR_TUNNEL_ID.json

ingress:
  # 前端
  - hostname: tradespro.yourdomain.com
    service: http://localhost:3000
  # 后端 API
  - hostname: api.tradespro.yourdomain.com
    service: http://localhost:8000
  # 默认路由（404）
  - service: http_status:404
```

**获取 Tunnel ID**:
```powershell
cloudflared tunnel list
```

**替换配置中的**:
- `YOUR_TUNNEL_ID` → 实际的隧道 ID
- `tradespro.yourdomain.com` → 你的域名（需要在 Cloudflare 添加）

---

### 步骤 5: 配置 DNS（1 分钟）

1. **登录 Cloudflare 控制台**: https://dash.cloudflare.com/
2. **选择你的域名**
3. **添加 DNS 记录**:

   **记录 1: 前端**
   ```
   类型: CNAME
   名称: tradespro
   目标: YOUR_TUNNEL_ID.cfargotunnel.com
   代理: 已启用（橙色云）
   ```

   **记录 2: 后端 API**
   ```
   类型: CNAME
   名称: api
   目标: YOUR_TUNNEL_ID.cfargotunnel.com
   代理: 已启用（橙色云）
   ```

---

### 步骤 6: 启动隧道（30 秒）

```powershell
cloudflared tunnel run tradespro
```

**设置为 Windows 服务（开机自启）**:
```powershell
cloudflared service install
cloudflared tunnel run tradespro
```

---

### 步骤 7: 配置应用（1 分钟）

**前端 `.env.local`**:
```bash
VITE_API_BASE_URL=https://api.tradespro.yourdomain.com/api
```

**后端 `.env`**:
```bash
CORS_ORIGINS=http://localhost:3000,https://tradespro.yourdomain.com
```

---

### 步骤 8: 启动应用

```powershell
# 终端 1: 后端
cd tradespro/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 终端 2: 前端
cd tradespro/frontend
npm run dev

# 终端 3: Cloudflare Tunnel（保持运行）
cloudflared tunnel run tradespro
```

---

## ✅ 验证

访问: `https://tradespro.yourdomain.com`

应该看到 TradesPro 登录页面！

---

## 🔄 如果不想使用域名（使用免费子域名）

### 使用 Cloudflare Tunnel 的临时 URL

Cloudflare Tunnel 提供临时 URL，不需要域名：

```powershell
# 启动隧道时使用 --url 参数
cloudflared tunnel --url http://localhost:3000
```

这会生成一个临时 URL，例如: `https://random-string.trycloudflare.com`

**注意**: 
- 临时 URL 每次重启都会变化
- 适合临时测试
- 不适合生产使用

---

## 📊 方案对比

| 方案 | 设置时间 | 路由器访问 | 安全性 | 推荐度 |
|------|----------|------------|--------|--------|
| **Cloudflare Tunnel** | 5 分钟 | ❌ 不需要 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **DuckDNS + 端口转发** | 15 分钟 | ✅ 需要 | ⭐⭐⭐ | ⭐⭐⭐ |
| **ngrok** | 2 分钟 | ❌ 不需要 | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎯 推荐工作流

### 开发环境

- **本地开发**: `localhost:3000`（HMR 工作正常）
- **远程测试**: Cloudflare Tunnel 临时 URL

### 演示/生产

- **Cloudflare Tunnel** + 自定义域名
- 或 **DuckDNS + 端口转发**（如果有路由器访问权限）

---

## 📝 快速命令参考

```powershell
# 查看隧道列表
cloudflared tunnel list

# 运行隧道
cloudflared tunnel run tradespro

# 查看隧道信息
cloudflared tunnel info tradespro

# 删除隧道
cloudflared tunnel delete tradespro
```

---

**最后更新**: 2025-11-03  
**状态**: ✅ **快速开始指南**

---

_推荐使用 Cloudflare Tunnel，最简单且最安全_








