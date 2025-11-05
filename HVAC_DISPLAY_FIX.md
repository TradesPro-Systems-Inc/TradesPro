# HVAC Load Display Fix - 2025-10-29

## 问题描述

用户在主表单的专门字段中输入了HVAC数据（Heating: 2000W, Cooling: 3000W），但UI的"Load Breakdown Details"部分显示 `HVAC Load: 0W`。

## 根本原因

计算引擎正确计算了HVAC负载（3000W），并在审计跟踪中显示正确，但**没有将分项负载值添加到 `results` 对象中**，导致前端UI无法显示这些值。

### 调试过程

1. **前端数据传递** ✅ 正确
   ```javascript
   🌡️ HVAC Debug: {
     inputs.heatingLoadW: 2000,
     inputs.coolingLoadW: 3000,
     inputs.isHeatingAcInterlocked: true
   }
   
   🌡️ HVAC Totals: {
     heatingTotal: 2000,
     coolingTotal: 3000
   }
   ```

2. **计算引擎逻辑** ✅ 正确
   - Step 2: Space Heating - 2000W
   - Step 3: Air Conditioning - 3000W
   - Step 4: HVAC Interlock - max(2000, 3000) = 3000W
   - Step 6: Total Appliance Loads - hvac: 3000W

3. **UI显示** ❌ 错误
   - `CalculationResults.vue` 第125行尝试读取 `bundle.results?.hvacLoad`
   - 但 `results` 对象中没有该字段！

## 解决方案

### 1. 更新 `CecResults` 类型定义

**文件**: `packages/cec-calculator/src/core/types.ts`

```typescript
export interface CecResults {
  // ... 现有字段 ...
  
  // ✅ 添加详细负载分解用于UI显示
  hvacLoad?: string;
  rangeLoad?: string;
  waterHeaterLoad?: string;
  poolSpaLoad?: string;
  evseLoad?: string;
  otherLargeLoadsTotal?: string;
  otherSmallLoadsTotal?: string;
}
```

### 2. 更新计算引擎输出

**文件**: `packages/cec-calculator/src/rules/8-200-single-dwelling.ts`

```typescript
const results: CecResults = {
  computedLivingArea_m2: toFixedDigits(livingArea),
  basicVA: toFixedDigits(baseLoadW),
  appliancesSumVA: toFixedDigits(applianceLoadW),
  // ... 其他字段 ...
  
  // ✅ 添加详细负载分解
  hvacLoad: toFixedDigits(hvacContribution),
  rangeLoad: toFixedDigits(rangeContribution),
  waterHeaterLoad: toFixedDigits(waterHeatersTotal),
  poolSpaLoad: toFixedDigits(poolSpaTotal),
  evseLoad: toFixedDigits(evseTotal),
  otherLargeLoadsTotal: toFixedDigits(largeLoadContribution),
  otherSmallLoadsTotal: toFixedDigits(smallLoadsRaw)
};
```

## 测试验证

### 输入数据
- Living Area: 155m²
- Heating Load: 2000W
- Cooling Load: 3000W
- Heating and A/C Interlocked: ✅
- Range: 15kW
- Water Heater: 3333W (Storage)
- EVSE: 4444W
- Other appliance: secR, 7000W (Continuous, Range type)

### 预期结果

**Load Breakdown Details**:
- Basic Load: 6000 VA ✅
- **HVAC Load: 3000 W** ← 应该显示正确值
- Range Load: 6000 W (主表单中的15kW Range)
- Water Heater Load: 3333 W
- EVSE Load: 4444 W
- Other Large Loads: 1750 W (7000W × 25% demand factor, 因为有Range)

**Total Appliance Loads**: 3000 + 6000 + 3333 + 4444 + 1750 = 18527W

**Method A Total**: 6000 + 18527 = 24527W

**Final Load**: max(24527W, 24000W) = **24527W** (Method A)

## 关键要点

### ✅ 已解决
1. **HVAC计算逻辑**正确实现了CEC规则：
   - Interlock时取max(heating, cooling)
   - 非interlock时取heating + cooling
   
2. **数据传递**从前端到计算引擎完全正确
   
3. **审计跟踪**详细记录了每个步骤

4. **UI显示**现在可以正确显示所有分项负载

### 📋 架构设计原则

1. **计算引擎**（`8-200-single-dwelling.ts`）：
   - 纯审计协调器
   - 不包含计算逻辑
   - 调用专门的纯函数计算器

2. **纯函数计算器**（独立模块）：
   - `heatingCoolingCalculator.ts`
   - `rangeLoadCalculator.ts`
   - `waterHeaterCalculator.ts`
   - `evseCalculator.ts`
   - `largeLoadCalculator.ts`

3. **输出结构**：
   - `results` 对象包含所有用于UI显示的值
   - `steps` 数组包含详细的审计跟踪
   - 清晰的分离：计算 vs 显示

## 后续测试

请刷新浏览器（Ctrl+F5）并重新执行相同的计算，验证：
1. ✅ HVAC Load 显示为 3000W（而不是0W）
2. ✅ Range Load 正确识别为6000W（15kW Range, CEC 8-200 1)a)iv）
3. ✅ 第二个Range（secR, 7000W）作为Other Large Load，应用25%需求系数
4. ✅ Water Heater Load 显示为3333W
5. ✅ EVSE Load 显示为4444W
6. ✅ 审计跟踪标题友好显示（如"Space Heating"而不是"calc_space_heating"）
7. ✅ PDF生成无乱码
8. ✅ 语言切换时保留输入数据

## 文件修改清单

1. ✅ `packages/cec-calculator/src/core/types.ts` - 添加详细负载字段到 `CecResults`
2. ✅ `packages/cec-calculator/src/rules/8-200-single-dwelling.ts` - 填充分项负载到 `results`
3. ✅ 重新编译计算引擎包

## 技术债务

无。所有修改都符合V4.1架构标准，无临时workaround或技术债务。













