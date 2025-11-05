# TradesPro V4.1 Plugin System

## 📋 概述

V4.1 Plugin System 允许开发者以插件方式开发、安装和运行计算功能。所有计算器（如 CEC single dwelling、NEC single dwelling）现在都以 plugin 方式实现，使得平台可以：

- ✅ 模块化扩展：新功能可以独立开发和部署
- ✅ 社区参与：第三方开发者可以贡献插件
- ✅ 动态加载：插件可以按需安装和卸载
- ✅ 统一接口：所有计算功能使用相同的标准接口
- ✅ 安全验证：插件可以签名和校验

---

## 🏗️ 架构设计

### 核心组件

```
@tradespro/calculation-engine/src/plugins/
├── types.ts              # Plugin类型定义
├── registry.ts           # Plugin注册表
├── loader.ts             # Plugin加载器
├── index.ts              # Plugin系统入口
└── builtin/              # 内置插件
    ├── cec-single-dwelling-plugin.ts
    └── nec-single-dwelling-plugin.ts
```

### 数据流

```
开发者 → 创建Plugin → 注册到Registry → 加载Plugin → 执行计算
```

---

## 📦 Plugin 标准接口

### Plugin Manifest

每个 plugin 必须提供一个 manifest，定义其元数据和能力：

```typescript
interface PluginManifest {
  id: string;                    // 唯一ID，如 "cec-single-dwelling-2024"
  name: string;                  // 显示名称
  version: string;               // 版本号（语义化版本）
  description: string;           // 描述
  domain: 'electrical' | 'hvac' | 'plumbing' | 'gas' | 'fire_alarm' | 'other';
  standards: string[];           // 支持的标准，如 ["CEC-2024"]
  buildingTypes: string[];       // 支持的建筑类型
  capabilities: {
    offline: boolean;            // 是否支持离线运行
    audit: boolean;              // 是否支持审计轨迹
    signing: boolean;            // 是否支持签名
    preview: boolean;            // 是否支持预览模式
  };
  // ... 更多字段见 types.ts
}
```

### CalculationPlugin 接口

所有 plugin 必须实现 `CalculationPlugin` 接口：

```typescript
interface CalculationPlugin {
  manifest: PluginManifest;
  
  // 输入验证（可选）
  validateInputs?(inputs: any): { valid: boolean; errors?: string[] };
  
  // 主计算函数（必需）
  calculate(
    inputs: any,
    context: PluginContext
  ): PluginCalculationResult | Promise<PluginCalculationResult>;
  
  // 生命周期钩子（可选）
  onInstall?(): void | Promise<void>;
  onUninstall?(): void | Promise<void>;
  onLoad?(): void | Promise<void>;
}
```

---

## 🚀 使用方法

### 1. 使用内置插件

```typescript
import { pluginRegistry, executePlugin, createPluginContext } from '@tradespro/calculation-engine';
import { tableManager } from '@tradespro/calculation-engine';

// 插件已经自动注册，直接使用
const pluginId = 'cec-single-dwelling-2024';

// 准备输入
const inputs = {
  systemVoltage: 240,
  livingArea_m2: 150,
  phase: 1,
  // ... 更多输入
};

// 准备上下文
const engineMeta = {
  name: 'tradespro-engine',
  version: '1.0.0',
  commit: process.env.GIT_COMMIT || 'dev',
};

const tables = await tableManager.loadTables('2024');
const context = createPluginContext(engineMeta, tables, {
  mode: 'official',
  tier: 'premium',
});

// 执行计算
const result = await executePlugin(pluginId, inputs, context);
console.log('计算结果:', result.bundle);
```

### 2. 查找可用插件

```typescript
import { pluginRegistry } from '@tradespro/calculation-engine';

// 列出所有插件
const allPlugins = pluginRegistry.list();

// 按域查找
const electricalPlugins = pluginRegistry.listByDomain('electrical');

// 按标准查找
const cecPlugins = pluginRegistry.listByStandard('CEC-2024');

// 按建筑类型查找
const singleDwellingPlugins = pluginRegistry.listByBuildingType('single-dwelling');
```

### 3. 获取插件信息

```typescript
const plugin = pluginRegistry.get('cec-single-dwelling-2024');
if (plugin) {
  console.log('插件名称:', plugin.manifest.name);
  console.log('插件版本:', plugin.manifest.version);
  console.log('支持的标准:', plugin.manifest.standards);
  console.log('能力:', plugin.manifest.capabilities);
}
```

---

## 🛠️ 开发新 Plugin

### 步骤 1: 创建 Plugin 文件

```typescript
// my-custom-plugin.ts
import type { CalculationPlugin, PluginContext, PluginCalculationResult } from '@tradespro/calculation-engine';

export const myCustomPlugin: CalculationPlugin = {
  manifest: {
    id: 'my-custom-plugin',
    name: 'My Custom Calculator',
    version: '1.0.0',
    description: 'My custom calculation plugin',
    domain: 'electrical',
    standards: ['CUSTOM-STANDARD'],
    buildingTypes: ['custom-building'],
    capabilities: {
      offline: true,
      audit: true,
      signing: true,
      preview: true,
    },
    entry: 'my-custom-plugin.ts',
  },

  validateInputs(inputs: any) {
    // 验证输入
    const errors: string[] = [];
    if (!inputs.requiredField) {
      errors.push('requiredField is required');
    }
    return { valid: errors.length === 0, errors };
  },

  async calculate(inputs: any, context: PluginContext): Promise<PluginCalculationResult> {
    // 执行计算逻辑
    const result = {
      // ... 计算结果
    };

    const bundle = {
      // ... 构建 UnsignedBundle
    };

    return {
      bundle,
      executionTimeMs: 100,
      warnings: [],
    };
  },

  onLoad() {
    console.log('My custom plugin loaded!');
  },
};

export default myCustomPlugin;
```

### 步骤 2: 注册 Plugin

```typescript
import { pluginRegistry } from '@tradespro/calculation-engine';
import { myCustomPlugin } from './my-custom-plugin';

// 注册插件
pluginRegistry.register(myCustomPlugin);
```

### 步骤 3: 使用 Plugin

```typescript
const result = await executePlugin('my-custom-plugin', inputs, context);
```

---

## 📝 内置插件

### CEC Single Dwelling Plugin

- **ID**: `cec-single-dwelling-2024`
- **标准**: CEC 2024, Section 8-200
- **建筑类型**: single-dwelling
- **能力**: offline, audit, signing, preview

```typescript
const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
```

### NEC Single Dwelling Plugin

- **ID**: `nec-single-dwelling-2023`
- **标准**: NEC 2023, Article 220
- **建筑类型**: single-dwelling
- **能力**: offline, audit, signing, preview
- **方法**: Standard Method (默认) 或 Optional Method

```typescript
// Standard Method
const context = createPluginContext(engineMeta, tables, {
  necMethod: 'standard',
});

// Optional Method
const context2 = createPluginContext(engineMeta, tables, {
  necMethod: 'optional',
});

const result = await executePlugin('nec-single-dwelling-2023', inputs, context);
```

---

## 🔒 安全与验证

### 插件签名验证（计划中）

插件可以包含数字签名以确保来源可信：

```typescript
const options = {
  verifySignature: true,
  verifyChecksum: true,
  allowUnverified: false,
};

await loadPlugin(pluginModule, options);
```

### 插件沙箱（计划中）

插件运行在受限环境中，只能：
- ✅ 访问提供的 context 和 tables
- ✅ 使用提供的 logger 接口
- ❌ 不能访问文件系统
- ❌ 不能进行网络请求
- ❌ 不能访问全局变量

---

## 📚 最佳实践

### 1. 输入验证

始终实现 `validateInputs` 方法：

```typescript
validateInputs(inputs: any) {
  const errors: string[] = [];
  // 验证所有必需字段
  // 验证数据类型
  // 验证数值范围
  return { valid: errors.length === 0, errors };
}
```

### 2. 错误处理

在 `calculate` 方法中妥善处理错误：

```typescript
async calculate(inputs: any, context: PluginContext) {
  try {
    // 计算逻辑
  } catch (error) {
    context.logger.error(`Calculation failed: ${error.message}`);
    throw error;
  }
}
```

### 3. 审计轨迹

确保计算结果包含完整的审计轨迹（steps）：

```typescript
// 计算结果应包含完整的 CalculationStep[]
// 每个步骤应包含：
// - inputs: 使用的输入值
// - outputs: 产生的输出值
// - justification: 计算说明
// - ruleCitations: 引用的规则
```

### 4. 性能优化

- 使用异步计算（如果计算耗时）
- 记录执行时间
- 缓存可重用的计算结果

---

## 🔄 迁移指南

### 从直接调用迁移到 Plugin

**之前**:
```typescript
import { computeSingleDwelling } from '@tradespro/calculation-engine';
const bundle = computeSingleDwelling(inputs, engineMeta, tables);
```

**之后**:
```typescript
import { executePlugin, createPluginContext } from '@tradespro/calculation-engine';
const context = createPluginContext(engineMeta, tables);
const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
const bundle = result.bundle;
```

---

## 📖 更多资源

- **类型定义**: `src/plugins/types.ts`
- **注册表实现**: `src/plugins/registry.ts`
- **加载器实现**: `src/plugins/loader.ts`
- **示例插件**: `src/plugins/builtin/`

---

## 🎯 下一步

1. ✅ Plugin 系统核心架构
2. ✅ CEC 和 NEC 插件实现
3. 🔄 Plugin 市场/商店（计划中）
4. 🔄 插件签名验证（计划中）
5. 🔄 插件沙箱环境（计划中）
6. 🔄 插件热重载（计划中）

---

## 🤝 贡献

欢迎贡献新的插件！请参考：
1. 创建符合标准的 plugin
2. 实现完整的测试
3. 提交 Pull Request
4. 更新文档

---

**最后更新**: 2025-01-XX
**版本**: 1.0.0





