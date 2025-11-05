# 架构审计报告 - 对照专家建议的全面检查

**日期**: 2025-01-04  
**审计人**: AI Assistant  
**对照标准**: 专家建议的V5插件化架构

---

## 📋 执行摘要

经过全面检查，当前架构在以下方面**已显著改善**，但仍存在**关键问题**需要立即修复：

### ✅ 已解决的问题
1. ✅ **冲突1**: `cecLoadCalculator.ts` 已不存在（已删除或重命名）
2. ✅ **冲突2**: `useOfflineCalculation.ts` 已不再使用 `fetch` 调用后端API
3. ✅ **8-200-single-dwelling.ts**: 协调器实现完整，没有明显的TODO

### ⚠️ 仍需修复的关键问题
1. ❌ **冲突3**: `tables.ts` 仍使用 `fs.readFile`，无法在前端运行
2. ❌ **插件系统未使用**: 前后端都没有通过plugin registry调用计算
3. ❌ **架构不一致**: 没有按照V5插件化架构重构

---

## 🔍 详细检查结果

### 1. 冲突1：协调器实现混乱

#### 检查结果：✅ **已解决**

**检查方法**:
```bash
grep -r "cecLoadCalculator" tradespro/
```

**结果**:
- ❌ 未找到 `cecLoadCalculator.ts` 文件
- ✅ 所有引用都是文档中的历史记录
- ✅ `8-200-single-dwelling.ts` 存在且完整

**结论**: `cecLoadCalculator.ts` 已被删除或重命名，不再存在冲突。

---

### 2. 冲突2：前端离线逻辑错误

#### 检查结果：✅ **部分解决，但未使用插件系统**

**当前实现** (`tradespro/frontend/src/composables/useOfflineCalculation.ts`):
```typescript
// ✅ 正确：直接调用计算函数，不通过fetch
import { computeSingleDwelling, computeNECSingleDwelling } from '@tradespro/calculation-engine';
import { tableManager } from '@tradespro/calculation-engine';

// ✅ 正确：本地加载表格
const ruleTables = await tableManager.loadTables(codeEdition);

// ✅ 正确：本地执行计算
resultBundle = computeSingleDwelling(inputs, engineMeta, ruleTables);
```

**问题**:
- ❌ **未使用插件系统**: 直接调用 `computeSingleDwelling`，而不是通过 `pluginRegistry.executePlugin()`
- ❌ **tableManager在浏览器中无法工作**: `tableManager.loadTables()` 内部使用 `fs.readFile`，浏览器无法执行

**专家建议的实现**:
```typescript
// 应该使用插件系统
import { pluginRegistry, executePlugin, createPluginContext } from "@tradespro/core-engine";
import { cecSingleDwellingPlugin } from "@tradespro/plugin-cec-8-200";

pluginRegistry.registerDefault(cecSingleDwellingPlugin);

const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
```

**结论**: 前端离线逻辑已改进，但**未遵循V5插件化架构**，仍需要重构。

---

### 3. 冲突3：`tables.ts` 的I/O耦合

#### 检查结果：❌ **严重问题，需要立即修复**

**当前实现** (`tradespro/packages/calculation-engine/src/core/tables.ts`):
```typescript
import fs from 'fs/promises';  // ❌ Node.js特有
import path from 'path';      // ❌ Node.js特有

async function readTable(tablesDir: string, fileName: string): Promise<any> {
  const content = await fs.readFile(path.join(tablesDir, fileName), 'utf-8');
  return JSON.parse(content);
}
```

**问题**:
1. ❌ 使用 `fs.readFile` - 浏览器无法执行
2. ❌ 使用 `path.join` - 浏览器环境不支持
3. ❌ `__dirname` - 浏览器环境不存在
4. ❌ 无法在前端（浏览器/Capacitor）中运行

**专家建议的解决方案**:
```typescript
// 分离：tableLookups.ts (纯函数)
// - selectAmpacityColumn
// - lookupAmbientFactor
// - lookupConductorSize
// 移入 @tradespro/core-engine

// 分离：tableLoader.ts (带I/O，环境特定)
// - 后端：使用 fs.readFile
// - 前端：使用 fetch 或 IndexedDB
// 不放入核心引擎包
```

**结论**: **严重问题**，需要立即分离I/O操作。

---

### 4. 插件系统使用情况

#### 检查结果：❌ **未使用插件系统**

**检查方法**:
```bash
grep -r "pluginRegistry\|executePlugin" tradespro/
```

**结果**:
- ✅ `pluginRegistry` 类已定义 (`packages/calculation-engine/src/plugins/registry.ts`)
- ✅ `cecSingleDwellingPlugin` 已创建 (`packages/calculation-engine/src/plugins/builtin/cec-single-dwelling-plugin.ts`)
- ❌ **前后端都没有使用插件系统**
- ❌ 前端直接调用 `computeSingleDwelling()`
- ❌ 后端直接调用 `computeSingleDwelling()`

**专家建议**: 所有计算都应通过插件系统执行：
```typescript
// 后端
const result = await executePlugin('cec-single-dwelling-2024', inputs, context);

// 前端
const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
```

**结论**: **架构不一致**，需要重构为插件化架构。

---

## 🎯 修复优先级

### P0 - 立即修复（阻塞性问题）

1. **分离 `tables.ts` 的I/O操作**
   - 创建 `tableLookups.ts`（纯函数，移入core-engine）
   - 创建 `tableLoader.ts`（环境特定，分别实现浏览器和Node.js版本）
   - 修复前端 `tableManager.loadTables()` 无法工作的问题

### P1 - 高优先级（架构一致性）

2. **重构为插件化架构**
   - 创建 `@tradespro/core-engine` 包
   - 创建 `@tradespro/plugin-cec-8-200` 包
   - 重构 `useOfflineCalculation.ts` 使用插件系统
   - 重构后端服务使用插件系统

### P2 - 中优先级（完善）

3. **完善插件系统**
   - 实现 `executePlugin` 函数
   - 实现 `createPluginContext` 函数
   - 添加插件加载和验证逻辑

---

## 📝 修复方案

### 方案1：立即修复 tables.ts I/O问题（P0）

**步骤**:
1. 创建 `packages/calculation-engine/src/core/tableLookups.ts`（纯函数）
2. 创建 `packages/calculation-engine/src/core/tableLoader.node.ts`（Node.js版本）
3. 创建 `packages/calculation-engine/src/core/tableLoader.browser.ts`（浏览器版本）
4. 更新 `tables.ts` 导出环境特定的loader

### 方案2：实现V5插件化架构（P1）

**步骤**:
1. 创建 `packages/core-engine/` 包
2. 创建 `packages/plugin-cec-8-200/` 包
3. 迁移插件接口到 `core-engine`
4. 迁移计算逻辑到 `plugin-cec-8-200`
5. 重构前后端使用插件系统

---

## ✅ 检查清单

- [x] 检查 `cecLoadCalculator.ts` 是否存在
- [x] 检查 `useOfflineCalculation.ts` 是否使用fetch
- [x] 检查 `tables.ts` 是否使用fs/path
- [x] 检查插件系统是否被使用
- [x] 检查 `8-200-single-dwelling.ts` 是否有TODO
- [ ] 修复 `tables.ts` I/O耦合问题
- [ ] 实现插件化架构重构
- [ ] 测试前端离线计算功能
- [ ] 测试后端计算服务功能

---

## 📌 结论

当前架构**已显著改善**，主要冲突1和冲突2已解决。但**冲突3（tables.ts I/O耦合）是严重问题**，需要立即修复。同时，**未使用插件系统**意味着架构仍未完全符合V5插件化架构的要求。

**建议**: 先修复P0问题（tables.ts），然后逐步实现V5插件化架构。






