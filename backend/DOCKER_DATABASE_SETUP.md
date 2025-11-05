# Docker PostgreSQL 数据库设置指南

## 🐳 Docker 数据库配置

### 选项 A: 使用 Docker Compose（推荐）

如果使用 `docker-compose.yml`：

```yaml
# docker-compose.yml (在项目根目录)
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: tradespro_postgres
    environment:
      POSTGRES_USER: tradespro_user
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: tradespro
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tradespro_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**启动数据库：**
```powershell
# 在项目根目录
docker-compose up -d postgres

# 检查状态
docker-compose ps

# 查看日志
docker-compose logs postgres
```

### 选项 B: 使用 Docker 命令

```powershell
# 启动 PostgreSQL 容器
docker run -d \
  --name tradespro_postgres \
  -e POSTGRES_USER=tradespro_user \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=tradespro \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -v ${PWD}/tradespro/backend/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:15

# 检查容器状态
docker ps

# 查看日志
docker logs tradespro_postgres

# 停止容器
docker stop tradespro_postgres

# 启动容器
docker start tradespro_postgres
```

---

## 🔧 后端配置

### 数据库连接字符串

Docker 数据库通常暴露在 `localhost:5432`，所以默认配置应该可以直接使用：

```python
# 默认配置（docker-compose 端口映射到 localhost）
DATABASE_URL=postgresql://tradespro_user:changeme@localhost:5432/tradespro
```

### 如果使用 Docker 网络

如果容器在同一 Docker 网络中：

```python
# 使用容器名称作为主机
DATABASE_URL=postgresql://tradespro_user:changeme@postgres:5432/tradespro
```

### 创建 .env 文件

在 `tradespro/backend/` 目录下创建 `.env` 文件：

```env
# backend/.env

# 数据库配置（Docker PostgreSQL）
DATABASE_URL=postgresql://tradespro_user:changeme@localhost:5432/tradespro

# 如果数据库容器名称不同，使用容器名称：
# DATABASE_URL=postgresql://tradespro_user:changeme@tradespro_postgres:5432/tradespro

# 应用配置
ENVIRONMENT=development
PORT=8000

# CORS（前端 URL）
CORS_ORIGINS=http://localhost:9000,http://localhost:8080,http://localhost:3000

# 安全（开发环境可以使用默认值）
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET=dev-secret-key-change-in-production
BUNDLE_SIGNING_KEY=dev-secret-key-change-in-production

# V4.1 Architecture: CI/CD 注入（开发环境使用默认值）
GIT_COMMIT=dev-local
GIT_COMMIT_SHORT=dev-local
```

---

## ✅ 验证数据库连接

### 方法 1: 使用 Docker 命令

```powershell
# 进入容器执行 psql
docker exec -it tradespro_postgres psql -U tradespro_user -d tradespro

# 在 psql 中执行：
# \dt  # 列出表
# \q   # 退出
```

### 方法 2: 使用本地 psql（如果已安装）

```powershell
# 连接到 Docker 中的数据库
psql -h localhost -p 5432 -U tradespro_user -d tradespro

# 密码：changeme
```

### 方法 3: 使用 Python 脚本

```powershell
# 在 backend 目录下
cd tradespro\backend
.\venv\Scripts\Activate.ps1

# 测试数据库连接
python -c "from app.database import engine; engine.connect(); print('✅ 数据库连接成功')"
```

---

## 🚀 启动后端

### 步骤 1: 确保数据库运行

```powershell
# 检查容器是否运行
docker ps | findstr postgres

# 如果未运行，启动容器
docker start tradespro_postgres

# 或者使用 docker-compose
docker-compose up -d postgres
```

### 步骤 2: 初始化数据库（首次运行）

**选项 A: 自动初始化（推荐）**

后端启动时会自动调用 `init_db()` 创建表，但需要先导入模型。

**选项 B: 手动初始化**

```powershell
# 使用 psql 执行初始化脚本
docker exec -i tradespro_postgres psql -U tradespro_user -d tradespro < tradespro\backend\init.sql

# 或者进入容器执行
docker exec -it tradespro_postgres psql -U tradespro_user -d tradespro
# 然后复制粘贴 init.sql 内容
```

### 步骤 3: 启动后端服务

```powershell
# 在 backend 目录下
cd tradespro\backend

# 激活 venv
.\venv\Scripts\Activate.ps1

# 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🔍 故障排除

### 问题 1: 无法连接到数据库

**错误信息：**
```
psycopg.OperationalError: could not connect to server
```

**解决方案：**

1. **检查容器是否运行：**
   ```powershell
   docker ps
   ```

2. **检查端口映射：**
   ```powershell
   docker port tradespro_postgres
   # 应该显示: 5432/tcp -> 0.0.0.0:5432
   ```

3. **检查数据库连接字符串：**
   ```powershell
   # 确保使用 localhost（不是容器名称）
   DATABASE_URL=postgresql://tradespro_user:changeme@localhost:5432/tradespro
   ```

4. **检查防火墙：**
   ```powershell
   # Windows: 确保端口 5432 未被阻止
   netstat -ano | findstr :5432
   ```

### 问题 2: 表不存在

**错误信息：**
```
relation "users" does not exist
```

**解决方案：**

1. **检查表是否存在：**
   ```powershell
   docker exec -it tradespro_postgres psql -U tradespro_user -d tradespro -c "\dt"
   ```

2. **手动初始化（推荐使用脚本）：**
   ```powershell
   # 使用初始化脚本（最简单）
   cd tradespro\backend
   .\init_db.ps1
   
   # 或手动执行（PowerShell）
   Get-Content init.sql -Raw | docker exec -i tradespro_postgres psql -U tradespro_user -d tradespro
   ```

3. **或者让应用自动创建（需要导入模型）：**
   ```python
   # 确保在 app/database.py 中导入了所有模型
   from app.models import User, Project, Calculation, ...
   ```

### 问题 3: 密码错误

**错误信息：**
```
password authentication failed for user "tradespro_user"
```

**解决方案：**

1. **检查环境变量：**
   ```powershell
   docker exec tradespro_postgres env | findstr POSTGRES
   ```

2. **重新创建容器（如果忘记密码）：**
   ```powershell
   docker stop tradespro_postgres
   docker rm tradespro_postgres
   # 然后重新运行 docker run 命令
   ```

### 问题 4: 端口被占用

**错误信息：**
```
Error: bind: address already in use
```

**解决方案：**

1. **检查端口占用：**
   ```powershell
   netstat -ano | findstr :5432
   ```

2. **更改端口映射：**
   ```powershell
   docker run -d ... -p 5433:5432 ...  # 使用 5433 端口
   # 然后更新 DATABASE_URL: localhost:5433
   ```

---

## 📋 快速检查清单

- [ ] Docker 容器运行中
- [ ] 端口 5432 已映射
- [ ] `.env` 文件配置正确
- [ ] 数据库连接测试通过
- [ ] 数据库表已创建（或初始化）
- [ ] 后端服务可以启动

---

## 🎯 下一步

数据库配置完成后：
1. ✅ 启动后端服务
2. ✅ 运行测试脚本
3. ✅ 测试前端集成

参考 `TESTING_QUICK_START.md` 继续测试流程。

