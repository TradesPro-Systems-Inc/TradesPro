# 插件版本管理和依赖解析文档

## 概述

TradesPro 插件系统提供完整的语义化版本管理和依赖解析功能。

## 版本格式

遵循语义化版本（SemVer）规范：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能添加
- **PATCH**: 向后兼容的问题修复

示例：`1.2.3`, `2.0.0`, `1.0.0-beta.1`

## 版本比较

```typescript
import { compareVersions } from '@tradespro/core-engine';

// 返回: -1 (v1 < v2), 0 (v1 === v2), 1 (v1 > v2)
const result = compareVersions('1.2.3', '1.2.4'); // -1
```

## 版本范围

支持多种版本范围格式：

### 精确版本
```
1.0.0
```

### 范围操作符
- `>=1.0.0` - 大于等于
- `>1.0.0` - 大于
- `<=1.0.0` - 小于等于
- `<1.0.0` - 小于
- `>=1.0.0 <2.0.0` - 范围

### 语义化范围
- `^1.0.0` - 兼容版本（>=1.0.0 <2.0.0）
- `~1.0.0` - 近似版本（>=1.0.0 <1.1.0）

### 使用示例

```typescript
import { satisfiesVersion, parseVersionRange } from '@tradespro/core-engine';

// 检查版本是否满足范围
satisfiesVersion('1.2.3', '>=1.0.0 <2.0.0'); // true
satisfiesVersion('2.0.0', '^1.0.0'); // false

// 解析版本范围
const range = parseVersionRange('^1.0.0');
// { min: '1.0.0', max: '2.0.0', includeMin: true, includeMax: false }
```

## 依赖解析

### 检查插件依赖

```typescript
import { resolveDependencies } from '@tradespro/core-engine';

const plugin = pluginRegistry.get('cec-single-dwelling-2024');
const resolution = resolveDependencies(plugin);

console.log(resolution.resolved); // true/false
console.log(resolution.dependencies); // 依赖列表
console.log(resolution.missing); // 缺失的依赖
console.log(resolution.conflicts); // 版本冲突
```

### 检查是否可以安装

```typescript
import { canInstallPlugin } from '@tradespro/core-engine';

const result = canInstallPlugin(plugin);
if (result.canInstall) {
  // 可以安装
} else {
  // 检查 result.resolution.missing 和 result.resolution.conflicts
}
```

### 获取安装顺序

```typescript
import { getInstallationOrder } from '@tradespro/core-engine';

const plugins = [plugin1, plugin2, plugin3];
const { order, errors } = getInstallationOrder(plugins);

// order 是按依赖关系排序的插件列表
// 确保依赖插件在依赖它们的插件之前安装
```

## 版本冲突检测

```typescript
import { checkVersionConflicts } from '@tradespro/core-engine';

const plugins = pluginRegistry.list();
const { conflicts } = checkVersionConflicts(plugins);

// conflicts 包含所有版本冲突信息
```

## 查找兼容版本

```typescript
import { getLatestCompatibleVersion } from '@tradespro/core-engine';

const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0'];
const latest = getLatestCompatibleVersion(versions, '^1.0.0');
// 返回: '1.2.0'
```

## CLI 工具

### 检查依赖

```bash
npm run dependency-check check cec-single-dwelling-2024
```

### 解析依赖

```bash
npm run dependency-check resolve cec-single-dwelling-2024
```

### 计算安装顺序

```bash
npm run dependency-check order plugin1 plugin2 plugin3
```

### 检查冲突

```bash
npm run dependency-check conflicts
```

### 比较版本

```bash
npm run dependency-check compare 1.2.3 1.2.4
```

### 检查版本范围

```bash
npm run dependency-check satisfies 1.2.3 "^1.0.0"
```

## 插件依赖声明

在 `manifest.json` 中声明依赖：

```json
{
  "dependencies": {
    "plugins": ["other-plugin-id"],
    "coreEngine": ">=1.0.0"
  }
}
```

## 自动依赖检查

安装插件时，系统会自动检查依赖：

```typescript
import { installPlugin } from '@tradespro/core-engine';

// 如果依赖不满足，会抛出错误
try {
  await installPlugin('plugin-id', {
    skipDependencyCheck: false, // 默认启用
  });
} catch (error) {
  // 处理依赖错误
}
```

## 最佳实践

1. **使用语义化版本**: 遵循 SemVer 规范
2. **明确依赖范围**: 使用 `^` 或 `~` 前缀
3. **定期检查更新**: 使用 `check-updates` 命令
4. **解决冲突**: 在安装前检查版本冲突
5. **按顺序安装**: 使用 `getInstallationOrder` 确保正确顺序



