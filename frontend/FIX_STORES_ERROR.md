# 修复 Stores 导入错误

## 错误信息
```
Uncaught SyntaxError: The requested module '/src/stores/index.ts' 
does not provide an export named 'default'
```

## 原因
这通常是由于：
1. Vite/Quasar 缓存问题
2. node_modules 需要重新安装
3. TypeScript 编译缓存

## 解决方案

### 方案1: 清除缓存并重启 (推荐) ⭐

```powershell
cd D:\TradesProOld\tradespro\frontend

# 1. 停止当前运行的 quasar dev (Ctrl+C)

# 2. 清除 Quasar 缓存
rm -rf .quasar

# 3. 清除 node_modules 缓存
rm -rf node_modules/.vite

# 4. 重新启动
quasar dev
```

### 方案2: 完全重新安装

```powershell
cd D:\TradesProOld\tradespro\frontend

# 1. 停止服务器
# Ctrl+C

# 2. 删除 node_modules
rm -rf node_modules

# 3. 删除 package-lock.json
rm package-lock.json

# 4. 重新安装
npm install

# 5. 启动
quasar dev
```

### 方案3: 检查 pinia boot 文件

确保 `src/boot/pinia.ts` 存在且内容正确。

如果不存在，创建它：

```typescript
// src/boot/pinia.ts
import { boot } from 'quasar/wrappers';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';

const pinia = createPinia();

pinia.use(createPersistedState({
  key: (id) => `tradespro-${id}`,
  storage: localStorage,
}));

export default boot(({ app }) => {
  app.use(pinia);
});

export { pinia };
```

### 方案4: 验证 stores/index.ts

确保 `src/stores/index.ts` 只使用命名导出：

```typescript
// src/stores/index.ts
export { useUserStore } from './user';
export { useProjectsStore } from './projects';
export { useCalculationsStore } from './calculations';
export { useSettingsStore } from './settings';
export { useUIStore } from './ui';

export type * from './types';
export { storeToRefs } from 'pinia';
```

**不要添加** `export default`！

## 快速修复命令

```powershell
# 一键修复 (推荐)
cd D:\TradesProOld\tradespro\frontend
rm -rf .quasar
rm -rf node_modules/.vite
quasar dev
```

## 如果仍然报错

1. 检查 Console 完整错误信息
2. 检查是否有其他文件引用错误
3. 重启 VSCode/编辑器
4. 重启电脑

## 验证修复

启动成功后应该看到：
```
✓ Webpack compiled successfully
App • Running at http://localhost:9000
```

访问 http://localhost:9000，页面应该正常显示。













