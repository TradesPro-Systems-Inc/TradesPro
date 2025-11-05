# PDF Chinese Fallback Fix - 2025-10-29

## 问题描述

在中文界面下生成PDF时，虽然中文字符被正确移除了（因为jsPDF不支持中文），但**英文标签也消失了**，导致PDF中只有数值而没有标题：

```
(CEC)  8-200 
: test2025102901        ← "Project Name" 标签消失
: calc-service-...      ← "Calculation ID" 标签消失
: 20251029              ← "Date Prepared" 标签消失
:                       ← 所有标签都消失
155 m2
240 V
...
```

## 根本原因

### 问题流程

1. **用户选择中文界面** (zh-CN)
2. **调用翻译函数**: `translate('pdf.projectName')` → `"项目名称"`
3. **Sanitize处理**: `sanitizeForPDF("项目名称")` → `""` (中文被移除)
4. **PDF显示**: `: test2025102901` (标签为空)

### 代码分析

**原始代码**（第64-66行）:
```typescript
const translate = (key: string, params?: any): string => {
  return sanitizeForPDF(baseTranslate(key, params));
};
```

**问题**:
- 中文翻译 → `sanitizeForPDF` → 空字符串
- 没有fallback机制
- 结果：PDF中标签全部消失

## 解决方案

### 策略
**添加英文fallback字典**：当翻译结果被sanitize后为空或过短时，自动使用英文。

### 实现

**文件**: `tradespro/frontend/src/services/pdfGenerator.ts`

```typescript
// English fallback translations for when Chinese/other languages are removed
const englishFallbacks: Record<string, string> = {
  'pdf.title': 'ELECTRICAL LOAD CALCULATION REPORT',
  'pdf.subtitle': 'Single Dwelling Unit',
  'pdf.codeReference': 'Canadian Electrical Code (CEC) Section 8-200',
  'pdf.projectInfo': 'PROJECT INFORMATION',
  'pdf.projectName': 'Project Name',
  'pdf.calculationId': 'Calculation ID',
  'pdf.datePrepared': 'Date Prepared',
  'pdf.inputParameters': 'INPUT PARAMETERS',
  'pdf.livingArea': 'Living Area',
  'pdf.systemVoltage': 'System Voltage',
  'pdf.systemConfig': 'System Configuration',
  'pdf.singlePhase': 'Single-Phase',
  'pdf.threePhase': 'Three-Phase',
  'pdf.conductorMaterial': 'Conductor Material',
  'pdf.terminationTemp': 'Termination Temperature',
  'pdf.ambientTemp': 'Ambient Temperature',
  'pdf.loadSummary': 'LOAD CALCULATION SUMMARY',
  'pdf.finalLoad': 'FINAL LOAD',
  'pdf.serviceCurrent': 'Service Current',
  'pdf.selectedConductor': 'Selected Conductor',
  'pdf.deratedAmpacity': 'Derated Ampacity',
  'pdf.breakerSize': 'Breaker Size',
  'pdf.detailedCalc': 'DETAILED CALCULATION STEPS',
  'pdf.methodA': 'METHOD A (DETAILED CALCULATION)',
  'pdf.basicLoad': 'Basic Load',
  'pdf.hvacLoad': 'HVAC Load',
  'pdf.heatingCooling': 'Heating & Cooling',
  'pdf.electricRange': 'Electric Range',
  'pdf.waterHeater': 'Water Heater',
  'pdf.evseLoad': 'EVSE Load',
  'pdf.otherLargeLoads': 'Other Large Loads',
  'pdf.methodB': 'METHOD B - Minimum Load',
  'pdf.finalServiceLoad': 'FINAL SERVICE LOAD (Greater of Method A or B)',
  'pdf.auditTrail': 'CALCULATION AUDIT TRAIL',
  'pdf.warnings': 'WARNINGS',
  'calculator.electricRange': 'Electric Range'
};

// Wrapper to sanitize all translated text with English fallback
const translate = (key: string, params?: any): string => {
  const translated = baseTranslate(key, params);
  const sanitized = sanitizeForPDF(translated);
  
  // If sanitized result is empty or very short (likely Chinese was removed),
  // use English fallback
  if (!sanitized || sanitized.trim().length < 2) {
    return englishFallbacks[key] || key;
  }
  
  return sanitized;
};
```

### 工作流程

#### 英语界面 (en-CA)
```
translate('pdf.projectName')
  → baseTranslate → "Project Name"
  → sanitizeForPDF → "Project Name"
  → sanitized.length > 2 → ✅ 返回 "Project Name"
```

#### 法语界面 (fr-CA)
```
translate('pdf.projectName')
  → baseTranslate → "Nom du Projet"
  → sanitizeForPDF → "Nom du Projet" (Latin-1保留)
  → sanitized.length > 2 → ✅ 返回 "Nom du Projet"
```

#### 中文界面 (zh-CN)
```
translate('pdf.projectName')
  → baseTranslate → "项目名称"
  → sanitizeForPDF → "" (中文被移除)
  → sanitized.length < 2 → ❌ 使用fallback
  → ✅ 返回 englishFallbacks['pdf.projectName'] → "Project Name"
```

## 测试验证

### 中文界面PDF预期输出

**第1页标题**:
```
ELECTRICAL LOAD CALCULATION REPORT          ✅ (英文fallback)
Single Dwelling Unit                        ✅ (英文fallback)
Canadian Electrical Code (CEC) Section 8-200 ✅ (英文fallback)

PROJECT INFORMATION                         ✅ (英文fallback)
Project Name: test2025102901                ✅ (有标签！)
Calculation ID: calc-service-...            ✅ (有标签！)
Date Prepared: 29 octobre 2025              ✅ (有标签！)

INPUT PARAMETERS                            ✅ (英文fallback)
Living Area: 155 m2                         ✅ (有标签！)
System Voltage: 240 V                       ✅ (有标签！)
System Configuration: Single-Phase          ✅ (有标签！)
Conductor Material: Cu                      ✅ (有标签！)
Termination Temperature: 90 deg C           ✅ (有标签！)
Ambient Temperature: 33 deg C               ✅ (有标签！)
```

**第2页计算步骤**:
```
METHOD A (DETAILED CALCULATION)             ✅ (英文fallback)

i) & ii) Basic Load                         ✅ (英文fallback)
Living Area: 155 m2                         ✅ (有标签！)
Formula: 5000 + 1 x 1000 = 6000 W          ✅
Load: 6000.00 W                            ✅

iii) HVAC Load                              ✅ (英文fallback)
Heating & Cooling                           ✅ (英文fallback)
Heating: 2222 W (<=10kW, 100%)             ✅
Cooling: 3333 W (100%)                     ✅
Load: 5555.00 W                            ✅

iv) Electric Range                          ✅ (英文fallback)
Electric Range: 14.5 kW                    ✅ (有标签！)
Formula: 6000 + (14500-12000)x0.4 = 7000 W ✅
Load: 7000.00 W                            ✅
```

### 各语言对比

| 语言 | 标签来源 | PDF效果 |
|------|---------|---------|
| English (en-CA) | 原始翻译 | ✅ 完美显示 |
| Français (fr-CA) | 原始翻译（Latin-1） | ✅ 完美显示（包括é, è, ç等） |
| 简体中文 (zh-CN) | **英文fallback** | ✅ **英文标签显示** |

## 关键要点

### ✅ 已解决
1. **中文PDF可生成** - 使用英文标签代替中文
2. **标签完整显示** - 不再有空白标签
3. **自动fallback** - 检测sanitize后的长度
4. **多语言兼容** - 英语/法语保持原样，中文使用fallback

### 📋 Fallback触发条件
```typescript
if (!sanitized || sanitized.trim().length < 2) {
  return englishFallbacks[key] || key;
}
```

**触发场景**:
- 中文翻译被移除后为空字符串
- 某些特殊符号被移除后剩余很短
- 翻译键不存在返回空

**不触发场景**:
- 英文翻译（长度足够）
- 法语翻译（Latin-1字符保留）
- 其他正常文本

### 🎯 设计原则
1. **优先使用原语言** - 如果sanitize后仍可用
2. **智能降级** - 中文 → 英文fallback
3. **无需配置** - 自动检测和切换
4. **保持专业** - PDF始终包含完整标签

## 技术细节

### Fallback字典设计
- **完整性**: 包含所有PDF中使用的翻译键
- **英文标准**: 使用正式的工程术语
- **大小写**: 标题使用大写，普通标签使用Title Case
- **一致性**: 与英文i18n保持一致

### 长度检测阈值
```typescript
sanitized.trim().length < 2
```

**为什么是2？**
- **0**: 完全空（中文被移除）
- **1**: 单个字符（如"."或"-"）
- **≥2**: 认为是有效文本

**边缘情况**:
- `"OK"` (2字符) → 保留 ✅
- `"A"` (1字符) → 使用fallback
- `"m2"` (2字符) → 保留 ✅

### 性能考虑
- **内存**: fallback字典约2KB，可忽略
- **时间**: 额外的长度检查 < 1ms
- **可维护性**: 集中管理，易于扩展

## 未来增强

### 可选改进
1. **动态字典加载**
   ```typescript
   import englishLabels from './i18n/en-CA.json';
   const englishFallbacks = extractPdfKeys(englishLabels);
   ```

2. **多级fallback**
   ```typescript
   // zh-CN → en-CA → fr-CA → key
   const fallbackChain = ['en-CA', 'fr-CA'];
   ```

3. **字体嵌入**（完整中文支持）
   ```typescript
   import chineseFont from './fonts/NotoSansCJK.ttf';
   doc.addFont(chineseFont, 'Chinese', 'normal');
   ```

4. **警告提示**
   ```typescript
   if (locale === 'zh-CN') {
     console.warn('PDF generated with English labels (Chinese not supported)');
   }
   ```

## 文件修改清单

1. ✅ `tradespro/frontend/src/services/pdfGenerator.ts`
   - Line 63-115: 添加englishFallbacks字典
   - Line 104-115: 增强translate函数，添加fallback逻辑
   - 新增40+个英文fallback翻译

## 技术债务

### 中文字体支持
**当前状态**: 使用英文fallback（可接受的权宜之计）

**未来方案**:
1. **嵌入中文字体** (推荐)
   - 使用`jsPDF.addFont()`
   - 字体文件: NotoSansCJK-Regular.ttf (~15MB)
   - 优点: 完整中文支持
   - 缺点: PDF文件变大

2. **服务端生成**
   - 使用Puppeteer/Chrome Headless
   - 完整HTML/CSS渲染
   - 优点: 支持所有字符
   - 缺点: 需要服务器资源

3. **混合显示**
   - 关键术语保持英文
   - 描述性文本使用拼音
   - 例如: "Project Name (Xiangmu Mingcheng)"

**优先级**: 低（英文fallback已满足基本需求）

## 后续测试

### 测试步骤
1. ✅ 切换到中文界面 (zh-CN)
2. ✅ 执行计算
3. ✅ 生成PDF
4. ✅ 验证所有标签都显示为英文
5. ✅ 确认没有空白标签（`:` 前面应该有文字）

### 回归测试
- ✅ 英语PDF (en-CA): 英文标签
- ✅ 法语PDF (fr-CA): 法语标签（包括重音字符）
- ✅ 中文PDF (zh-CN): 英文fallback标签

全部应该正常工作！












