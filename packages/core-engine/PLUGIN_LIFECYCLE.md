# 插件生命周期管理文档

## 概述

TradesPro 插件系统提供完整的插件生命周期管理功能，包括安装、卸载、更新和版本管理。

## 核心功能

### 1. 安装插件

支持从多种来源安装插件：

```typescript
import { installPlugin } from '@tradespro/core-engine';

// 从文件系统安装
const result = await installPlugin('/path/to/plugin', {
  verifySignature: true,
  publicKeyPath: './keys/public.pem',
  skipHealthCheck: false,
});

// 从 URL 安装
const result2 = await installPlugin('https://example.com/plugin.tar.gz', {
  verifySignature: true,
  cacheDir: './.plugin-cache',
});

// 从 npm 安装
const result3 = await installPlugin('@tradespro/plugin-cec-8-200', {
  verifySignature: true,
  installDir: './.plugin-npm',
});
```

### 2. 卸载插件

```typescript
import { uninstallPlugin } from '@tradespro/core-engine';

const result = await uninstallPlugin('cec-single-dwelling-2024', {
  removeFiles: true,
  removePath: '/path/to/plugin',
});
```

### 3. 更新插件

```typescript
import { updatePlugin } from '@tradespro/core-engine';

// 更新到最新版本
const result = await updatePlugin('cec-single-dwelling-2024');

// 更新到指定版本
const result2 = await updatePlugin('cec-single-dwelling-2024', {
  targetVersion: '1.1.0',
  force: true,
});
```

### 4. 检查更新

```typescript
import { checkForUpdates } from '@tradespro/core-engine';

// 检查所有插件更新
const updates = await checkForUpdates();

// 检查特定插件更新
const updates2 = await checkForUpdates('cec-single-dwelling-2024');
```

### 5. 查询插件信息

```typescript
import { getPluginInstallInfo, listInstalledPlugins } from '@tradespro/core-engine';

// 获取单个插件信息
const info = getPluginInstallInfo('cec-single-dwelling-2024');

// 列出所有已安装插件
const plugins = listInstalledPlugins();
```

## CLI 工具

使用 `plugin-manager` CLI 工具管理插件：

```bash
# 安装插件
npm run plugin-manager install /path/to/plugin
npm run plugin-manager install https://example.com/plugin.tar.gz
npm run plugin-manager install @tradespro/plugin-cec-8-200

# 卸载插件
npm run plugin-manager uninstall cec-single-dwelling-2024

# 更新插件
npm run plugin-manager update cec-single-dwelling-2024
npm run plugin-manager update cec-single-dwelling-2024 --version 1.1.0

# 检查更新
npm run plugin-manager check-updates
npm run plugin-manager check-updates cec-single-dwelling-2024

# 列出已安装插件
npm run plugin-manager list

# 查看插件信息
npm run plugin-manager info cec-single-dwelling-2024
```

## 安装信息

每个安装的插件都包含以下信息：

- `pluginId`: 插件唯一标识符
- `version`: 插件版本
- `installedAt`: 安装时间
- `source`: 安装来源（path/url/npm/builtin）
- `sourcePath`: 原始来源路径
- `installPath`: 安装路径
- `healthStatus`: 健康状态（healthy/unhealthy/unknown）
- `lastHealthCheck`: 最后健康检查时间

## 版本管理

插件版本遵循语义化版本（SemVer）：
- `1.0.0` - 主版本.次版本.修订版本
- 更新时会自动比较版本号
- 支持强制更新（`force: true`）

## 依赖解析

插件可以声明对其他插件的依赖：

```json
{
  "dependencies": {
    "plugins": ["other-plugin-id"],
    "coreEngine": ">=1.0.0"
  }
}
```

系统会在安装时检查并解析依赖关系。

## 安全特性

- **签名验证**: 安装时验证插件签名
- **健康检查**: 安装后自动运行健康检查
- **沙箱测试**: 可选的沙箱环境测试

## 最佳实践

1. **安装前验证**: 始终启用签名验证
2. **定期更新**: 使用 `check-updates` 定期检查更新
3. **健康监控**: 定期运行健康检查
4. **备份配置**: 在更新前备份插件配置



