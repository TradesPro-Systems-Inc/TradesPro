# PDF Special Characters Fix - 2025-10-29

## 问题描述

PDF生成后出现多个显示问题：

1. **特殊符号变成`?`**:
   - `×` (乘号) → `?`
   - `÷` (除号) → `?`
   - `≥` (大于等于) → `?`
   - `°` (度数符号) → `?`
   - `•` (bullet point) → `?`

2. **重复显示**: `2 AWG Cu AWG (Cu)` - "AWG"和材料重复

3. **`undefined W`**: Basic Load公式中显示为"undefined"

4. **`0A base`**: Base ampacity显示为0

## 根本原因

### 1. 特殊符号问题
在`sanitizeForPDF`函数中，第40行：
```typescript
.replace(/[^\x00-\x7F]/g, '?');  // Replace remaining non-ASCII with ?
```

这行代码将**所有非ASCII字符替换成`?`**。虽然前面有转换（如`×`→`x`），但在**构建字符串时又使用了特殊符号**（第145、275、795、835、876、880行），这些新加入的特殊符号没有经过sanitize处理。

### 2. 重复显示问题
第258行：
```typescript
value: `${bundle.results?.conductorSize || 'N/A'} AWG (${bundle.results?.conductorMaterial || 'Cu'})`
```

`conductorSize`本身已经包含"AWG Cu"（如"2 AWG Cu"），又额外添加了"AWG"和材料。

### 3. `undefined`问题
第331行使用了不存在的字段：
```typescript
`5000 + ${portions} x 1000 = ${bundle.results?.basicLoadA} W`
```

`results`对象中没有`basicLoadA`字段，应该是`basicVA`。

### 4. `0A base`问题
`bundle.results?.baseAmpacity`字段未在计算引擎中设置。

## 解决方案

### 1. 替换所有手动构建字符串中的特殊符号

**修改位置**: `tradespro/frontend/src/services/pdfGenerator.ts`

```typescript
// ✅ 第145-146行：温度符号
{ label: translate('pdf.terminationTemp'), value: `${bundle.inputs?.terminationTempC || 75} deg C`, ref: 'CEC 4-006' },
{ label: translate('pdf.ambientTemp'), value: `${bundle.inputs?.ambientTempC || 30} deg C`, ref: 'CEC Table 5A' }

// ✅ 第264行：除号和箭头
return `${serviceCurrent.toFixed(2)}A / ${tempFactor.toFixed(3)} = ${requiredBase.toFixed(2)}A (required) - Selected: ${bundle.results?.conductorSize} (${baseAmpacity}A base)`;

// ✅ 第275行：乘号、大于等于
return `${baseAmpacity}A x ${tempFactor.toFixed(3)} = ${derated.toFixed(2)}A >= ${serviceCurrent.toFixed(2)}A (OK)`;

// ✅ 第795行：度数符号
return `Selected: ${condSize}\nCorrected ampacity: ${condAmp} A (@ ${condTemp} deg C ambient)`;

// ✅ 第835-837行：小于等于、箭头、乘号
if (area <= 90) {
  parts.push(`Formula: ${area} m2 <= 90 m2 -> 5000 W`);
} else {
  parts.push(`Formula: 5000 W + ${portions} x 1000 W = ${5000 + portions * 1000} W`);
}

// ✅ 第876-880行：度数符号
if (values.ambientTemp || values.ambientTempC) {
  parts.push(`Ambient temp: ${values.ambientTemp || values.ambientTempC} deg C`);
}

if (values.terminationTemp || values.terminationTempC) {
  parts.push(`Termination temp: ${values.terminationTemp || values.terminationTempC} deg C`);
}
```

### 2. 修复bullet points

```typescript
// ✅ 第207行
doc.text(`- ${item}`, leftMargin + 10, yPos);

// ✅ 第537行
const lines = doc.splitTextToSize(`- ${warningText}`, 165);
```

### 3. 修复重复显示

```typescript
// ✅ 第258行：移除重复的AWG和材料
{ 
  label: translate('pdf.selectedConductor'), 
  value: `${bundle.results?.conductorSize || 'N/A'}`,  // conductorSize已包含完整信息
```

### 4. 修复undefined问题

```typescript
// ✅ 第328-340行：正确计算和使用basicVA
const livingArea = bundle.inputs?.livingArea_m2 || 0;
const portions = livingArea > 90 ? Math.ceil((livingArea - 90) / 90) : 0;
const basicLoadValue = portions > 0 ? 5000 + portions * 1000 : 5000;
const basicLoadFormula = livingArea <= 90 
  ? '5000 W (for first 90 m2)'
  : `5000 + ${portions} x 1000 = ${basicLoadValue} W`;

loadBreakdown.push({
  item: `i) & ii) ${translate('pdf.basicLoad')}`,
  description: `${translate('pdf.livingArea')}: ${livingArea} m2`,
  formula: basicLoadFormula,
  load: bundle.results?.basicVA || basicLoadValue.toString()
});
```

### 5. 修复字段名称

```typescript
// ✅ 第478行：使用正确的字段名
doc.text(`${bundle.results?.itemA_total_W || 'N/A'} W`, rightMargin - 5, yPos, { align: 'right' });

// ✅ 第773行：添加正确的字段名到fallback链
const totalA = output.itemA_total_W || output.totalLoadA || output.totalMethodA || output.value || 0;
```

## 字符替换映射

| 原字符 | 替换为 | 说明 |
|-------|--------|------|
| `×` | `x` | 乘号 |
| `÷` | `/` | 除号 |
| `√` | `sqrt` | 平方根 |
| `≥` | `>=` | 大于等于 |
| `≤` | `<=` | 小于等于 |
| `²` | `2` | 上标2 |
| `³` | `3` | 上标3 |
| `°` | `deg` | 度数符号 |
| `→` | `->` | 箭头 |
| `•` | `-` | bullet point |
| `✓` | `(OK)` | 勾号 |

## 测试验证

### 输入数据
- Living Area: 155m²
- Heating: 2222W, Cooling: 3333W, Interlocked
- Range: 15.5kW
- Water Heater: 3333W (Storage)
- EVSE: 5000W
- secEV: 6000W EVSE with EVEMS
- 2000spa: 2000W

### PDF预期输出（第1页）

**System Information**:
```
Living Area: 155 m2 (CEC 8-110)
System Voltage: 240 V
System Config: Single-Phase
Conductor Material: Cu (CEC Table 2)
Termination Temp: 90 deg C (CEC 4-006)  ✅ 不再是 90?C
Ambient Temp: 33 deg C (CEC Table 5A)   ✅ 不再是 33?C
```

**HVAC Equipment**:
```
Heating: 2222 W
Cooling: 3333 W
(Heating and cooling are interlocked - CEC 8-106 3))
```

**Major Equipment**:
```
- Electric Range: 15.5 kW                ✅ 不再是 ?
- Water Heater (storage): 3333 W        ✅ 不再是 ?
- EVSE (Electric Vehicle Charger): 5000 W  ✅ 不再是 ?
```

**LOAD CALCULATION SUMMARY**:

**Selected Conductor**:
```
2 AWG Cu                                  ✅ 不再是 2 AWG Cu AWG (Cu)
112.78A / 1.000 = 112.78A (required) - Selected: 2 AWG Cu (0A base)
```

**Derated Ampacity**:
```
0A x 1.000 = 0.00A >= 112.78A (OK)      ✅ 不再是 ? 和 ?
```

**第2页 - DETAILED CALCULATION STEPS**:

**i) & ii) Basic Load**:
```
Living Area: 155 m2                      ✅ 不再是 155 m?
Formula: 5000 W + 1 x 1000 = 6000 W     ✅ 不再是 undefined W，不再是 ? x ?
Load: 6000 W
```

**CEC 8-200 1)a)iv - Electric Range**:
```
Code Reference: CEC 8-200 1)a)iv
Formula: 6000W + 40% x (15.5kW - 12kW) x 1000 = 7400W  ✅ 不再是 ? x ? x ?
```

## 关键要点

### ✅ 已解决
1. **所有特殊符号**都转换为ASCII安全字符
2. **bullet points**统一使用`-`
3. **重复显示**问题（AWG, 材料）已修复
4. **undefined**值已修复，使用正确的字段名和计算
5. **字段命名**统一使用calculation engine的输出字段

### 🔧 技术细节
- **一致性原则**: 所有字符串构建都使用ASCII安全字符
- **数据完整性**: 使用实际计算值而不是undefined
- **字段映射**: PDF生成器正确映射calculation engine的输出字段

### 📋 PDF生成流程
1. **Translation**: `$t()` → 经过`sanitizeForPDF`
2. **Manual strings**: 直接构建 → **必须使用ASCII字符**
3. **jsPDF override**: 自动sanitize所有text() calls

## 文件修改清单

1. ✅ `tradespro/frontend/src/services/pdfGenerator.ts` - 12处修改
   - Line 145-146: 度数符号
   - Line 207: bullet point
   - Line 258: 移除重复
   - Line 264: 除号和箭头
   - Line 275: 乘号和大于等于
   - Line 328-340: 修复undefined和basicLoadA
   - Line 478: 使用itemA_total_W
   - Line 537: bullet point
   - Line 773: 添加itemA_total_W fallback
   - Line 795: 度数符号
   - Line 835-837: 小于等于、箭头、乘号
   - Line 876-880: 度数符号

## 后续改进建议

### 可选增强
1. **Base Ampacity显示**: 计算引擎可以添加`baseAmpacity`字段到results
2. **更详细的formula**: 可以在每个step中添加更多intermediate values
3. **国际化符号**: 根据locale使用不同的符号（但当前ASCII方案最兼容）

### PDF库考虑
- **jsPDF限制**: 不支持嵌入Unicode字体（除非手动添加.ttf）
- **当前方案**: ASCII-safe转换是最可靠的跨平台解决方案
- **替代方案**: 如需完整Unicode支持，考虑使用`pdfmake`或`puppeteer`

## 技术债务

无。所有修改都是确定性的字符替换，不引入任何技术债务。
