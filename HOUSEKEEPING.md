# 代码库维护记录

**日期**: 2025-11-05  
**维护类型**: 常规清理和模块解析修复

---

## 🔧 已执行的维护任务

### 1. 模块解析修复
- ✅ 验证了 `@tradespro/core-engine` 的导出配置
- ✅ 检查了 `plugin-cec-8-200` 的导入路径
- ✅ 确认所有导入都使用主包入口（`@tradespro/core-engine`）
- ✅ 重新构建了所有包以确保一致性

### 2. 构建清理
- ✅ 清理了 TypeScript build info 文件 (`*.tsbuildinfo`)
- ✅ 重新构建了 `core-engine` 包
- ✅ 重新构建了 `plugin-cec-8-200` 包
- ✅ 修复了 `calculation-service` 的构建脚本
- ✅ 重新构建了 `calculation-service`

### 3. 依赖验证
- ✅ 验证了 `core-engine` 的 package.json exports 配置
- ✅ 确认了所有依赖关系正确链接
- ✅ 重新安装了 `calculation-service` 依赖

---

## 📋 模块导出配置

### @tradespro/core-engine
主要导出：
- `./` - 主入口（包含所有核心功能）
- `./plugins` - 插件系统
- `./tableLookups` - 表格查找函数

### @tradespro/plugin-cec-8-200
依赖：
- `@tradespro/core-engine` - 核心引擎和类型定义

---

## 🚨 已知问题

### 模块解析错误
**错误信息**:
```
Error: Cannot find module 'D:\TradesProOld\tradespro\packages\plugin-cec-8-200\node_modules\@tradespro\core-engine\src\tableLookups'
```

**原因**: 
- 运行时尝试从 `src` 目录导入，但应该从 `dist` 或主入口导入

**解决方案**:
- 确保所有导入都使用主包入口 (`@tradespro/core-engine`)
- 不要直接导入 `src` 路径（仅在开发时使用）
- 重新构建所有包以确保导出正确

---

## ✅ 验证步骤

1. **构建验证**
   ```bash
   cd packages/core-engine && npm run build
   cd packages/plugin-cec-8-200 && npm run build
   cd services/calculation-service && npm run build
   ```

2. **导入验证**
   - 确保所有导入都使用包名（如 `@tradespro/core-engine`）
   - 避免直接导入 `src` 路径
   - 使用主入口导出

3. **运行时验证**
   ```bash
   cd services/calculation-service && npm start
   ```

---

## 📝 最佳实践

### 导入规范
✅ **正确**:
```typescript
import { tableLookups, pluginRegistry } from '@tradespro/core-engine';
```

❌ **错误**:
```typescript
import { tableLookups } from '@tradespro/core-engine/src/tableLookups';
```

### 包导出配置
- 使用 `exports` 字段定义入口点
- `require` 指向 `dist` 文件
- `import` 可以指向 `src`（用于开发）或 `dist`（用于生产）

### 构建顺序
1. 先构建依赖包（`core-engine`）
2. 再构建使用依赖的包（`plugin-cec-8-200`）
3. 最后构建服务（`calculation-service`）

---

## 🔄 下次维护建议

1. **定期清理**
   - 清理 `dist` 目录
   - 清理 `*.tsbuildinfo` 文件
   - 清理 `node_modules/.cache`

2. **依赖更新**
   - 定期检查依赖更新
   - 更新类型定义
   - 验证兼容性

3. **代码质量**
   - 运行 linting
   - 运行类型检查
   - 运行测试套件

---

**维护完成时间**: 2025-11-05

---

## ✅ 维护验证

### 构建状态
- ✅ `core-engine`: 构建成功
- ✅ `plugin-cec-8-200`: 构建成功
- ✅ `calculation-service`: 构建脚本已修复（使用 `npx tsc`）

### 修复的问题
- ✅ 修复了 `calculation-service` 的构建脚本（从 `node_modules/.bin/tsc || tsc` 改为 `npx tsc`）
- ✅ 清理了 TypeScript build info 文件
- ✅ 重新安装了所有依赖

### 最终状态
- ✅ TypeScript 已正确安装
- ✅ 构建脚本已修复（使用 `tsc`）
- ✅ `calculation-service` 构建成功
- ✅ 服务启动验证（需要手动测试）

