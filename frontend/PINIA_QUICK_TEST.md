# Pinia Stores 快速测试指南

## 🚀 启动应用

```bash
cd D:\TradesProOld\tradespro\frontend
quasar dev
```

应用将在 `http://localhost:3000` 或 `http://localhost:9000` 启动

## 🧪 测试清单

### 1. Settings Store 测试

#### 测试字体大小 ✅
1. 打开应用
2. 点击顶部工具栏的 **文字大小** 按钮（`A` 图标）
3. 选择不同大小：小、中、大
4. 观察页面文字大小变化
5. **刷新页面** - 字体大小应该保持
6. 打开开发者工具Console，输入：
   ```javascript
   localStorage.getItem('tradespro-settings')
   ```
   应该看到保存的设置数据

#### 测试语言切换 ✅
1. 点击顶部工具栏的 **语言** 按钮（旗帜图标）
2. 切换语言：English / Français / 简体中文
3. 观察界面语言变化
4. **刷新页面** - 语言设置应该保持
5. 检查localStorage：
   ```javascript
   localStorage.getItem('tradespro-settings')
   ```

### 2. UI Store 测试

#### 测试侧边栏 ✅
1. 在小屏幕（或缩小浏览器窗口）查看
2. 点击左上角的 **菜单** 按钮
3. 侧边栏应该打开
4. 点击外部区域或再次点击菜单关闭
5. **刷新页面** - 侧边栏状态应该保持（如果之前是打开的）

#### 测试通知系统
打开浏览器Console，输入：
```javascript
// 获取UI store
import { useUIStore } from './src/stores'
const uiStore = useUIStore()

// 测试不同类型的通知
uiStore.notifySuccess('成功消息测试')
uiStore.notifyError('错误消息测试')
uiStore.notifyWarning('警告消息测试')
uiStore.notifyInfo('信息消息测试')
```

### 3. Projects Store 测试

#### 测试项目管理 ✅
1. 导航到 **项目管理** 页面
2. 点击 **新建项目** 按钮
3. 填写项目信息：
   - 项目名称
   - 项目描述
   - 位置
   - 客户名称
4. 点击保存
5. 项目应该出现在列表中
6. **刷新页面** - 项目应该仍然存在
7. 检查localStorage：
   ```javascript
   localStorage.getItem('tradespro-projects')
   ```

#### 测试搜索和筛选
1. 在搜索框输入关键词
2. 项目列表应该实时筛选
3. 使用状态筛选器选择状态
4. 使用排序选择器改变排序

### 4. Calculations Store 测试

#### 测试计算保存 ✅
1. 导航到 **计算器** 页面
2. 填写计算表单：
   - 居住面积
   - 系统电压
   - 其他参数
3. 点击 **计算** 按钮
4. 计算完成后，结果应该自动保存
5. **刷新页面**
6. 检查localStorage：
   ```javascript
   localStorage.getItem('tradespro-calculations')
   ```
   应该看到计算历史

#### 测试导出功能
打开Console测试：
```javascript
import { useCalculationsStore } from './src/stores'
const calcStore = useCalculationsStore()

// 查看计算数量
console.log('计算总数:', calcStore.calculationsCount)

// 查看最近的计算
console.log('最近的计算:', calcStore.recentCalculations)

// 导出所有计算
calcStore.exportAllCalculationsAsJSON()
```

### 5. User Store 测试

#### 测试用户认证（Mock）
打开Console测试：
```javascript
import { useUserStore } from './src/stores'
const userStore = useUserStore()

// 测试登录
await userStore.login('test@example.com', 'password')
console.log('已登录:', userStore.isAuthenticated)
console.log('当前用户:', userStore.currentUser)

// 刷新页面后用户信息应该保持
```

## 🔍 在浏览器中调试

### Vue Devtools

1. 安装 [Vue.js devtools](https://devtools.vuejs.org/) 扩展
2. 打开DevTools
3. 选择 **Pinia** 标签页
4. 查看所有stores的状态
5. 观察状态变化
6. 使用时间旅行功能回溯状态

### Console调试

在浏览器Console中，你可以直接访问stores：

```javascript
// 1. 导入stores（需要在支持ES6模块的环境）
// 或者通过window对象访问

// 2. 查看所有localStorage数据
Object.keys(localStorage)
  .filter(key => key.startsWith('tradespro'))
  .forEach(key => {
    console.log(key, JSON.parse(localStorage.getItem(key)))
  })

// 3. 清除特定store的数据
localStorage.removeItem('tradespro-projects')

// 4. 清除所有tradespro数据
Object.keys(localStorage)
  .filter(key => key.startsWith('tradespro'))
  .forEach(key => localStorage.removeItem(key))
```

## 📊 数据验证

### 检查localStorage结构

每个store的数据结构：

#### tradespro-user
```json
{
  "currentUser": {
    "id": "1",
    "email": "user@example.com",
    "fullName": "用户名",
    "createdAt": "2024-10-28T..."
  },
  "token": "jwt-token",
  "isAuthenticated": true
}
```

#### tradespro-projects
```json
{
  "projects": [
    {
      "id": "1",
      "name": "项目名称",
      "status": "inProgress",
      "created_at": "2024-10-28T..."
    }
  ],
  "currentProject": null
}
```

#### tradespro-calculations
```json
{
  "calculations": [
    {
      "id": "calc-123",
      "inputs": { ... },
      "results": { ... },
      "createdAt": "2024-10-28T..."
    }
  ]
}
```

#### tradespro-settings
```json
{
  "language": "zh-CN",
  "fontSize": "medium",
  "theme": "auto",
  "autoSave": true,
  "cecVersion": "2024"
}
```

#### tradespro-ui
```json
{
  "sidebarOpen": false
}
```

## 🐛 常见问题排查

### 问题1: 数据没有持久化

**检查：**
```javascript
// 1. 检查pinia是否正确加载
console.log('Pinia loaded:', !!window.__pinia)

// 2. 检查localStorage是否可用
console.log('localStorage available:', typeof Storage !== 'undefined')

// 3. 查看存储的数据
console.log(localStorage)
```

**解决：**
- 确保浏览器允许localStorage
- 检查是否在隐私/无痕模式
- 清除浏览器缓存并重试

### 问题2: 页面刷新后状态丢失

**检查：**
```javascript
// 检查boot文件是否加载
// 查看Network标签，确保pinia.ts被加载
```

**解决：**
- 确保 `quasar.config.js` 中包含 `pinia` boot文件
- 检查控制台是否有错误

### 问题3: TypeScript类型错误

**检查：**
```bash
# 运行类型检查
npm run type-check
# 或
tsc --noEmit
```

**解决：**
- 重启IDE/编辑器
- 运行 `npm install`
- 检查tsconfig.json配置

## ✅ 测试完成清单

完成以下测试后，Pinia stores实现可以认为已成功：

- [ ] 字体大小调整并持久化
- [ ] 语言切换并持久化
- [ ] 侧边栏状态持久化
- [ ] 项目创建并持久化
- [ ] 项目搜索和筛选工作正常
- [ ] 计算结果保存到历史
- [ ] 计算历史在刷新后保持
- [ ] 导出JSON功能正常
- [ ] 用户登录状态持久化
- [ ] Vue Devtools能查看所有stores
- [ ] localStorage包含所有tradespro-*键
- [ ] 主题切换工作正常
- [ ] 通知系统显示正常
- [ ] 无Console错误
- [ ] TypeScript无类型错误

## 🎯 性能测试

### 测试大量数据

```javascript
import { useCalculationsStore, useProjectsStore } from './src/stores'

// 测试50条计算记录
const calcStore = useCalculationsStore()
for(let i = 0; i < 50; i++) {
  calcStore.addCalculation({
    id: `test-${i}`,
    inputs: { livingArea_m2: 100, systemVoltage: 120, phase: 1 },
    results: { serviceCurrentA: 100 },
    steps: [],
    calculationTimeMs: 50,
    createdAt: new Date().toISOString()
  })
}

// 检查性能
console.time('filter')
const filtered = calcStore.calculations.filter(c => c.id.includes('test'))
console.timeEnd('filter')

// 测试100个项目
const projectsStore = useProjectsStore()
for(let i = 0; i < 100; i++) {
  projectsStore.createProject({
    name: `测试项目 ${i}`,
    description: `描述 ${i}`
  })
}

// 测试搜索性能
console.time('search')
projectsStore.setSearchQuery('测试')
console.timeEnd('search')
```

## 📝 报告问题

如果发现问题，请记录：
1. 复现步骤
2. 预期行为
3. 实际行为
4. Console错误信息
5. localStorage数据快照
6. 浏览器和版本

---

**测试准备就绪！开始测试Pinia stores吧！** 🚀


