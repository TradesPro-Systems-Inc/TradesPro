# 表格数据与计算引擎分离架构分析

**日期**: 2025-01-04  
**问题**: 表格数据和计算引擎是否可以/应该分离？

---

## 📊 当前架构

### 现状：表格数据在计算引擎内

```
@tradespro/calculation-engine/
├── src/                    # 计算逻辑
│   ├── rules/              # 规则协调器
│   ├── calculators/        # 计算器
│   └── core/               # 表格加载器
├── data/                   # 表格数据 ⚠️
│   └── tables/
│       └── 2024/
└── package.json
```

**特点**:
- ✅ 简单：一个包包含所有依赖
- ✅ 版本一致：表格和计算逻辑版本绑定
- ⚠️ 耦合：表格更新需要重新发布计算引擎

---

## 🔄 分离架构方案

### 方案1: 独立表格包（推荐）

```
@tradespro/cec-tables/
├── data/
│   └── tables/
│       ├── 2021/
│       ├── 2024/
│       └── 2027/
├── package.json
└── README.md

@tradespro/calculation-engine/
├── src/                    # 只包含计算逻辑
└── package.json
  "dependencies": {
    "@tradespro/cec-tables": "^1.0.0"
  }
```

**优点**:
- ✅ **职责分离**: 表格数据独立管理
- ✅ **独立更新**: 表格更新不影响计算引擎
- ✅ **版本控制**: 表格版本独立管理
- ✅ **可复用**: 多个计算引擎可共享同一套表格
- ✅ **缓存优化**: 表格数据可以单独缓存
- ✅ **按需加载**: 可以只加载需要的版本（2021/2024/2027）

**缺点**:
- ⚠️ **依赖管理**: 需要管理两个包的版本兼容性
- ⚠️ **构建复杂度**: 需要同步两个包的发布

---

### 方案2: 表格作为资源包（更灵活）

```
@tradespro/tables/
├── cec/
│   └── 2024/
├── nec/
│   └── 2023/
└── package.json

@tradespro/calculation-engine/
├── src/
└── package.json
  "dependencies": {
    "@tradespro/tables": "^1.0.0"
  }
```

**优点**:
- ✅ **多标准支持**: CEC、NEC、未来标准
- ✅ **统一管理**: 所有表格在一个包
- ✅ **版本独立**: 表格版本与计算引擎解耦

---

## 🎯 推荐方案：渐进式分离

### 阶段1: 当前（已实现）
- 表格数据在 `calculation-engine` 内
- 适合MVP和快速开发

### 阶段2: 分离（未来优化）
- 创建 `@tradespro/cec-tables` 包
- 计算引擎依赖表格包
- 保持向后兼容

### 阶段3: 多标准支持
- 创建 `@tradespro/tables` 统一包
- 支持CEC、NEC等多种标准
- 插件化加载

---

## 📋 实施建议

### 如果选择分离，需要：

1. **创建新包**:
   ```bash
   packages/
     cec-tables/
       package.json
       data/tables/2024/
   ```

2. **更新计算引擎**:
   ```json
   // calculation-engine/package.json
   {
     "dependencies": {
       "@tradespro/cec-tables": "workspace:*"
     }
   }
   ```

3. **更新加载器**:
   ```typescript
   // tableLoader.node.ts
   import { getTablePath } from '@tradespro/cec-tables';
   const tablesDir = getTablePath('2024');
   ```

4. **更新前端**:
   ```json
   // frontend/package.json
   {
     "dependencies": {
       "@tradespro/cec-tables": "workspace:*"
     }
   }
   ```

---

## 🤔 何时应该分离？

### ✅ 应该分离的情况：
1. **多标准支持**: 需要支持CEC、NEC、IEC等多种标准
2. **频繁更新**: 表格数据需要频繁更新（如每年新版本）
3. **多引擎共享**: 多个计算引擎需要共享同一套表格
4. **大型团队**: 表格维护团队和计算引擎团队分离
5. **离线缓存**: 需要独立缓存表格数据

### ⚠️ 可以不分离的情况：
1. **MVP阶段**: 快速开发和迭代
2. **单一标准**: 只支持CEC
3. **小团队**: 团队规模小，不需要复杂管理
4. **版本绑定**: 表格版本必须与计算引擎版本绑定

---

## 💡 当前建议

### 建议：**暂时保持现状，但准备分离**

**理由**:
1. **MVP阶段**: 当前是MVP，快速迭代更重要
2. **单一标准**: 目前主要支持CEC（NEC刚加入）
3. **架构已就绪**: 当前的加载器设计已经支持未来分离
4. **渐进式**: 可以在需要时再分离，不影响现有代码

### 准备措施：
1. ✅ **加载器抽象**: 已经有 `tableLoader.node.ts` 和 `tableLoader.browser.ts`
2. ✅ **路径配置**: 表格路径可以通过配置注入
3. ⚠️ **待实现**: 创建独立的表格包（当需要时）

---

## 🔧 迁移路径（如果未来需要分离）

### 步骤1: 创建表格包
```bash
mkdir packages/cec-tables
cp -r packages/calculation-engine/data packages/cec-tables/
```

### 步骤2: 更新计算引擎
```typescript
// 从
const tablesDir = path.join(__dirname, '../../data/tables', edition);
// 改为
import { getTablePath } from '@tradespro/cec-tables';
const tablesDir = getTablePath(edition);
```

### 步骤3: 更新依赖
```json
// calculation-engine/package.json
{
  "dependencies": {
    "@tradespro/cec-tables": "workspace:*"
  }
}
```

---

## 📊 对比总结

| 特性 | 当前（在一起） | 分离架构 |
|------|----------------|---------|
| **简单性** | ✅ 简单 | ⚠️ 复杂 |
| **版本管理** | ⚠️ 绑定 | ✅ 独立 |
| **更新频率** | ⚠️ 一起更新 | ✅ 独立更新 |
| **可复用性** | ⚠️ 单一引擎 | ✅ 多引擎共享 |
| **缓存** | ⚠️ 一起缓存 | ✅ 独立缓存 |
| **构建复杂度** | ✅ 简单 | ⚠️ 需要同步 |

---

## 🎯 最终建议

**当前阶段**: 保持现状，表格和计算引擎在一起
- ✅ 简单高效
- ✅ 适合MVP
- ✅ 架构已为未来分离做好准备

**未来阶段**: 当需要时再分离
- 支持多标准（CEC、NEC、IEC等）
- 表格需要频繁独立更新
- 多个计算引擎需要共享表格

---

**结论**: 表格和计算引擎**可以放在一起**（当前架构），也**可以分离**（未来优化）。当前架构已经为未来分离做好了准备，可以在需要时平滑迁移。






