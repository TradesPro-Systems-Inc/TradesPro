# 🌍 修复语言切换问题 / Fix Language Switching Issue

## ⚡ 快速修复方法 / Quick Fix Methods

### 方法 1: 浏览器控制台（最快）/ Method 1: Browser Console (Fastest)

1. 在 TradesPro 应用页面，按 **F12** 打开开发者工具
2. 点击 **Console** 标签
3. 粘贴并运行以下代码：

#### 重置为英语 / Reset to English:
```javascript
localStorage.setItem('tradespro-locale', 'en-CA');
console.log('✅ Language set to English (en-CA)');
location.reload();
```

#### 重置为法语 / Reset to French:
```javascript
localStorage.setItem('tradespro-locale', 'fr-CA');
console.log('✅ Language set to French (fr-CA)');
location.reload();
```

#### 重置为中文 / Reset to Chinese:
```javascript
localStorage.setItem('tradespro-locale', 'zh-CN');
console.log('✅ Language set to Chinese (zh-CN)');
location.reload();
```

#### 清除所有设置 / Clear All Settings:
```javascript
localStorage.clear();
localStorage.setItem('tradespro-locale', 'en-CA');
console.log('✅ All settings cleared, reset to English');
location.reload();
```

---

### 方法 2: 使用重置工具 / Method 2: Use Reset Tool

打开文件：`reset-to-english.html`

或者在浏览器中访问：
```
file:///d:/TradesProOld/tradespro/frontend/reset-to-english.html
```

---

## 🔍 检查当前语言设置 / Check Current Language Setting

在控制台运行：
```javascript
console.log('Current locale:', localStorage.getItem('tradespro-locale'));
console.log('All localStorage:', { ...localStorage });
```

---

## 🐛 调试语言切换 / Debug Language Switching

如果语言切换器不工作，在控制台运行：
```javascript
// 查看当前 i18n 状态
console.log('i18n instance:', window.vue?.$i18n || 'Not found');
console.log('Available locales:', window.vue?.$i18n?.availableLocales);
console.log('Current locale:', window.vue?.$i18n?.locale);

// 强制更改语言
if (window.vue?.$i18n) {
  window.vue.$i18n.locale = 'en-CA';
  localStorage.setItem('tradespro-locale', 'en-CA');
  console.log('✅ Forced language change to English');
  location.reload();
}
```

---

## ⚠️ 常见问题 / Common Issues

### 问题 1: 语言切换后没有变化
**解决方案**: 确保页面完全重新加载
```javascript
localStorage.setItem('tradespro-locale', 'en-CA');
window.location.href = window.location.href; // 强制重载
```

### 问题 2: 显示的是错误的语言
**解决方案**: 清除缓存并重置
```javascript
// 清除所有相关的 localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('tradespro') || key.includes('i18n') || key.includes('locale')) {
    localStorage.removeItem(key);
  }
});
localStorage.setItem('tradespro-locale', 'en-CA');
location.reload();
```

### 问题 3: 某些文本仍然是中文/法语
**解决方案**: 这可能是翻译文件的问题，已经在最新的代码中修复

---

## 📝 技术说明 / Technical Notes

- 应用使用 `vue-i18n` 的 **legacy mode**
- Locale 保存在 `localStorage` 中，键名为 `'tradespro-locale'`
- 支持的语言代码：
  - `'en-CA'` - 英语（加拿大）
  - `'fr-CA'` - 法语（加拿大）
  - `'zh-CN'` - 简体中文

- 语言切换后会触发页面重载以确保所有组件更新

---

## ✅ 验证修复 / Verify Fix

运行以下代码来验证语言设置是否正确：
```javascript
const currentLocale = localStorage.getItem('tradespro-locale');
const expectedLocale = 'en-CA'; // 或者 'fr-CA', 'zh-CN'

console.log('Current locale:', currentLocale);
console.log('Expected locale:', expectedLocale);
console.log('Match:', currentLocale === expectedLocale ? '✅' : '❌');

if (currentLocale !== expectedLocale) {
  console.log('Fixing locale...');
  localStorage.setItem('tradespro-locale', expectedLocale);
  location.reload();
}
```

---

## 🆘 如果还是不行 / If Still Not Working

1. 完全关闭浏览器
2. 重新打开浏览器
3. 按 **Ctrl + Shift + Delete** 清除浏览器缓存
4. 重新访问应用
5. 在控制台运行上述脚本

或者联系开发团队获取支持。

