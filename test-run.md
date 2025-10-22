# TradesPro 测试运行指南

## 🚀 快速测试步骤

### 方法1：前端测试（推荐，最快）

```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖（如果还没安装）
npm install

# 3. 启动开发服务器
npm run dev
```

**预期结果**：
- 前端服务器启动在 `http://localhost:9000`
- 浏览器会自动打开
- 您可以看到TradesPro界面

### 方法2：完整系统测试（Docker）

```bash
# 1. 在tradespro根目录
cd ..

# 2. 启动所有服务
docker-compose up -d

# 3. 检查服务状态
docker-compose ps
```

**预期结果**：
- 前端：http://localhost:9000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs
- 计算服务：http://localhost:3001

### 方法3：分别启动服务

#### 启动后端
```bash
# 进入后端目录
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 启动FastAPI服务器
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 启动计算服务
```bash
# 进入计算服务目录
cd services/calculation-service

# 安装依赖
npm install

# 启动服务
npm run dev
```

## 🎯 测试功能

### 1. 基础计算功能
- 打开 http://localhost:9000
- 输入居住面积（如150平方米）
- 点击"计算（离线）"
- 查看计算结果

### 2. 字体大小调整
- 点击顶部工具栏的字体大小按钮
- 选择小字体、中字体、大字体
- 观察界面字体变化

### 3. 用户管理
- 点击用户头像菜单
- 选择"用户设置"
- 编辑个人信息

### 4. 项目管理
- 点击"项目管理"导航
- 查看项目列表
- 点击"新建项目"创建项目

## 🔧 故障排除

### 前端启动失败
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### 后端启动失败
```bash
# 检查Python版本
python --version

# 安装依赖
pip install -r requirements.txt

# 检查端口占用
netstat -an | findstr :8000
```

### Docker启动失败
```bash
# 检查Docker状态
docker --version
docker-compose --version

# 清理Docker缓存
docker system prune -f

# 重新启动
docker-compose down
docker-compose up -d
```

## 📱 移动端测试

### Android测试
```bash
# 在frontend目录
npx quasar mode add capacitor android
npx cap sync android
npx cap open android
```

### iOS测试
```bash
# 在frontend目录
npx quasar mode add capacitor ios
npx cap sync ios
npx cap open ios
```

## 🎉 成功标志

### 前端成功启动
- ✅ 浏览器打开 http://localhost:9000
- ✅ 看到TradesPro界面
- ✅ 可以输入计算参数
- ✅ 字体大小调整功能正常
- ✅ 用户设置和项目管理页面可访问

### 后端成功启动
- ✅ http://localhost:8000/docs 可访问
- ✅ API端点响应正常
- ✅ 计算服务 http://localhost:3001 可访问

### 完整系统成功
- ✅ 所有服务都在运行
- ✅ 前端可以调用后端API
- ✅ 计算功能正常工作
- ✅ 数据持久化正常

## 🆘 需要帮助？

如果遇到问题，请检查：
1. Node.js版本 >= 18.0.0
2. Python版本 >= 3.8
3. Docker和Docker Compose已安装
4. 端口8000、9000、3001没有被占用
5. 防火墙设置允许这些端口

**现在开始测试吧！** 🚀
