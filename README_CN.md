# 🏗️ TradesPro - CEC负载计算平台

> 基于加拿大电气规范(CEC 2024)的专业级单户住宅服务负载计算器

# Tradespro Project

**欢迎新成员！在开始编码之前，请务必阅读我们的 [核心架构指南 (ARCHITECTURE_GUIDE.md)](./ARCHITECTURE_GUIDE.md)。**

## 📋 项目概述

TradesPro是一个完整的、可审计的、符合CEC规范的电气负载计算平台，专为加拿大电气工程师、承包商和检查员设计。

### 核心特性

- ✅ **完整CEC 8-200实现** - 单户住宅负载计算
- ✅ **可审计计算包** - 每个计算步骤完整记录
- ✅ **离线优先** - 无需网络连接即可使用
- ✅ **导体精准选择** - 铜线/铝线 + 温度修正
- ✅ **三语言支持** - 英语/法语/中文
- ✅ **响应式设计** - 桌面和移动端
- ✅ **跨平台** - Web/iOS/Android

---

## 🚀 快速开始

### 前置要求

- Node.js 16+ 
- npm 7+

### 安装

```bash
# 1. 克隆项目
cd D:\TradesProOld\tradespro

# 2. 安装前端依赖
cd frontend
npm install

# 3. 启动开发服务器
npx quasar dev
```

### 访问

打开浏览器访问: **http://localhost:3000**

---

## 📖 使用文档

### 快速指南

| 文档 | 说明 | 链接 |
|------|------|------|
| 🚀 启动指南 | 如何启动开发环境 | [START_DEV.md](START_DEV.md) |
| 🌍 多语言 | i18n快速启动 | [I18N_QUICK_START.md](I18N_QUICK_START.md) |
| 📊 今日进度 | 最新完成功能 | [TODAYS_PROGRESS.md](TODAYS_PROGRESS.md) |

### 技术文档

| 文档 | 说明 | 链接 |
|------|------|------|
| 📐 CEC实现 | CEC 8-200规则详解 | [CEC_8-200_IMPLEMENTATION.md](CEC_8-200_IMPLEMENTATION.md) |
| 🔧 计算修复 | 导体选择逻辑 | [CALCULATION_FIXES.md](CALCULATION_FIXES.md) |
| 🌐 i18n完整指南 | 多语言详细配置 | [I18N_SETUP.md](I18N_SETUP.md) |
| ⚡ 同步异步 | 性能优化说明 | [SYNC_VS_ASYNC.md](SYNC_VS_ASYNC.md) |

---

## 🏗️ 项目结构

```
tradespro/
├── frontend/                    # Quasar/Vue3 前端
│   ├── src/
│   │   ├── pages/              # 页面组件
│   │   │   ├── CalculatorPage.vue       # 计算器主页
│   │   │   ├── ProjectManagement.vue    # 项目管理
│   │   │   └── UserSettings.vue         # 用户设置
│   │   ├── components/         # 可复用组件
│   │   │   ├── calculator/     # 计算相关
│   │   │   ├── audit/          # 审计轨迹
│   │   │   └── common/         # 通用组件
│   │   ├── composables/        # 组合式API
│   │   │   ├── useOfflineCalculation.ts  # 核心计算逻辑
│   │   │   └── useFontSize.ts            # 字体控制
│   │   ├── i18n/               # 多语言文件
│   │   │   ├── en-CA.json      # 英语
│   │   │   ├── fr-CA.json      # 法语
│   │   │   └── zh-CN.json      # 中文
│   │   ├── layouts/            # 布局组件
│   │   └── boot/               # Boot插件
│   └── quasar.config.js        # Quasar配置
│
├── services/
│   └── calculation-service/    # Node.js计算服务
│       ├── src/
│       │   ├── calculators/    # 计算器实现
│       │   └── core/           # 核心类型和表格
│       └── package.json
│
├── backend/                     # FastAPI后端（可选）
│   ├── app/
│   │   ├── main.py            # API入口
│   │   └── routers/           # API路由
│   └── requirements.txt
│
└── docs/                        # 文档
    ├── CEC_8-200_IMPLEMENTATION.md
    ├── CALCULATION_FIXES.md
    ├── I18N_SETUP.md
    └── ...
```

---

## 🎯 功能特性

### 1. CEC 8-200负载计算

#### 方法a) - 详细计算
- ✅ **基础负载**: 5000W (前90m²) + 1000W/90m² (超出部分)
- ✅ **供暖负载**: 前10kW @ 100% + 超出部分 @ 75%
- ✅ **空调负载**: 100%需求系数
- ✅ **互锁处理**: 供暖/空调不能同时运行
- ✅ **电炉灶**: 6000W + 40% × (额定-12kW)
- ✅ **热水器**: 100%（即热式/泳池） / 75%（储水式）
- ✅ **EV充电**: 100%需求系数
- ✅ **其他负载**: 25%需求系数（有Range时）

#### 方法b) - 最小值
- ✅ **≥80m²**: 24000W (100A @ 240V)
- ✅ **<80m²**: 14400W (60A @ 240V)

#### 最终负载
- ✅ **取较大值**: max(方法a, 方法b)

### 2. 导体选择

#### 材料选择
- ✅ **铜线(Cu)**: CEC Table 2完整载流量
- ✅ **铝线(Al)**: CEC Table 4 完整载流量
- ✅ **14 AWG - 500 kcmil**: 全规格支持

#### 温度修正
- ✅ **端接温度**: 60°C / 75°C / 90°C
- ✅ **环境温度**: 30-50°C+ 修正系数
- ✅ **CEC Table 5A**: 完整温度修正表

#### 计算公式
```
额定载流量 = 基准载流量 × 温度修正系数
```

### 3. 可审计计算

每个计算步骤包含：
- ✅ **公式引用**: CEC规则编号
- ✅ **输入值**: 所有输入参数
- ✅ **中间值**: 计算过程
- ✅ **输出值**: 计算结果
- ✅ **规则引用**: 相关CEC规则
- ✅ **表格引用**: 使用的CEC表格
- ✅ **时间戳**: 计算时间

### 4. 多语言支持

#### 支持语言
- 🇨🇦 **English (Canada)** - 默认语言
- 🇨🇦 **Français (Canada)** - 加拿大法语
- 🇨🇳 **简体中文** - Simplified Chinese

#### 翻译范围
- ✅ 界面所有文本
- ✅ 提示和说明
- ✅ 错误消息
- ✅ 按钮和标签

### 5. 用户体验

- ✅ **字体大小控制**: 小/中/大三档
- ✅ **暗色模式**: 支持深色主题（待实现）
- ✅ **响应式设计**: 适配所有屏幕
- ✅ **离线存储**: 本地保存计算结果
- ✅ **实时验证**: 输入即时反馈

---

## 🧪 使用示例

### 示例1: 基础住宅

**输入**:
- 居住面积: 150 m²
- 系统电压: 240V 单相
- 无供暖/空调/电器

**计算**:
- 方法a): 6000W (基础)
- 方法b): 24000W (≥80m²最小值)
- **最终**: 24000W

**结果**:
- 服务电流: 100A
- 导体(Cu 75°C 30°C): 1/0 AWG (125A)
- 断路器: 100A

### 示例2: 带电炉灶和EV

**输入**:
- 居住面积: 200 m²
- 电炉灶: 15kW
- EV充电: 7.2kW
- 热水器: 10kW即热式

**计算**:
- 基础: 7000W
- 电炉灶: 7200W [6000 + (15000-12000)×0.4]
- EV: 7200W (100%)
- 热水器: 10000W (100%)
- **总计**: 31400W

**结果**:
- 服务电流: 130.8A
- 导体(Cu 75°C 30°C): 2/0 AWG (145A)
- 断路器: 150A

### 示例3: 高温环境铝线

**输入**:
- 服务电流: 100A
- 材料: 铝(Al)
- 环境温度: 50°C
- 端接温度: 75°C

**计算**:
- 温度修正系数: 0.75
- 需要基准载流量: 100 / 0.75 = 133.33A
- 查表: 3/0 AWG Al (130A × 0.75 = 97.5A) ❌
- 查表: 4/0 AWG Al (150A × 0.75 = 112.5A) ✅

**结果**:
- 导体: 4/0 AWG Al (150A基准)
- 额定载流量: 112.5A
- 满足要求: ✅

---

## 📊 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **UI**: Quasar Framework 2
- **语言**: TypeScript
- **状态**: Pinia (待实现)
- **路由**: Vue Router 4
- **国际化**: Vue I18n 9

### 计算引擎
- **运行时**: Node.js 16+
- **语言**: TypeScript
- **包管理**: npm workspaces

### 后端（可选）
- **框架**: FastAPI
- **数据库**: PostgreSQL
- **缓存**: Redis
- **语言**: Python 3.9+

### 移动端
- **框架**: Capacitor
- **平台**: iOS / Android

---

## 🔧 开发指南

### 开发环境设置

```bash
# 1. 安装依赖
npm install

# 2. 启动前端
npx quasar dev

# 3. 构建计算服务（如果修改）
cd services/calculation-service
npm run build
```

### 代码规范

#### 注释语言
按照加拿大规范，**代码注释使用英语**:

```typescript
// ✅ GOOD: English comments
/**
 * Calculate base load per CEC 8-200 1)a)i-ii)
 * @param area Living area in square meters
 * @returns Base load in watts
 */
function calculateBaseLoad(area: number): number {
  // For areas up to 90m²
  if (area <= 90) {
    return 5000;
  }
  return 5000 + Math.ceil((area - 90) / 90) * 1000;
}
```

#### 界面文本
**界面文本使用i18n**，支持三种语言

### 测试

```bash
# 单元测试（待实现）
npm test

# E2E测试（待实现）
npm run test:e2e
```

---

## 📝 待实现功能

### 高优先级
- [ ] 界面文本i18n化
- [ ] 束线修正系数 (CEC Table 5C)
- [ ] 电压降计算 (CEC 8-102)

### 中优先级
- [ ] 导管尺寸选择 (CEC Table 9A-9D)
- [ ] 接地导体选择 (CEC Table 16)
- [ ] PDF报告生成

### 低优先级
- [ ] 三相负载计算
- [ ] 多住宅单元 (CEC 8-200 2))
- [ ] 公寓楼 (CEC 8-202)
- [ ] 用户认证系统
- [ ] 云端同步

---

## 🤝 贡献指南

### 报告问题

请在GitHub Issues中报告问题，包括：
1. 问题描述
2. 重现步骤
3. 期望结果
4. 实际结果
5. 环境信息（浏览器/OS）

### 提交代码

1. Fork项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建Pull Request

---

## 📄 许可证

Copyright © 2024 TradesPro

---

## 🙏 致谢

- **Canadian Standards Association (CSA)** - CEC规范
- **Quasar Framework** - 优秀的Vue UI框架
- **Vue.js团队** - 强大的前端框架
- **TypeScript团队** - 类型安全

---

## 📞 联系方式

- **项目**: TradesPro
- **版本**: 1.0.0
- **状态**: 开发中
- **文档**: 本仓库 `/docs` 目录

---

## 🎉 开始使用

```bash
cd D:\TradesProOld\tradespro\frontend
npm install
npx quasar dev
```

然后打开浏览器访问 http://localhost:3000

享受专业的CEC负载计算体验！🚀


