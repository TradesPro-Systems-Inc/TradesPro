# Range识别问题调试指南

## 问题描述

用户添加了14kW Range，但计算显示：
```
❌ rangePresent: false
❌ Step 5: calc_large_loads_no_range
❌ Large loads (no range): 6000W × 100% + 2899W × 25% = 6724.75W
```

这说明Range被错误分类为 `other_large` 而不是 `range`。

## 已添加的调试功能

### 1. 前端调试（CalculatorPage.vue）

在添加电器时会输出：
```javascript
🔥 Range: 14000W = 14kW  // 显示rating_kW已设置
✅ Added to appliances: {type: 'range', watts: 14000, rating_kW: 14}
```

### 2. 计算引擎调试（8-200-single-dwelling.ts）

在分类电器时会输出：
```javascript
🔍 Categorizing appliance: {type: 'range', watts: 14000, rating_kW: 14}
✅ Identified as RANGE  // 如果正确识别
⚠️ Appliance type 'xxx' not recognized  // 如果未识别

📊 Final categories: {
  range: 1,  // 应该是1，不是0
  heating: 0,
  cooling: 1,
  // ...
}
```

## 测试步骤

### 步骤1：刷新浏览器
```bash
按 Ctrl+F5 强制刷新（清除缓存）
```

### 步骤2：打开浏览器Console
```bash
按 F12 打开开发者工具
切换到 Console 标签
```

### 步骤3：添加Range
1. 在"Add Appliance"表单中：
   - **Appliance Type**: 选择 "Range" (第一个选项)
   - **Watts**: 输入 `14000`
   - 点击 "Add Appliance"

2. **检查Console输出**：
```javascript
// 应该看到：
🔥 Range: 14000W = 14kW
✅ Added to appliances: {type: 'range', watts: 14000, rating_kW: 14, ...}
📊 Current appliances: [{type: 'range', ...}]
```

3. **如果Console显示**：
```javascript
⚠️ 如果看到 type: 'other' 或其他值
→ 问题：前端没有正确设置type
→ 解决：确保在下拉框中选择了 "Range"
```

### 步骤4：添加其他电器
- Water Heater: 4500W
- EVSE: 7200W (不勾选EVEMS)
- Air Conditioning: 2233W

### 步骤5：执行计算
1. 点击 "Calculate" 按钮

2. **检查Console输出**：
```javascript
// 应该看到：
📤 Sending to engine: {appliances: [{type: 'range', watts: 14000, rating_kW: 14}, ...]}

🔍 Categorizing appliance: {type: 'range', watts: 14000, rating_kW: 14}
✅ Identified as RANGE

📊 Final categories: {
  range: 1,        // ✅ 应该是1
  cooling: 1,      // ✅ AC
  water_heaters: 1,// ✅ Water heater
  evse: 1,         // ✅ EVSE
  other_large: 0   // ✅ 应该是0（Range不在这里）
}
```

3. **如果Console显示**：
```javascript
❌ 如果看到：
🔍 Categorizing appliance: {type: 'other', watts: 14000}
⚠️ Appliance type 'other' not recognized, categorizing by size

📊 Final categories: {
  range: 0,        // ❌ 错误：应该是1
  other_large: 1   // ❌ Range被错误分类到这里
}

→ 问题：type字段传递错误
→ 需要检查：前端是否正确设置了type = 'range'
```

### 步骤6：检查审计跟踪
应该看到：

```
✅ 正确的显示：

Step 4: Range Load
  Formula: CEC 8-200 1)a)iv
  Note: Range: 14kW → 6000W + 40% × (14-12) × 1000 = 6800W
  Output: rangeContribution_W: 6800.00

Step 8: Other Large Loads (如果有其他>1500W的电器)
  Formula: CEC 8-200 1)a)vii A)
  Note: Other loads >1500W with Range present: Apply 25% demand factor
  rangePresent: true ✅
```

```
❌ 如果看到错误的显示：

Step 5: calc_large_loads_no_range
  Note: Other loads >1500W without Range: ...
  rangePresent: false ❌
  otherLargeRaw: 8899.00 (包含了14000W Range)

→ 问题确认：Range被错误分类为other_large
```

## 可能的问题和解决方案

### 问题1：type字段不是'range'
**症状**：Console显示 `type: 'other'` 或其他值

**原因**：
- 用户在下拉框中没有选择"Range"
- 或者前端applianceTypes数组配置错误

**解决**：
1. 确保在"Appliance Type"下拉框中选择第一个选项 "Range"
2. 检查applianceTypes数组是否正确配置

### 问题2：type字段为undefined
**症状**：Console显示 `type: undefined`

**原因**：前端没有正确传递type字段

**解决**：检查CalculatorPage.vue的addAppliance函数

### 问题3：类型不匹配
**症状**：Console显示 `⚠️ Appliance type 'Range' not recognized`（大写R）

**原因**：type值大小写错误，应该是小写 `'range'`

**解决**：确保applianceTypes数组的value是小写 `'range'`

## 改进的审计跟踪显示

现在的note文本更友好：

### Range识别成功时：
```
Step 4: Electric Range Load
  Note: Range: 14kW → 6000W + 40% × (14-12) × 1000 = 6800W
  (清晰说明Range被识别并正确计算)
```

### 有Range时的其他大负载：
```
Step 8: Other Large Appliances
  Note: Other loads >1500W with Range present: Apply 25% demand factor to 5000W = 1250W
  rangePresent: true
```

### 无Range时的其他大负载：
```
Step 8: Other Large Appliances  
  Note: Other loads >1500W without Range: First 6000W @ 100%, Excess 2899W @ 25% = 6724.75W
  rangePresent: false
```

## 如何判断问题是否解决

### ✅ 成功标志：
1. Console显示 `✅ Identified as RANGE`
2. Console显示 `range: 1` 在Final categories中
3. 审计跟踪显示 "Step 4: Range Load" 6800W
4. 审计跟踪显示 `rangePresent: true`
5. 最终总负载 ≈ 26,733W (不是24,000W)

### ❌ 失败标志：
1. Console显示 `⚠️ Appliance type ... not recognized`
2. Console显示 `range: 0` 或缺失
3. 审计跟踪显示 "without Range"
4. 审计跟踪显示 `rangePresent: false`
5. otherLargeRaw包含了14000W

## 预期的完整计算结果

```
步骤1: 基础负载
  100m² → 6,000W

步骤2: 空调
  2,233W @ 100% = 2,233W

步骤3: Range ✅
  14kW → 6000W + 40% × 2000W = 6,800W

步骤4: Water Heater
  4,500W @ 100% = 4,500W

步骤5: EVSE
  7,200W @ 100% = 7,200W

步骤6: 电器总和
  2233 + 6800 + 4500 + 7200 = 20,733W

步骤7: 方法A
  6000 + 20733 = 26,733W

步骤8: 方法B
  24,000W (≥80m²)

步骤9: 最终负载
  max(26733, 24000) = 26,733W ✅

步骤10: 服务电流
  26,733W ÷ 240V = 111.39A

步骤11: 断路器
  125A (下一个标准尺寸)
```

## 如果问题仍然存在

请提供以下信息：
1. **Console完整输出**（截图或复制）
2. **添加Range时的输出**（应该显示type和rating_kW）
3. **分类时的输出**（🔍 Categorizing appliance）
4. **最终分类结果**（📊 Final categories）

这样我们可以精确定位问题在哪个环节。

---

**调试版本**: 2025-10-29  
**优先级**: P0 (关键)  
**状态**: 等待用户测试和反馈













