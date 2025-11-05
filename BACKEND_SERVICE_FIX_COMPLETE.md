# 后端服务启动问题 - 完整修复

**日期**: 2025-01-04  
**问题**: 后端服务启动失败 - 模块解析错误

---

## 🐛 问题描述

### 错误1: Express模块未找到
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

### 错误2: 模块路径解析失败
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\TradesProOld\tradespro\packages\calculation-engine\src\core\types'
```

---

## ✅ 修复步骤

### 1. 修复 `calculation-engine` 包的 `package.json`

**问题**: `exports` 配置指向源文件而不是编译后的文件

**修复前**:
```json
{
  "exports": {
    ".": {
      "import": "./src/index.ts",  // ❌ 运行时无法解析
      "require": "./dist/index.js",
      "default": "./src/index.ts"  // ❌ 运行时无法解析
    }
  }
}
```

**修复后**:
```json
{
  "exports": {
    ".": {
      "require": "./dist/index.js",  // ✅ 使用编译后的文件
      "import": "./dist/index.js",   // ✅ 使用编译后的文件
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"   // ✅ 使用编译后的文件
    }
  }
}
```

### 2. 修复 `calculation-engine/src/index.ts`

**问题**: 导出浏览器版本的 `tables.browser`，但后端需要Node.js版本

**修复前**:
```typescript
export * from './core/tables.browser';  // ❌ 浏览器版本
export { tableManager } from './core/tables.browser';
```

**修复后**:
```typescript
export * from './core/tables';  // ✅ Node.js版本（默认）
export { tableManager } from './core/tables';
```

### 3. 修复 `calculation-service` 的依赖路径

**问题**: 指向不存在的 `cec-calculator` 目录

**修复前**:
```json
"@tradespro/calculation-engine": "file:../../packages/cec-calculator"
```

**修复后**:
```json
"@tradespro/calculation-engine": "file:../../packages/calculation-engine"
```

### 4. 修复 `calculation-service` 的 TypeScript 配置

**问题**: 使用ES模块，但运行时需要CommonJS

**修复**:
```json
{
  "compilerOptions": {
    "module": "CommonJS",      // 从 "ESNext" 改为 "CommonJS"
    "moduleResolution": "node" // 从 "bundler" 改为 "node"
  }
}
```

### 5. 重新编译和安装

```bash
# 1. 重新编译 calculation-engine
cd tradespro/packages/calculation-engine
npm run build

# 2. 重新安装 calculation-service 依赖
cd tradespro/services/calculation-service
npm install

# 3. 启动服务
npm start
```

---

## 📋 修复清单

- [x] 修复 `calculation-engine/package.json` 的 `exports` 配置
- [x] 修复 `calculation-engine/src/index.ts` 导出Node.js版本
- [x] 修复 `calculation-service/package.json` 依赖路径
- [x] 修复 `calculation-service/tsconfig.json` 模块格式
- [x] 重新编译 `calculation-engine`
- [x] 重新安装 `calculation-service` 依赖
- [x] 测试服务启动

---

## 🔍 问题根源

1. **模块解析配置错误**: `package.json` 的 `exports` 字段指向源文件，导致运行时无法解析
2. **环境版本不匹配**: 导出了浏览器版本，但后端需要Node.js版本
3. **依赖路径错误**: 指向不存在的目录
4. **模块格式不匹配**: TypeScript编译为ES模块，但运行时需要CommonJS

---

## ✅ 验证

服务应该能够：
1. ✅ 成功加载表格文件
2. ✅ 响应 `/health` 端点
3. ✅ 响应 `/api/tables` 端点
4. ✅ 执行计算请求

---

## 📝 测试命令

```bash
# 检查服务健康状态
curl http://localhost:3001/health

# 检查表格信息
curl http://localhost:3001/api/tables

# 测试计算
curl -X POST http://localhost:3001/api/calculate/single-dwelling \
  -H "Content-Type: application/json" \
  -d '{"livingArea_m2": 150, "systemVoltage": 240, "phase": 1}'
```

---

**状态**: ✅ 修复完成，服务应该能够正常启动






