# 单一事实来源（SSoT）架构实现

**日期**: 2025-01-04  
**状态**: ✅ 已实现

---

## 🎯 核心原则

**单一事实来源（Single Source of Truth, SSoT）**: 表格数据只存在于一个位置，前端和后端都从这个唯一来源读取。

---

## 📁 SSoT 位置

### 唯一的事实来源
```
packages/calculation-engine/data/tables/
├── 2024/
│   ├── table2.json
│   ├── table4.json
│   ├── table5A.json
│   └── table5C.json
└── (未来版本: 2021, 2027, etc.)
```

**这是唯一可以修改表格数据的位置！**

---

## 🔄 自动分发机制

### 后端（Node.js）
- **直接访问**: 使用 `require.resolve('@tradespro/calculation-engine')` 定位包
- **文件系统读取**: 从包的 `data/tables/` 目录直接读取
- **实现**: `tableLoader.node.ts`

```typescript
// 自动定位SSoT，无论包在workspace还是node_modules
const packageEntry = require.resolve('@tradespro/calculation-engine');
const tablesDir = path.join(path.dirname(packageEntry), '../data/tables', edition);
```

### 前端（浏览器）
- **构建时复制**: 在 `npm run dev` 或 `npm run build` 前自动执行
- **脚本**: `frontend/copy-tables.mjs`
- **目标**: `frontend/public/data/tables/` (自动生成，不提交到Git)

```bash
# 自动执行
npm run dev    # → 自动复制表格 → 启动开发服务器
npm run build  # → 自动复制表格 → 构建生产版本
```

---

## ✅ 实施步骤

### 1. 后端加载器更新
- ✅ 使用 `require.resolve` 定位SSoT
- ✅ 验证目录存在性
- ✅ 错误处理

### 2. 前端自动复制脚本
- ✅ 创建 `copy-tables.mjs`
- ✅ 从SSoT复制到 `public/data/tables/`
- ✅ 验证复制完整性

### 3. 构建脚本集成
- ✅ `package.json` 中添加 `copy:tables` 脚本
- ✅ `dev` 和 `build` 脚本前自动执行复制

### 4. Git配置
- ✅ `.gitignore` 中忽略 `frontend/public/data/tables/`
- ✅ `package.json` 中确保 `data/**/*` 包含在发布包中

---

## 🚫 禁止的操作

### ❌ 不要手动修改
```
frontend/public/data/tables/  # ❌ 这是自动生成的，不要手动修改！
```

### ❌ 不要手动同步
- 不要手动复制文件
- 不要手动编辑 `frontend/public/data/tables/` 中的文件

### ✅ 唯一修改位置
```
packages/calculation-engine/data/tables/  # ✅ 只在这里修改！
```

---

## 📋 维护流程

### 更新表格数据

1. **修改SSoT**:
   ```bash
   # 编辑唯一的表格文件
   packages/calculation-engine/data/tables/2024/table2.json
   ```

2. **自动分发**:
   ```bash
   # 前端会自动在下次构建时同步
   cd frontend
   npm run dev  # 或 npm run build
   ```

3. **后端自动使用**:
   - 后端服务重启后自动从SSoT加载最新数据
   - 无需手动操作

---

## 🔍 验证

### 检查SSoT
```bash
ls packages/calculation-engine/data/tables/2024/
```

### 检查前端同步
```bash
cd frontend
npm run copy:tables
ls public/data/tables/2024/
```

### 验证一致性
```bash
# 比较文件（应该完全一致）
diff packages/calculation-engine/data/tables/2024/table2.json \
     frontend/public/data/tables/2024/table2.json
```

---

## 🎯 架构优势

### ✅ 单一事实来源
- 只有一个地方存储表格数据
- 避免数据漂移（Data Drift）
- 保证前后端一致性

### ✅ 自动同步
- 构建时自动复制
- 无需手动操作
- 减少人为错误

### ✅ 可审计性
- 所有修改都在SSoT中
- Git历史清晰
- 版本控制简单

### ✅ 可信任性
- 前端离线版和后端在线版使用相同数据
- 计算结果一致
- 符合“可审计、可复现、可信任”原则

---

## 📝 未来扩展

### 插件架构（V5）
当实现插件系统时，SSoT将迁移到：
```
packages/plugin-cec-8-200/data/tables/
```

### 多标准支持
```
packages/
  plugin-cec-8-200/data/tables/
  plugin-nec-220/data/tables/
```

---

## ⚠️ 重要提醒

1. **永远只修改SSoT**: `packages/calculation-engine/data/tables/`
2. **不要手动编辑**: `frontend/public/data/tables/` 是自动生成的
3. **构建前自动同步**: `npm run dev` 和 `npm run build` 会自动执行复制
4. **Git忽略**: `frontend/public/data/tables/` 已在 `.gitignore` 中

---

**状态**: ✅ 架构已实现，单一事实来源原则已强制执行






