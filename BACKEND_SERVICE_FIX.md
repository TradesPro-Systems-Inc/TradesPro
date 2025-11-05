# 后端服务启动问题修复

**日期**: 2025-01-04  
**问题**: 后端服务启动失败 - `Cannot find package 'express'`

---

## 🐛 问题描述

启动后端服务时遇到错误：
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express' imported from D:\TradesProOld\tradespro\services\calculation-service\dist\server.js
```

---

## ✅ 修复步骤

### 1. 修复依赖路径
**问题**: `package.json` 中 `@tradespro/calculation-engine` 路径错误

**修复前**:
```json
"@tradespro/calculation-engine": "file:../../packages/cec-calculator"
```

**修复后**:
```json
"@tradespro/calculation-engine": "file:../../packages/calculation-engine"
```

### 2. 修复TypeScript配置
**问题**: `tsconfig.json` 使用ES模块，但运行时需要CommonJS

**修复**:
```json
{
  "compilerOptions": {
    "module": "CommonJS",  // 从 "ESNext" 改为 "CommonJS"
    "moduleResolution": "node"  // 从 "bundler" 改为 "node"
  }
}
```

### 3. 修复构建脚本
**问题**: TypeScript未正确安装

**修复**:
```json
{
  "scripts": {
    "build": "npx tsc"  // 使用npx确保能找到TypeScript
  }
}
```

### 4. 重新安装依赖
```bash
cd tradespro/services/calculation-service
npm install
```

---

## ⚠️ 待解决的问题

### TypeScript安装问题
- TypeScript在devDependencies中，但npm install后未正确安装到node_modules
- 可能需要：
  1. 删除node_modules和package-lock.json
  2. 重新安装：`npm install`
  3. 或使用全局TypeScript：`npm install -g typescript`

### 模块格式问题
- dist/server.js使用ES模块语法（`import`），但tsconfig.json已改为CommonJS
- 需要重新编译：`npm run build`

---

## 📝 下一步操作

1. **确保TypeScript正确安装**
   ```bash
   cd tradespro/services/calculation-service
   npm install typescript --save-dev
   ```

2. **重新编译**
   ```bash
   npm run build
   ```

3. **启动服务**
   ```bash
   npm start
   ```

4. **验证服务**
   ```bash
   curl http://localhost:3001/health
   ```

---

## 📋 检查清单

- [x] 修复package.json依赖路径
- [x] 修复tsconfig.json模块配置
- [x] 修复构建脚本
- [ ] 确保TypeScript正确安装
- [ ] 重新编译代码
- [ ] 测试服务启动
- [ ] 验证表格加载功能

---

## 🔍 问题根源

1. **依赖路径错误**: 指向不存在的`cec-calculator`目录
2. **模块格式不匹配**: TypeScript编译为ES模块，但Node.js运行时需要CommonJS
3. **TypeScript未安装**: devDependencies中声明但未正确安装

---

**状态**: ⚠️ 部分修复完成，需要重新编译和测试






