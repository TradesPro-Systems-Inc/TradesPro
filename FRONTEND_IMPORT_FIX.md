# 前端导入修复记录

**日期**: 2025-11-05  
**问题**: Vite 无法解析 `@tradespro/calculation-engine/core/tables.browser`

---

## 🔧 修复内容

### 1. 更新 calculation-engine 导出
在 `packages/calculation-engine/src/index.ts` 中添加了浏览器版本的 tableManager 导出：

```typescript
// Also export browser version for frontend convenience
// Frontend can import: import { tableManagerBrowser } from '@tradespro/calculation-engine'
export { tableManager as tableManagerBrowser } from './core/tables.browser';
```

### 2. 更新前端导入
将所有前端文件中的导入从：
```typescript
import { tableManager } from '@tradespro/calculation-engine/core/tables.browser';
```

改为：
```typescript
import { tableManagerBrowser as tableManager } from '@tradespro/calculation-engine';
```

**更新的文件**:
- ✅ `frontend/src/pages/CalculatorPage.vue`
- ✅ `frontend/src/composables/useOfflineCalculation.ts`

### 3. 更新 Vite 配置
在 `quasar.config.js` 中添加了对子路径导出的支持：

```javascript
// Support subpath exports for calculation-engine (e.g., /core/tables.browser)
upsertAlias(/^@tradespro\/calculation-engine\/(.+)$/, `${engineCorePath}/$1`);
```

### 4. 清理缓存
- ✅ 清除了 `.quasar` 缓存
- ✅ 确保 `calculation-engine` 包已重新构建

---

## ✅ 验证步骤

1. **重新启动开发服务器**
   ```bash
   cd frontend
   npm run dev
   ```

2. **检查控制台**
   - 应该不再有模块解析错误
   - `tableManager` 应该能正常加载

3. **测试功能**
   - 打开计算器页面
   - 尝试加载表格数据
   - 验证计算功能

---

## 📝 最佳实践

### 导入规范
✅ **推荐**:
```typescript
import { tableManagerBrowser as tableManager } from '@tradespro/calculation-engine';
```

❌ **不推荐**:
```typescript
import { tableManager } from '@tradespro/calculation-engine/core/tables.browser';
```

**原因**:
- 主包入口更稳定
- 避免直接导入子路径（Vite 可能无法正确解析）
- 使用别名导出更清晰

---

**修复完成时间**: 2025-11-05
