# 关键问题修复：Range识别 + PDF乱码

## 问题1：Range没有被正确识别 ✅ 已修复

### 问题描述
用户添加了14kW的Range，但计算过程中找不到这个值，其他电器按照"没有Range"的规则计算。

### 根本原因
前端在添加电器时只传递了 `watts` 字段，没有传递 `rating_kW` 字段。计算引擎需要 `rating_kW` 来识别Range。

### 修复内容

#### 1. 更新 `Appliance` 接口
```typescript
interface Appliance {
  id?: string;
  name?: string;
  watts?: number;
  type?: string;
  isContinuous?: boolean;
  rating_kW?: number;  // ✅ 新增：For range
  hasEVEMS?: boolean;  // ✅ 新增：For EVSE
}
```

#### 2. 更新 `newAppliance` 对象
```typescript
const newAppliance = reactive({
  type: 'other',
  name: '',
  watts: 0,
  isContinuous: false,
  hasEVEMS: false  // ✅ 新增
});
```

#### 3. 更新 `addAppliance` 函数
```typescript
// For range: calculate rating_kW
if (newAppliance.type === 'range') {
  appliance.rating_kW = newAppliance.watts / 1000;
  console.log(`🔥 Range: ${newAppliance.watts}W = ${appliance.rating_kW}kW`);
}

// For EVSE: add hasEVEMS flag
if (newAppliance.type === 'evse') {
  appliance.hasEVEMS = newAppliance.hasEVEMS;
  console.log(`⚡ EVSE: ${newAppliance.watts}W, EVEMS: ${appliance.hasEVEMS}`);
}
```

#### 4. 添加 EVEMS 复选框到UI
```vue
<!-- EVEMS toggle for EVSE only -->
<q-toggle
  v-if="newAppliance.type === 'evse'"
  v-model="newAppliance.hasEVEMS"
  label="Has EVEMS (Energy Management System)"
  class="q-mt-sm"
  color="green"
>
  <q-tooltip>
    If EVSE is managed by an Energy Management System (EVEMS), 
    it can be exempted from load calculation per CEC 8-106 11)
  </q-tooltip>
</q-toggle>
```

### 测试步骤

1. **刷新浏览器** (Ctrl+F5)
2. **添加Range**:
   - Type: Range
   - Watts: 14000
   - 点击 "Add Appliance"
3. **检查Console**:
   ```
   🔥 Range: 14000W = 14kW
   ✅ Added to appliances: {type: 'range', watts: 14000, rating_kW: 14}
   ```
4. **点击Calculate**
5. **查看审计跟踪**:
   - 应该看到 "Step 4: Range Load"
   - 应该显示: `14kW → 6000W + 40% × (14-12) × 1000 = 6800W`

### 预期结果

#### 之前（错误）
```
其他大负载计算：8000W × 100% = 8000W (无Range)
```

#### 现在（正确）
```
步骤4: Range负载
  14kW → 6000W + 40% × (14-12) × 1000 = 6800W

步骤8: 其他大负载
  如果有Range: totalW × 25%
  如果无Range: 6000W + (excess × 25%)
```

---

## 问题2：PDF乱码 ⚠️ 部分修复

### 问题描述
PDF第一页出现乱码，显示为 `&0&0&0&2&/` 等符号。

### 可能原因

1. **jsPDF字体问题**: 默认的Helvetica字体可能不支持某些特殊字符
2. **公式渲染问题**: 数学公式（如 `÷`, `×`, `√3`）可能无法正确显示
3. **编码问题**: 文本编码转换错误

### 临时解决方案

#### 方案1：清理特殊字符
在PDF生成时，将特殊字符转换为ASCII：

```typescript
// 在 pdfGenerator.ts 中添加清理函数
function sanitizeForPDF(text: string): string {
  return text
    .replace(/×/g, ' x ')      // 乘号 → x
    .replace(/÷/g, ' / ')      // 除号 → /
    .replace(/√/g, 'sqrt')     // 根号 → sqrt
    .replace(/≥/g, '>=')       // 大于等于 → >=
    .replace(/≤/g, '<=')       // 小于等于 <= 
    .replace(/²/g, '2')        // 平方 → 2
    .replace(/[^\x00-\x7F]/g, '');  // 移除非ASCII字符
}
```

#### 方案2：使用支持Unicode的字体
安装和使用支持Unicode的字体（如DejaVu Sans）：

```typescript
// 需要安装 jspdf-font-dejavu
import { jsPDF } from 'jspdf';
import 'jspdf-font-dejavu';

const doc = new jsPDF();
doc.setFont('DejaVuSans');
```

#### 方案3：使用autoTable进行表格渲染
autoTable库对特殊字符的支持更好：

```typescript
import 'jspdf-autotable';

(doc as any).autoTable({
  head: [['Item', 'Formula', 'Result']],
  body: [
    ['Basic Load', '5000W + 1 × 1000W', '6000W'],
    ['Range Load', '6000W + 40% × 2000W', '6800W'],
    // ...
  ],
  startY: yPos,
  styles: { font: 'helvetica', fontSize: 10 }
});
```

### 推荐修复步骤

1. **短期**: 使用 `sanitizeForPDF()` 清理特殊字符
2. **中期**: 迁移到 `jspdf-autotable` 进行更好的表格渲染
3. **长期**: 集成支持Unicode的字体系统

### 需要进一步调试

请提供：
1. 完整的PDF文件（或截图）
2. 具体是哪些内容出现乱码
3. 使用的浏览器和操作系统

这样我可以更准确地诊断和修复PDF问题。

---

## 修改的文件

✅ **`tradespro/frontend/src/pages/CalculatorPage.vue`**
- 更新 `Appliance` 接口
- 更新 `newAppliance` 对象
- 更新 `addAppliance` 函数
- 添加 EVEMS 复选框

⏳ **`tradespro/frontend/src/services/pdfGenerator.ts`** (待修复)
- 需要添加特殊字符清理
- 需要改进公式渲染

---

## 测试清单

### Range识别测试
- [ ] 添加14kW Range
- [ ] Console显示 `rating_kW: 14`
- [ ] 计算结果显示Range步骤
- [ ] Range负载显示6800W
- [ ] 其他大负载应用正确的需求系数

### EVSE EVEMS测试
- [ ] 添加EVSE时显示EVEMS复选框
- [ ] 无EVEMS：EVSE @ 100%
- [ ] 有EVEMS：EVSE = 0W (豁免)

### PDF生成测试
- [ ] 生成PDF无错误
- [ ] 文本清晰可读
- [ ] 无乱码符号
- [ ] 公式正确显示

---

**修复时间**: 2025-10-29  
**优先级**: P0 (关键)  
**状态**: Range识别 ✅ | PDF乱码 ⚠️













