# 表格文件位置说明

**日期**: 2025-01-04

---

## 📁 表格文件位置

表格JSON文件存储在**两个位置**，用于不同的运行环境：

### 1. **后端（Node.js）目录**
```
tradespro/packages/calculation-engine/data/tables/2024/
├── table2.json    (导体载流量表)
├── table4.json    (环境温度修正系数表)
├── table5A.json   (CEC 5A表)
└── table5C.json   (CEC 5C表)
```

**用途**: 
- 后端服务（`calculation-service`）使用
- Node.js 环境通过 `fs.readFile` 读取

**加载器**: `tableLoader.node.ts`
```typescript
const tablesDir = path.join(__dirname, '../../data/tables', edition);
```

---

### 2. **前端（浏览器）目录**
```
tradespro/frontend/public/data/tables/2024/
├── table2.json
├── table4.json
├── table5A.json
└── table5C.json
```

**用途**:
- 前端应用（Vue/Quasar）使用
- 浏览器环境通过 `fetch` API 加载
- 通过 Vite 开发服务器或生产构建的静态文件服务

**加载器**: `tableLoader.browser.ts`
```typescript
const editionUrl = `${this.tablesBaseUrl}${edition}/`;
// 默认: '/data/tables/2024/'
```

---

## 🔄 为什么需要两个位置？

### 架构原因
1. **环境隔离**:
   - Node.js 使用文件系统 (`fs.readFile`)
   - 浏览器使用 HTTP (`fetch`)

2. **构建和部署**:
   - 后端服务打包时不包含 `public` 目录
   - 前端构建时只包含 `public` 目录的内容

3. **开发环境**:
   - Vite 开发服务器自动 serve `public` 目录
   - 后端服务直接从 `data` 目录读取

---

## 📋 文件同步

**重要**: 两个位置的表格文件必须**保持同步**！

当前文件已同步：
- ✅ `table2.json` - 两个位置都存在
- ✅ `table4.json` - 两个位置都存在
- ✅ `table5A.json` - 两个位置都存在
- ✅ `table5C.json` - 两个位置都存在

---

## 🛠️ 如何更新表格文件

### 方法1: 手动复制
```bash
# 从后端目录复制到前端目录
cp tradespro/packages/calculation-engine/data/tables/2024/*.json \
   tradespro/frontend/public/data/tables/2024/
```

### 方法2: 使用脚本（推荐）
创建一个同步脚本 `scripts/sync-tables.js`:
```javascript
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../packages/calculation-engine/data/tables/2024');
const targetDir = path.join(__dirname, '../frontend/public/data/tables/2024');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 复制所有JSON文件
const files = ['table2.json', 'table4.json', 'table5A.json', 'table5C.json'];
files.forEach(file => {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);
  fs.copyFileSync(source, target);
  console.log(`✅ Copied ${file}`);
});
```

---

## 🔍 验证文件是否存在

### 检查后端文件
```bash
cd tradespro/packages/calculation-engine
ls -la data/tables/2024/
```

### 检查前端文件
```bash
cd tradespro/frontend
ls -la public/data/tables/2024/
```

---

## 📝 目录结构

```
tradespro/
├── packages/
│   └── calculation-engine/
│       ├── data/
│       │   └── tables/
│       │       └── 2024/          ← 后端使用
│       │           ├── table2.json
│       │           ├── table4.json
│       │           ├── table5A.json
│       │           └── table5C.json
│       └── src/
│           └── core/
│               ├── tableLoader.node.ts    ← 读取 data/tables/
│               └── tableLoader.browser.ts ← 使用 fetch API
│
└── frontend/
    └── public/
        └── data/
            └── tables/
                └── 2024/          ← 前端使用
                    ├── table2.json
                    ├── table4.json
                    ├── table5A.json
                    └── table5C.json
```

---

## ⚠️ 注意事项

1. **文件同步**: 更新表格文件后，必须同步到两个位置
2. **版本控制**: 两个位置的表格文件都应该提交到 Git
3. **路径配置**: 
   - 后端使用相对路径 `../../data/tables/`
   - 前端使用URL路径 `/data/tables/`

---

**状态**: ✅ 两个位置的表格文件都存在且同步






