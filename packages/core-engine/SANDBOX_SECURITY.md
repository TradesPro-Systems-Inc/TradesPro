# 插件沙箱安全配置文档

## 概述

TradesPro 插件系统使用 `vm2` 作为主要的沙箱执行环境，确保插件代码在隔离的环境中运行，防止恶意代码访问系统资源。

## 安全特性

### 1. vm2 配置

- **内存限制**: 默认 64MB，可配置
- **超时保护**: 默认 5 秒，可配置
- **文件系统隔离**: 限制到插件目录
- **网络访问**: 默认禁用
- **嵌套 VM**: 禁用（防止逃逸）
- **严格模式**: 启用

### 2. 模块加载限制

- **相对路径**: 允许加载插件目录内的相对模块
- **外部模块**: 默认禁用，可通过配置允许
- **内置模块**: 默认禁用，可通过白名单允许

### 3. 回退机制

如果 `vm2` 不可用，系统会回退到 Node.js 原生 `vm` 模块（安全性较低）。在生产环境中，应确保 `vm2` 已安装。

## 使用示例

```typescript
import { runPluginInSandbox } from '@tradespro/core-engine';

const result = await runPluginInSandbox(
  '/path/to/plugin.js',
  inputs,
  context,
  {
    mode: 'vm2',           // 使用 vm2（推荐）
    timeoutMs: 10000,      // 10 秒超时
    memoryLimitMb: 128,    // 128MB 内存限制
    allowRequire: false,   // 禁用 require
    allowedModules: [],     // 允许的内置模块列表
  }
);
```

## 安全建议

1. **生产环境**: 始终使用 `vm2` 模式
2. **密钥管理**: 不要将私钥暴露给插件
3. **输入验证**: 在传递给插件前验证所有输入
4. **资源限制**: 设置合理的超时和内存限制
5. **审计日志**: 记录所有插件执行操作

## 测试

使用测试工具验证沙箱功能：

```bash
npm run test-sandbox <plugin-path> --inputs test-inputs.json
```



