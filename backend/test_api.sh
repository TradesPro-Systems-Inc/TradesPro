#!/bin/bash
# backend/test_api.sh
# 快速测试 API 端点

BASE_URL="http://localhost:8000"

echo "🧪 测试 TradesPro Backend API"
echo "================================"
echo ""

# 1. 健康检查
echo "1️⃣  健康检查"
curl -s "${BASE_URL}/health" | python -m json.tool
echo ""
echo ""

# 2. 根路径
echo "2️⃣  根路径"
curl -s "${BASE_URL}/" | python -m json.tool
echo ""
echo ""

# 3. 用户注册
echo "3️⃣  用户注册"
curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }' | python -m json.tool
echo ""
echo ""

# 4. 用户登录
echo "4️⃣  用户登录"
TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/token" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "password123"
    }')
echo $TOKEN_RESPONSE | python -m json.tool

# 提取 token
TOKEN=$(echo $TOKEN_RESPONSE | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo ""
echo "🔑 Token: $TOKEN"
echo ""
echo ""

# 5. 获取当前用户信息
echo "5️⃣  获取当前用户信息"
curl -s "${BASE_URL}/api/v1/auth/me" \
    -H "Authorization: Bearer $TOKEN" | python -m json.tool
echo ""
echo ""

# 6. 创建项目
echo "6️⃣  创建项目"
curl -s -X POST "${BASE_URL}/api/v1/projects" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "测试项目",
        "description": "这是一个测试项目",
        "location": "Edmonton, AB"
    }' | python -m json.tool
echo ""
echo ""

# 7. 获取项目列表
echo "7️⃣  获取项目列表"
curl -s "${BASE_URL}/api/v1/projects" \
    -H "Authorization: Bearer $TOKEN" | python -m json.tool
echo ""
echo ""

# 8. 同步计算
echo "8️⃣  同步计算"
curl -s -X POST "${BASE_URL}/api/v1/calculations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "project_id": 1,
        "bundle": {
            "id": "calc-test-123",
            "createdAt": "2025-01-01T00:00:00Z",
            "results": {
                "conductorSize": "2/0 AWG Cu",
                "panelRatingA": "200"
            }
        }
    }' | python -m json.tool
echo ""
echo ""

echo "✅ API 测试完成"