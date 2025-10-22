# 🌍 多语言功能快速启动指南

## ✅ 已完成的配置

### 1. 安装依赖 ✅
```bash
npm install vue-i18n@9
```

### 2. 创建的文件 ✅

#### 语言文件
- `src/i18n/en-CA.json` - English (Canada) - 默认语言
- `src/i18n/fr-CA.json` - Français (Canada)  
- `src/i18n/zh-CN.json` - 简体中文

#### Boot 文件
- `src/boot/i18n.ts` - Quasar boot配置

#### 组件
- `src/components/common/LanguageSwitcher.vue` - 语言切换组件

### 3. 配置更新 ✅

#### `quasar.config.js`
```javascript
boot: [
  'i18n'  // ✅ 已添加
],
```

#### `MainLayout.vue`
```vue
<!-- ✅ 已添加语言切换器 -->
<LanguageSwitcher />
```

---

## 🚀 立即测试

### 启动开发服务器

```bash
cd D:\TradesProOld\tradespro\frontend
npm run dev
```

### 测试语言切换

1. **打开浏览器** http://localhost:3000
2. **查看顶部工具栏** - 应该看到语言切换下拉菜单
3. **点击切换语言**:
   - 🇨🇦 English (Canada)
   - 🇨🇦 Français (Canada)
   - 🇨🇳 简体中文

4. **验证功能**:
   - ✅ 界面文本应该立即切换
   - ✅ 刷新页面后语言保持不变
   - ✅ 所有按钮、标签、提示都应该翻译

---

## 📝 当前界面文本状态

### ⚠️ 需要更新的组件

目前界面文本还是硬编码的中文，需要逐步替换为i18n翻译键。

#### 示例：更新前 vs 更新后

**更新前**（硬编码）:
```vue
<q-btn label="计算器" icon="calculate" />
```

**更新后**（使用i18n）:
```vue
<q-btn :label="$t('nav.calculator')" icon="calculate" />
```

---

## 🔧 下一步工作

### 需要更新的文件

#### 1. MainLayout.vue
```vue
<!-- 导航菜单 -->
<q-btn :label="$t('nav.calculator')" />
<q-btn :label="$t('nav.projects')" />

<!-- 用户菜单 -->
<q-item-label>{{ $t('nav.userSettings') }}</q-item-label>
<q-item-label>{{ $t('nav.projects') }}</q-item-label>
<q-item-label>{{ $t('nav.help') }}</q-item-label>
```

#### 2. CalculatorPage.vue
所有界面文本需要替换为翻译键

#### 3. CalculationResults.vue  
结果显示文本需要国际化

#### 4. AuditTrail.vue
审计轨迹标题和标签需要翻译

---

## 📚 使用方法

### 在模板中使用

```vue
<template>
  <!-- 简单文本 -->
  <div>{{ $t('calculator.title') }}</div>
  
  <!-- 带参数 -->
  <div>{{ $t('calculator.results.completedIn', { time: 150 }) }}</div>
  
  <!-- 在属性中 -->
  <q-input :label="$t('calculator.projectName')" />
  
  <!-- 在hint中 -->
  <q-input :hint="$t('calculator.projectNameHint')" />
</template>
```

### 在 script 中使用

```typescript
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const message = t('calculator.title');
$q.notify({
  message: t('common.success')
});
```

---

## 🌐 可用的翻译键

### 应用级别
- `app.title` - "TradesPro - CEC Load Calculator"
- `app.version` - "Version"

### 导航
- `nav.calculator` - "Calculator" / "Calculateur" / "计算器"
- `nav.projects` - "Projects" / "Projets" / "项目管理"
- `nav.userSettings` - "User Settings" / "Paramètres" / "用户设置"
- `nav.help` - "Help" / "Aide" / "帮助"

### 计算器
- `calculator.title` - 计算器标题
- `calculator.basicInfo` - "Basic Information"
- `calculator.projectName` - "Project Name"
- `calculator.livingArea` - "Living Area (m²)"
- `calculator.range` - "Electric Range"
- `calculator.evse` - "EVSE"
- `calculator.waterHeater` - "Water Heaters"
- `calculator.hvac` - "Heating and Cooling"
- `calculator.calculate` - "Calculate (Offline)"
- `calculator.reset` - "Reset"

### 结果
- `calculator.results.title` - "Calculation Results"
- `calculator.results.calculatedLoad` - "Calculated Load"
- `calculator.results.serviceCurrent` - "Service Current"
- `calculator.results.conductorSize` - "Conductor Size"

### 审计轨迹
- `calculator.auditTrail.title` - "Calculation Audit Trail"
- `calculator.auditTrail.step` - "Step"
- `calculator.auditTrail.operation` - "Operation"

---

## 🎨 语言切换器界面

```
┌─────────────────────────────┐
│ 🌐 English            ▼     │
├─────────────────────────────┤
│ 🇨🇦 English                │
│    English (Canada)    ✓   │
├─────────────────────────────┤
│ 🇨🇦 Français               │
│    Français (Canada)       │
├─────────────────────────────┤
│ 🇨🇳 Chinese                │
│    简体中文                 │
└─────────────────────────────┘
```

---

## ✅ 测试清单

- [x] vue-i18n安装成功
- [x] Boot文件创建
- [x] Quasar配置更新
- [x] 语言文件创建（en-CA, fr-CA, zh-CN）
- [x] 语言切换组件创建
- [x] MainLayout添加切换器
- [ ] 测试语言切换功能
- [ ] 更新所有硬编码文本
- [ ] 验证翻译完整性

---

## 🐛 故障排除

### 问题1: 看不到语言切换器
**检查**:
1. 浏览器开发者工具Console是否有错误
2. `MainLayout.vue`是否正确导入`LanguageSwitcher`
3. 刷新浏览器缓存 (Ctrl+Shift+R)

### 问题2: 切换语言无效果
**原因**: 界面文本还是硬编码的，需要更新为`$t('key')`格式

**解决**: 逐步更新组件文本为翻译键

### 问题3: 编译错误
**检查**:
1. `quasar.config.js`中`boot`数组是否包含`'i18n'`
2. `src/boot/i18n.ts`文件是否存在
3. `package.json`中是否有`vue-i18n`依赖

---

## 📝 代码注释语言规范

按照您的要求，**代码注释使用英语**：

```typescript
// ✅ GOOD: English comments
/**
 * Calculate the base load according to CEC 8-200
 * @param area - Living area in square meters
 * @returns Base load in watts
 */
function calculateBaseLoad(area: number): number {
  // For areas up to 90m²
  if (area <= 90) {
    return 5000;
  }
  
  // For areas exceeding 90m²
  return 5000 + Math.ceil((area - 90) / 90) * 1000;
}
```

但**界面文本使用i18n**，支持三种语言：
- 英语（默认）
- 法语
- 中文

---

## 🎯 立即行动

1. **启动开发服务器**: `npm run dev`
2. **打开浏览器**: http://localhost:3000
3. **查看语言切换器** - 应该在顶部工具栏
4. **测试切换功能** - 点击切换不同语言
5. **报告问题** - 如果有任何问题，请提供错误信息

现在i18n基础架构已经完全就绪！🎉

接下来需要逐步将硬编码的文本替换为翻译键。


