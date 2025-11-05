# 用户等级权限系统 (User Tier Permissions System)

## 📋 概述

本系统实现了基于用户等级（tier）的功能权限控制，确保不同等级的用户只能访问其权限范围内的功能。

## 🎯 用户等级定义

### Guest（非注册用户）
- ✅ 可以执行计算
- ✅ 可以查看基本计算结果
- ❌ 不能查看计算步骤
- ❌ 不能下载JSON文件
- ❌ 不能下载PDF文件
- ❌ 不能管理项目

### Tier 1（基础注册用户）
- ✅ 可以执行计算
- ✅ 可以查看基本计算结果
- ✅ 可以查看详细计算步骤
- ✅ 可以保存计算结果
- ❌ 不能下载JSON文件
- ❌ 不能下载PDF文件
- ❌ 不能管理项目

### Tier 2（专业用户）
- ✅ 所有 Tier 1 功能
- ✅ 可以下载JSON文件
- ✅ 可以下载PDF文件
- ✅ 可以查看项目列表
- ✅ 可以分享计算结果
- ✅ 可以导出报告
- ❌ 不能创建/编辑/删除项目

### Tier 3（企业用户）
- ✅ 所有 Tier 2 功能
- ✅ 可以创建项目
- ✅ 可以编辑项目
- ✅ 可以删除项目
- ✅ 完整的项目管理功能

## 📁 文件结构

```
frontend/src/
├── composables/
│   └── usePermissions.ts          # 权限检查 composable
├── pinia-stores/
│   ├── types.ts                   # 用户类型定义（包含 UserTier）
│   └── user.ts                    # 用户 store（包含 tier 获取）
├── utils/
│   └── permissionFilter.ts        # 权限过滤工具函数
└── components/
    └── calculator/
        └── CalculationResults.vue # 使用权限控制的组件示例
```

## 🔧 使用方法

### 1. 在组件中使用权限检查

```vue
<template>
  <div>
    <!-- 根据权限显示/隐藏功能 -->
    <q-btn
      v-if="canViewSteps"
      @click="showSteps"
      label="查看步骤"
    />
    
    <q-btn
      v-if="canDownloadPDF"
      @click="downloadPDF"
      label="下载PDF"
    />
    
    <!-- 显示升级提示 -->
    <q-btn
      v-else-if="isTier1"
      disabled
      label="下载PDF (需要升级)"
    >
      <q-tooltip>
        升级到 Tier 2 或更高版本以解锁此功能
      </q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@/composables/usePermissions';

const { can, isTier, isAtLeastTier } = usePermissions();

// 检查特定权限
const canViewSteps = computed(() => can('canViewSteps'));
const canDownloadPDF = computed(() => can('canDownloadPDF'));

// 检查用户等级
const isTier1 = computed(() => isTier('tier1'));
const isAtLeastTier2 = computed(() => isAtLeastTier('tier2'));
</script>
```

### 2. 在 Composable 中过滤数据

```typescript
import { usePermissions } from './usePermissions';
import { filterBundleByTier } from '../utils/permissionFilter';

export function useCalculation() {
  const { userTier } = usePermissions();
  const bundle = ref<UnsignedBundle | null>(null);
  
  // 根据用户等级过滤计算结果
  const filteredBundle = computed(() => {
    return filterBundleByTier(bundle.value, userTier.value);
  });
  
  return {
    bundle: filteredBundle,
    // ...
  };
}
```

### 3. 权限检查 API

```typescript
import { usePermissions } from '@/composables/usePermissions';

const {
  userTier,        // 当前用户等级 (computed)
  permissions,     // 所有权限 (computed)
  isAuthenticated, // 是否已登录 (computed)
  can,             // 检查单个权限 (function)
  isTier,          // 检查是否为特定等级 (function)
  isAtLeastTier,   // 检查是否至少为特定等级 (function)
} = usePermissions();

// 使用示例
if (can('canDownloadPDF')) {
  // 允许下载PDF
}

if (isTier('tier3')) {
  // 只有 Tier 3 用户可以执行
}

if (isAtLeastTier('tier2')) {
  // Tier 2 及以上用户可以执行
}
```

## 🔐 权限列表

### 计算相关权限

| 权限 | Guest | Tier 1 | Tier 2 | Tier 3 |
|------|-------|--------|--------|--------|
| `canCalculate` | ✅ | ✅ | ✅ | ✅ |
| `canViewSteps` | ❌ | ✅ | ✅ | ✅ |
| `canDownloadJSON` | ❌ | ❌ | ✅ | ✅ |
| `canDownloadPDF` | ❌ | ❌ | ✅ | ✅ |

### 项目相关权限

| 权限 | Guest | Tier 1 | Tier 2 | Tier 3 |
|------|-------|--------|--------|--------|
| `canViewProjects` | ❌ | ❌ | ✅ | ✅ |
| `canCreateProject` | ❌ | ❌ | ❌ | ✅ |
| `canEditProject` | ❌ | ❌ | ❌ | ✅ |
| `canDeleteProject` | ❌ | ❌ | ❌ | ✅ |
| `canManageProjects` | ❌ | ❌ | ❌ | ✅ |

### 其他功能权限

| 权限 | Guest | Tier 1 | Tier 2 | Tier 3 |
|------|-------|--------|--------|--------|
| `canSaveCalculations` | ❌ | ✅ | ✅ | ✅ |
| `canShareCalculations` | ❌ | ❌ | ✅ | ✅ |
| `canExportReports` | ❌ | ❌ | ✅ | ✅ |

## 🔄 后端集成

### 后端需要返回用户等级

确保后端 API `/v1/auth/me` 返回用户的 `tier` 字段：

```json
{
  "id": "123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "tier": "tier2",
  // ... 其他字段
}
```

### 后端权限验证

后端也应该在 API 端点中验证权限：

```python
# Python/FastAPI 示例
from fastapi import Depends, HTTPException

def require_tier(min_tier: str):
    def check_tier(current_user: User = Depends(get_current_user)):
        tier_order = {"guest": 0, "tier1": 1, "tier2": 2, "tier3": 3}
        user_tier = current_user.tier or "guest"
        
        if tier_order[user_tier] < tier_order[min_tier]:
            raise HTTPException(
                status_code=403,
                detail=f"This feature requires {min_tier} or higher"
            )
        return current_user
    return check_tier

# 使用示例
@app.get("/api/v1/calculations/{id}/pdf")
async def download_pdf(
    id: str,
    user: User = Depends(require_tier("tier2"))
):
    # 生成PDF
    pass
```

## 📝 迁移指南

### 现有组件迁移

1. **导入权限 composable**
   ```typescript
   import { usePermissions } from '@/composables/usePermissions';
   ```

2. **添加权限检查**
   ```vue
   <q-btn
     v-if="can('canDownloadPDF')"
     @click="downloadPDF"
   />
   ```

3. **更新数据过滤**
   ```typescript
   import { filterBundleByTier } from '@/utils/permissionFilter';
   const filteredBundle = computed(() => 
     filterBundleByTier(bundle.value, userTier.value)
   );
   ```

## ✅ 测试清单

- [ ] Guest 用户只能看到基本结果
- [ ] Guest 用户不能查看计算步骤
- [ ] Tier 1 用户可以查看计算步骤
- [ ] Tier 1 用户不能下载文件
- [ ] Tier 2 用户可以下载 JSON 和 PDF
- [ ] Tier 2 用户不能创建项目
- [ ] Tier 3 用户可以管理项目
- [ ] 所有权限检查函数正常工作
- [ ] 权限变更时 UI 正确更新

## 🚀 未来扩展

- [ ] 添加权限变更历史记录
- [ ] 实现权限缓存机制
- [ ] 添加权限变更通知
- [ ] 支持自定义权限配置
- [ ] 添加权限审计日志

## 📚 相关文档

- [用户 Store 文档](./PINIA_STORES_GUIDE.md)
- [插件系统权限](./../packages/calculation-engine/PLUGIN_SYSTEM.md)

---

**最后更新**: 2025-01-XX  
**版本**: 1.0.0





