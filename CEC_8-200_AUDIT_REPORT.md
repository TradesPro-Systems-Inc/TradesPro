# CEC 8-200 实现审计报告 🔍

**日期**: 2025-10-22  
**审计范围**: CEC 8-200 Single Dwellings 负载计算  
**参考文档**: cec8-200.txt (Lines 12-44)

---

## 📊 执行摘要

### ✅ 已正确实现的部分
1. **8-200 1)a)i-ii** - 基础负载计算 ✓
2. **8-106 3)** - 供暖/空调互锁 ✓  
3. **基本数据结构** - 输入输出接口 ✓

### ⚠️ 需要修正的部分
1. **8-200 1)a)iii** - HVAC负载需求系数 (部分正确)
2. **8-200 1)a)iv** - Range负载公式 (需验证)
3. **8-200 1)a)v** - 热水器负载处理 (需补充tankless类型)
4. **8-200 1)a)vi** - EVSE负载 (已实现但需验证8-106 11)
5. **8-200 1)a)vii** - 其他大负载 (未正确实现)
6. **8-200 1)b** - 最小负载要求 (需补充)

### ❌ 未实现的功能
1. **8-200 2)** - Row Housing (联排住宅)
2. **8-202** - Apartment Buildings (公寓楼)
3. **8-200 3)** - 非连续负载判定 (Rule 8-104关联)

---

## 📋 详细审计

### ✅ 1. 基础负载 (8-200 1)a)i-ii) - 正确 ✓

**规范要求**:
```
i) a basic load of 5000 W for the first 90 m2 of living area; plus
ii) an additional 1000 W for each 90 m2 or portion thereof in excess of 90 m2
```

**当前实现** (baseLoadCalculator.ts:21-34):
```typescript
export function calculateBaseLoad(livingArea_m2: number): number {
  if (livingArea_m2 <= 90) {
    return 5000;
  }
  const additionalArea = livingArea_m2 - 90;
  const additionalPortions = Math.ceil(additionalArea / 90);
  return 5000 + (additionalPortions * 1000);
}
```

**结论**: ✅ 完全正确

---

### ⚠️ 2. HVAC负载 (8-200 1)a)iii) - 部分正确

**规范要求**:
```
iii) any electric space-heating loads provided for with demand factors 
     as permitted in Section 62 
     plus any air-conditioning loads with a demand factor of 100%, 
     subject to Rule 8-106 3)
```

**Section 62 需求系数** (62-118 3)):
```
a) the first 10 kW of connected heating load at 100% demand factor; plus
b) the balance of the connected heating load at 75% demand factor
```

**当前实现** (useOfflineCalculation.ts:69-81):
```typescript
// ✅ 供暖需求系数正确
const heatingLoadW = inputs.heatingLoadW || 0;
const heatingDemand = heatingLoadW <= 10000 
  ? heatingLoadW 
  : 10000 + (heatingLoadW - 10000) * 0.75;

// ✅ 空调100%正确
const coolingLoadW = inputs.coolingLoadW || 0;

// ✅ 互锁处理正确 (CEC 8-106 3))
const hvacLoad = inputs.isHeatingAcInterlocked 
  ? Math.max(heatingDemand, coolingLoadW)
  : heatingDemand + coolingLoadW;
```

**结论**: ✅ 实现正确！
- 供暖: 前10kW@100% + 超出部分@75% ✓
- 空调: 100% ✓
- 互锁: 取较大值 ✓

---

### ⚠️ 3. Range负载 (8-200 1)a)iv) - 需验证

**规范要求**:
```
iv) any electric range load provided for as follows: 
    6000 W for a single range plus 40% of any amount by which 
    the rating of the range exceeds 12 kW
```

**公式**:
```
Range Load = 6000W + 40% × max(0, Rating - 12000W)
```

**当前实现** (useOfflineCalculation.ts:83-95):
```typescript
if (inputs.hasElectricRange && inputs.electricRangeRatingKW) {
  const rangeRatingW = inputs.electricRangeRatingKW * 1000;
  if (rangeRatingW <= 12000) {
    rangeLoad = 6000;
  } else {
    rangeLoad = 6000 + (rangeRatingW - 12000) * 0.4;
  }
}
```

**测试案例**:
- 8kW range: `6000W` ✅
- 12kW range: `6000W` ✅
- 15kW range: `6000 + (15000-12000) × 0.4 = 7200W` ✅

**结论**: ✅ 公式正确！

**⚠️ 注意** (Appendix B):
```
"If more than one electric range is involved, the initial range 
will be provided for according to Rule 8-200 1) a) iv), 
and any subsequent ranges will be provided for by Rule 8-200 1) a) vii)."
```
- 第1个range: 按 iv) 计算 ✅
- 第2+个range: 按 vii) 25%需求系数 ⚠️ (需在前端UI中说明)

---

### ⚠️ 4. 热水器负载 (8-200 1)a)v) - 需补充

**规范要求**:
```
v) any electric tankless water heaters or electric water heaters 
   for steamers, swimming pools, hot tubs, or spas 
   with a demand factor of 100%
```

**当前实现** (useOfflineCalculation.ts:97-106):
```typescript
let waterHeaterLoad = 0;
if (inputs.waterHeaterType && inputs.waterHeaterType !== 'none' &&
    inputs.waterHeaterRatingW) {
  waterHeaterLoad = inputs.waterHeaterRatingW;
}
```

**问题**:
1. ❌ 规范只包括 "tankless" 和 "pool/spa/hot tub" 热水器
2. ❌ Storage (储水式) 热水器应该不在这里，而是在 8-200 1)a)vii 中按25%计算
3. ⚠️ 当前实现没有区分类型，全部按100%

**建议修正**:
```typescript
// 只有 tankless 和 pool/spa 按100%
if (inputs.waterHeaterType === 'tankless' || 
    inputs.waterHeaterType === 'pool_heater' ||
    inputs.waterHeaterType === 'spa_heater') {
  waterHeaterLoad = inputs.waterHeaterRatingW || 0; // 100%
}
// Storage 热水器应在 vii) 中按25%处理
```

**结论**: ⚠️ 需要修正热水器类型处理

---

### ⚠️ 5. EVSE负载 (8-200 1)a)vi) - 需验证

**规范要求**:
```
vi) except as permitted by Rule 8-106 11), 
    any electric vehicle supply equipment loads 
    with a demand factor of 100%
```

**Rule 8-106 11)** (Lines 210-215):
```
The demand load for the electric vehicle supply equipment 
shall not be required to be considered in the determination 
of the calculated load where an electric vehicle energy 
management system... performs the functions of:
a) monitoring the consumer's service, feeders, and branch circuits; and
b) controlling the electric vehicle supply equipment loads 
   in accordance with Rule 8-500
```

**当前实现** (useOfflineCalculation.ts:108-111):
```typescript
if (inputs.hasEVSE && inputs.evseRatingW) {
  evseLoad = inputs.evseRatingW; // 100%
}
```

**问题**:
- ❌ 没有实现 EVEMS (Electric Vehicle Energy Management System) 检查
- ❌ 规范说"except as permitted"意味着如果有EVEMS，EVSE负载可以不计入

**建议补充**:
```typescript
// 只有在没有EVEMS时才计入100%
if (inputs.hasEVSE && inputs.evseRatingW && !inputs.hasEVEMS) {
  evseLoad = inputs.evseRatingW;
}
```

**结论**: ⚠️ 需要添加EVEMS支持（可作为future feature）

---

### ❌ 6. 其他大负载 (8-200 1)a)vii) - 未正确实现

**规范要求**:
```
vii) any loads provided for that have a rating in excess of 1500 W, 
     in addition to those outlined in Items i) to vi), at
     
     A) 25% of the rating of each load, if an electric range has been provided for; or
     
     B) 100% of the combined load up to 6000 W, 
        plus 25% of the combined load that exceeds 6000 W, 
        if an electric range has not been provided for
```

**关键点**:
1. 只适用于 >1500W 的负载
2. 不包括 i-vi 中已经处理的负载
3. **有Range**: 每个负载 × 25%
4. **无Range**: (前6000W × 100%) + (超出部分 × 25%)

**当前实现** (useOfflineCalculation.ts:113-132):
```typescript
// ❌ 当前实现：所有其他电器都按100%计算
let otherAppliancesLoad = 0;
if (inputs.appliances && inputs.appliances.length > 0) {
  inputs.appliances.forEach(appliance => {
    otherAppliancesLoad += appliance.watts || 0; // 100% 错误！
  });
}
```

**⚠️ 严重问题**: 其他大负载应该按需求系数计算，不是100%！

**建议修正**:
```typescript
// 筛选出 >1500W 的其他负载
const largeLoads = (inputs.appliances || [])
  .filter(app => (app.watts || 0) > 1500);

let otherLoadContribution = 0;

if (largeLoads.length > 0) {
  const totalLargeLoad = largeLoads.reduce((sum, app) => sum + (app.watts || 0), 0);
  
  if (inputs.hasElectricRange) {
    // A) 有Range: 每个负载 × 25%
    otherLoadContribution = totalLargeLoad * 0.25;
  } else {
    // B) 无Range: 前6000W@100% + 超出部分@25%
    if (totalLargeLoad <= 6000) {
      otherLoadContribution = totalLargeLoad;
    } else {
      otherLoadContribution = 6000 + (totalLargeLoad - 6000) * 0.25;
    }
  }
}
```

**结论**: ❌ 需要重写 vii) 的实现逻辑

---

### ❌ 7. 最小负载要求 (8-200 1)b) - 未实现

**规范要求**:
```
b)
i) 24 000 W where the floor area, exclusive of the basement floor area, 
   is 80 m2 or more; or

ii) 14 400 W where the floor area, exclusive of the basement floor area, 
    is less than 80 m2
```

**关键**: 
- **"exclusive of basement"** = 不包括地下室面积
- Rule 8-110 定义living area包含地下室（75%计入）

**当前实现**:
```typescript
// ❌ 完全没有实现 1)b) 最小负载！
// 当前只计算了 1)a)，没有取 max(1a, 1b)
```

**建议补充**:
```typescript
// 计算方法 a) 的总负载
const calculatedLoadA = basicLoad + hvacLoad + rangeLoad + 
                        waterHeaterLoad + evseLoad + otherLoadContribution;

// 计算方法 b) 的最小负载
// 注意：规范说的是"exclusive of basement"，需要区分地上/地下面积
// 暂时简化为使用总面积
const minimumLoadB = inputs.livingArea_m2 >= 80 ? 24000 : 14400;

// 取较大值！
const finalCalculatedLoad = Math.max(calculatedLoadA, minimumLoadB);
```

**结论**: ❌ 必须实现！这是规范的核心要求

---

## 🎯 优先修复清单

### 🔴 P0 - 严重错误（必须立即修复）

1. **实现 8-200 1)b) 最小负载要求**
   - 文件: `useOfflineCalculation.ts`
   - 影响: 所有小型住宅计算错误
   - 修复: 添加 `max(calculatedLoadA, minimumLoadB)` 逻辑

2. **修正 8-200 1)a)vii 其他大负载计算**
   - 文件: `useOfflineCalculation.ts`
   - 影响: 所有带额外电器的计算错误
   - 修复: 实现25%需求系数和有/无Range的不同算法

### 🟡 P1 - 重要问题（应尽快修复）

3. **区分热水器类型 (8-200 1)a)v)**
   - 文件: `useOfflineCalculation.ts`, `types.ts`
   - 影响: Storage热水器按100%计算是错误的
   - 修复: 只有tankless/pool/spa按100%，storage按25%

4. **添加EVEMS支持 (8-106 11))**
   - 文件: `types.ts`, `useOfflineCalculation.ts`
   - 影响: 有EVEMS的系统EVSE负载应该可豁免
   - 修复: 添加 `hasEVEMS` 输入参数

### 🟢 P2 - 增强功能（后续版本）

5. **实现 8-200 2) Row Housing**
   - 新功能，需要添加多户计算逻辑

6. **实现 8-202 Apartment Buildings**
   - 新功能，完整的多户住宅系统

---

## 📐 修正后的完整公式

### CEC 8-200 1) 正确实现:

```typescript
// ============= 方法 a) 详细计算 =============

// i-ii) 基础负载
basicLoad = livingArea <= 90 
  ? 5000 
  : 5000 + Math.ceil((livingArea - 90) / 90) * 1000;

// iii) HVAC负载 (Section 62 + 8-106 3))
heatingDemand = heating <= 10000 
  ? heating 
  : 10000 + (heating - 10000) * 0.75;

hvacLoad = interlocked 
  ? Math.max(heatingDemand, cooling) 
  : heatingDemand + cooling;

// iv) Range负载
if (hasRange) {
  rangeLoad = rangeRating <= 12000 
    ? 6000 
    : 6000 + (rangeRating - 12000) * 0.4;
}

// v) 热水器 (只有tankless和pool/spa)
if (waterHeaterType === 'tankless' || waterHeaterType === 'pool_spa') {
  waterHeaterLoad = waterHeaterRating; // 100%
}

// vi) EVSE
if (hasEVSE && !hasEVEMS) {
  evseLoad = evseRating; // 100%
}

// vii) 其他大负载 (>1500W)
largeLoads = appliances.filter(app => app.watts > 1500);
totalLargeLoad = sum(largeLoads);

if (hasRange) {
  // A) 有Range: 25%
  otherLoad = totalLargeLoad * 0.25;
} else {
  // B) 无Range: 前6000W@100% + 超出@25%
  otherLoad = totalLargeLoad <= 6000 
    ? totalLargeLoad 
    : 6000 + (totalLargeLoad - 6000) * 0.25;
}

calculatedLoadA = basicLoad + hvacLoad + rangeLoad + 
                  waterHeaterLoad + evseLoad + otherLoad;

// ============= 方法 b) 最小值 =============
minimumLoadB = livingArea >= 80 ? 24000 : 14400;

// ============= 最终负载 =============
FINAL_LOAD = Math.max(calculatedLoadA, minimumLoadB);
```

---

## 📝 附加说明

### Rule 8-110 - 面积定义
```
Living area includes:
a) 100% of ground floor area
b) 100% of above-ground floors used for living
c) 75% of basement areas exceeding 1.8m height
```

### Rule 8-104 3) - 连续负载定义
```
A load is considered continuous unless it does not persist for:
a) More than 1h in any 2h period (if load ≤ 225A); or
b) More than 3h in any 6h period (if load > 225A)
```

### Rule 8-200 3) - 非连续负载豁免
```
Notwithstanding Rule 86-302, the total load calculated in accordance 
with either Subrule 1) or 2) shall NOT be considered to be a 
continuous load for application of Rule 8-104
```
**意义**: 计算出的负载不需要按125%放大（Rule 8-104通常要求连续负载×125%）

---

## 🔄 下一步行动

1. ✅ 完成此审计报告
2. ⏳ 修正P0级严重错误
3. ⏳ 实现P1级重要功能
4. ⏳ 添加单元测试验证所有规则
5. ⏳ 开发 8-200 2) Row Housing
6. ⏳ 开发 8-202 Apartment Buildings

---

**审计完成时间**: 2025-10-22  
**审计员**: AI Assistant  
**状态**: 待修复

