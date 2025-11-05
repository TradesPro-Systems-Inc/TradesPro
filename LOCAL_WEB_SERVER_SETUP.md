# 本地 Web 服务器设置指南 - Telus 动态 IP

**目标**: 在本地运行 TradesPro 前端和后端，通过互联网访问（使用 Telus 动态 IP）

---

## 📋 前置要求

1. ✅ **Telus 互联网服务**（已有）
2. ✅ **路由器管理员权限**（配置端口转发）
3. ✅ **动态 DNS 服务**（处理动态 IP 地址）
4. ✅ **防火墙配置**（允许端口访问）

---

## 🎯 方案概述

### 架构图

```
Internet
   ↓
Telus Router (动态 IP)
   ↓ (端口转发)
本地计算机
   ├─ 前端 (端口 3000)
   └─ 后端 (端口 8000)
```

### 步骤概览

1. **获取动态 DNS 域名**（免费）
2. **配置路由器端口转发**
3. **配置防火墙**
4. **设置动态 DNS 客户端**
5. **配置应用使用动态域名**

---

## ✅ 步骤 1: 设置动态 DNS (DDNS)

### 选项 A: DuckDNS（推荐，免费）

**优点**:
- ✅ 完全免费
- ✅ 设置简单
- ✅ 自动更新 IP
- ✅ 支持多个域名

**设置步骤**:

1. **注册账户**:
   - 访问 https://www.duckdns.org/
   - 使用 GitHub/Google/Reddit 账户登录

2. **创建域名**:
   - 登录后，点击 "Add domain"
   - 输入想要的域名（例如: `tradespro`）
   - 选择域名后缀（`.duckdns.org`）
   - 完整域名: `tradespro.duckdns.org`

3. **获取 Token**:
   - 在域名列表中，复制 Token（用于自动更新 IP）

4. **安装更新客户端**（Windows）:

   **方法 1: 使用 DuckDNS 官方脚本**:
   ```powershell
   # 创建更新脚本: C:\Scripts\duckdns-update.ps1
   $token = "YOUR_DUCKDNS_TOKEN"
   $domain = "tradespro"
   Invoke-WebRequest -Uri "https://www.duckdns.org/update?domains=$domain&token=$token&ip=" -UseBasicParsing
   ```

   **方法 2: 使用 Windows 任务计划程序**:
   - 打开"任务计划程序"
   - 创建基本任务
   - 触发器: 每 5 分钟
   - 操作: 运行 PowerShell 脚本

   **方法 3: 使用第三方工具**:
   - 下载 [DuckDNS Update Client](https://github.com/duckdns/duckdns)
   - 或使用 [No-IP DUC](https://www.noip.com/download)（也支持 DuckDNS）

---

### 选项 B: No-IP（免费，有限制）

**优点**:
- ✅ 免费（30 天需要确认一次）
- ✅ 官方客户端工具

**设置步骤**:

1. 访问 https://www.noip.com/
2. 注册账户
3. 创建主机名（例如: `tradespro.ddns.net`）
4. 下载并安装 No-IP DUC（动态更新客户端）
5. 配置客户端自动更新

---

### 选项 C: Cloudflare Tunnel（推荐，更安全）

**优点**:
- ✅ 完全免费
- ✅ 不需要端口转发
- ✅ 更安全（不在公网暴露端口）
- ✅ 自动 HTTPS

**设置步骤**（见下方详细说明）:

---

## ✅ 步骤 2: 配置路由器端口转发

### Telus 路由器配置（通用步骤）

1. **登录路由器管理界面**:
   - 通常: `http://192.168.1.1` 或 `http://192.168.0.1`
   - 默认用户名/密码: 查看路由器标签或 Telus 文档

2. **找到端口转发设置**:
   - 菜单: "Advanced" → "Port Forwarding" 或 "NAT" → "Port Forwarding"
   - 不同型号可能位置不同

3. **添加端口转发规则**:

   **规则 1: 前端 (端口 3000)**
   ```
   服务名称: TradesPro Frontend
   外部端口: 3000 (或选择其他端口，如 8080)
   内部 IP: 你的计算机 IP（例如: 192.168.1.100）
   内部端口: 3000
   协议: TCP
   启用: 是
   ```

   **规则 2: 后端 (端口 8000)**
   ```
   服务名称: TradesPro Backend
   外部端口: 8000 (或选择其他端口，如 8081)
   内部 IP: 你的计算机 IP（例如: 192.168.1.100）
   内部端口: 8000
   协议: TCP
   启用: 是
   ```

4. **保存配置**:
   - 点击 "Apply" 或 "Save"
   - 路由器可能需要重启

---

### 查找你的计算机 IP 地址

**Windows PowerShell**:
```powershell
ipconfig
# 查找 "IPv4 Address"，通常是 192.168.1.x 或 192.168.0.x
```

**或者设置静态 IP（推荐）**:
- 在路由器 DHCP 设置中，为你的计算机 MAC 地址分配固定 IP
- 或 Windows 网络设置中配置静态 IP

---

## ✅ 步骤 3: 配置 Windows 防火墙

**Windows 防火墙设置**:

1. **打开 Windows Defender 防火墙**:
   - 搜索 "Windows Defender Firewall"
   - 点击 "高级设置"

2. **添加入站规则**:

   **规则 1: 前端端口 3000**
   - 新建规则 → 端口 → TCP → 特定本地端口: `3000`
   - 操作: 允许连接
   - 配置文件: 全部勾选
   - 名称: "TradesPro Frontend"

   **规则 2: 后端端口 8000**
   - 新建规则 → 端口 → TCP → 特定本地端口: `8000`
   - 操作: 允许连接
   - 配置文件: 全部勾选
   - 名称: "TradesPro Backend"

---

## ✅ 步骤 4: 配置应用使用动态域名

### 更新前端环境变量

**创建或更新 `tradespro/frontend/.env.local`**:
```bash
# 使用动态 DNS 域名
# 替换为你的实际域名
VITE_API_BASE_URL=https://tradespro.duckdns.org:8000/api
```

**注意**: 如果使用 HTTPS，需要配置 SSL 证书（见下方说明）

---

### 更新后端 CORS 配置

**更新 `tradespro/backend/.env`**:
```bash
# 添加你的动态 DNS 域名到 CORS 允许列表
CORS_ORIGINS=http://localhost:3000,https://tradespro.duckdns.org,https://tradespro.duckdns.org:3000
```

---

## 🔒 步骤 5: 配置 HTTPS（可选但推荐）

### 选项 A: 使用 Let's Encrypt（免费 SSL 证书）

**使用 Certbot**:

1. **安装 Certbot**:
   ```powershell
   # Windows 使用 Chocolatey
   choco install certbot
   ```

2. **获取证书**:
   ```powershell
   certbot certonly --standalone -d tradespro.duckdns.org
   ```

3. **配置反向代理**（使用 Nginx 或 Caddy）:
   - Nginx: 配置 SSL 证书和反向代理
   - Caddy: 自动 HTTPS（推荐，更简单）

---

### 选项 B: 使用 Caddy（推荐，自动 HTTPS）

**Caddy 自动处理 HTTPS**:

1. **下载 Caddy**: https://caddyserver.com/download

2. **创建 `Caddyfile`**:
   ```
   tradespro.duckdns.org {
       # 前端反向代理
       handle /api/* {
           reverse_proxy localhost:8000
       }
       
       # 前端静态文件
       handle {
           reverse_proxy localhost:3000
       }
   }
   ```

3. **启动 Caddy**:
   ```powershell
   caddy run
   ```

**优点**:
- ✅ 自动获取和更新 SSL 证书
- ✅ 自动 HTTPS
- ✅ 简单配置

---

## 🚀 完整设置步骤（快速开始）

### 1. 设置 DuckDNS

```powershell
# 1. 访问 https://www.duckdns.org/ 注册并创建域名
# 2. 获取 Token
# 3. 创建更新脚本: C:\Scripts\duckdns-update.ps1

$token = "YOUR_DUCKDNS_TOKEN"
$domain = "tradespro"
Invoke-WebRequest -Uri "https://www.duckdns.org/update?domains=$domain&token=$token&ip=" -UseBasicParsing
Write-Host "DuckDNS updated at $(Get-Date)"
```

**设置自动更新**:
- 打开"任务计划程序"
- 创建任务: 每 5 分钟运行一次脚本

---

### 2. 配置路由器端口转发

```
前端: 外部 3000 → 内部 192.168.1.100:3000
后端: 外部 8000 → 内部 192.168.1.100:8000
```

---

### 3. 配置应用

**前端 `.env.local`**:
```bash
VITE_API_BASE_URL=https://tradespro.duckdns.org:8000/api
```

**后端 `.env`**:
```bash
CORS_ORIGINS=http://localhost:3000,https://tradespro.duckdns.org,https://tradespro.duckdns.org:3000
```

---

### 4. 启动服务

```powershell
# 终端 1: 后端
cd tradespro/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 终端 2: 前端
cd tradespro/frontend
npm run dev
```

---

## 🔒 安全建议

### 1. 使用 HTTPS（必需）

- ✅ 使用 Caddy 自动 HTTPS（推荐）
- ✅ 或使用 Let's Encrypt + Nginx

### 2. 防火墙配置

- ✅ 只开放必要的端口（3000, 8000）
- ✅ 考虑使用非标准端口（如 8080, 8081）

### 3. 后端安全

- ✅ 使用强密码
- ✅ 定期更新依赖
- ✅ 限制管理员访问

### 4. 路由器安全

- ✅ 更改默认管理员密码
- ✅ 启用路由器防火墙
- ✅ 禁用不必要的服务

---

## 🔄 替代方案：Cloudflare Tunnel（推荐）

**优点**:
- ✅ 不需要端口转发
- ✅ 不需要配置路由器
- ✅ 自动 HTTPS
- ✅ 更安全（不在公网暴露端口）
- ✅ 完全免费

**设置步骤**:

1. **创建 Cloudflare 账户**:
   - 访问 https://www.cloudflare.com/
   - 注册免费账户

2. **安装 cloudflared**:
   ```powershell
   # 下载: https://github.com/cloudflare/cloudflared/releases
   # 或使用 Chocolatey
   choco install cloudflared
   ```

3. **登录 Cloudflare**:
   ```powershell
   cloudflared tunnel login
   ```

4. **创建隧道**:
   ```powershell
   cloudflared tunnel create tradespro
   ```

5. **配置隧道**:
   创建 `%USERPROFILE%\.cloudflared\config.yml`:
   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: %USERPROFILE%\.cloudflared\YOUR_TUNNEL_ID.json
   
   ingress:
     - hostname: tradespro.yourdomain.com
       service: http://localhost:3000
     - hostname: api.tradespro.yourdomain.com
       service: http://localhost:8000
     - service: http_status:404
   ```

6. **运行隧道**:
   ```powershell
   cloudflared tunnel run tradespro
   ```

7. **配置 DNS**:
   - 在 Cloudflare 控制台添加 DNS 记录
   - 指向隧道

**前端配置**:
```bash
VITE_API_BASE_URL=https://api.tradespro.yourdomain.com/api
```

---

## 📊 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **DuckDNS + 端口转发** | 免费、简单 | 需要配置路由器、暴露端口 | ⭐⭐⭐ |
| **Cloudflare Tunnel** | 免费、安全、自动 HTTPS | 需要域名 | ⭐⭐⭐⭐⭐ |
| **ngrok** | 简单、快速 | 免费版有限制、URL 变化 | ⭐⭐⭐⭐ |

---

## 🎯 推荐方案

### 对于 TradesPro 项目

**最佳选择**: **Cloudflare Tunnel**

**理由**:
1. ✅ 不需要配置路由器（适合租户或无法访问路由器）
2. ✅ 更安全（不暴露端口）
3. ✅ 自动 HTTPS
4. ✅ 完全免费
5. ✅ 性能好

**如果无法使用 Cloudflare Tunnel**:
- 使用 **DuckDNS + 端口转发**（需要路由器访问权限）

---

## 📝 快速检查清单

### DuckDNS + 端口转发方案

- [ ] DuckDNS 账户创建完成
- [ ] 域名创建完成（例如: `tradespro.duckdns.org`）
- [ ] 自动更新脚本设置完成
- [ ] 路由器端口转发配置完成（3000, 8000）
- [ ] Windows 防火墙规则添加完成
- [ ] 前端 `.env.local` 配置完成
- [ ] 后端 `.env` CORS 配置完成
- [ ] 测试从外部网络访问

### Cloudflare Tunnel 方案

- [ ] Cloudflare 账户创建完成
- [ ] 域名添加到 Cloudflare（或使用免费子域名）
- [ ] cloudflared 安装完成
- [ ] 隧道创建完成
- [ ] 配置文件创建完成
- [ ] DNS 记录配置完成
- [ ] 隧道运行测试完成

---

## 🐛 常见问题

### 问题 1: 无法从外部访问

**检查清单**:
1. ✅ 路由器端口转发配置正确
2. ✅ Windows 防火墙允许端口
3. ✅ 应用绑定到 `0.0.0.0` 而不是 `localhost`
4. ✅ 使用正确的域名/IP 地址

### 问题 2: IP 地址变化

**解决**: 确保 DuckDNS 更新脚本正常运行

### 问题 3: HTTPS 证书问题

**解决**: 使用 Caddy 或 Cloudflare Tunnel（自动 HTTPS）

---

**最后更新**: 2025-11-03  
**状态**: ✅ **完整设置指南**

---

_推荐使用 Cloudflare Tunnel 方案，最简单且最安全_








