# Plugin System Security - Quick Start

## 🚀 快速开始

### 1. 安装 vm2 (推荐，用于沙箱)

```bash
npm install vm2@^3.9.19
```

### 2. 安装并验证插件

```typescript
import { installPluginFromPath } from '@tradespro/calculation-engine';

const { plugin, verification } = await installPluginFromPath('/path/to/plugin', {
  verifySignature: true,
  verifyChecksum: true,
  publicKeyPath: '/path/to/public.pem',
  requireSignature: process.env.NODE_ENV === 'production',
  useSandbox: true,
});
```

### 3. 在沙箱中执行插件

```typescript
import { executePluginInSandbox, createPluginContext } from '@tradespro/calculation-engine';

const result = await executePluginInSandbox(
  'plugin-id',
  '/path/to/plugin/dist/index.js',
  inputs,
  context,
  { mode: 'vm2', timeoutMs: 8000 }
);
```

## 📚 完整文档

- [PLUGIN_SECURITY.md](../../PLUGIN_SECURITY.md) - 完整安全指南
- [PLUGIN_SYSTEM.md](../../PLUGIN_SYSTEM.md) - 插件系统文档





