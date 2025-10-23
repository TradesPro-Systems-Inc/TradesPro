# TradesPro 计算引擎架构分析

**日期**: 2025-10-23  
**状态**: 当前使用前端独立计算引擎

---

## 📊 当前架构状态

### ✅ 实现情况

#### 1. **前端计算引擎**（✅ 已实现且正在使用）
- **位置**: `frontend/src/composables/useOfflineCalculation.ts`
- **实现**: 第 54-535 行，完整的 CEC 8-200 计算逻辑
- **特点**:
  - 纯同步计算，无需后端
  - 完全离线工作
  - 生成完整的 audit trail
  - 本地存储持久化

```typescript
// 第 578 行 - 实际调用
const rawBundle = calculateSingleDwelling(
  inputs,
  engineMeta,
  tableManager.loadTables()
);
```

#### 2. **微服务计算引擎**（✅ 已实现但未启用）
- **位置**: `services/calculation-service/src/calculators/cecLoadCalculator.ts`
- **实现**: 完整的 TypeScript 实现
- **特点**:
  - 服务端计算
  - 完整的审计跟踪
  - 可签名验证
  - **当前未被前端调用**

#### 3. **云端同步**（⚠️ 可选功能）
- **位置**: `useOfflineCalculation.ts` 第 736-751 行
- **功能**: 后台静默同步到云端
- **特点**:
  - 不影响离线功能
  - 仅保存计算结果
  - **不进行计算验证**

---

## ⚠️ 问题分析

### 核心问题：**双引擎架构风险**

```
用户输入
   ↓
前端计算引擎 ──→ Audit Trail A
   ↓
结果 + Audit Trail
   ↓
(可选) 云端同步
   ↓
微服务引擎 (未调用) ──→ Audit Trail B (不存在)
```

### 具体风险

1. **代码重复**
   - 前端：`useOfflineCalculation.ts` (第 54-535 行)
   - 后端：`cecLoadCalculator.ts` (完整实现)
   - **问题**: 两套独立代码，需手动保持同步

2. **逻辑不一致**
   - 修改 CEC 规则需要改两处
   - 容易导致前后端计算结果不同
   - 无法保证审计记录一致性

3. **维护成本高**
   - 每次 CEC 规则更新需要双倍工作量
   - Bug 修复需要两边都改
   - 测试需要覆盖两个引擎

4. **审计记录差异**
   ```typescript
   // 前端生成的 audit trail
   {
     stepIndex: 7,
     operationId: 'select_conductor',
     note: "Required base ampacity: 129.80A ÷ 0.880 = 147.50A..."
   }
   
   // 后端可能生成不同的 audit trail（如果被调用）
   {
     stepIndex: 7,
     operationId: 'conductor_selection',
     note: "Base ampacity calculation: ..." // 格式可能不同
   }
   ```

---

## 🎯 解决方案

### 方案 1: 统一到前端（当前实现）

#### ✅ 优点
- 完全离线工作 ⭐⭐⭐⭐⭐
- 响应速度快（无网络延迟）
- 移动端友好
- 用户体验最佳
- 无需服务器成本

#### ❌ 缺点
- 无法保证计算一致性 ⚠️
- 难以版本管理
- 审计记录无签名验证
- 更新需要重新部署前端

#### 适用场景
- 个人用户
- 离线使用为主
- 不需要法律签名
- 成本敏感

---

### 方案 2: 统一到微服务（推荐用于企业版）

#### ✅ 优点
- 单一真实数据源 ⭐⭐⭐⭐⭐
- 审计记录一致
- 版本管理容易
- 可签名验证
- 更新无需重新部署前端

#### ❌ 缺点
- 需要网络连接
- 响应稍慢（网络延迟）
- 服务器成本
- 离线功能受限

#### 实现步骤

```typescript
// 1. 修改 useOfflineCalculation.ts
async function calculateLocally(inputs: CecInputsSingle) {
  loading.value = true;
  const startTime = performance.now();

  try {
    // 优先使用微服务
    if (navigator.onLine) {
      const response = await fetch('/api/v1/calculate/single-dwelling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      
      bundle.value = await response.json();
    } else {
      // 离线回退到本地引擎
      const engineMeta = { ... };
      bundle.value = calculateSingleDwelling(inputs, engineMeta, tableManager.loadTables());
    }

    calculationTimeMs.value = performance.now() - startTime;
    await saveToLocalStorage(bundle.value);
    return bundle.value;
  } catch (err) {
    // 网络错误时回退到本地引擎
    console.warn('微服务调用失败，使用本地引擎');
    const engineMeta = { ... };
    bundle.value = calculateSingleDwelling(inputs, engineMeta, tableManager.loadTables());
    return bundle.value;
  }
}
```

#### 适用场景
- 企业用户
- 需要法律签名
- 审计合规要求高
- 在线使用为主

---

### 方案 3: 共享计算核心（最优，需重构）⭐⭐⭐⭐⭐

#### ✅ 优点
- **逻辑完全一致**
- 前端可离线工作
- 后端可签名验证
- 单一维护点
- 审计记录一致

#### 实现架构

```
tradespro/
├── packages/
│   └── cec-calculator/          # 共享计算包
│       ├── package.json
│       ├── src/
│       │   ├── index.ts         # 导出主函数
│       │   ├── cec-8-200.ts     # CEC 8-200 规则
│       │   ├── cec-8-202.ts     # CEC 8-202 规则
│       │   ├── tables.ts        # CEC 表格数据
│       │   └── types.ts         # 共享类型
│       └── tests/
│           └── cec-8-200.test.ts
├── frontend/
│   └── src/
│       └── composables/
│           └── useOfflineCalculation.ts
│               # import { calculateSingleDwelling } from '@tradespro/cec-calculator';
└── services/
    └── calculation-service/
        └── src/
            └── calculators/
                └── cecLoadCalculator.ts
                    # import { calculateSingleDwelling } from '@tradespro/cec-calculator';
```

#### 实现步骤

**步骤 1: 创建共享包**

```bash
# 1. 创建包
cd tradespro
mkdir -p packages/cec-calculator/src
cd packages/cec-calculator

# 2. 初始化包
npm init -y

# 3. 配置 package.json
```

```json
{
  "name": "@tradespro/cec-calculator",
  "version": "1.0.0",
  "description": "TradesPro CEC Load Calculation Engine",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**步骤 2: 提取计算逻辑**

```typescript
// packages/cec-calculator/src/index.ts
export * from './cec-8-200';
export * from './types';
export * from './tables';

// packages/cec-calculator/src/cec-8-200.ts
import { CecInputsSingle, UnsignedBundle, EngineMeta, RuleTables } from './types';

/**
 * CEC 8-200 Single Dwelling Load Calculation
 * Pure function - works in browser and Node.js
 */
export function calculateSingleDwelling(
  inputs: CecInputsSingle,
  engineMeta: EngineMeta,
  tables: RuleTables
): UnsignedBundle {
  // 将现有的计算逻辑移到这里
  // ... (当前 useOfflineCalculation.ts 第 54-535 行的代码)
}
```

**步骤 3: 前端使用共享包**

```typescript
// frontend/src/composables/useOfflineCalculation.ts
import { calculateSingleDwelling } from '@tradespro/cec-calculator';

export function useOfflineCalculation() {
  // ...
  async function calculateLocally(inputs: CecInputsSingle) {
    // ✅ 使用共享计算引擎
    const rawBundle = calculateSingleDwelling(
      inputs,
      engineMeta,
      tableManager.loadTables()
    );
    // ...
  }
}
```

**步骤 4: 后端使用共享包**

```typescript
// services/calculation-service/src/calculators/cecLoadCalculator.ts
import { calculateSingleDwelling } from '@tradespro/cec-calculator';

export function calculateSingleDwellingService(
  inputs: CecInputsSingle
): UnsignedBundle {
  const engineMeta = {
    name: 'tradespro-cec-engine',
    version: process.env.VERSION || '1.0.0',
    commit: process.env.GIT_COMMIT || 'unknown'
  };
  
  // ✅ 使用共享计算引擎（与前端完全一致）
  const bundle = calculateSingleDwelling(
    inputs,
    engineMeta,
    loadTables()
  );
  
  // 可选：添加服务端签名
  return addSignature(bundle);
}
```

#### 适用场景
- 所有场景 ⭐⭐⭐⭐⭐
- 长期维护
- 团队协作
- 质量要求高

---

## 📋 当前状态总结

### ✅ 已实现
1. 前端独立计算引擎（完整）
2. 微服务计算引擎（完整但未使用）
3. 离线持久化存储
4. 云端后台同步（可选）

### ⚠️ 存在问题
1. **双引擎代码重复**
2. **无计算验证机制**
3. **审计记录可能不一致**
4. **维护成本高**

### 🎯 建议
1. **短期**（1-2周）：
   - 添加前后端计算对比功能
   - 在开发环境中启用双引擎验证
   - 确保两边逻辑一致

2. **中期**（1-2月）：
   - 实施方案 3（共享计算核心）
   - 重构为 monorepo 架构
   - 统一测试套件

3. **长期**（3-6月）：
   - 实现计算签名验证
   - 添加版本回溯功能
   - 支持多版本 CEC 规范

---

## 🔍 审计记录对比需求

### 问题
> 计算完成后，audit trail 每一步应该都和之前的计算比一下需不需要？

### 答案
**需要！** 原因：

1. **法律合规**
   - 审计记录用于证明计算过程
   - 前后端结果必须一致
   - 差异可能导致法律问题

2. **质量保证**
   - 及时发现计算逻辑错误
   - 防止代码漂移
   - 确保更新同步

3. **调试工具**
   - 帮助定位问题
   - 验证修复效果
   - 回归测试

### 实现建议

```typescript
// 添加验证函数
async function validateCalculation(inputs: CecInputsSingle) {
  // 1. 前端计算
  const frontendBundle = calculateSingleDwelling(inputs, engineMeta, tables);
  
  // 2. 调用微服务（开发环境）
  if (process.env.NODE_ENV === 'development') {
    try {
      const response = await fetch('/api/v1/calculate/validate', {
        method: 'POST',
        body: JSON.stringify(inputs)
      });
      const backendBundle = await response.json();
      
      // 3. 对比审计记录
      const diff = compareAuditTrails(
        frontendBundle.steps,
        backendBundle.steps
      );
      
      // 4. 报告差异
      if (diff.hasDifference) {
        console.error('⚠️ 计算差异检测到:', diff);
        showDevelopmentWarning(diff);
      } else {
        console.log('✅ 计算验证通过');
      }
    } catch (err) {
      console.warn('验证失败（离线模式）');
    }
  }
  
  return frontendBundle;
}

function compareAuditTrails(frontendSteps, backendSteps) {
  const differences = [];
  
  for (let i = 0; i < frontendSteps.length; i++) {
    const fe = frontendSteps[i];
    const be = backendSteps[i];
    
    if (!be) {
      differences.push({
        step: i,
        issue: 'Backend missing step',
        frontend: fe
      });
      continue;
    }
    
    // 对比关键字段
    if (fe.operationId !== be.operationId) {
      differences.push({
        step: i,
        issue: 'Operation ID mismatch',
        frontend: fe.operationId,
        backend: be.operationId
      });
    }
    
    // 对比输出值（允许小数点误差）
    const feOutput = parseFloat(fe.output?.value || 0);
    const beOutput = parseFloat(be.output?.value || 0);
    const delta = Math.abs(feOutput - beOutput);
    
    if (delta > 0.01) {
      differences.push({
        step: i,
        issue: 'Output value mismatch',
        frontend: feOutput,
        backend: beOutput,
        delta
      });
    }
  }
  
  return {
    hasDifference: differences.length > 0,
    differences
  };
}
```

---

## 📚 参考文档

- [CEC 8-200 规范](./cec8-200.txt)
- [导体选择修复](./CRITICAL_FIXES_2025-10-23b.md)
- [PDF 多语言支持](./PDF_I18N_IMPLEMENTATION.md)
- [架构讨论](./工程讨论3.txt)

---

## ✅ 下一步行动

### 立即执行（本周）
1. ✅ 完成 PDF 多语言支持
2. ✅ 修复导体选择公式显示
3. 🔲 添加开发环境计算验证
4. 🔲 创建测试用例对比表

### 短期计划（下周）
1. 🔲 实现 `compareAuditTrails` 函数
2. 🔲 添加开发工具栏显示计算差异
3. 🔲 编写单元测试

### 中期计划（下月）
1. 🔲 重构为共享计算包（方案 3）
2. 🔲 统一类型定义
3. 🔲 实现 monorepo 架构

---

**总结**: 当前使用前端独立引擎，建议逐步过渡到共享计算核心架构以确保长期可维护性。

