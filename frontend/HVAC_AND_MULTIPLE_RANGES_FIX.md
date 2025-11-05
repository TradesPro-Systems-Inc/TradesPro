# HVAC和多个Range的问题修复

## 问题1：HVAC 3000W 显示为0W

### 分析
从Console输出看：
```javascript
📊 Current appliances: Proxy(Array) {0: {…}, 1: {…}}
🔍 Categorizing appliance: {type: 'other', name: 'ww', watts: 3333, isContinuous: true}
⚠️ Appliance type 'other' not recognized, categorizing by size
```

**问题**：你的HVAC被标记为 `type: 'other'` 而不是 `type: 'air_conditioning'` 或 `type: 'space_heating'`。

### 如何正确添加HVAC

#### 方法1：在"Appliances"表单中添加
1. **Appliance Type**: 选择 "Air Conditioning" 或 "Space Heating"
2. **Watts**: 3000
3. 点击 "Add Appliance"

#### 方法2：使用主表单中的专门字段
在主表单中有专门的HVAC字段：
- **Heating Load (W)**: 输入供暖功率
- **Cooling Load (W)**: 输入制冷功率
- **Interlocked**: 如果供暖和制冷互锁，勾选此项

### 为什么显示0W？

如果你使用了主表单的HVAC字段（Heating Load / Cooling Load），这些值应该直接传入计算引擎。

但从审计跟踪看：
```
HVAC Load: 0 W
```

这意味着：
- `inputs.heatingLoadW` = 0 或 undefined
- `inputs.coolingLoadW` = 0 或 undefined
- 没有添加 type='air_conditioning' 或 'space_heating' 的电器

---

## 问题2：多个Range的处理

### CEC 8-200规则

**正确的逻辑**：
- **第一个Range**: CEC 8-200 1)a)iv
  ```
  6000W + 40% × (rating - 12kW) × 1000
  ```
  
- **第二个及以后的Range**: CEC 8-200 1)a)vii A)
  ```
  作为"其他大负载"，与Range同时存在
  → 25%需求系数
  ```

### 当前实现

代码已经正确实现了这个逻辑：
```typescript
const rangeItems = categories['range']?.items || [];
if (rangeItems.length > 0) {
  const firstRange = rangeItems[0];  // 第一个Range
  // ... 使用 CEC 8-200 1)a)iv 计算
  
  // Additional ranges treated as other loads
  for (let i = 1; i < rangeItems.length; i++) {
    addTo('other_large', rangeItems[i]);  // 第2+个Range → other_large
  }
}
```

### 你的情况

从Console看：
```javascript
📊 Current appliances: {0: {...}, 1: {...}}

Appliance 0: type='other', name='ww', watts=3333
Appliance 1: type='range', name='secR', watts=12000

📊 Final categories: {range: 1, other_large: 1}
```

**问题**：你只有1个Range (secR, 12kW)，第一个15kW的Range不见了！

### 可能原因

1. **你删除了第一个Range**，然后添加了第二个
2. **或者第一个Range的type被错误设置为'other'**

### 如何测试多个Range

1. 添加第一个Range：
   - Type: Range
   - Name: Range1
   - Watts: 15000
   - 点击 "Add Appliance"

2. 添加第二个Range：
   - Type: Range
   - Name: Range2
   - Watts: 12000
   - 点击 "Add Appliance"

3. 点击 "Calculate"

4. 检查Console：
```javascript
📊 Final categories: {range: 2, ...}  // 应该有2个Range

审计跟踪应该显示：
Step X: Electric Range
  Range1: 15kW → 6000W + 40% × 3000 = 7200W
  
Step Y: Other Large Loads (with Range)
  Range2: 12000W × 25% = 3000W
  (因为有Range存在，应用25%需求系数)
```

---

## 修复建议

### 1. HVAC问题修复

**Option A**: 如果想在电器列表中添加HVAC
- 确保选择正确的Type: "Air Conditioning" 或 "Space Heating"
- **不要选择 "Other"**

**Option B**: 使用主表单的专门字段
- 在主表单中找到 "Heating Load (W)" 和 "Cooling Load (W)"
- 直接输入数值（如3000）

### 2. 多个Range处理

代码已经正确，但需要确保：
1. 所有Range的 `type` 都是 `'range'`（不是 `'other'`）
2. 所有Range都有 `rating_kW` 字段

### 3. 调试步骤

添加电器后，检查Console输出：
```javascript
✅ Added to appliances: {
  type: 'range',        // ✅ 必须是'range'
  watts: 15000,
  rating_kW: 15         // ✅ 必须存在
}
```

如果看到：
```javascript
❌ {type: 'other', watts: 15000}  // ❌ type错误
❌ {type: 'range', watts: 15000}  // ❌ 缺少rating_kW
```

说明添加过程有问题。

---

## 预期的完整计算（你的例子）

**输入**:
- Living Area: 155m²
- Range1: 15kW
- Range2: 12kW  
- HVAC: 3000W
- Other: 3333W (continuous)

**计算**:
```
Step 1: Basic Load
  155m² → 5000W + ceil(65/90) × 1000 = 6000W

Step 2: HVAC
  3000W @ 100% = 3000W

Step 3: Electric Range (First)
  15kW → 6000W + 40% × (15-12) × 1000 = 7200W

Step 4: Other Large Loads (with Range)
  Range2 (12000W) + Other (3333W) = 15333W
  15333W × 25% = 3833.25W
  (因为有Range，所有>1500W的负载都用25%)

总电器负载: 3000 + 7200 + 3833.25 = 14033.25W
方法A总计: 6000 + 14033.25 = 20033.25W
方法B最小值: 24000W (≥80m²)
最终负载: 24000W (使用方法B)
```

---

## 当前问题总结

1. ❌ **HVAC显示0W**: type被错误设置为'other'而不是'air_conditioning'
2. ⚠️ **只看到1个Range**: 第一个15kW Range不见了
3. ✅ **多Range逻辑正确**: 代码已经正确实现，只需正确添加电器

---

## 下一步

1. **清空所有电器**（点击每个电器旁的删除按钮）
2. **重新添加**，确保选择正确的Type：
   - Range1: Type="Range", Watts=15000
   - Range2: Type="Range", Watts=12000
   - HVAC: Type="Air Conditioning", Watts=3000
3. **检查Console**确认type和rating_kW都正确
4. **计算**并查看审计跟踪

如果还有问题，请提供完整的Console输出，特别是：
- 🔵 Adding appliance 的所有输出
- 📊 Current appliances 的完整内容
- 🔍 Categorizing appliance 的所有输出
- 📊 Final categories 的完整内容













