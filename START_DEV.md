# 🚀 启动开发环境

## 方法1: 使用 npx（推荐）

```bash
cd D:\TradesProOld\tradespro\frontend
npx quasar dev
```

## 方法2: 从根目录启动

```bash
cd D:\TradesProOld\tradespro
npm run dev:frontend
```

## 方法3: 安装全局Quasar CLI

```bash
npm install -g @quasar/cli
cd D:\TradesProOld\tradespro\frontend
quasar dev
```

## 🌐 访问地址

开发服务器启动后，打开浏览器访问：

**http://localhost:3000**

或

**http://localhost:9000**

（端口可能根据配置不同）

## ✅ 验证功能

1. **语言切换器** - 顶部工具栏应该有语言选择下拉菜单
2. **字体大小控制** - 可以切换小/中/大字体
3. **计算功能** - 输入数据并进行负载计算
4. **导体材料选择** - 铜线/铝线切换
5. **温度修正** - 环境温度和端接温度影响导体选择

## 🐛 故障排除

### 问题: 'quasar' is not recognized

**解决方案**: 使用 `npx quasar dev` 代替 `quasar dev`

### 问题: 端口被占用

**解决方案**: 
1. 关闭占用端口的程序
2. 或修改 `quasar.config.js` 中的端口：
```javascript
devServer: {
  port: 3001 // 改为其他端口
}
```

### 问题: 编译错误

**检查**:
1. 运行 `npm install` 确保所有依赖已安装
2. 删除 `node_modules` 和 `package-lock.json`，重新安装
3. 检查控制台错误信息

## 📝 开发服务器特性

- ✅ **热重载** - 修改代码后自动刷新
- ✅ **错误提示** - 编译错误会显示在浏览器中
- ✅ **Vue DevTools** - 支持Vue开发者工具
- ✅ **Source Maps** - 方便调试

## 🎯 快速测试清单

### 语言切换
- [ ] 切换到English - 界面显示英文
- [ ] 切换到Français - 界面显示法文（目前硬编码文本不会变）
- [ ] 切换到简体中文 - 界面显示中文
- [ ] 刷新页面 - 语言保持选择

### 计算功能
- [ ] 输入150m² - 应该显示24000W（100A）
- [ ] 选择铝线 - 导体尺寸应该比铜线大
- [ ] 环境温度50°C - 导体尺寸应该增大
- [ ] 添加电炉灶12kW - 应该按公式计算6000W

### 字体控制
- [ ] 小字体 - 文字变小
- [ ] 中字体 - 默认大小
- [ ] 大字体 - 文字变大
- [ ] 刷新页面 - 字体设置保持

## 📂 项目结构

```
tradespro/
├── frontend/              ← 前端项目
│   ├── src/
│   │   ├── pages/        ← 页面组件
│   │   ├── components/   ← 可复用组件
│   │   ├── layouts/      ← 布局组件
│   │   ├── i18n/         ← 多语言文件
│   │   ├── composables/  ← 组合式API
│   │   └── boot/         ← Boot插件
│   └── quasar.config.js  ← Quasar配置
├── services/
│   └── calculation-service/  ← 计算引擎
└── backend/              ← FastAPI后端
```

## 🎨 开发建议

1. **使用Vue DevTools** - 安装浏览器扩展
2. **开启Source Maps** - 已在开发模式启用
3. **查看Network请求** - 验证离线计算（无网络请求）
4. **使用Console** - 查看计算步骤日志

## 📚 相关文档

- `I18N_QUICK_START.md` - 多语言快速指南
- `CALCULATION_FIXES.md` - 计算逻辑修复说明
- `CEC_8-200_IMPLEMENTATION.md` - CEC规则实现细节

现在可以开始开发了！🎉


