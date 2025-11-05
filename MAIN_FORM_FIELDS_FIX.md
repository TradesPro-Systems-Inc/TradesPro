# Main Form Fields Processing Fix - 2025-10-29

## 问题描述

用户在**主表单的专门字段**中输入了：
- ✅ Electric Range: 14.5kW
- ✅ Water Heater: 3333W (Storage)
- ✅ EVSE: 4444W

但UI显示结果中这些负载都是0W：
- ❌ Range Load: 0W
- ❌ Water Heater Load: 0W
- ❌ EVSE Load: 0W

只有HVAC Load显示正确（5000W），因为之前已经修复了HVAC字段的处理。

## 根本原因

计算引擎只处理了`inputs.appliances[]`数组中的电器，但**没有处理主表单的专门字段**：
- `inputs.hasElectricRange` + `inputs.electricRangeRatingKW`
- `inputs.waterHeaterType` + `inputs.waterHeaterRatingW`
- `inputs.hasEVSE` + `inputs.evseRatingW`

## 解决方案

### 1. 更新TypeScript类型定义

**文件**: `packages/cec-calculator/src/core/types.ts`

为`CecInputsSingle`接口添加主表单字段：

```typescript
export interface CecInputsSingle {
  id?: string;
  project?: string;
  livingArea_m2?: number;
  systemVoltage: number;
  phase?: 1 | 3;
  appliances?: Appliance[];
  continuousLoads?: Appliance[];
  heatingLoadW?: number;
  coolingLoadW?: number;
  isHeatingAcInterlocked?: boolean;
  
  // ✅ Main form dedicated fields
  hasElectricRange?: boolean;
  electricRangeRatingKW?: number;
  hasEVSE?: boolean;
  evseRatingW?: number;
  evseHasEVEMS?: boolean;
  waterHeaterType?: 'none' | 'storage' | 'tankless' | 'pool_spa';
  waterHeaterRatingW?: number;
  
  conductorMaterial?: 'Cu' | 'Al';
  terminationTempC?: number;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
  codeEdition?: CodeEdition;
}
```

### 2. 预处理主表单字段

**文件**: `packages/cec-calculator/src/rules/8-200-single-dwelling.ts`

在分类appliances之前，将主表单字段转换为`Appliance`对象：

```typescript
// ============================================
// Pre-process: Convert Main Form Fields to Appliances
// ============================================
const allAppliances: Appliance[] = [...(inputs.appliances || [])];

// Add Range from main form if present
if (inputs.hasElectricRange && inputs.electricRangeRatingKW) {
  allAppliances.push({
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
  allAppliances.push({
    type: whType,
    name: `Water Heater (${inputs.waterHeaterType})`,
    watts: inputs.waterHeaterRatingW,
    isContinuous: false
  });
  console.log(`💧 Added Water Heater from main form: ${inputs.waterHeaterRatingW}W (${inputs.waterHeaterType})`);
}

// Add EVSE from main form if present
if (inputs.hasEVSE && inputs.evseRatingW) {
  allAppliances.push({
    type: 'evse',
    name: 'EVSE (Main Form)',
    watts: inputs.evseRatingW,
    hasEVEMS: inputs.evseHasEVEMS || false,
    isContinuous: false
  });
  console.log(`⚡ Added EVSE from main form: ${inputs.evseRatingW}W, EVEMS: ${inputs.evseHasEVEMS || false}`);
}

// ============================================
// Step 2: Categorize Appliances by Type
// ============================================
const appliances = allAppliances;
```

## 测试验证

### 输入数据
- Living Area: 150m²
- Heating Load: 2000W
- Cooling Load: 3000W
- **Heating and A/C NOT Interlocked** (用户取消勾选了)
- **Electric Range: 14.5kW** ← 主表单字段
- **Water Heater: 3333W (Storage)** ← 主表单字段
- **EVSE: 4444W** ← 主表单字段

### 预期计算步骤

#### Step 1: Basic Load
- 150m² → 6000W

#### Step 2-4: HVAC Load
- Heating: 2000W @ 100%
- Cooling: 3000W @ 100%
- **NOT Interlocked** → 2000 + 3000 = **5000W**

#### Step 5: Electric Range (CEC 8-200 1)a)iv)
- 14.5kW Range
- Formula: 6000W + 40% × (14.5kW - 12kW)
- = 6000W + 40% × 2.5kW
- = 6000W + 1000W
- = **7000W**

#### Step 6: Water Heater (CEC 8-200 1)a)v)
- 3333W Storage Water Heater
- Demand factor: 100%
- = **3333W**

#### Step 7: EVSE (CEC 8-200 1)a)vi)
- 4444W EVSE
- No EVEMS
- Demand factor: 100%
- = **4444W**

#### Step 8: Total Appliance Loads
- HVAC: 5000W
- Range: 7000W
- Water Heater: 3333W
- EVSE: 4444W
- **Total**: 5000 + 7000 + 3333 + 4444 = **19777W**

#### Step 9: Method A Total
- Basic: 6000W
- Appliances: 19777W
- **Total**: 6000 + 19777 = **25777W**

#### Step 10: Method B (Minimum)
- 150m² ≥ 80m²
- **Minimum**: 24000W

#### Step 11: Final Load
- **Final Load** = max(25777W, 24000W) = **25777W** (Method A)

#### Step 12: Service Current
- 25777W ÷ 240V = **107.4A**

#### Step 13: Conductor Selection
- Required: 107.4A
- Material: Cu
- Termination: 75°C
- Ambient: 37°C
- **Selected**: 2 AWG Cu or 1 AWG Cu (取决于温度修正)

### 预期UI显示

**Load Breakdown Details**:
- Basic Load: 6000 VA ✅
- HVAC Load: 5000 W ✅ (已修复)
- **Range Load: 7000 W** ✅ (应该正确显示)
- **Water Heater Load: 3333 W** ✅ (应该正确显示)
- **EVSE Load: 4444 W** ✅ (应该正确显示)
- Other Large Loads: 0 W (没有其他大负载)

**Calculated Load**: **25777 W** (不再显示24000W)

## Console调试输出

刷新后重新计算，应该看到：

```javascript
🔥 Added Range from main form: 14.5kW
💧 Added Water Heater from main form: 3333W (storage)
⚡ Added EVSE from main form: 4444W, EVEMS: false

🔍 Categorizing appliance: {type: 'range', name: 'Electric Range (Main Form)', watts: 14500, rating_kW: 14.5, ...}
✅ Identified as RANGE

🔍 Categorizing appliance: {type: 'water_heater', name: 'Water Heater (storage)', watts: 3333, ...}
✅ Identified as WATER_HEATER

🔍 Categorizing appliance: {type: 'evse', name: 'EVSE (Main Form)', watts: 4444, hasEVEMS: false, ...}
✅ Identified as EVSE

📊 Final categories: {
  range: 1,
  heating: 0,
  cooling: 0,
  water_heaters: 1,
  pool_spa: 0,
  evse: 1,
  other_large: 0,
  other_small: 0
}
```

## 架构符合性

### ✅ V4.1 架构原则
1. **纯审计协调器**: `8-200-single-dwelling.ts`只负责orchestration，不包含计算逻辑
2. **纯函数计算器**: 所有计算逻辑都在专门的calculator模块中
3. **类型安全**: TypeScript完整类型定义
4. **可测试性**: 所有计算函数都是纯函数
5. **可审计性**: 详细的step-by-step audit trail

### 🔧 预处理设计
- **位置**: 在appliance分类之前
- **目的**: 将主表单字段标准化为`Appliance[]`格式
- **原则**: 数据标准化应该在早期进行，确保后续处理逻辑统一

## 关键要点

### ✅ 已解决
1. **主表单字段支持**: Range、Water Heater、EVSE从主表单正确读取
2. **数据标准化**: 主表单字段转换为统一的`Appliance`对象
3. **类型安全**: 完整的TypeScript类型定义
4. **调试日志**: 清晰的console输出用于验证

### 📋 用户体验
- 用户可以选择两种方式输入：
  - **主表单专门字段**: 快速输入常见负载
  - **Appliance Loads列表**: 添加额外或特殊负载
- 两种方式的数据最终合并处理

### 🎯 后续增强（可选）
1. 主表单EVSE字段添加EVEMS toggle（如果需要）
2. 主表单Range字段支持multiple ranges（目前已经支持在Appliance Loads中添加）
3. UI显示区分主表单和列表添加的appliances

## 文件修改清单

1. ✅ `packages/cec-calculator/src/core/types.ts` - 添加主表单字段到`CecInputsSingle`
2. ✅ `packages/cec-calculator/src/rules/8-200-single-dwelling.ts` - 预处理主表单字段
3. ✅ 重新编译计算引擎包

## 技术债务

无。所有修改都符合V4.1架构标准。













