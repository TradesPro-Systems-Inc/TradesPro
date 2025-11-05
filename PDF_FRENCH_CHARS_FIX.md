# PDF French Characters Fix - 2025-10-29

## 问题描述

PDF报告中，法语特殊字符显示为`?`：
- `ÉLECTRIQUE` → `?LECTRIQUE`
- `électricité` → `?lectricit?`
- `Préparation` → `Pr?paration`
- `Monophasé` → `Monophas?`
- `PARAMÈTRES` → `PARAM?TRES`

所有法语重音字符（É, é, è, ê, à, ç, ô, etc.）都被替换成了`?`。

## 根本原因

在`sanitizeForPDF`函数的最后一行（第40行）：

```typescript
.replace(/[^\x00-\x7F]/g, '?');  // Replace remaining non-ASCII with ?
```

这个正则表达式的含义：
- `[^\x00-\x7F]` = 匹配**不在**Basic ASCII范围（0-127）的所有字符
- 结果：所有非ASCII字符（包括法语、中文、日语等）都被替换成`?`

### 字符编码范围
- **Basic ASCII** (U+0000 to U+007F): a-z, A-Z, 0-9, 基本符号
- **Latin-1 Supplement** (U+0080 to U+00FF): 
  - 法语：É, é, è, ê, ë, à, â, ç, ô, etc.
  - 西班牙语：ñ, Ñ, ¿, ¡, etc.
  - 德语：ä, ö, ü, ß, etc.
- **其他Unicode** (U+0100+): 中文、日文、韩文、表情符号等

## 解决方案

### 策略
**保留Latin-1字符，移除其他Unicode字符**

jsPDF的默认字体（Helvetica）支持完整的Latin-1字符集（包括法语、西班牙语、德语等欧洲语言的重音字符）。

### 修改代码

**文件**: `tradespro/frontend/src/services/pdfGenerator.ts`

```typescript
/**
 * Sanitize text for PDF rendering (fix garbled characters)
 * Converts special Unicode characters to PDF-safe equivalents
 * Preserves Latin-1 characters (French, Spanish, etc.)
 */
function sanitizeForPDF(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/×/g, ' x ')       // Multiplication sign → x
    .replace(/÷/g, ' / ')       // Division sign → /
    .replace(/√/g, 'sqrt')      // Square root → sqrt
    .replace(/≥/g, '>=')        // Greater than or equal → >=
    .replace(/≤/g, '<=')        // Less than or equal → <=
    .replace(/²/g, '2')         // Superscript 2 → 2
    .replace(/³/g, '3')         // Superscript 3 → 3
    .replace(/°/g, ' deg ')     // Degree symbol → deg
    .replace(/–/g, '-')         // En dash → hyphen
    .replace(/—/g, '-')         // Em dash → hyphen
    .replace(/"/g, '"')         // Smart quote left → straight quote
    .replace(/"/g, '"')         // Smart quote right → straight quote
    .replace(/'/g, "'")         // Smart apostrophe left → straight
    .replace(/'/g, "'")         // Smart apostrophe right → straight
    // ✅ Keep Latin-1 Supplement (U+0080 to U+00FF) for French/Spanish/German
    // Only replace characters outside Basic Latin + Latin-1 range
    .replace(/[^\x00-\xFF]/g, '');  // Remove chars outside Latin-1 (keeps É, é, è, ç, etc.)
}
```

### 关键变化
- **之前**: `/[^\x00-\x7F]/g` → 替换所有非ASCII字符
- **现在**: `/[^\x00-\xFF]/g` → 只移除Latin-1范围外的字符

**结果**:
- ✅ **保留**: É, é, è, ê, ë, à, â, ä, ö, ü, ç, ñ, etc. (Latin-1)
- ❌ **移除**: 中文、日文、韩文、emoji等（超出Latin-1）

## 测试验证

### 法语文本测试

**输入**:
```
RAPPORT DE CALCUL DE CHARGE ÉLECTRIQUE
Code canadien de l'électricité (CCE)
Préparation
PARAMÈTRES D'ENTRÉE
Monophasé
```

**预期PDF输出**:
```
RAPPORT DE CALCUL DE CHARGE ÉLECTRIQUE  ✅
Code canadien de l'électricité (CCE)    ✅
Préparation                              ✅
PARAMÈTRES D'ENTRÉE                      ✅
Monophasé                                ✅
```

### 其他语言支持

| 语言 | 字符示例 | 支持状态 |
|------|---------|---------|
| 法语 (fr-CA) | É, é, è, ê, à, ç, ô | ✅ 完全支持 |
| 英语 (en-CA) | A-Z, a-z | ✅ 完全支持 |
| 西班牙语 | ñ, Ñ, ¿, ¡ | ✅ 完全支持 |
| 德语 | ä, ö, ü, ß | ✅ 完全支持 |
| 中文 (zh-CN) | 中文汉字 | ⚠️ 会被移除 |
| 日文 | ひらがな、カタカナ | ⚠️ 会被移除 |

### 中文PDF的处理

对于中文PDF，字符会被移除（因为超出Latin-1范围）。如果需要完整的中文支持，需要：

1. **方案A**: 在jsPDF中嵌入中文字体（.ttf文件）
   ```typescript
   doc.addFont('path/to/chinese-font.ttf', 'ChineseFont', 'normal');
   doc.setFont('ChineseFont');
   ```

2. **方案B**: 使用romanization（拼音）
   ```typescript
   // 例如："计算报告" → "Jisuan Baogao"
   ```

3. **方案C**: 保留关键英文/法文术语
   ```typescript
   // 混合显示："Calculation Report (计算报告)"
   ```

**当前实现**: 暂不支持中文PDF，中文字符会被静默移除。这是一个已知限制。

## Latin-1 字符完整列表

### 常用法语字符
```
À (U+00C0) - A grave
Â (U+00C2) - A circumflex
Ç (U+00C7) - C cedilla
É (U+00C9) - E acute
È (U+00C8) - E grave
Ê (U+00CA) - E circumflex
Ë (U+00CB) - E diaeresis
Î (U+00CE) - I circumflex
Ï (U+00CF) - I diaeresis
Ô (U+00D4) - O circumflex
Ù (U+00D9) - U grave
Û (U+00DB) - U circumflex
Ü (U+00DC) - U diaeresis
Ÿ (U+0178) - Y diaeresis (不在Latin-1，会被移除)

小写：
à, â, ç, é, è, ê, ë, î, ï, ô, ù, û, ü, ÿ
```

### 其他Latin-1字符
```
¡ ¢ £ ¤ ¥ ¦ § ¨ © ª « ¬ ­ ® ¯
° ± ² ³ ´ µ ¶ · ¸ ¹ º » ¼ ½ ¾ ¿
À Á Â Ã Ä Å Æ Ç È É Ê Ë Ì Í Î Ï
Ð Ñ Ò Ó Ô Õ Ö × Ø Ù Ú Û Ü Ý Þ ß
à á â ã ä å æ ç è é ê ë ì í î ï
ð ñ ò ó ô õ ö ÷ ø ù ú û ü ý þ ÿ
```

**注意**: 一些数学符号（×, ÷, °, ², ³）在前面已经被替换成ASCII等价物。

## 关键要点

### ✅ 已解决
1. **法语字符保留** - É, é, è, ç等正确显示
2. **欧洲语言支持** - 法语、西班牙语、德语完全支持
3. **数学符号转换** - ×→x, °→deg等保持ASCII兼容
4. **jsPDF兼容性** - 使用默认字体支持的字符集

### 📋 字符处理策略
- **Latin-1范围内** (U+0000 - U+00FF): 保留
- **数学符号**: 转换为ASCII等价物（×→x, ≥→>=）
- **其他Unicode**: 移除（中文、emoji等）

### 🎯 适用场景
- ✅ **英语PDF**: 完全支持
- ✅ **法语PDF**: 完全支持（包括所有重音字符）
- ✅ **西班牙语PDF**: 完全支持
- ⚠️ **中文PDF**: 字符会被移除（需要额外字体支持）

## 文件修改清单

1. ✅ `tradespro/frontend/src/services/pdfGenerator.ts`
   - Line 20-44: 更新`sanitizeForPDF`函数
   - 修改正则表达式：`/[^\x00-\x7F]/` → `/[^\x00-\xFF]/`
   - 添加注释说明Latin-1字符保留策略

## 技术债务

### 中文支持
**当前限制**: 中文字符会被静默移除

**未来改进选项**:
1. 检测语言并动态加载对应字体
2. 使用`pdfmake`库（内置更好的Unicode支持）
3. 使用服务端PDF生成（Node.js + Puppeteer）
4. 提供"仅英文/法文PDF"选项

**优先级**: 低（因为主要用户群是加拿大英语/法语）

## 后续测试

### 测试步骤
1. 切换到法语界面（fr-CA）
2. 执行计算
3. 生成PDF
4. 验证以下文本正确显示：
   - ✅ `ÉLECTRIQUE` (不是`?LECTRIQUE`)
   - ✅ `électricité` (不是`?lectricit?`)
   - ✅ `Préparation` (不是`Pr?paration`)
   - ✅ `Monophasé` (不是`Monophas?`)
   - ✅ `PARAMÈTRES` (不是`PARAM?TRES`)

### 预期结果
所有法语重音字符应该正确显示，无`?`替换。












