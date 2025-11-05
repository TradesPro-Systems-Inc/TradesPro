# 插件加载器文档

## 概述

TradesPro 插件系统支持从多种来源加载插件：

1. **文件系统** - 本地目录（已实现）
2. **URL** - HTTP/HTTPS 下载（新增）
3. **NPM** - npm 包管理器（新增）

## 文件系统加载

从本地目录加载插件：

```typescript
import { installPluginFromPath } from '@tradespro/core-engine';

const result = await installPluginFromPath('/path/to/plugin', {
  verifySignature: true,
  publicKeyPath: './keys/public.pem',
});
```

## URL 加载

从 HTTP/HTTPS URL 下载并加载插件：

```typescript
import { installPluginFromUrl } from '@tradespro/core-engine';

const result = await installPluginFromUrl('https://example.com/plugins/cec-8-200.tar.gz', {
  verifySignature: true,
  publicKeyPath: './keys/public.pem',
  cacheDir: './.plugin-cache',
  timeout: 30000,
});
```

**特性：**
- 自动下载和缓存插件包
- 支持 tarball (.tar.gz) 格式
- 自动提取到缓存目录
- 支持签名验证

## NPM 加载

从 npm 注册表安装并加载插件：

```typescript
import { installPluginFromNpm } from '@tradespro/core-engine';

// 从 npm 注册表安装
const result = await installPluginFromNpm('@tradespro/plugin-cec-8-200', {
  verifySignature: true,
  publicKeyPath: './keys/public.pem',
  installDir: './.plugin-npm',
});

// 从特定版本安装
const result2 = await installPluginFromNpm('@tradespro/plugin-cec-8-200@1.0.0', {
  verifySignature: true,
});

// 从 Git 仓库安装
const result3 = await installPluginFromNpm('git+https://github.com/tradespro/plugin-cec-8-200.git', {
  verifySignature: true,
});
```

**特性：**
- 自动安装 npm 包
- 支持版本指定
- 支持 Git 仓库
- 支持自定义注册表
- 自动缓存安装的包

## 安全配置

所有加载器都支持：

- **签名验证**: 验证插件 manifest 的数字签名
- **Checksum 验证**: 验证插件完整性
- **沙箱执行**: 在隔离环境中测试插件（可选）

## 使用示例

### 完整示例

```typescript
import {
  installPluginFromPath,
  installPluginFromUrl,
  installPluginFromNpm,
  pluginRegistry,
  executePlugin
} from '@tradespro/core-engine';

// 1. 从文件系统加载
await installPluginFromPath('./plugins/cec-8-200', {
  verifySignature: true,
  publicKeyPath: './keys/public.pem',
});

// 2. 从 URL 加载
await installPluginFromUrl('https://cdn.tradespro.com/plugins/cec-8-200.tar.gz', {
  verifySignature: true,
  publicKeyPath: './keys/public.pem',
});

// 3. 从 npm 加载
await installPluginFromNpm('@tradespro/plugin-cec-8-200', {
  verifySignature: true,
  publicKeyPath: './keys/public.pem',
});

// 4. 使用插件
const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
```

## 依赖

- `tar`: 用于解压 URL 下载的 tarball（可选依赖）
- `vm2`: 用于沙箱执行（可选依赖）

安装依赖：

```bash
npm install tar vm2
```



