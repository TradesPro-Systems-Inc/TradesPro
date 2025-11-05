# Cloudflare Tunnel 安装和配置指南

**问题**: `cloudflared` 命令未识别

---

## 🔧 解决方法

### 方法 1: 手动下载安装（推荐）

1. **下载 cloudflared**:
   - 访问: https://github.com/cloudflare/cloudflared/releases/latest
   - 下载: `cloudflared-windows-amd64.exe`（或 `cloudflared-windows-amd64.msi`）

2. **安装**:

   **选项 A: 使用 MSI 安装程序**（推荐）:
   - 双击下载的 `.msi` 文件
   - 按照安装向导完成安装
   - 会自动添加到 PATH

   **选项 B: 手动安装**:
   - 将 `cloudflared-windows-amd64.exe` 重命名为 `cloudflared.exe`
   - 放到 `C:\Program Files\cloudflared\` 或 `C:\cloudflared\`
   - 添加到系统 PATH（见下方说明）

3. **验证安装**:
   ```powershell
   # 重新打开 PowerShell 或命令提示符
   cloudflared --version
   ```

---

### 方法 2: 使用 Chocolatey（如果已安装）

```powershell
choco install cloudflared
```

---

### 方法 3: 使用 Scoop（如果已安装）

```powershell
scoop install cloudflared
```

---

## 🔧 手动添加到 PATH（如果方法 1 选项 B）

### 步骤 1: 创建 cloudflared 目录

```powershell
# 创建目录
New-Item -ItemType Directory -Path "C:\cloudflared" -Force

# 将 cloudflared.exe 复制到这个目录
# （假设你已经下载了 cloudflared-windows-amd64.exe）
Copy-Item ".\cloudflared-windows-amd64.exe" "C:\cloudflared\cloudflared.exe"
```

### 步骤 2: 添加到系统 PATH

**方法 A: 使用 PowerShell（管理员权限）**:

```powershell
# 以管理员身份运行 PowerShell
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\cloudflared",
    "Machine"
)
```

**方法 B: 使用图形界面**:

1. 右键点击"此电脑" → "属性"
2. 点击"高级系统设置"
3. 点击"环境变量"
4. 在"系统变量"中找到 `Path`，点击"编辑"
5. 点击"新建"，添加: `C:\cloudflared`
6. 点击"确定"保存

### 步骤 3: 重启 PowerShell

关闭并重新打开 PowerShell，然后验证：

```powershell
cloudflared --version
```

---

## ✅ 验证安装

```powershell
# 应该显示版本号
cloudflared --version

# 应该显示帮助信息
cloudflared --help
```

---

## 🚀 继续设置

安装成功后，继续以下步骤：

### 1. 登录 Cloudflare

```powershell
cloudflared tunnel login
```

这会打开浏览器，登录你的 Cloudflare 账户。

### 2. 创建隧道

```powershell
cloudflared tunnel create tradespro
```

### 3. 配置隧道

创建配置文件: `%USERPROFILE%\.cloudflared\config.yml`

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

### 4. 运行隧道

```powershell
cloudflared tunnel run tradespro
```

---

## 🐛 常见问题

### 问题 1: 仍然显示 "command not found"

**解决**:
1. 确认 cloudflared.exe 在正确的位置
2. 确认已添加到 PATH
3. **重启 PowerShell**（重要！）
4. 尝试使用完整路径: `C:\cloudflared\cloudflared.exe --version`

### 问题 2: 找不到 .cloudflared 目录

**解决**:
```powershell
# 创建目录
New-Item -ItemType Directory -Path "$env:USERPROFILE\.cloudflared" -Force
```

### 问题 3: 登录后找不到配置文件

**解决**:
- 登录后，配置文件通常在: `%USERPROFILE%\.cloudflared\`
- 如果没有，手动创建 `config.yml`

---

## 📝 快速检查清单

- [ ] cloudflared.exe 已下载
- [ ] cloudflared.exe 已放到固定目录（如 `C:\cloudflared\`）
- [ ] 已添加到系统 PATH
- [ ] PowerShell 已重启
- [ ] `cloudflared --version` 可以运行
- [ ] Cloudflare 账户已创建
- [ ] 已运行 `cloudflared tunnel login`

---

**最后更新**: 2025-11-03  
**状态**: ✅ **安装问题解决指南**

---

_如果问题仍然存在，请提供完整的错误信息_








