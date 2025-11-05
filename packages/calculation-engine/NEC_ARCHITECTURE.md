# NEC Calculator Architecture

## 文件结构和位置

### 包根目录
```
tradespro/packages/calculation-engine/
├── package.json                    # 包配置 (包名: @tradespro/calculation-engine)
├── tsconfig.json                   # TypeScript 配置
├── src/                            # 源代码目录
│   ├── index.ts                    # 主入口，导出所有模块
│   │
│   ├── core/                       # 核心类型和表格管理
│   │   ├── types.ts                # 共享类型定义 (CecInputsSingle, UnsignedBundle, etc.)
│   │   ├── tableLookups.ts         # 表格查找函数 (CEC Table 2, 4, 5A, 5C)
│   │   ├── tables.ts               # Node.js 表格管理器
│   │   └── tables.browser.ts       # 浏览器兼容表格管理器
│   │
│   ├── calculators/                # 纯函数计算器 (Pure Functions)
│   │   ├── baseLoadCalculator.ts          # CEC 基础负载计算
│   │   ├── heatingCoolingCalculator.ts    # CEC HVAC 负载计算
│   │   ├── rangeLoadCalculator.ts         # CEC 电灶负载计算
│   │   ├── waterHeaterCalculator.ts       # CEC 热水器负载计算
│   │   ├── evseCalculator.ts              # CEC EVSE 负载计算
│   │   ├── largeLoadCalculator.ts         # CEC 大负载计算
│   │   ├── applianceLoadCalculator.ts     # CEC 电器负载汇总
│   │   ├── necBaseLoadCalculator.ts       # 🆕 NEC 基础负载计算
│   │   └── necStandardMethodCalculator.ts  # 🆕 NEC 标准方法计算
│   │
│   └── rules/                      # 规则协调器 (Audit Coordinators)
│       ├── 8-200-single-dwelling.ts        # CEC 8-200 单户住宅计算协调器
│       └── 220-single-dwelling.ts          # 🆕 NEC 220 单户住宅计算协调器
│
└── dist/                           # 编译输出目录
```

## NEC 相关文件详解

### 1. **NEC 基础负载计算器** (`calculators/necBaseLoadCalculator.ts`)
**位置**: `tradespro/packages/calculation-engine/src/calculators/necBaseLoadCalculator.ts`

**功能**:
- `calculateNECGeneralLighting(livingArea_ft2)` - NEC 220.12 通用照明 (3 VA/ft²)
- `calculateNECSmallApplianceLoad()` - NEC 220.52 小器具负载 (4500 VA)
- `calculateNECOptionalGeneralLoad(livingArea_ft2, applianceVA)` - NEC 220.82 可选方法

**引用规则**:
- NEC 220.12 - General Lighting Load
- NEC 220.52 - Small Appliance and Laundry Loads
- NEC 220.82(B) - Optional Method General Loads

---

### 2. **NEC 标准方法计算器** (`calculators/necStandardMethodCalculator.ts`)
**位置**: `tradespro/packages/calculation-engine/src/calculators/necStandardMethodCalculator.ts`

**功能**:
- `applyNECLightingDemandFactors(totalLightingVA)` - Table 220.42 照明需求系数
- `applyNECApplianceDemandFactor(applianceVA, applianceCount)` - NEC 220.53 器具需求系数 (75%)
- `calculateNECDryerLoad(dryerVA, dryerCount)` - NEC 220.54 干衣机负载 (5000 VA 最小值)
- `calculateNECRangeLoad(rangeVA, rangeCount)` - NEC 220.55 电灶负载 (Table 220.55)
- `calculateNECHVACLoad(heatingVA, coolingVA)` - NEC 220.60 非同时负载

**引用规则**:
- NEC 220.42 - Table 220.42 Lighting Load Demand Factors
- NEC 220.53 - Appliance Load (75% for 4+ appliances)
- NEC 220.54 - Electric Clothes Dryers
- NEC 220.55 - Table 220.55 Electric Cooking Appliances
- NEC 220.60 - Noncoincident Loads

---

### 3. **NEC 规则协调器** (`rules/220-single-dwelling.ts`)
**位置**: `tradespro/packages/calculation-engine/src/rules/220-single-dwelling.ts`

**主函数**:
```typescript
computeNECSingleDwelling(
  inputs: CecInputsSingle,
  engineMeta: EngineMeta,
  ruleTables: RuleTables,
  useOptionalMethod: boolean = false
): UnsignedBundle
```

**功能**:
- **标准方法** (Standard Method - Part III): 完整的 NEC Article 220 Part III 计算流程
- **可选方法** (Optional Method - Part IV): NEC 220.82 可选计算方法
- 生成完整的审计轨迹 (Calculation Steps)
- 引用所有相关的 NEC 条文编号

**计算流程** (标准方法):
1. 通用照明负载 (NEC 220.12) - 3 VA/ft²
2. 小器具电路负载 (NEC 220.52) - 4500 VA
3. 应用照明需求系数 (NEC 220.42, Table 220.42)
4. 电灶负载 (NEC 220.55, Table 220.55)
5. 干衣机负载 (NEC 220.54)
6. HVAC 负载 (NEC 220.60 - 非同时负载)
7. 固定器具负载 (NEC 220.53)
8. 总负载计算
9. 服务电流计算

**计算流程** (可选方法 - NEC 220.82):
1. 通用负载 = 照明 + 小器具 + 固定器具
2. 应用可选方法需求系数: 首 10 kVA @ 100% + 剩余 @ 40%
3. 添加 HVAC 负载 (取最大值)
4. 总负载计算

---

### 4. **主入口文件** (`index.ts`)
**位置**: `tradespro/packages/calculation-engine/src/index.ts`

**导出内容**:
```typescript
// 导出 NEC 规则协调器
export * from './rules/220-single-dwelling';

// 导出主函数
export { computeNECSingleDwelling } from './rules/220-single-dwelling';
```

---

## 架构设计原则

### V4.1 Architecture Compliance
- ✅ **Pure Functions**: 所有计算器都是纯函数（无副作用）
- ✅ **Separation of Concerns**: 计算逻辑与协调逻辑分离
- ✅ **Stable Coordinator**: 规则协调器稳定，不频繁修改
- ✅ **Audit Trail**: 每个计算步骤都有完整的审计轨迹
- ✅ **Rule Citations**: 所有计算都引用 NEC 条文编号

### 与 CEC 架构的一致性
- 使用相同的类型系统 (`CecInputsSingle`, `UnsignedBundle`, `CalculationStep`)
- 遵循相同的审计轨迹格式
- 使用相同的表格管理系统（可扩展支持 NEC 表格）

---

## 使用示例

```typescript
import { computeNECSingleDwelling } from '@tradespro/calculation-engine';

// 标准方法
const inputs: CecInputsSingle = {
  livingArea_m2: 150,
  systemVoltage: 240,
  phase: 1,
  hasElectricRange: true,
  electricRangeRatingKW: 12,
  heatingLoadW: 8000,
  coolingLoadW: 0,
  isHeatingAcInterlocked: true,
  appliances: [
    { type: 'water_heater', watts: 4500, name: 'Water Heater' }
  ]
};

const engineMeta: EngineMeta = {
  name: 'TradesPro NEC Calculator',
  version: '1.0.0',
  commit: 'abc123'
};

const ruleTables: RuleTables = {
  edition: '2023',
  code: 'nec'
};

// 执行计算
const bundle = computeNECSingleDwelling(inputs, engineMeta, ruleTables, false);
console.log(bundle.results.serviceCurrentA); // 服务电流
console.log(bundle.steps); // 审计轨迹
```

---

## 待实现功能

1. **NEC 表格查找** (TODO)
   - Table 310.15(B)(16) - 导线载流量
   - Table 220.84 - 多户住宅需求系数
   - 其他 NEC 表格

2. **前端集成** (TODO)
   - CEC/NEC 切换界面
   - NEC 专用输入字段
   - 可选方法选择

3. **测试** (TODO)
   - 单元测试
   - Golden Fixtures
   - 与 CEC 结果对比测试

---

## 文件统计

- **NEC 专用文件**: 3 个
  - `necBaseLoadCalculator.ts` (NEC 基础负载)
  - `necStandardMethodCalculator.ts` (NEC 标准方法)
  - `220-single-dwelling.ts` (NEC 规则协调器)

- **共享文件**: 
  - `types.ts` (类型定义)
  - `index.ts` (主入口)

- **总文件数**: 15 个 TypeScript 文件
  - 9 个计算器文件 (7 CEC + 2 NEC)
  - 2 个规则协调器文件 (1 CEC + 1 NEC)
  - 4 个核心文件

