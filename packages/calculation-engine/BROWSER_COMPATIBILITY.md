# 浏览器兼容性说明 (Browser Compatibility)

## 问题 (Issue)

插件系统中的某些模块依赖 Node.js 特定的 API（如 `fs`、`vm`、`crypto`），这些模块无法在浏览器环境中运行。

## 受影响的模块 (Affected Modules)

以下模块仅适用于服务器端（Node.js）：

- `src/plugins/loader.ts` - 使用 `fs.readFileSync`
- `src/plugins/signatureVerifier.ts` - 使用 `fs.readFileSync` 和 `crypto`
- `src/plugins/sandboxRunner.ts` - 使用 `vm` 和 `fs`

## 解决方案 (Solution)

### 前端（浏览器）使用

默认导出不包含这些服务器端模块。前端代码应该只导入浏览器兼容的部分：

```typescript
// ✅ 安全 - 浏览器兼容
import {
  pluginRegistry,
  cecSingleDwellingPlugin,
  necSingleDwellingPlugin,
  type PluginManifest,
  type CalculationPlugin,
} from '@tradespro/calculation-engine';

// ❌ 不要在浏览器代码中这样做
// import { loadPlugin } from '@tradespro/calculation-engine'; // 会导致错误
```

### 后端（Node.js）使用

服务器端代码可以直接导入这些模块：

```typescript
// ✅ 服务器端 - 完整功能
import { loadPlugin, installPluginFromPath } from '@tradespro/calculation-engine/src/plugins/loader';
import { verifyManifestIntegrity } from '@tradespro/calculation-engine/src/plugins/signatureVerifier';
import { runPluginInSandbox } from '@tradespro/calculation-engine/src/plugins/sandboxRunner';
```

## 架构建议 (Architecture Recommendations)

### 前端职责

- 调用后端 API 执行计算
- 使用预注册的内置插件（CEC、NEC）
- 显示计算结果和步骤

### 后端职责

- 动态加载和验证第三方插件
- 执行插件签名验证
- 在沙箱中运行不受信任的插件代码
- 管理插件生命周期

## 迁移指南 (Migration Guide)

如果你的前端代码中出现了类似以下错误：

```
Error: Module "fs" has been externalized for browser compatibility
```

请检查你的导入语句，确保：

1. 不要直接导入 `loader`、`signatureVerifier` 或 `sandboxRunner`
2. 只使用 `pluginRegistry` 和内置插件
3. 如需动态加载插件，应该通过后端 API 实现

## 未来改进 (Future Improvements)

考虑创建一个浏览器兼容的插件加载器：

- 使用 `fetch` 替代 `fs.readFileSync`
- 使用 Web Crypto API 替代 Node.js `crypto`
- 使用 Web Workers 替代 `vm` 沙箱






