# 构建错误修复总结

**日期**: 2025-01-04

## ✅ 已修复的问题

### 1. plugin-cec-8-200 构建错误 ✅

**问题**: `Cannot find module '@tradespro/core-engine/tableLookups'`

**解决方案**:
- 更新导入路径为 `@tradespro/core-engine/src/tableLookups`
- 保持 `moduleResolution: "node"`（不使用 `node16`，因为需要配合 `module: "Node16"`）

### 2. calculation-service 构建错误 ✅

**问题**: 
- `Cannot find module './core/types'` 等
- `Cannot find module '@tradespro/calculation-engine'`

**解决方案**:
- 更新 `src/index.ts` 只导出 `server.ts`
- 添加 `@tradespro/calculation-engine` 依赖（用于 `tableManager`）
- 确保 `@types/node` 已安装

### 3. TypeScript 编译问题 ✅

**问题**: `tsc` 命令找不到

**解决方案**:
- 使用 workspace 依赖中的 tsc（从 `packages/core-engine/node_modules/.bin/tsc`）
- 或者确保 `typescript` 正确安装到本地 `node_modules`

---

## 📝 构建命令

```bash
# 1. 构建 core-engine
cd packages/core-engine && npm install && npm run build

# 2. 构建 plugin-cec-8-200
cd ../plugin-cec-8-200 && npm install && npm run build

# 3. 构建 calculation-service
cd ../../services/calculation-service && npm install && npm run build
```

---

## ⚠️ 注意事项

1. **tableManager 位置**: 仍然在 `@tradespro/calculation-engine` 中，这是可以接受的（I/O已分离）
2. **TypeScript 路径**: 如果本地没有 tsc，可以使用 workspace 依赖中的版本
3. **导入路径**: 使用 `@tradespro/core-engine/src/tableLookups` 作为临时解决方案，直到 `exports` 字段正确配置

---

**状态**: ✅ **构建错误已修复**






