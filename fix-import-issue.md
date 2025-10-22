# 修复导入问题指南

## 🔧 问题分析

前端无法找到 `@tradespro/calculation-service` 包，这是因为：

1. 计算服务还没有被构建
2. 前端无法正确引用本地包
3. 需要先构建计算服务，然后在前端中引用

## 🚀 解决方案

### 方案1：构建计算服务（推荐）

```bash
# 1. 进入tradespro根目录
cd D:\TradesProOld\tradespro

# 2. 构建计算服务
cd services/calculation-service
npm install
npm run build

# 3. 回到根目录，安装所有依赖
cd ../..
npm install

# 4. 启动前端
cd frontend
npm run dev
```

### 方案2：临时修复（快速测试）

修改前端代码，暂时移除对计算服务的依赖：

1. 在 `frontend/src/pages/CalculatorPage.vue` 中注释掉计算服务相关的导入
2. 使用模拟数据来测试界面功能

### 方案3：使用Docker（完整解决方案）

```bash
# 在tradespro根目录
docker-compose up -d
```

## 🎯 推荐步骤

### 步骤1：构建计算服务
```bash
cd D:\TradesProOld\tradespro\services\calculation-service
npm install
npm run build
```

### 步骤2：安装根目录依赖
```bash
cd D:\TradesProOld\tradespro
npm install
```

### 步骤3：启动前端
```bash
cd frontend
npm run dev
```

## 🔍 如果还有问题

### 检查计算服务是否构建成功
```bash
# 检查dist目录是否存在
ls services/calculation-service/dist
```

### 检查package.json配置
确保根目录的package.json包含正确的工作区配置。

### 使用Docker（最可靠）
```bash
docker-compose up -d
```

## 📝 临时修复代码

如果急需测试前端界面，可以临时修改 `CalculatorPage.vue`：

```typescript
// 注释掉这行
// import { tableManager } from '@tradespro/calculation-service';

// 添加模拟数据
const mockTableManager = {
  loadTables: async () => ({ table2: {}, table4: {} })
};
```

这样可以让前端先运行起来，测试界面功能。
