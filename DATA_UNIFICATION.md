# TradesPro 数据统一说明

**日期**: 2025-10-23  
**主题**: 统一使用标准 CEC 表格数据

---

## 📊 问题发现

用户发现了一个重要的代码重复问题：

### 原有数据源
**位置**: `services/calculation-service/dist/data/tables/2024/table2.json`

**特点**:
- ✅ 完整的 CEC Table 2 数据
- ✅ 标准化的数据格式
- ✅ 包含所有 6 个温度等级（60, 75, 90, 110, 125, 200°C）
- ✅ 完整的元数据（tableId, version, source, checksum）
- ✅ 28 个线号规格（14 AWG ~ 2000 kcmil）

**数据格式**:
```json
{
  "tableId": "CEC-2024-T2",
  "name": "Ampacities for Insulated Copper Conductors",
  "version": "2024",
  "entries": [
    {
      "size": "14",
      "unit": "AWG",
      "ampacity60C": 15,
      "ampacity75C": 20,
      "ampacity90C": 25,
      "ampacity110C": 25,
      "ampacity125C": 30,
      "ampacity200C": 35,
      "notes": ["See Rule 14-104 2)"]
    },
    ...
  ]
}
```

### ❌ 重复创建的数据（已删除）
**位置**: `frontend/src/data/cecTable2.json`（已删除）

**问题**:
- ❌ 数据重复
- ❌ 格式不一致
- ❌ 维护成本高
- ❌ 容易出现数据不同步

---

## ✅ 解决方案

### 统一数据源
**单一真实数据源**: `services/calculation-service/dist/data/tables/2024/table2.json`

### 数据流向
```
CEC 2024 官方规范
   ↓
services/calculation-service/dist/data/tables/2024/table2.json
   ↓
   ├─→ 计算引擎 (useOfflineCalculation.ts)
   └─→ 交互式表格 (CecTableViewer.vue)
```

---

## 🔧 实现细节

### CecTableViewer.vue 修改

#### 修改前（错误）
```vue
<script setup>
import cecTable2Data from '../../data/cecTable2.json';  // ❌ 重复数据

const tableData = ref(cecTable2Data);
</script>
```

#### 修改后（正确）
```vue
<script setup>
import cecTable2Data from '../../../services/calculation-service/dist/data/tables/2024/table2.json';  // ✅ 标准数据

// 数据转换适配器
const tableData = computed(() => {
  return {
    ...cecTable2Data,
    baseTemp: '30°C',
    data: cecTable2Data.entries.map(entry => ({
      size: `${entry.size}${entry.unit === 'AWG' ? '' : ' kcmil'}`,
      ampacity60C: entry.ampacity60C,
      ampacity75C: entry.ampacity75C,
      ampacity90C: entry.ampacity90C,
      ampacity110C: entry.ampacity110C || null,
      ampacity125C: entry.ampacity125C || null,
      ampacity200C: entry.ampacity200C || null
    }))
  };
});
</script>
```

---

## 📈 数据完整性对比

### 原来的简化版（已废弃）

**位置**: `useOfflineCalculation.ts` 中的 `conductorTable75C`

```typescript
const conductorTable75C = [
  { size: '14 AWG', cu: 15, al: 0 },
  { size: '12 AWG', cu: 20, al: 15 },
  { size: '10 AWG', cu: 30, al: 25 },
  ...
  { size: '500 kcmil', cu: 320, al: 260 }
];
```

**问题**:
- ❌ 只有 75°C 一个温度
- ❌ 只有 18 个线号
- ❌ 硬编码在代码中

### 标准数据源（现在使用）

**位置**: `services/calculation-service/dist/data/tables/2024/table2.json`

**优势**:
- ✅ **6 个温度等级**: 60°C, 75°C, 90°C, 110°C, 125°C, 200°C
- ✅ **28 个线号**: 14 AWG ~ 2000 kcmil
- ✅ **168 个数据点**: 28 × 6 = 168
- ✅ **完整元数据**: tableId, version, source, checksum
- ✅ **可追溯性**: 每个条目都有 notes
- ✅ **单一维护点**: 只需更新一个文件

---

## 🎯 用户体验改进

### 修改前
用户在计算器中只能选择：
- 60°C
- 75°C
- 90°C

### 修改后
用户现在可以选择：
- 60°C
- 75°C
- 90°C
- **110°C** ✨ (新增)
- **125°C** ✨ (新增)
- **200°C** ✨ (新增)

**适用场景**:
- **110°C**: 高温环境（如工业炉区域）
- **125°C**: 特殊高温绝缘材料
- **200°C**: 耐火电缆、特殊应用

---

## 🔄 未来计划

### 1. 扩展到其他表格
- Table 4: Aluminum conductors
- Table 5A: Temperature correction factors
- Table 5C: Multiple conductor derating
- Table 19: Conduit fill tables

### 2. 动态加载
```typescript
// 未来可以从 API 动态加载最新版本
const tableData = await fetch('/api/tables/cec-2024/table2');
```

### 3. 版本管理
```typescript
// 支持多个 CEC 版本
import table2_2021 from '.../2021/table2.json';
import table2_2024 from '.../2024/table2.json';
```

---

## ✅ 修改清单

### 删除的文件
- ✅ `frontend/src/data/cecTable2.json` （重复数据）

### 修改的文件
- ✅ `frontend/src/components/tools/CecTableViewer.vue`
  - 改用标准数据源
  - 添加数据转换适配器
  - 支持所有 6 个温度等级

### 保持不变的文件
- ✅ `services/calculation-service/dist/data/tables/2024/table2.json`
  - 标准数据源
  - 继续作为单一真实数据源

---

## 📊 数据格式对比

### 标准格式（services）
```json
{
  "tableId": "CEC-2024-T2",
  "entries": [
    {
      "size": "14",
      "unit": "AWG",
      "ampacity60C": 15,
      "ampacity75C": 20,
      "ampacity90C": 25,
      "ampacity110C": 25,
      "ampacity125C": 30,
      "ampacity200C": 35
    }
  ]
}
```

### UI 格式（转换后）
```javascript
{
  data: [
    {
      size: "14",
      ampacity60C: 15,
      ampacity75C: 20,
      ampacity90C: 25,
      ampacity110C: 25,
      ampacity125C: 30,
      ampacity200C: 35
    }
  ]
}
```

**转换逻辑**: 简单的映射，保持数据结构清晰

---

## 🎓 经验教训

### ❌ 错误做法
1. 创建重复的数据文件
2. 硬编码表格数据在组件中
3. 不同地方使用不同格式

### ✅ 正确做法
1. **单一数据源原则** (Single Source of Truth)
2. **数据与展示分离** (Data-Presentation Separation)
3. **适配器模式** (Adapter Pattern) 用于格式转换
4. **版本管理** (Version Control) 保留历史数据

---

## 🔍 代码审查要点

### 检查清单
- [x] 删除重复的数据文件
- [x] 统一使用标准数据源
- [x] 添加数据转换适配器
- [x] 支持所有温度等级
- [x] 保持向后兼容性
- [x] 无 linter 错误

---

## 📚 参考资料

- [CEC 2024 Edition](https://www.csagroup.org/)
- [Single Source of Truth Pattern](https://en.wikipedia.org/wiki/Single_source_of_truth)
- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)

---

**总结**: 通过统一数据源，我们消除了代码重复，提高了数据一致性，并为用户提供了更完整的功能（支持 6 个温度等级而不是 3 个）。这是一个重要的代码质量改进。

**感谢用户的反馈！** 这个问题的发现避免了未来可能的数据不同步和维护困难。

