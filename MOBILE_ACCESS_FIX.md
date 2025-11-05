# 手机访问局域网时的网络错误修复指南

## 问题描述
在手机上通过局域网IP（如 `192.168.1.84:3000`）访问前端页面时，点击登录/注册会出现 Network Error。

## 原因
前端API配置默认指向 `localhost:8000`，但手机无法访问电脑的 `localhost`，需要指向电脑的局域网IP地址。

## ✅ 已自动修复
前端API配置已更新，会自动检测局域网IP并指向正确的后端地址。

## 🔧 解决步骤

### 1. 确认后端服务正在运行
```powershell
# 在项目根目录
cd tradespro/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**重要**：必须使用 `--host 0.0.0.0`，这样后端才能接受来自局域网的连接。

### 2. 确认电脑IP地址
```powershell
# Windows PowerShell
ipconfig

# 查找 "IPv4 地址"，例如：
# IPv4 地址 . . . . . . . . . . . : 192.168.1.84
```

### 3. 确认前端服务配置
前端开发服务器需要绑定到 `0.0.0.0` 才能从局域网访问。

检查 `tradespro/frontend/quasar.config.js`：
```javascript
devServer: {
  host: '0.0.0.0',  // ✅ 必须设置为 0.0.0.0
  open: true,
  port: 3000
}
```

如果配置正确，启动时会显示：
```
App • ⚡ Vite server running

  - Local:   http://localhost:3000/
  - Network: http://192.168.1.84:3000/  ← 这个地址手机可以访问
```

### 4. 检查Windows防火墙
确保防火墙允许8000端口（后端）和3000端口（前端）的入站连接。

**方法1：通过Windows设置**
1. 打开 "Windows Defender 防火墙"
2. 点击 "高级设置"
3. 点击 "入站规则" → "新建规则"
4. 选择 "端口" → "TCP" → 输入端口号 `8000` 和 `3000`
5. 允许连接 → 应用到所有配置文件 → 命名并保存

**方法2：通过PowerShell（管理员权限）**
```powershell
# 允许8000端口（后端）
New-NetFirewallRule -DisplayName "TradesPro Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# 允许3000端口（前端）
New-NetFirewallRule -DisplayName "TradesPro Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 5. 确认手机和电脑在同一WiFi网络
- 手机连接的WiFi名称必须与电脑相同
- 如果使用手机热点，确保电脑连接到手机热点

### 6. 测试后端连接
在手机浏览器中直接访问：
```
http://192.168.1.84:8000/health
```

应该看到JSON响应：
```json
{
  "status": "healthy",
  "service": "tradespro-backend",
  ...
}
```

如果无法访问，说明：
- 后端未运行
- 防火墙阻止了连接
- 手机和电脑不在同一网络

### 7. 测试前端连接
在手机浏览器中访问：
```
http://192.168.1.84:3000
```

应该能看到前端页面。

### 8. 检查浏览器控制台
在手机浏览器中：
1. 打开前端页面
2. 打开开发者工具（Chrome：菜单 → 更多工具 → 开发者工具）
3. 查看Console标签
4. 应该看到：`🌐 Local network detected - Using same IP for backend: http://192.168.1.84:8000/api`

如果看到 `localhost:8000`，说明自动检测未生效，需要手动配置。

## 🔧 手动配置（如果自动检测失败）

如果自动检测失败，可以手动设置环境变量：

### 创建/编辑 `.env.local` 文件
在 `tradespro/frontend/` 目录下创建或编辑 `.env.local`：

```env
VITE_API_BASE_URL=http://192.168.1.84:8000/api
```

**注意**：将 `192.168.1.84` 替换为你的实际IP地址。

### 重启前端服务
```powershell
cd tradespro/frontend
# 停止当前服务（Ctrl+C）
quasar dev
```

## 🐛 常见问题排查

### 问题1：后端连接超时
**症状**：手机访问后端API时出现超时错误

**解决方案**：
1. 确认后端运行在 `0.0.0.0:8000`
2. 检查防火墙设置
3. 尝试在手机浏览器直接访问 `http://192.168.1.84:8000/health`

### 问题2：CORS错误
**症状**：浏览器控制台显示 CORS 相关错误

**解决方案**：
后端已配置允许所有来源（`*`），如果仍有问题，检查：
1. 后端CORS配置是否正确
2. 后端是否重启以应用新配置

### 问题3：前端API URL仍然是localhost
**症状**：浏览器控制台显示API请求指向 `localhost:8000`

**解决方案**：
1. 清除浏览器缓存
2. 硬刷新页面（Ctrl+F5 或 Cmd+Shift+R）
3. 检查浏览器控制台的日志，确认检测到的IP地址
4. 如果自动检测失败，使用手动配置（见上方）

### 问题4：手机无法访问电脑
**症状**：手机浏览器无法打开 `http://192.168.1.84:3000`

**解决方案**：
1. 确认电脑和手机在同一WiFi网络
2. 确认前端服务绑定到 `0.0.0.0`（不是 `localhost`）
3. 检查Windows防火墙
4. 尝试从电脑浏览器访问 `http://192.168.1.84:3000` 测试

## 📝 快速检查清单

- [ ] 后端运行在 `0.0.0.0:8000`
- [ ] 前端运行在 `0.0.0.0:3000`
- [ ] Windows防火墙允许8000和3000端口
- [ ] 手机和电脑在同一WiFi网络
- [ ] 手机可以访问 `http://192.168.1.84:8000/health`
- [ ] 手机可以访问 `http://192.168.1.84:3000`
- [ ] 浏览器控制台显示正确的API URL（不是localhost）

## 🎯 验证修复

完成以上步骤后：
1. 在手机浏览器访问 `http://192.168.1.84:3000`
2. 打开浏览器开发者工具（Console）
3. 点击登录/注册
4. 查看Network标签，确认API请求指向 `http://192.168.1.84:8000/api/v1/auth/...`
5. 如果请求成功，说明问题已解决！

## 💡 提示

- **IP地址可能变化**：如果电脑重新连接WiFi，IP地址可能会改变，需要更新配置
- **使用固定IP**：可以在路由器中为电脑设置固定IP地址，避免每次都要更新配置
- **HTTPS**：局域网访问通常使用HTTP，如果需要在生产环境使用HTTPS，需要配置SSL证书







