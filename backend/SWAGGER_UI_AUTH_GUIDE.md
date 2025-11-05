# Swagger UI 认证使用指南

## 问题说明

在 FastAPI Swagger UI (`http://localhost:8000/docs`) 中测试需要认证的端点时，需要先设置 Bearer Token。

## 使用步骤

### 1. 注册或登录获取 Token

1. 打开 `http://localhost:8000/docs`
2. 找到 **Authentication** 部分的 `/api/v1/auth/register` 或 `/api/v1/auth/token` (登录)
3. 点击 "Try it out"
4. 填写请求体：
   - **注册示例**:
     ```json
     {
       "email": "test@example.com",
       "password": "password123",
       "full_name": "Test User"
     }
     ```
   - **登录示例**:
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```
5. 点击 "Execute"
6. 在响应中复制 `access_token` 的值（例如：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`）

### 2. 设置 Bearer Token

1. 在 Swagger UI 页面右上角找到 **"Authorize"** 按钮（🔒 锁图标）
2. 点击 "Authorize" 按钮
3. 在弹出的对话框中：
   - 找到 **"HTTPBearer"** 或 **"bearerAuth"** 部分
   - 在 **"Value"** 输入框中粘贴刚才复制的 `access_token`
   - **注意**：只需要粘贴 token 值，**不需要**添加 "Bearer " 前缀
4. 点击 "Authorize"
5. 点击 "Close" 关闭对话框

### 3. 测试需要认证的端点

现在你可以测试任何需要认证的端点了：

- ✅ `/api/v1/auth/me` - 获取当前用户信息
- ✅ `/api/v1/auth/profile` - 更新用户资料
- ✅ `/api/v1/projects/*` - 项目管理端点
- ✅ `/api/v1/calculations/*` - 计算相关端点

### 4. 撤销认证（可选）

如果需要测试未认证的请求，可以：
1. 再次点击右上角的 "Authorize" 按钮
2. 点击 "Logout" 或清除 token 输入框
3. 点击 "Close"

## 常见问题

### Q: 为什么登录成功后拉取用户信息还是失败？

**A**: 在 Swagger UI 中，登录成功只会返回 token，**不会自动设置**到认证请求中。你必须手动：
1. 复制登录响应中的 `access_token`
2. 点击右上角的 "Authorize" 按钮
3. 将 token 粘贴到输入框中
4. 点击 "Authorize"

### Q: 需要每次都设置 token 吗？

**A**: 是的，每次刷新 Swagger UI 页面后都需要重新设置 token。但设置一次后，在当前会话中所有需要认证的请求都会自动使用这个 token。

### Q: Token 多久过期？

**A**: 默认是 15 分钟（可以在 `app/utils/config.py` 中的 `ACCESS_TOKEN_EXPIRE_MINUTES` 配置）。

### Q: 如何知道端点是否需要认证？

**A**: 在 Swagger UI 中，需要认证的端点会显示 🔒 锁图标。或者在端点的详细信息中查看 "Security" 部分。

## 使用 curl 测试（替代方案）

如果你不想使用 Swagger UI，也可以使用 curl：

```bash
# 1. 登录获取 token
curl -X POST "http://localhost:8000/api/v1/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 响应: {"access_token":"eyJhbGc...","token_type":"bearer","expires_in":900}

# 2. 使用 token 访问受保护的端点
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer eyJhbGc..."
```

注意：在 curl 中需要使用 `Bearer ` 前缀（后面有空格）。

## PowerShell 测试示例

```powershell
# 1. 登录
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/token" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    email = "test@example.com"
    password = "password123"
  } | ConvertTo-Json)

$token = $loginResponse.access_token
Write-Host "Token: $token"

# 2. 使用 token 获取用户信息
$headers = @{
  Authorization = "Bearer $token"
}

$userInfo = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/me" `
  -Method GET `
  -Headers $headers

$userInfo | ConvertTo-Json
```









