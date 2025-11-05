# Internet Access Authentication Troubleshooting Guide

**问题**: 通过 internet 访问时登录失败 (401 Unauthorized)

---

## 🔍 问题分析

当通过 internet（非 localhost）访问时，可能遇到以下问题：

1. **API Base URL 配置错误** - 前端仍尝试连接 localhost
2. **CORS 配置不包含 internet origin** - 后端拒绝跨域请求
3. **Token 未正确发送** - 认证头未附加到请求

---

## ✅ 已实施的修复

### 1. 前端 API Base URL 自动检测

**位置**: `tradespro/frontend/src/services/api.ts`

**功能**:
- ✅ 优先使用环境变量 `VITE_API_BASE_URL`
- ✅ 自动检测当前 hostname（如果非 localhost）
- ✅ 自动推断后端 URL（同域名 + 端口 8000）
- ✅ 添加调试日志

**代码**:
```typescript
function getApiBaseURL(): string {
  // 1. Environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Auto-detect from window location
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Auto-infer backend URL
      const backendURL = `${protocol}//${hostname}:8000/api`;
      return backendURL;
    }
  }
  
  // 3. Default localhost
  return 'http://localhost:8000/api';
}
```

---

### 2. 后端 CORS 配置增强

**位置**: `tradespro/backend/app/utils/config.py` 和 `tradespro/backend/app/main.py`

**功能**:
- ✅ 支持通配符 `*`（仅开发环境）
- ✅ 自动过滤空字符串
- ✅ 添加配置日志

**配置**:
```python
# .env 文件
CORS_ORIGINS=http://localhost:3000,https://your-domain.com,https://your-ip:3000
```

---

### 3. Token 存储增强

**位置**: `tradespro/frontend/src/pinia-stores/user.ts`

**功能**:
- ✅ 支持多个 localStorage 键（向后兼容）
- ✅ 添加调试日志
- ✅ 改进 token 读取逻辑

---

### 4. 请求拦截器增强

**位置**: `tradespro/frontend/src/services/api.ts`

**功能**:
- ✅ 添加调试日志（token 是否存在）
- ✅ 记录请求 URL 和 baseURL
- ✅ 帮助诊断认证问题

---

## 🔧 配置步骤

### 步骤 1: 设置环境变量

**开发环境** (`tradespro/frontend/.env.local`):
```bash
VITE_API_BASE_URL=http://your-backend-ip:8000/api
```

**生产环境** (`tradespro/frontend/.env.production`):
```bash
VITE_API_BASE_URL=https://api.your-domain.com/api
```

---

### 步骤 2: 配置后端 CORS

**开发环境** (`tradespro/backend/.env`):
```bash
CORS_ORIGINS=http://localhost:3000,http://your-frontend-ip:3000,https://your-domain.com
```

**生产环境**:
```bash
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

### 步骤 3: 验证配置

1. **检查前端 API Base URL**:
   - 打开浏览器控制台
   - 查看 `📡 API Configuration:` 日志
   - 确认 `baseURL` 正确

2. **检查 Token 发送**:
   - 打开浏览器控制台
   - 查看 `🔐 Request with auth:` 日志
   - 确认 `hasToken: true`

3. **检查后端 CORS**:
   - 查看后端启动日志
   - 确认 `CORS configured: X origin(s) allowed`
   - 确认你的前端 origin 在列表中

---

## 🐛 常见问题排查

### 问题 1: CORS 错误

**症状**: `Access to XMLHttpRequest has been blocked by CORS policy`

**解决方案**:
1. 检查后端 `.env` 文件中的 `CORS_ORIGINS`
2. 确保前端 origin 在列表中（包括协议、域名、端口）
3. 重启后端服务

**示例**:
```bash
# 前端运行在 https://example.com:3000
# 后端 .env 需要包含:
CORS_ORIGINS=https://example.com:3000,http://example.com:3000
```

---

### 问题 2: 401 Unauthorized

**症状**: `GET /api/v1/projects HTTP/1.1 401 Unauthorized`

**可能原因**:
1. Token 未发送
2. Token 过期
3. Token 格式错误

**排查步骤**:
1. 打开浏览器开发者工具 → Network 标签
2. 查看请求 Headers
3. 确认 `Authorization: Bearer <token>` 存在
4. 检查 token 是否有效（未过期）

**解决方案**:
- 重新登录获取新 token
- 检查 localStorage 中是否有 `access_token`
- 查看控制台日志确认 token 是否被读取

---

### 问题 3: API Base URL 错误

**症状**: 请求发送到错误的 URL（如仍发送到 localhost）

**解决方案**:
1. 设置环境变量 `VITE_API_BASE_URL`
2. 或确保前端自动检测逻辑正常工作
3. 检查控制台中的 `📡 API Configuration:` 日志

---

## 📝 调试检查清单

- [ ] 前端 baseURL 正确（检查控制台日志）
- [ ] 后端 CORS 包含前端 origin（检查后端日志）
- [ ] Token 存在于 localStorage（检查 Application → Local Storage）
- [ ] Token 附加到请求头（检查 Network → Headers）
- [ ] 后端服务可访问（ping 或 curl 测试）
- [ ] 防火墙允许端口 8000（后端）和 3000（前端）

---

## 🚀 快速测试

### 测试 1: 检查 API 配置

```javascript
// 浏览器控制台
console.log('API Base URL:', api.defaults.baseURL);
console.log('Token:', localStorage.getItem('access_token'));
```

### 测试 2: 手动测试后端

```bash
# 测试后端健康检查
curl http://your-backend-ip:8000/health

# 测试认证端点（无需 token）
curl -X POST http://your-backend-ip:8000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 测试 3: 检查 CORS

```bash
# 测试 CORS 预检请求
curl -X OPTIONS http://your-backend-ip:8000/api/v1/projects \
  -H "Origin: http://your-frontend-ip:3000" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

---

## ✅ 验证清单

完成以下步骤后，应该可以正常通过 internet 访问：

1. ✅ 前端 API baseURL 正确指向后端
2. ✅ 后端 CORS 配置包含前端 origin
3. ✅ Token 正确存储和发送
4. ✅ 后端服务可访问（端口开放）
5. ✅ 网络连接正常（无防火墙阻止）

---

**最后更新**: 2025-11-03  
**状态**: ✅ **已实施修复，需要配置环境变量**

---

_如果问题仍然存在，请检查浏览器控制台和后端日志获取详细错误信息_








