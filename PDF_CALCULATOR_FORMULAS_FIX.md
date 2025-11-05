# PDF Calculator Formulas Fix - 2025-10-29

## 问题描述

PDF中的审计跟踪（audit trail）步骤中，formula字符串包含特殊符号，显示为`?`：

```
5000W for first 90m? + 1000W per additional 90m? portion  ← m² 变成 m?
6000W + 40% ? (14.5kW - 12kW) ? 1000 = 7000W              ← × 变成 ?
Tankless water heater: 3333W ? 100% = 3333W               ← × 变成 ?
Pool/spa heater: 2000W ? 100% = 2000W                     ← × 变成 ?
```

这个问题出现在**所有语言**（英语、法语、中文）的PDF中。

## 根本原因

### 问题来源

这些formula字符串是在**计算引擎的calculator模块中**生成的，不是通过i18n翻译系统，所以没有经过前端的`sanitizeForPDF`处理。

### 受影响的文件

1. **`rangeLoadCalculator.ts`**
   ```typescript
   formula = '6000W (rating ≤ 12kW)';  // ≤ → ?
   formula = `6000W + 40% × (${rating}kW - 12kW) × 1000 = ${demand}W`;  // × → ?
   ```

2. **`waterHeaterCalculator.ts`**
   ```typescript
   formula = `${type}: ${watts}W × 100% = ${demand}W`;  // × → ?
   warnings.push(`...typically ≤6000W`);  // ≤ → ?
   ```

3. **`evseCalculator.ts`**
   ```typescript
   formula: `EVSE: ${watts}W × 100% = ${watts}W`;  // × → ?
   ```

4. **`largeLoadCalculator.ts`**
   ```typescript
   formula: `Large loads: ${watts}W × 25% = ${demand}W`;  // × → ?
   formula: `${w1}W × 100% + ${w2}W × 25% = ${demand}W`;  // × → ?
   ```

5. **`baseLoadCalculator.ts`**
   ```typescript
   breakdown: `First 90m²: 5000W`;  // m² → m?
   breakdown: `First 90m²: 5000W + ${n} portions × 1000W = ${total}W`;  // m², × → ?
   warnings.push('...>1000m²');  // m² → ?
   ```

### 为什么会有问题？

1. **计算引擎生成formula** → 包含Unicode字符（×, ≤, ²）
2. **传递到前端** → formula作为字符串存储在`bundle.steps`中
3. **PDF生成时显示** → 前端的`sanitizeForPDF`只处理翻译文本，不处理formula
4. **jsPDF渲染** → Unicode字符超出Latin-1范围 → 显示为`?`

## 解决方案

### 策略
**在计算引擎源头使用ASCII安全字符**，而不是在PDF生成时再处理。

### 字符替换规则

| 原字符 | 替换为 | 说明 |
|-------|--------|------|
| `×` | `x` | 乘号 |
| `≤` | `<=` | 小于等于 |
| `≥` | `>=` | 大于等于 |
| `²` | `2` | 上标2（如m²→m2） |

### 修改清单

#### 1. rangeLoadCalculator.ts
```typescript
// Before:
formula = '6000W (rating ≤ 12kW)';
formula = `6000W + 40% × (${rating}kW - 12kW) × 1000 = ${demand}W`;

// After:
formula = '6000W (rating <= 12kW)';
formula = `6000W + 40% x (${rating}kW - 12kW) x 1000 = ${demand}W`;
```

#### 2. waterHeaterCalculator.ts
```typescript
// Before:
formula = `${type}: ${watts}W × 100% = ${demand}W`;
warnings.push(`...typically ≤6000W`);

// After:
formula = `${type}: ${watts}W x 100% = ${demand}W`;
warnings.push(`...typically <=6000W`);
```

#### 3. evseCalculator.ts
```typescript
// Before:
formula: `EVSE: ${watts}W × 100% = ${watts}W`;

// After:
formula: `EVSE: ${watts}W x 100% = ${watts}W`;
```

#### 4. largeLoadCalculator.ts
```typescript
// Before:
formula: `Large loads: ${watts}W × 25% = ${demand}W`;
formula: `${w1}W × 100% + ${w2}W × 25% = ${demand}W`;
// Comments:
// Returns 5000W (no range, ≤6000W)
// Returns 6500W (no range: 6000 + 0.25×2000)

// After:
formula: `Large loads: ${watts}W x 25% = ${demand}W`;
formula: `${w1}W x 100% + ${w2}W x 25% = ${demand}W`;
// Comments:
// Returns 5000W (no range, <=6000W)
// Returns 6500W (no range: 6000 + 0.25x2000)
```

#### 5. baseLoadCalculator.ts
```typescript
// Before:
breakdown: `First 90m²: 5000W`;
breakdown: `First 90m²: 5000W + ${n} portions × 1000W = ${total}W`;
warnings.push('...>1000m²');

// After:
breakdown: `First 90m2: 5000W`;
breakdown: `First 90m2: 5000W + ${n} portions x 1000W = ${total}W`;
warnings.push('...>1000m2');
```

## 测试验证

### PDF预期输出（所有语言）

**Step 1: Basic Load**
```
5000W for first 90m2 + 1000W per additional 90m2 portion  ✅ (不再是 m?)
```

**Step 4: Electric Range (14.5kW)**
```
6000W + 40% x (14.5kW - 12kW) x 1000 = 7000W  ✅ (不再是 ? x ? x ?)
```

**Step 5: Water Heater**
```
Tankless water heater: 3333W x 100% = 3333W   ✅ (不再是 ?)
```

**Step 6: Pool/Spa**
```
Pool/spa heater: 2000W x 100% = 2000W         ✅ (不再是 ?)
```

**Step 7: EVSE**
```
EVSE: 5000W x 100% = 5000W (no EVEMS)        ✅ (不再是 ?)
```

**Step 8: Other Large Loads**
```
Large loads (range present): 13600W x 25% = 3400W  ✅ (不再是 ?)
```

### 各语言对比

| 语言 | Formula来源 | PDF效果 |
|------|------------|---------|
| English (en-CA) | 计算引擎 | ✅ ASCII字符 |
| Français (fr-CA) | 计算引擎 | ✅ ASCII字符 |
| 简体中文 (zh-CN) | 计算引擎 | ✅ ASCII字符 |

**结果**：所有语言的PDF都使用相同的ASCII formula，确保一致性和兼容性。

## 设计原则

### 1. 源头解决
**在数据生成时使用ASCII字符**，而不是在显示时转换。

**优点**:
- 简单直接
- 一次修改，所有地方生效
- 无性能开销
- 不依赖前端sanitize

**缺点**:
- Formula不是"数学完美"（用`x`代替`×`）

### 2. 跨平台兼容
ASCII字符在**所有平台**都能正确显示：
- PDF（jsPDF）
- HTML（浏览器）
- 日志文件
- JSON导出
- Email
- 打印

### 3. 工程标准
工程文档中使用ASCII是**行业标准**：
```
Correct engineering notation:
- "m2" instead of "m²"
- "x" instead of "×"
- "<=" instead of "≤"
```

实际工程图纸、规范文档经常使用这种表示法。

## 关键要点

### ✅ 已解决
1. **所有formula使用ASCII** - 计算引擎源头修复
2. **跨语言一致性** - 英语、法语、中文PDF都正确
3. **无需前端处理** - formula已经是ASCII安全的
4. **comments也修复** - JSDoc中的示例也更新

### 📋 修改范围
- **5个calculator文件**: 所有formula字符串
- **12处代码修改**: formula和warnings
- **6处注释修改**: JSDoc examples

### 🎯 测试覆盖
- ✅ Basic Load formula
- ✅ Range Load formula (两种情况)
- ✅ Water Heater formula
- ✅ EVSE formula
- ✅ Large Loads formula (两种情况)
- ✅ Warnings文本

## 架构影响

### 计算引擎变更
**类型**: 字符串内容变更（无API变化）

**影响**:
- ✅ 不影响计算逻辑
- ✅ 不影响数值结果
- ✅ 不影响API接口
- ✅ 只影响formula字符串显示

**向后兼容性**: ✅ 完全兼容
- 旧版PDF：可能有`?`
- 新版PDF：显示`x`, `<=`, `m2`

### 前端变更
**无需变更** - 前端的`sanitizeForPDF`继续处理翻译文本，formula已经是ASCII安全的。

### 后端变更
**无需变更** - 后端使用相同的计算引擎，自动获得修复。

## 文件修改清单

1. ✅ `packages/cec-calculator/src/calculators/rangeLoadCalculator.ts`
   - Line 62: `≤` → `<=`
   - Line 64: `× ... ×` → `x ... x`

2. ✅ `packages/cec-calculator/src/calculators/waterHeaterCalculator.ts`
   - Line 87: `×` → `x`
   - Line 123: `≤` → `<=`

3. ✅ `packages/cec-calculator/src/calculators/evseCalculator.ts`
   - Line 75: `×` → `x`

4. ✅ `packages/cec-calculator/src/calculators/largeLoadCalculator.ts`
   - Line 18-20: Comments `≤`, `×` → `<=`, `x`
   - Line 79: `×` → `x`
   - Line 90, 92: `×` → `x`
   - Line 107: `≤` → `<=`

5. ✅ `packages/cec-calculator/src/calculators/baseLoadCalculator.ts`
   - Line 9-10: Comments `m²` → `m2`
   - Line 51: `m²` → `m2`
   - Line 61: `m²`, `×` → `m2`, `x`
   - Line 87: `m²` → `m2`
   - Line 130: `m²` → `m2`

6. ✅ 重新编译计算引擎包

## 技术债务

无。这是一个永久性的正确解决方案。

## 未来考虑

### 国际化Formula？
**问题**: 是否应该本地化formula文本？

**当前方案**: 所有formula使用英文ASCII
```
// All languages:
"6000W + 40% x (14.5kW - 12kW) x 1000 = 7000W"
```

**可选方案**: 本地化formula（不推荐）
```javascript
// English:
"6000W + 40% x (14.5kW - 12kW) x 1000 = 7000W"

// French:
"6000W + 40 % x (14,5 kW - 12 kW) x 1000 = 7000 W"

// Chinese:
"6000瓦 + 40% x (14.5千瓦 - 12千瓦) x 1000 = 7000瓦"
```

**决策**: 保持英文ASCII
- **原因1**: 工程标准是国际通用的
- **原因2**: 数学公式本身是"语言无关"的
- **原因3**: 避免翻译错误和一致性问题
- **原因4**: CEC代码引用本身是英文

### 后续测试

测试所有语言的PDF：
1. ✅ 英语PDF (en-CA)
2. ✅ 法语PDF (fr-CA)
3. ✅ 中文PDF (zh-CN)

验证所有formula都使用ASCII字符，无`?`显示。












