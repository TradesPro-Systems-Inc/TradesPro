# Plugin System Security Guide

## 🔒 安全特性

V4.1 Plugin System 提供了完整的安全机制，包括：

1. **签名验证** - 使用 RSA/ECDSA 公钥验证插件来源
2. **校验和验证** - 使用 SHA-256 验证插件完整性
3. **沙箱执行** - 在隔离环境中运行未信任的插件

---

## 📝 签名验证

### 生成密钥对

使用 OpenSSL 生成 RSA 密钥对：

```bash
# 生成 2048-bit 私钥
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048

# 导出公钥
openssl rsa -pubout -in private.pem -out public.pem
```

### 签名插件 Manifest

```typescript
import signatureVerifier from '@tradespro/calculation-engine/plugins/signatureVerifier';
import fs from 'fs';

// 读取 manifest
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

// 读取私钥
const privateKey = fs.readFileSync('private.pem', 'utf8');

// 签名 manifest
const signature = signatureVerifier.signManifest(manifest, privateKey);
const checksum = signatureVerifier.computeChecksum(manifest);

// 添加到 manifest
manifest.signature = signature;
manifest.checksum = checksum;

// 保存签名后的 manifest
fs.writeFileSync('manifest.signed.json', JSON.stringify(manifest, null, 2));
```

### 验证插件签名

```typescript
import { installPluginFromPath } from '@tradespro/calculation-engine';

// 安装插件并验证签名
const { plugin, verification } = await installPluginFromPath('/path/to/plugin', {
  verifySignature: true,
  verifyChecksum: true,
  publicKeyPath: '/path/to/public.pem',
  requireSignature: true, // 生产环境强制要求签名
});

if (!verification.signatureValid) {
  console.error('Signature verification failed!');
}
```

---

## 🏖️ 沙箱执行

### 配置沙箱

沙箱提供了两种模式：
- **vm2** (推荐) - 更强的安全性，更好的隔离
- **native vm** (回退) - 基础隔离，适用于受信任插件

```typescript
import { executePluginInSandbox, createPluginContext } from '@tradespro/calculation-engine';
import { tableManager } from '@tradespro/calculation-engine';

// 创建上下文
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

// 在沙箱中执行插件
const result = await executePluginInSandbox(
  'my-plugin-id',
  '/path/to/plugin/dist/index.js',
  inputs,
  context,
  {
    mode: 'vm2',              // 使用 vm2
    timeoutMs: 8000,          // 8秒超时
    memoryLimitMb: 128,       // 128MB 内存限制
    allowRequire: false,      // 禁止 require 外部模块
    allowedModules: [],       // 允许的模块列表（如果 allowRequire 为 true）
  }
);
```

### 安装 vm2（推荐）

```bash
npm install vm2@^3.9.19
```

如果不安装 vm2，系统会自动回退到原生 vm（安全性较低）。

---

## 🔧 完整安装示例

```typescript
import { installPluginFromPath } from '@tradespro/calculation-engine';

async function installThirdPartyPlugin(pluginDir: string) {
  try {
    const { plugin, verification } = await installPluginFromPath(pluginDir, {
      // 签名验证
      verifySignature: true,
      verifyChecksum: true,
      publicKeyPath: process.env.PLUGIN_PUBLIC_KEY_PATH || '/opt/tradespro/pubkeys/publisher.pem',
      requireSignature: process.env.NODE_ENV === 'production',
      
      // 沙箱配置
      useSandbox: true,
      sandboxOptions: {
        mode: 'vm2',
        timeoutMs: 5000,
        memoryLimitMb: 64,
        allowRequire: false,
      },
    });

    console.log(`✅ Plugin installed: ${plugin.manifest.name}`);
    console.log(`   Signature: ${verification.signatureValid ? '✓' : '✗'}`);
    console.log(`   Checksum: ${verification.checksumValid ? '✓' : '✗'}`);
    
    return plugin;
  } catch (error) {
    console.error('Plugin installation failed:', error);
    throw error;
  }
}
```

---

## ⚠️ 安全最佳实践

### 1. 生产环境配置

在生产环境中，**必须**启用以下安全措施：

```typescript
const options = {
  verifySignature: true,
  verifyChecksum: true,
  requireSignature: true,  // 强制要求签名
  useSandbox: true,        // 使用沙箱执行
  allowUnverified: false,  // 不允许未验证插件
};
```

### 2. 公钥管理

- 将公钥存储在安全的位置（如环境变量或密钥管理服务）
- 为不同的发布者使用不同的公钥
- 定期轮换密钥

### 3. 沙箱限制

- **内存限制**: 根据插件需求设置合理的 `memoryLimitMb`
- **超时设置**: 设置合理的 `timeoutMs` 防止无限循环
- **模块限制**: 如果必须允许 `require`，使用 `allowedModules` 白名单

### 4. 日志和监控

- 记录所有插件安装和执行的审计日志
- 监控插件性能（执行时间、内存使用）
- 设置告警机制检测异常行为

### 5. 依赖扫描

如果允许插件使用外部依赖，必须：
- 使用 Snyk 或 OSS-Fix 扫描依赖漏洞
- 维护允许的依赖白名单
- 定期更新依赖版本

---

## 🧪 测试示例

### 测试签名验证

```typescript
import signatureVerifier from '@tradespro/calculation-engine/plugins/signatureVerifier';
import fs from 'fs';

// 生成测试密钥对（仅在测试中使用）
// openssl genpkey -algorithm RSA -out test-private.pem -pkeyopt rsa_keygen_bits:2048
// openssl rsa -pubout -in test-private.pem -out test-public.pem

const manifest = {
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  // ... other fields
};

const privateKey = fs.readFileSync('test-private.pem', 'utf8');
const publicKey = fs.readFileSync('test-public.pem', 'utf8');

// 签名
const signature = signatureVerifier.signManifest(manifest, privateKey);
manifest.signature = signature;

// 验证
const isValid = signatureVerifier.verifySignature(manifest, signature, publicKey);
console.assert(isValid, 'Signature verification should succeed');
```

### 测试沙箱执行

```typescript
import { runPluginInSandbox } from '@tradespro/calculation-engine/plugins/sandboxRunner';
import { createPluginContext } from '@tradespro/calculation-engine';

const context = createPluginContext(
  { name: 'test', version: '1.0.0', commit: 'test' },
  {},
  { mode: 'official' }
);

const result = await runPluginInSandbox(
  '/path/to/test-plugin.js',
  { testInput: 123 },
  context,
  { mode: 'vm2', timeoutMs: 3000 }
);

if (result.ok) {
  console.log('Plugin executed successfully:', result.result);
} else {
  console.error('Plugin execution failed:', result.error);
}
```

---

## 📚 相关文档

- [PLUGIN_SYSTEM.md](./PLUGIN_SYSTEM.md) - 插件系统完整文档
- [V4.1_PLUGIN_SYSTEM_COMPLETE.md](./V4.1_PLUGIN_SYSTEM_COMPLETE.md) - 实现完成报告

---

## 🆘 故障排除

### vm2 未安装警告

如果看到 `vm2 not available, falling back to native vm` 警告：

```bash
npm install vm2@^3.9.19
```

### 签名验证失败

1. 检查公钥是否正确
2. 确认 manifest 在签名后未被修改
3. 验证签名算法是否匹配（RSA-SHA256）

### 沙箱执行超时

- 增加 `timeoutMs` 值
- 检查插件代码是否有无限循环
- 优化插件性能

---

**最后更新**: 2025-01-XX
**版本**: 1.0.0





