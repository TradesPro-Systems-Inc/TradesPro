# 计算引擎重构完成 ✅

## 你的建议完全正确！

你说得对：**`8-200-single-dwelling.ts` 作为核心规则协调器，不应该频繁修改**。我已经按照正确的V4.1架构进行了完整重构。

## 新的架构设计

### 设计原则

1. **关注点分离**: 计算逻辑 ≠ 协调逻辑
2. **纯函数**: 所有计算器都是纯函数（无副作用，可确定性输出）
3. **稳定的协调器**: `8-200-single-dwelling.ts` 保持稳定
4. **CEC合规**: 每个计算器严格遵循特定的CEC章节
5. **可测试性**: 纯函数易于单元测试

### 文件结构

```
packages/cec-calculator/src/
├── calculators/                         # 专门的纯函数计算器
│   ├── baseLoadCalculator.ts           ✅ CEC 8-200 1)a)i-ii (居住面积 → 基础负载)
│   ├── heatingCoolingCalculator.ts     ✅ CEC 62-118 3), 8-106 3) (HVAC需求)
│   ├── rangeLoadCalculator.ts          🆕 CEC 8-200 1)a)iv (Range需求)
│   ├── waterHeaterCalculator.ts        🆕 CEC 8-200 1)a)v (热水器需求)
│   ├── evseCalculator.ts               🆕 CEC 8-200 1)a)vi, 8-106 11 (EVSE需求)
│   ├── largeLoadCalculator.ts          🆕 CEC 8-200 1)a)vii (大负载需求)
│   └── applianceLoadCalculator.ts      🔄 重新导出所有电器计算器
│
└── rules/                               # 规则协调器（稳定）
    └── 8-200-single-dwelling.ts        📋 只负责协调，调用专门函数
```

### 专门的计算器模块

#### 1. Range Load Calculator (`rangeLoadCalculator.ts`)
**CEC规则**: 8-200 1)a)iv

```typescript
calculateRangeLoad(14)  // 返回 6800W
// 公式: 6000W + 40% × (14kW - 12kW) × 1000 = 6800W
```

#### 2. Water Heater Calculator (`waterHeaterCalculator.ts`)
**CEC规则**: 8-200 1)a)v + Section 62

```typescript
calculateWaterHeaterLoad(4500, 'storage')    // 返回 4500W @ 100%
calculateWaterHeaterLoad(5000, 'tankless')   // 返回 5000W @ 100%
```

#### 3. EVSE Calculator (`evseCalculator.ts`)
**CEC规则**: 8-200 1)a)vi + 8-106 11

```typescript
calculateEVSELoad(7200, false)  // 返回 7200W (无EVEMS)
calculateEVSELoad(7200, true)   // 返回 0W (有EVEMS，豁免)
```

#### 4. Large Load Calculator (`largeLoadCalculator.ts`)
**CEC规则**: 8-200 1)a)vii

```typescript
// 有Range时
calculateLargeLoads(8000, true)   // 返回 2000W (8000 × 25%)

// 无Range时
calculateLargeLoads(8000, false)  // 返回 6500W
// 解释: 6000W @ 100% + 2000W @ 25% = 6500W
```

#### 5. Heating/Cooling Calculator (`heatingCoolingCalculator.ts`)
**CEC规则**: 62-118 3), 8-106 3)

```typescript
// 供暖 >10kW 时应用需求系数
calculateHeatingCoolingLoad(12000, 2000, false)
// 返回: 11500W (供暖) + 2000W (空调) = 13500W
// 供暖: 10000 @ 100% + 2000 @ 75% = 11500W
```

### 核心协调器 (`8-200-single-dwelling.ts`)

**职责**:
1. ✅ 接收输入和规则表
2. ✅ 调用专门的计算器函数
3. ✅ 创建详细的审计跟踪
4. ✅ 组装最终计算结果
5. ❌ **不包含**计算逻辑
6. ❌ **不应该**频繁修改

**现在的结构**:
```typescript
// 步骤4: Range负载 (调用专门函数)
const rangeCalc = calculateRangeLoadWithAudit(rating_kW);
rangeContribution = rangeCalc.demandW;

pushStep({
  operationId: 'calc_range_load',
  formulaRef: 'CEC 8-200 1)a)iv',
  intermediateValues: {...},
  output: { rangeContribution_W: ... },
  note: rangeCalc.formula,  // "6000W + 40% × ..."
  ruleCitations: ['CEC 8-200 1)a)iv']
});

// 步骤5: 热水器 (调用专门函数)
const whCalc = calculateWaterHeaterLoadWithAudit(whWatts, whType);
waterHeatersTotal += whCalc.demandW;

pushStep({
  operationId: 'calc_water_heater',
  formulaRef: whCalc.ruleReference,  // "CEC 8-200 1)a)v"
  output: { waterHeaterLoad_W: ... },
  note: whCalc.formula,  // "Water heater: 4500W × 100% = 4500W"
  ruleCitations: [whCalc.ruleReference]
});

// ... 以此类推，每个电器都有专门的计算函数
```

## 你的例子的正确计算

**输入**:
- 居住面积: 100m²
- Range: 14kW
- Water Heater: 4500W
- EVSE: 7200W (无EVEMS)
- 空调: 2233W
- 电压: 240V, 单相

**详细步骤**:

```
步骤1: 基础负载 (baseLoadCalculator)
  100m² → 5000W + ceil(10/90) × 1000W = 6,000W

步骤2: 空调 (heatingCoolingCalculator)
  2233W @ 100% = 2,233W

步骤3: Range (rangeLoadCalculator)
  14kW → 6000W + 40% × (14-12) × 1000 = 6,800W
  ✅ 不是14000W！

步骤4: Water Heater (waterHeaterCalculator)
  4500W @ 100% = 4,500W
  ✅ 100%需求系数

步骤5: EVSE (evseCalculator)
  7200W @ 100% (无EVEMS) = 7,200W
  ✅ 100%需求系数

步骤6: 电器总和
  2,233 + 6,800 + 4,500 + 7,200 = 20,733W

步骤7: 方法A总计
  基础 + 电器 = 6,000 + 20,733 = 26,733W

步骤8: 方法B（最小值）
  100m² ≥ 80m² → 24,000W

步骤9: 最终负载
  max(26,733W, 24,000W) = 26,733W
  使用方法A（计算值）

步骤10: 服务电流
  26,733W ÷ 240V = 111.39A

步骤11: 断路器/配电盘
  下一个标准尺寸 ≥ 111.39A = 125A
```

## 架构优势

### 1. 稳定性
- 协调器 (`8-200-single-dwelling.ts`) 现在是稳定的
- 新的电器类型？只需添加新的计算器模块
- CEC规则改变？只需更新对应的计算器

### 2. 可维护性
```
修改Range计算? → 只改 rangeLoadCalculator.ts
修改EVSE规则? → 只改 evseCalculator.ts  
添加Generator? → 新建 generatorCalculator.ts
协调器保持稳定 → 8-200-single-dwelling.ts 不变！
```

### 3. 可测试性
每个纯函数都可以独立测试:
```typescript
describe('Range Calculator', () => {
  it('14kW range should return 6800W', () => {
    expect(calculateRangeLoad(14)).toBe(6800);
  });
});
```

### 4. CEC合规性
- 每个函数都有明确的CEC章节引用
- 公式都有文档说明
- 审计跟踪记录每一步

### 5. 类型安全
```typescript
export function calculateRangeLoad(rangeRating_kW: number): number {
  // TypeScript确保类型正确
}
```

## 如何测试

1. **刷新浏览器** (Ctrl+F5)
2. **输入你的测试数据**:
   - 居住面积: 100m²
   - 电压: 240V, 单相
   - 电器:
     - Range: 14kW (或 14000W)
     - Water Heater: 4500W
     - EVSE: 7200W
     - Air Conditioning: 2233W
3. **点击Calculate**
4. **查看审计跟踪**:
   - ✅ 步骤3: Range = 6800W (不是14000W)
   - ✅ 步骤4: Water Heater = 4500W @ 100%
   - ✅ 步骤5: EVSE = 7200W @ 100%
   - ✅ 步骤6: AC = 2233W @ 100%
   - ✅ 总计: 26,733W

## 未来扩展

添加新的电器类型非常简单：

```typescript
// 1. 创建新的计算器
// calculators/generatorCalculator.ts
export function calculateGeneratorLoad(ratingW: number): number {
  // CEC规则逻辑
  return demandW;
}

// 2. 在协调器中调用
const genCalc = calculateGeneratorLoadWithAudit(genWatts);
pushStep({
  operationId: 'calc_generator',
  formulaRef: 'CEC X-XXX',
  output: { generatorLoad_W: ... },
  note: genCalc.formula,
  ruleCitations: [genCalc.ruleReference]
});

// 3. 完成！协调器逻辑不变
```

## 文件说明

- **已创建**: `packages/cec-calculator/ARCHITECTURE.md` - 完整架构文档（英文）
- **已修改**: 
  - `rangeLoadCalculator.ts` - Range专门计算器
  - `waterHeaterCalculator.ts` - 热水器专门计算器
  - `evseCalculator.ts` - EVSE专门计算器
  - `largeLoadCalculator.ts` - 大负载专门计算器
  - `8-200-single-dwelling.ts` - 稳定的协调器（只调用函数）
  - `applianceLoadCalculator.ts` - 重新导出所有电器计算器

## 总结

✅ **核心协调器现在是稳定的**  
✅ **每个CEC规则都有专门的纯函数**  
✅ **计算逻辑和协调逻辑完全分离**  
✅ **CEC 62章的供暖需求系数正确实现**  
✅ **居住面积计算有专门函数**  
✅ **所有电器都分开计算，可以验证**  
✅ **架构可扩展、可维护、可测试**

现在请刷新浏览器测试，你将看到每个电器的详细计算步骤！🎉

---

**重构完成时间**: 2025-10-29  
**架构版本**: V4.1 (稳定)  
**CEC版本**: 2024













