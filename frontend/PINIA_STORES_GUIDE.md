# TradesPro Pinia Stores 使用指南

## 📚 目录

- [概述](#概述)
- [Store架构](#store架构)
- [使用方法](#使用方法)
- [各Store详解](#各store详解)
- [数据持久化](#数据持久化)
- [最佳实践](#最佳实践)

## 概述

TradesPro项目现在使用Pinia作为统一的状态管理解决方案。所有stores都支持自动数据持久化到localStorage和Capacitor Preferences（原生应用）。

## Store架构

```
tradespro/frontend/src/stores/
├── index.ts              # Store入口，导出所有stores
├── types.ts              # TypeScript类型定义
├── user.ts              # 用户管理Store
├── projects.ts           # 项目管理Store
├── calculations.ts       # 计算历史Store
├── settings.ts           # 应用设置Store
└── ui.ts                 # UI状态Store
```

## 使用方法

### 基础导入

```typescript
// 导入单个store
import { useUserStore } from '@/stores';

// 导入多个stores
import { useUserStore, useProjectsStore, useSettingsStore } from '@/stores';

// 导入storeToRefs工具
import { storeToRefs } from 'pinia';
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores';
import { storeToRefs } from 'pinia';

// 1. 获取store实例
const userStore = useUserStore();

// 2. 使用storeToRefs获取响应式状态（保持响应性）
const { currentUser, isAuthenticated } = storeToRefs(userStore);

// 3. 直接调用actions（不需要storeToRefs）
const login = userStore.login;
const logout = userStore.logout;

// 4. 在模板中使用
</script>

<template>
  <div>
    <div v-if="isAuthenticated">
      欢迎，{{ currentUser?.fullName }}
    </div>
    <button @click="login('email@example.com', 'password')">登录</button>
    <button @click="logout()">登出</button>
  </div>
</template>
```

## 各Store详解

### 1. User Store (用户管理)

**状态：**
- `currentUser`: 当前用户信息
- `isAuthenticated`: 是否已登录
- `token`: JWT令牌
- `loading`: 加载状态
- `error`: 错误信息

**Actions：**
```typescript
// 登录
await userStore.login(email, password);

// 注册
await userStore.register(email, password, fullName);

// 登出
userStore.logout();

// 更新个人资料
await userStore.updateProfile({
  fullName: '新名字',
  company: '新公司'
});

// 修改密码
await userStore.changePassword(oldPassword, newPassword);
```

**使用示例：**
```vue
<script setup lang="ts">
import { useUserStore } from '@/stores';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const { currentUser, isAuthenticated, userFullName, userInitials } = storeToRefs(userStore);

async function handleLogin() {
  const success = await userStore.login('user@example.com', 'password');
  if (success) {
    console.log('登录成功');
  }
}
</script>

<template>
  <div>
    <q-avatar v-if="isAuthenticated" color="primary" text-color="white">
      {{ userInitials }}
    </q-avatar>
    <span>{{ userFullName }}</span>
  </div>
</template>
```

### 2. Projects Store (项目管理)

**状态：**
- `projects`: 项目列表
- `currentProject`: 当前选中的项目
- `filteredProjects`: 过滤后的项目（computed）
- `searchQuery`: 搜索关键词
- `statusFilter`: 状态筛选
- `sortBy`: 排序字段

**Actions：**
```typescript
// 获取所有项目
await projectsStore.fetchProjects();

// 获取单个项目
await projectsStore.fetchProject(projectId);

// 创建项目
const newProject = await projectsStore.createProject({
  name: '新项目',
  description: '项目描述',
  location: '多伦多',
  client_name: '客户名称'
});

// 更新项目
await projectsStore.updateProject(projectId, {
  name: '更新后的名称',
  status: 'completed'
});

// 删除项目
await projectsStore.deleteProject(projectId);

// 设置搜索和筛选
projectsStore.setSearchQuery('关键词');
projectsStore.setStatusFilter('inProgress');
projectsStore.setSortBy('created_at');
```

**使用示例：**
```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { useProjectsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const projectsStore = useProjectsStore();
const { 
  filteredProjects, 
  projectsCount, 
  projectsByStatus,
  loading 
} = storeToRefs(projectsStore);

onMounted(() => {
  projectsStore.fetchProjects();
});

async function createNewProject() {
  const project = await projectsStore.createProject({
    name: '我的新项目',
    description: '项目描述'
  });
  console.log('创建成功:', project);
}
</script>

<template>
  <div>
    <q-input v-model="projectsStore.searchQuery" label="搜索项目" />
    
    <div v-if="loading">加载中...</div>
    
    <q-card v-for="project in filteredProjects" :key="project.id">
      <q-card-section>
        <h6>{{ project.name }}</h6>
        <p>{{ project.description }}</p>
      </q-card-section>
    </q-card>
    
    <p>总计: {{ projectsCount }} 个项目</p>
  </div>
</template>
```

### 3. Calculations Store (计算历史)

**状态：**
- `calculations`: 计算历史列表
- `currentCalculation`: 当前计算
- `recentCalculations`: 最近10条计算（computed）

**Actions：**
```typescript
// 添加新计算
calculationsStore.addCalculation(bundle);

// 获取计算
const calc = calculationsStore.getCalculationById(id);

// 获取项目的所有计算
const projectCalcs = calculationsStore.getCalculationsByProjectId(projectId);

// 删除计算
calculationsStore.deleteCalculation(id);

// 清空历史
calculationsStore.clearHistory();

// 导出为JSON
calculationsStore.exportCalculationAsJSON(calculation);
calculationsStore.exportAllCalculationsAsJSON();

// 导入JSON
calculationsStore.importCalculationsFromJSON(jsonString);
```

**使用示例：**
```vue
<script setup lang="ts">
import { useCalculationsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const calculationsStore = useCalculationsStore();
const { recentCalculations, calculationsCount } = storeToRefs(calculationsStore);

function handleCalculationComplete(bundle: any) {
  // 保存计算结果到历史
  calculationsStore.addCalculation(bundle);
}

function exportHistory() {
  calculationsStore.exportAllCalculationsAsJSON();
}
</script>

<template>
  <div>
    <h6>最近的计算 ({{ calculationsCount }})</h6>
    <q-list>
      <q-item v-for="calc in recentCalculations" :key="calc.id">
        <q-item-section>
          <q-item-label>{{ calc.inputs.project }}</q-item-label>
          <q-item-label caption>
            {{ new Date(calc.createdAt).toLocaleString() }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    
    <q-btn @click="exportHistory" label="导出历史" />
  </div>
</template>
```

### 4. Settings Store (应用设置)

**状态：**
- `language`: 当前语言 ('en-CA' | 'fr-CA' | 'zh-CN')
- `fontSize`: 字体大小 ('small' | 'medium' | 'large')
- `theme`: 主题 ('light' | 'dark' | 'auto')
- `autoSave`: 是否自动保存
- `showCalculationSteps`: 是否显示计算步骤
- `cecVersion`: CEC版本

**Actions：**
```typescript
// 设置语言
settingsStore.setLanguage('zh-CN');

// 设置字体大小
settingsStore.setFontSize('large');

// 设置主题
settingsStore.setTheme('dark');
settingsStore.toggleTheme(); // 切换主题

// 应用主题
settingsStore.applyTheme();

// 批量更新设置
settingsStore.updateSettings({
  language: 'en-CA',
  fontSize: 'medium',
  theme: 'auto'
});

// 重置为默认值
settingsStore.resetToDefaults();
```

**使用示例：**
```vue
<script setup lang="ts">
import { useSettingsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const settingsStore = useSettingsStore();
const { 
  language, 
  fontSize, 
  theme, 
  isDarkTheme 
} = storeToRefs(settingsStore);
</script>

<template>
  <div>
    <q-select 
      :model-value="language" 
      @update:model-value="settingsStore.setLanguage"
      :options="['en-CA', 'fr-CA', 'zh-CN']"
      label="语言"
    />
    
    <q-select 
      :model-value="fontSize" 
      @update:model-value="settingsStore.setFontSize"
      :options="['small', 'medium', 'large']"
      label="字体大小"
    />
    
    <q-toggle 
      :model-value="isDarkTheme" 
      @update:model-value="settingsStore.toggleTheme"
      label="深色模式"
    />
  </div>
</template>
```

### 5. UI Store (UI状态)

**状态：**
- `sidebarOpen`: 侧边栏是否打开
- `showCalculationSteps`: 是否显示计算步骤对话框
- `loading`: 全局加载状态
- `error`: 全局错误信息
- `notifications`: 通知列表

**Actions：**
```typescript
// 侧边栏控制
uiStore.toggleSidebar();
uiStore.openSidebar();
uiStore.closeSidebar();

// 计算步骤对话框
uiStore.openCalculationSteps(calculationId);
uiStore.closeCalculationSteps();

// 加载状态
uiStore.setLoading(true);

// 错误和成功消息
uiStore.setError('出错了');
uiStore.setSuccess('操作成功');
uiStore.clearMessages();

// 通知
uiStore.notifySuccess('保存成功');
uiStore.notifyError('保存失败');
uiStore.notifyWarning('注意事项');
uiStore.notifyInfo('提示信息');

// 对话框控制
uiStore.showUserSettings();
uiStore.hideUserSettings();
```

**使用示例：**
```vue
<script setup lang="ts">
import { useUIStore } from '@/stores';
import { storeToRefs } from 'pinia';

const uiStore = useUIStore();
const { 
  sidebarOpen, 
  loading, 
  error, 
  notifications 
} = storeToRefs(uiStore);

async function saveData() {
  uiStore.setLoading(true);
  try {
    // 保存操作
    await api.save();
    uiStore.notifySuccess('保存成功');
  } catch (err) {
    uiStore.notifyError('保存失败');
  } finally {
    uiStore.setLoading(false);
  }
}
</script>

<template>
  <div>
    <q-drawer v-model="sidebarOpen">
      侧边栏内容
    </q-drawer>
    
    <q-inner-loading :showing="loading" />
    
    <q-banner v-if="error" class="bg-negative text-white">
      {{ error }}
    </q-banner>
    
    <q-btn @click="saveData" :loading="loading">
      保存
    </q-btn>
  </div>
</template>
```

## 数据持久化

所有stores都配置了自动持久化：

### User Store
持久化字段：
- `currentUser`
- `token`
- `isAuthenticated`

### Projects Store
持久化字段：
- `projects`
- `currentProject`

### Calculations Store
持久化所有字段（最多50条历史记录）

### Settings Store
持久化所有设置字段

### UI Store
持久化字段：
- `sidebarOpen`

### 手动控制持久化

```typescript
// 数据会自动保存到 localStorage 和 Capacitor Preferences
// 格式：tradespro-{storeName}

// 例如：
// tradespro-user
// tradespro-projects
// tradespro-calculations
// tradespro-settings
// tradespro-ui
```

## 最佳实践

### 1. 使用storeToRefs保持响应性

```typescript
// ❌ 错误 - 会失去响应性
const { currentUser } = useUserStore();

// ✅ 正确 - 保持响应性
const { currentUser } = storeToRefs(useUserStore());
```

### 2. Actions不需要storeToRefs

```typescript
const userStore = useUserStore();

// ✅ 直接调用actions
await userStore.login(email, password);

// 或解构（actions不会失去响应性）
const { login, logout } = userStore;
await login(email, password);
```

### 3. 在setup中初始化

```typescript
<script setup lang="ts">
import { onMounted } from 'vue';
import { useProjectsStore } from '@/stores';

const projectsStore = useProjectsStore();

onMounted(() => {
  // 在组件挂载时加载数据
  projectsStore.fetchProjects();
});
</script>
```

### 4. 组合多个stores

```typescript
<script setup lang="ts">
import { 
  useUserStore, 
  useProjectsStore, 
  useSettingsStore 
} from '@/stores';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const projectsStore = useProjectsStore();
const settingsStore = useSettingsStore();

const { isAuthenticated } = storeToRefs(userStore);
const { filteredProjects } = storeToRefs(projectsStore);
const { language } = storeToRefs(settingsStore);

// 使用多个stores的数据
</script>
```

### 5. 错误处理

```typescript
async function saveProject() {
  const result = await projectsStore.createProject(data);
  
  if (result) {
    // 成功
    uiStore.notifySuccess('项目创建成功');
  } else {
    // 失败 - store的error字段会包含错误信息
    uiStore.notifyError(projectsStore.error || '创建失败');
  }
}
```

### 6. TypeScript类型支持

```typescript
import type { 
  User, 
  Project, 
  CalculationBundle,
  Language,
  FontSize,
  Theme
} from '@/stores/types';

const user: User = {
  id: '1',
  email: 'user@example.com',
  fullName: '用户名',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

## 迁移指南

### 从本地状态迁移到Store

**之前：**
```vue
<script setup lang="ts">
import { ref } from 'vue';

const projects = ref([]);
const loading = ref(false);

async function fetchProjects() {
  loading.value = true;
  // API call...
  loading.value = false;
}
</script>
```

**之后：**
```vue
<script setup lang="ts">
import { useProjectsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const projectsStore = useProjectsStore();
const { projects, loading } = storeToRefs(projectsStore);

// 直接调用store的action
const fetchProjects = projectsStore.fetchProjects;
</script>
```

## 调试

### Vue Devtools

Pinia完全支持Vue Devtools：

1. 打开Vue Devtools
2. 选择"Pinia"标签页
3. 查看所有stores的状态
4. 追踪状态变化
5. 时间旅行调试

### 控制台调试

```typescript
// 在浏览器控制台中
window.__pinia = pinia; // 如果已配置

// 访问stores
const userStore = useUserStore();
console.log(userStore.currentUser);
console.log(userStore.$state); // 查看整个状态
```

## 性能优化

### 1. 按需导入

```typescript
// ✅ 只导入需要的stores
import { useUserStore } from '@/stores';

// ❌ 避免导入整个index
import * as stores from '@/stores';
```

### 2. 使用computed而不是重复计算

```typescript
// Store中已有computed
const { filteredProjects } = storeToRefs(projectsStore);

// 不需要在组件中再次过滤
```

### 3. 避免不必要的响应性

```typescript
// 如果只需要读取一次，不需要storeToRefs
const initialLanguage = settingsStore.language;

// 如果需要响应式，使用storeToRefs
const { language } = storeToRefs(settingsStore);
```

## 总结

Pinia stores提供了：
- ✅ 统一的状态管理
- ✅ 自动数据持久化
- ✅ 完整的TypeScript支持
- ✅ 优秀的开发体验
- ✅ Vue Devtools集成
- ✅ 模块化和可扩展性

现在所有组件都应该使用Pinia stores来管理状态，而不是本地的ref/reactive！


