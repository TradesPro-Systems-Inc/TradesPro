# CEC 交互式表格查询功能

**日期**: 2025-10-23  
**功能**: CEC 表格交互式查询工具

---

## 🎯 功能概述

为 TradesPro 添加了交互式的 CEC 表格查询功能，让习惯查表的电气工程师可以通过点选快速查询载流量值。

---

## ✨ 功能特点

### 1. **交互式表格**
- 点击任意线号行和温度列
- 实时高亮显示选中的单元格
- 清晰显示选中的数值

### 2. **完整的 CEC Table 2 数据**
- 包含所有标准线号 (14 AWG ~ 2000 kcmil)
- 6个温度等级 (60°C, 75°C, 90°C, 110°C, 125°C, 200°C)
- 完整的载流量数据

### 3. **多语言支持**
- 英语 (English)
- 法语 (Français)
- 中文 (简体中文)

### 4. **响应式设计**
- 桌面端优化
- 移动端友好
- 自适应布局

---

## 📂 文件结构

```
tradespro/frontend/src/
├── data/
│   └── cecTable2.json                 # CEC Table 2 完整数据
├── components/
│   └── tools/
│       └── CecTableViewer.vue         # 表格查看器组件
├── pages/
│   └── TablesPage.vue                 # 表格页面
├── router/
│   └── routes.js                      # 添加 /tables 路由
├── layouts/
│   └── MainLayout.vue                 # 添加导航链接
└── i18n/
    ├── en-CA.json                     # 英语翻译
    ├── fr-CA.json                     # 法语翻译
    └── zh-CN.json                     # 中文翻译
```

---

## 🎨 UI 设计

### 选中效果

```
┌─────────────────────────────────────────────────┐
│  💡 选中数值:                                    │
│  线号 3/0 AWG  @  75 °C‡  =  200 A             │
└─────────────────────────────────────────────────┘
```

### 表格布局

```
┌──────────┬───────┬───────┬───────┬───────┬───────┬───────┐
│ Size     │ 60°C  │ 75°C  │ 90°C  │ 110°C │ 125°C │ 200°C │
├──────────┼───────┼───────┼───────┼───────┼───────┼───────┤
│ 14§      │  15   │  20   │  25   │  25   │  30   │  35   │
│ 12§      │  20   │  25   │  30   │  30   │  35   │  40   │
│ ...      │ ...   │ ...   │ ...   │ ...   │ ...   │ ...   │
│ 3/0 AWG  │ 165   │►200◄  │ 225   │ 255   │ 270   │ 330   │
│ ...      │ ...   │ ...   │ ...   │ ...   │ ...   │ ...   │
└──────────┴───────┴───────┴───────┴───────┴───────┴───────┘
```

### 颜色方案

- **表头**: 深灰色 (grey-9) + 白色文字
- **选中行**: 浅蓝色背景 (blue-1)
- **选中单元格**: 绿色高亮 (green-3)
- **悬停效果**: 黄色淡化 (yellow-1)
- **N/A 单元格**: 灰色斜体

---

## 🔧 技术实现

### 数据结构

```json
{
  "table": "CEC Table 2",
  "columns": [
    { "key": "temp60", "label": "60 °C‡", "temp": 60 },
    { "key": "temp75", "label": "75 °C‡", "temp": 75 },
    ...
  ],
  "data": [
    { "size": "14§", "temp60": 15, "temp75": 20, ... },
    { "size": "12§", "temp60": 20, "temp75": 25, ... },
    ...
  ]
}
```

### 交互逻辑

```vue
<script setup>
const selectedRow = ref(null);
const selectedCol = ref(null);

function handleCellClick(rowIndex, colKey) {
  selectedRow.value = rowIndex;
  selectedCol.value = colKey;
}

const selectedValue = computed(() => {
  if (selectedRow.value !== null && selectedCol.value !== null) {
    const row = tableData.value.data[selectedRow.value];
    const col = columns.find(c => c.key === selectedCol.value);
    return {
      size: row.size,
      temp: col.label,
      ampacity: row[selectedCol.value]
    };
  }
  return null;
});
</script>
```

---

## 🌐 访问路径

- **URL**: `/tables`
- **导航**: `CEC Tables` 按钮
- **移动端**: 汉堡菜单 → CEC 表格

---

## 📝 使用说明

### 步骤 1: 访问表格页面
点击导航栏的 "CEC Tables" 按钮

### 步骤 2: 选择线号
点击左侧列的任意线号（如 "3/0 AWG"）

### 步骤 3: 选择温度
点击表头的任意温度列（如 "75 °C‡"）

### 步骤 4: 查看结果
表格上方会显示：
```
选中数值: 线号 3/0 AWG @ 75 °C‡ = 200 A
```

---

## 🎯 用户场景

### 场景 1: 快速查询
**需求**: 查询 3/0 AWG 铜线在 75°C 时的载流量

**步骤**:
1. 访问 `/tables`
2. 点击 "3/0" 行
3. 点击 "75 °C‡" 列
4. 看到结果: **200 A**

### 场景 2: 对比温度
**需求**: 对比同一线号在不同温度下的载流量

**步骤**:
1. 选择线号 "3/0"
2. 查看该行所有温度的值:
   - 60°C: 165 A
   - 75°C: 200 A
   - 90°C: 225 A
   - ...

### 场景 3: 移动端查询
**需求**: 在施工现场用手机查表

**步骤**:
1. 打开手机浏览器
2. 点击汉堡菜单 ☰
3. 选择 "CEC 表格"
4. 横向滚动查看完整表格

---

## 🔮 未来扩展

### Table 4 - Aluminum Conductors
计划添加铝导体载流量表

### Table 5A - Temperature Correction Factors
计划添加温度修正系数表

### Table 5C - Derating for Multiple Conductors
计划添加多导体降额系数表

### Table 19 - Conduit Fill
计划添加管道填充表

---

## 🎨 样式特点

### CSS 类

```scss
.cec-table {
  .ampacity-header {
    &:hover { background-color: rgba(255, 255, 255, 0.1); }
    &.selected-col { background-color: rgba(33, 150, 243, 0.3); }
  }
  
  .ampacity-row {
    &:hover { background-color: rgba(33, 150, 243, 0.05); }
    &.selected-row { background-color: rgba(33, 150, 243, 0.1); }
  }
  
  .ampacity-cell {
    &.hover-cell:hover { background-color: rgba(255, 235, 59, 0.2); }
    &.selected-cell {
      background-color: rgba(76, 175, 80, 0.3);
      font-weight: bold;
      color: #1b5e20;
      font-size: 1.1rem;
    }
  }
}
```

---

## 📊 数据完整性

### CEC Table 2 数据覆盖

- ✅ **AWG 线号**: 14, 12, 10, 8, 6, 4, 3, 2, 1, 0, 00, 000, 0000
- ✅ **kcmil 线号**: 250, 300, 350, 400, 500, 600, 700, 750, 800, 900, 1000, 1250, 1500, 1750, 2000
- ✅ **温度等级**: 60°C, 75°C, 90°C, 110°C, 125°C, 200°C
- ✅ **总数据点**: 28 × 6 = 168 个载流量值

### 数据准确性

- 数据来源: CEC 2024 Edition, Table 2
- 验证方式: 对照官方规范文档
- 特殊标记:
  - `§` 符号表示特殊规格
  - `—` 表示该温度不适用

---

## 🌟 用户体验

### 视觉反馈

1. **悬停效果**: 单元格变黄色，提示可点击
2. **选中高亮**: 绿色背景，加粗字体
3. **行列高亮**: 浅蓝色背景
4. **结果卡片**: 大号绿色字体显示结果

### 交互流程

```
用户访问 → 点击线号 → 点击温度 → 查看结果
   ↑                                    ↓
   └────────── 可重复选择 ──────────────┘
```

---

## 🚀 性能优化

- **懒加载**: 表格数据按需加载
- **虚拟滚动**: 大型表格使用虚拟滚动
- **缓存**: 选中状态保存在内存中
- **响应式**: 使用 computed 减少不必要的渲染

---

## 📱 响应式设计

### 桌面端 (> 1024px)
- 完整表格显示
- 所有列可见
- 大字体清晰显示

### 平板端 (768px - 1024px)
- 横向滚动查看
- 固定线号列
- 中等字体

### 移动端 (< 768px)
- 紧凑布局
- 横向滚动
- 触摸友好的按钮大小

---

## ✅ 测试检查

- [x] 表格数据加载正常
- [x] 点击选中功能正常
- [x] 多语言切换正常
- [x] 移动端显示正常
- [x] 响应式布局正常
- [x] 无 linter 错误

---

## 📚 参考资料

- [CEC 2024 Edition](https://www.csagroup.org/standards/areas-of-expertise/energy-and-environment/electrical-and-gas/canadian-electrical-code/)
- [CEC Table 2](./cec8-200.txt)
- [Quasar Framework](https://quasar.dev/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

---

**总结**: CEC 交互式表格查询功能已完成，为用户提供了一个快速、直观、多语言的电气规范查询工具。

