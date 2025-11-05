# Range Priority Fix - 2025-10-29

## 问题描述

当用户同时使用**主表单Range字段**和**Appliance列表添加第二个Range**时，计算引擎错误地将**列表中的Range当作第一个Range**处理，而将**主表单Range当作第二个Range**。

### 实际情况
- **主表单**: 14.5kW Range (应该是第一个)
- **列表添加**: 12kW Range "2ndRange" (应该是第二个)

### Console输出显示
```javascript
🔍 Categorizing appliance: Proxy(Object) {type: 'range', name: '2ndRange', watts: 12000, ...}
✅ Identified as RANGE  // ← 被当作第一个！

🔍 Categorizing appliance: {type: 'range', name: 'Electric Range (Main Form)', watts: 14500, ...}
✅ Identified as RANGE  // ← 被当作第二个！
```

### 错误结果
- **第一个Range**: 12kW → 使用CEC 8-200 1)a)iv公式 = 6000W
- **第二个Range**: 14.5kW → 作为其他大负载 × 25% = 3625W
- **总计**: 9625W ❌

### 正确结果（应该是）
- **第一个Range**: 14.5kW → 使用CEC 8-200 1)a)iv公式 = 7400W
- **第二个Range**: 12kW → 作为其他大负载 × 25% = 3000W
- **总计**: 10400W ✅

## 根本原因

在预处理步骤中（第85-121行），主表单appliances被**追加**到用户列表末尾：

```typescript
const allAppliances: Appliance[] = [...(inputs.appliances || [])];

// Add Range from main form
if (inputs.hasElectricRange && inputs.electricRangeRatingKW) {
  allAppliances.push({  // ❌ push() 追加到末尾
    type: 'range',
    name: 'Electric Range (Main Form)',
    watts: inputs.electricRangeRatingKW * 1000,
    rating_kW: inputs.electricRangeRatingKW,
  });
}
```

结果数组顺序：`[用户添加的appliances..., 主表单appliances...]`

但根据CEC 8-200规则：
- **第一个Range**: 6000W + 40% × (rating - 12kW)
- **后续Range**: 作为其他大负载，应用25%需求系数

主表单的Range应该优先于用户列表中添加的Range。

## 解决方案

### 修改策略
将主表单appliances **插入到开头**，而不是追加到末尾：

```typescript
// ============================================
// Pre-process: Convert Main Form Fields to Appliances
// IMPORTANT: Main form appliances are inserted at the BEGINNING
// to ensure they are processed first (especially for Range priority)
// ============================================
const mainFormAppliances: Appliance[] = [];

// Add Range from main form if present
if (inputs.hasElectricRange && inputs.electricRangeRatingKW) {
  mainFormAppliances.push({
    type: 'range',
    name: 'Electric Range (Main Form)',
    watts: inputs.electricRangeRatingKW * 1000,
    rating_kW: inputs.electricRangeRatingKW,
    isContinuous: false
  });
  console.log(`🔥 Added Range from main form: ${inputs.electricRangeRatingKW}kW`);
}

// Add Water Heater from main form if present
if (inputs.waterHeaterType && inputs.waterHeaterType !== 'none' && inputs.waterHeaterRatingW) {
  const whType = inputs.waterHeaterType === 'tankless' ? 'tankless_water_heater' : 'water_heater';
  mainFormAppliances.push({
    type: whType,
    name: `Water Heater (${inputs.waterHeaterType})`,
    watts: inputs.waterHeaterRatingW,
    isContinuous: false
  });
  console.log(`💧 Added Water Heater from main form: ${inputs.waterHeaterRatingW}W (${inputs.waterHeaterType})`);
}

// Add EVSE from main form if present
if (inputs.hasEVSE && inputs.evseRatingW) {
  mainFormAppliances.push({
    type: 'evse',
    name: 'EVSE (Main Form)',
    watts: inputs.evseRatingW,
    hasEVEMS: inputs.evseHasEVEMS || false,
    isContinuous: false
  });
  console.log(`⚡ Added EVSE from main form: ${inputs.evseRatingW}W, EVEMS: ${inputs.evseHasEVEMS || false}`);
}

// ✅ Merge: Main form appliances FIRST, then user-added appliances
const allAppliances: Appliance[] = [...mainFormAppliances, ...(inputs.appliances || [])];
```

### 新的数组顺序
`[主表单appliances..., 用户添加的appliances...]`

这确保：
1. **主表单Range始终排在最前面**
2. **用户列表中添加的Range排在后面**
3. **第一个Range（主表单）使用正确的CEC公式**
4. **后续Range（列表）作为其他大负载处理**

## 测试验证

### 输入数据
- **主表单Range**: 14.5kW (应该是第一个)
- **列表Range**: 12kW "2ndRange" (应该是第二个)
- Living Area: 155m²
- Heating: 2222W, Cooling: 3333W
- Water Heater: 3333W (Tankless)
- EVSE: 5000W
- Pool/Spa: 2000W
- Other: 1600W

### 预期Console输出

```javascript
🔥 Added Range from main form: 14.5kW
💧 Added Water Heater from main form: 3333W (tankless)
⚡ Added EVSE from main form: 5000W, EVEMS: false

// ✅ 主表单Range排在前面
🔍 Categorizing appliance: {type: 'range', name: 'Electric Range (Main Form)', watts: 14500, rating_kW: 14.5, ...}
✅ Identified as RANGE

// ✅ 列表Range排在后面
🔍 Categorizing appliance: Proxy(Object) {type: 'range', name: '2ndRange', watts: 12000, rating_kW: 12, ...}
✅ Identified as RANGE

📊 Final categories: {range: 2, ...}
```

### 预期审计跟踪

**Step 5: Electric Range** (第一个Range - 主表单)
```
Name: Electric Range (Main Form)
Rating: 14.5 kW
Formula: 6000W + 40% × (14.5kW - 12kW) × 1000 = 7400W
Output: rangeContribution_W: 7400.00
```

**Step X: Other Large Loads** (第二个Range - 列表)
```
Total large loads: 12000W (includes 2ndRange)
Has Range: true
Demand factor: 25%
Output: 12000W × 25% = 3000W
```

### 预期计算结果

**Appliance Loads**:
- HVAC: 5555W (2222 + 3333, not interlocked)
- **Range (1st - Main Form 14.5kW)**: **7400W** ✅
- Water Heater: 3333W
- Pool/Spa: 2000W
- EVSE: 5000W
- **Other Large Loads (includes 2nd Range 12kW)**: **(12000 + 0) × 25% = 3000W** ✅
- Other (1600W < 1500W): 1600W @ 100% = 1600W

**Total Appliances**: 5555 + 7400 + 3333 + 2000 + 5000 + 3000 + 1600 = **27888W**

**Method A Total**: 6000 (basic) + 27888 = **33888W**

**Final Load**: max(33888W, 24000W) = **33888W**

## 设计原则

### 优先级规则
1. **主表单字段优先**: 主表单是用户的主要输入界面，应该优先处理
2. **列表字段补充**: Appliance列表用于添加额外或特殊负载
3. **CEC规则符合**: 第一个Range使用特殊公式，后续Range按普通大负载处理

### 用户体验
- **直观性**: 主表单Range被视为"主要"Range
- **灵活性**: 可以在列表中添加第二、第三个Range
- **一致性**: 所有主表单字段（Range, Water Heater, EVSE）都优先处理

### 技术实现
- **清晰的数组合并**: `[mainForm, ...userList]`
- **注释说明**: IMPORTANT注释标明设计意图
- **Console日志**: 清晰显示处理顺序

## 关键要点

### ✅ 已解决
1. **Range优先级**: 主表单Range始终是第一个
2. **正确的CEC计算**: 第一个Range用iv公式，后续用vii公式
3. **数组顺序**: 主表单appliances插入到开头

### 📋 适用场景
- **单Range**: 主表单 → 正确使用iv公式 ✅
- **双Range**: 主表单 + 列表 → 主表单用iv，列表用vii ✅
- **多Range**: 主表单 + 多个列表 → 主表单用iv，其余用vii ✅

### 🎯 CEC规则符合性
- **CEC 8-200 1)a)iv**: 第一个Range的特殊公式 ✅
- **CEC 8-200 1)a)vii**: 后续Range作为其他大负载 ✅
- **范围处理顺序**: 明确且可预测 ✅

## 文件修改清单

1. ✅ `packages/cec-calculator/src/rules/8-200-single-dwelling.ts` 
   - Line 82-126: 重构预处理逻辑
   - 创建独立的`mainFormAppliances`数组
   - 优先合并：`[mainForm, ...userList]`
   - 添加IMPORTANT注释说明设计意图

## 技术债务

无。修改符合V4.1架构原则，逻辑清晰，注释完善。

## 后续测试建议

测试以下场景：
1. ✅ **只有主表单Range** (14.5kW) → 7400W
2. ✅ **主表单Range + 列表Range** (14.5kW + 12kW) → 7400W + 3000W
3. ✅ **主表单Range + 多个列表Range** (14.5kW + 12kW + 10kW) → 7400W + (12kW + 10kW) × 25%
4. ✅ **只有列表Range** (12kW) → 6000W (因为是第一个)
5. ✅ **多个列表Range** (12kW + 10kW) → 6000W + 10kW × 25%












