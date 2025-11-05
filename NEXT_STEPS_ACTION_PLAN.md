# TradesPro 下一步行动计划

**制定日期**: 2025-10-28  
**当前状态**: V4.1架构完成，Pinia stores已实现  
**下一阶段**: 组件迁移和功能完善

---

## 🎯 总体目标

1. **完成所有组件的Pinia迁移** - 统一状态管理
2. **测试和验证功能** - 确保质量
3. **完善后端集成** - 前后端统一
4. **扩展功能** - 多标准、多类型支持

---

## 📅 详细实施计划

### 阶段1: 组件Pinia迁移（第1周）

#### Day 1-2: 更新CalculatorPage.vue ⭐⭐⭐⭐⭐

**目标**: 使用Pinia stores管理计算状态

**需要做的改动**:

1. **导入stores**
```typescript
// 在 <script setup> 开头添加
import { useCalculationsStore, useSettingsStore, useProjectsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const calculationsStore = useCalculationsStore();
const settingsStore = useSettingsStore();
const projectsStore = useProjectsStore();

const { cecVersion } = storeToRefs(settingsStore);
const { currentProject } = storeToRefs(projectsStore);
```

2. **保存计算结果到历史**
```typescript
// 在 onCalculate 函数中，计算成功后添加
async function onCalculate() {
  const success = await calculateLocally(inputs);
  
  if (success && bundle.value) {
    // ✅ 保存到计算历史
    calculationsStore.addCalculation({
      ...bundle.value,
      projectId: currentProject.value?.id,
      inputs: {
        ...bundle.value.inputs,
        codeEdition: cecVersion.value
      }
    });
    
    $q.notify({
      type: 'positive',
      message: $t('calculator.calculationSaved'),
      position: 'top'
    });
  }
}
```

3. **显示最近的计算**
```typescript
// 添加到模板中
const { recentCalculations } = storeToRefs(calculationsStore);
```

```vue
<!-- 在页面右侧添加历史记录侧边栏 -->
<q-drawer side="right" v-model="showHistory" bordered>
  <q-list>
    <q-item-label header>{{ $t('calculator.recentCalculations') }}</q-item-label>
    <q-item 
      v-for="calc in recentCalculations" 
      :key="calc.id"
      clickable
      @click="loadCalculation(calc)"
    >
      <q-item-section>
        <q-item-label>{{ calc.inputs.project }}</q-item-label>
        <q-item-label caption>
          {{ new Date(calc.createdAt).toLocaleString() }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</q-drawer>
```

**预计时间**: 2天  
**文件**: `tradespro/frontend/src/pages/CalculatorPage.vue`

---

#### Day 3-4: 更新UserSettings.vue ⭐⭐⭐⭐

**目标**: 使用User Store和Settings Store管理用户和设置

**需要做的改动**:

1. **替换本地状态为stores**
```typescript
// 删除本地的 userProfile 等状态
// const userProfile = reactive({ ... }); // ❌ 删除

// 改为使用stores
import { useUserStore, useSettingsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
const settingsStore = useSettingsStore();

const { currentUser } = storeToRefs(userStore);
const { language, fontSize, theme, autoSave } = storeToRefs(settingsStore);
```

2. **更新保存函数**
```typescript
async function onSaveProfile() {
  const success = await userStore.updateProfile({
    fullName: currentUser.value.fullName,
    company: currentUser.value.company,
    licenseNumber: currentUser.value.licenseNumber,
    phone: currentUser.value.phone,
    bio: currentUser.value.bio
  });
  
  if (success) {
    $q.notify({
      type: 'positive',
      message: $t('userSettings.profileUpdated')
    });
  }
}

async function onSavePreferences() {
  settingsStore.updateSettings({
    language: language.value,
    fontSize: fontSize.value,
    theme: theme.value,
    autoSave: autoSave.value
  });
  
  $q.notify({
    type: 'positive',
    message: $t('userSettings.preferencesUpdated')
  });
}
```

**预计时间**: 2天  
**文件**: `tradespro/frontend/src/pages/UserSettings.vue`

---

#### Day 5: 更新ProjectManagement.vue ⭐⭐⭐⭐

**目标**: 完整迁移到Projects Store

**参考文件**: 之前我们讨论过的示例代码

**需要做的改动**:

1. **导入Projects Store**
```typescript
import { useProjectsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const projectsStore = useProjectsStore();
const { 
  filteredProjects, 
  loading, 
  searchQuery, 
  statusFilter, 
  sortBy 
} = storeToRefs(projectsStore);
```

2. **替换所有本地状态**
```typescript
// ❌ 删除这些本地状态
// const projects = ref([...]);
// const searchQuery = ref('');
// const sortBy = ref('');
// const statusFilter = ref('');

// ✅ 使用store的状态（已通过storeToRefs获取）
```

3. **使用store的actions**
```typescript
async function onCreateProject() {
  const result = await projectsStore.createProject({
    name: newProject.name,
    description: newProject.description,
    location: newProject.location,
    client_name: newProject.client_name
  });
  
  if (result) {
    $q.notify({
      type: 'positive',
      message: $t('projects.projectCreated')
    });
    showCreateDialog.value = false;
  }
}
```

**预计时间**: 1天  
**文件**: `tradespro/frontend/src/pages/ProjectManagement.vue`

---

#### Day 6-7: 测试和Bug修复 ⭐⭐⭐⭐⭐

**测试清单**:

- [ ] 计算功能正常
- [ ] 计算历史保存和加载
- [ ] 用户设置保存和持久化
- [ ] 项目创建、编辑、删除
- [ ] 语言切换正常
- [ ] 字体大小调整正常
- [ ] 主题切换正常
- [ ] 刷新页面后数据保持
- [ ] 离线模式正常工作

**测试步骤**:
```bash
cd D:\TradesProOld\tradespro\frontend
quasar dev

# 在浏览器中测试所有功能
# 检查Console是否有错误
# 检查localStorage数据
```

---

### 阶段2: 测试和验证（第2周）

#### Day 8-10: 全面功能测试 ⭐⭐⭐⭐

**测试内容**:

1. **计算准确性测试**
   - 测试各种输入组合
   - 验证计算结果正确性
   - 对比CEC标准

2. **数据持久化测试**
   - 创建数据后刷新页面
   - 检查localStorage
   - 验证Capacitor Preferences（如果有移动设备）

3. **多语言测试**
   - 切换到每种语言
   - 检查所有页面
   - 验证翻译正确性

4. **性能测试**
   - 大量计算历史记录
   - 大量项目数据
   - 页面加载速度

**测试文档**: 记录所有发现的问题

---

#### Day 11-12: 添加单元测试 ⭐⭐⭐

**为共享计算包添加测试**:

```bash
# 创建测试文件
cd packages/cec-calculator
mkdir -p tests
```

**测试文件1**: `tests/baseLoadCalculator.test.ts`
```typescript
import { calculateBaseLoad } from '../src/calculators/baseLoadCalculator';

describe('calculateBaseLoad', () => {
  it('should return 5000W for 90m² or less', () => {
    expect(calculateBaseLoad(80)).toBe(5000);
    expect(calculateBaseLoad(90)).toBe(5000);
  });
  
  it('should calculate correctly for area > 90m²', () => {
    expect(calculateBaseLoad(100)).toBe(5000 + (10 * 40)); // 5400W
    expect(calculateBaseLoad(150)).toBe(5000 + (60 * 40)); // 7400W
  });
});
```

**测试文件2**: `tests/8-200-single-dwelling.test.ts`
```typescript
import { computeSingleDwelling } from '../src/rules/8-200-single-dwelling';

describe('computeSingleDwelling', () => {
  it('should generate complete audit trail', () => {
    const inputs = {
      livingArea_m2: 150,
      systemVoltage: 120,
      phase: 1
    };
    
    const result = computeSingleDwelling(inputs, engineMeta, tables);
    
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.results.chosenCalculatedLoad_W).toBeDefined();
  });
});
```

**运行测试**:
```bash
cd packages/cec-calculator
npm test
```

---

#### Day 13-14: 文档更新和代码审查 ⭐⭐⭐

**更新文档**:
- [ ] 更新README.md
- [ ] 更新FEATURE_SUMMARY.md
- [ ] 添加组件迁移完成说明
- [ ] 更新测试覆盖率报告

**代码审查**:
- [ ] 检查所有组件是否使用stores
- [ ] 检查是否有重复代码
- [ ] 检查类型定义是否完整
- [ ] 检查注释是否清晰

---

### 阶段3: 后端集成（第3-4周）

#### Week 3: 后端使用共享计算包 ⭐⭐⭐⭐

**目标**: 让后端微服务也使用 `@tradespro/calculation-engine`

**步骤1**: 更新后端依赖
```json
// services/calculation-service/package.json
{
  "dependencies": {
    "@tradespro/calculation-engine": "file:../../packages/cec-calculator"
  }
}
```

**步骤2**: 更新计算服务
```typescript
// services/calculation-service/src/calculators/cecLoadCalculator.ts

// ❌ 删除旧的计算逻辑
// export function calculateSingleDwelling(...) { ... }

// ✅ 改为使用共享包
import { computeSingleDwelling } from '@tradespro/calculation-engine';

export function calculateSingleDwellingService(
  inputs: CecInputsSingle
): UnsignedBundle {
  const engineMeta: EngineMeta = {
    name: 'tradespro-backend-engine',
    version: process.env.VERSION || '1.0.0',
    commit: process.env.GIT_COMMIT || 'unknown'
  };
  
  const ruleTables = loadTables(); // 后端表格加载
  
  // ✅ 使用共享计算引擎（与前端完全一致）
  return computeSingleDwelling(inputs, engineMeta, ruleTables);
}
```

**步骤3**: 验证前后端一致性
```typescript
// 添加验证endpoint
app.post('/api/v1/calculate/validate', async (req, res) => {
  const inputs = req.body;
  
  const backendResult = calculateSingleDwellingService(inputs);
  
  res.json({
    backend: backendResult,
    message: 'Backend calculation for validation'
  });
});
```

---

#### Week 4: 实现计算验证和签名 ⭐⭐⭐

**功能1**: 开发环境双引擎验证
```typescript
// frontend/src/composables/useOfflineCalculation.ts

async function calculateLocally(inputs: CecInputsSingle) {
  // 1. 前端计算
  const frontendBundle = computeSingleDwelling(inputs, engineMeta, ruleTables);
  
  // 2. 开发环境验证
  if (process.env.NODE_ENV === 'development') {
    try {
      const response = await fetch('/api/v1/calculate/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      
      const { backend } = await response.json();
      
      // 3. 对比结果
      const differences = compareCalculations(frontendBundle, backend);
      
      if (differences.length > 0) {
        console.warn('⚠️ 前后端计算差异:', differences);
        // 显示开发工具栏警告
      } else {
        console.log('✅ 前后端计算一致');
      }
    } catch (err) {
      console.warn('验证失败（可能离线）:', err);
    }
  }
  
  return frontendBundle;
}
```

**功能2**: 计算结果签名（生产环境）
```typescript
// 后端添加签名
import crypto from 'crypto';

function signCalculationBundle(bundle: UnsignedBundle): SignedBundle {
  const canonicalJSON = JSON.stringify(bundle, Object.keys(bundle).sort());
  const hash = crypto.createHash('sha256').update(canonicalJSON).digest('hex');
  
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(hash)
    .sign(privateKey, 'base64');
  
  return {
    ...bundle,
    signature: {
      algorithm: 'RS256',
      value: signature,
      publicKey: publicKeyPEM,
      timestamp: new Date().toISOString()
    }
  };
}
```

---

### 阶段4: 功能扩展（第5-8周）

#### Week 5-6: 多版本CEC标准支持 ⭐⭐⭐

**目标**: 支持CEC 2021, 2024, 2027

**实现**:
```typescript
// 表格管理器支持多版本
const tables2021 = await tableManager.loadTables('cec', '2021');
const tables2024 = await tableManager.loadTables('cec', '2024');
const tables2027 = await tableManager.loadTables('cec', '2027');

// UI中添加版本选择
<q-select
  v-model="cecVersion"
  :options="['2021', '2024', '2027']"
  label="CEC版本"
/>
```

**数据准备**:
- 收集各版本的CEC表格数据
- 创建表格JSON文件
- 添加版本差异处理逻辑

---

#### Week 7-8: 其他建筑类型支持 ⭐⭐⭐

**CEC 8-202**: 多户住宅
```typescript
// packages/cec-calculator/src/rules/8-202-multi-dwelling.ts
export function computeMultiDwelling(
  inputs: CecInputsMulti,
  engineMeta: EngineMeta,
  ruleTables: RuleTables
): UnsignedBundle {
  // 多户住宅计算逻辑
}
```

**CEC 8-204**: 商业建筑
```typescript
// packages/cec-calculator/src/rules/8-204-commercial.ts
export function computeCommercialBuilding(
  inputs: CecInputsCommercial,
  engineMeta: EngineMeta,
  ruleTables: RuleTables
): UnsignedBundle {
  // 商业建筑计算逻辑
}
```

---

## 🎯 关键里程碑

| 里程碑 | 目标日期 | 状态 |
|--------|---------|------|
| ✅ V4.1架构完成 | 2025-10-28 | 完成 |
| ✅ Pinia stores实现 | 2025-10-28 | 完成 |
| 组件Pinia迁移 | Week 1 | 待开始 |
| 全面测试 | Week 2 | 待开始 |
| 后端集成 | Week 3-4 | 待开始 |
| 多版本支持 | Week 5-6 | 待开始 |
| 多类型支持 | Week 7-8 | 待开始 |

---

## 📊 工作量估算

| 任务 | 预计工时 | 难度 |
|------|---------|------|
| CalculatorPage迁移 | 16h | ⭐⭐⭐⭐ |
| UserSettings迁移 | 8h | ⭐⭐⭐ |
| ProjectManagement迁移 | 4h | ⭐⭐ |
| 测试和修复 | 16h | ⭐⭐⭐ |
| 单元测试 | 8h | ⭐⭐⭐ |
| 后端集成 | 16h | ⭐⭐⭐⭐ |
| 计算验证 | 8h | ⭐⭐⭐⭐ |
| 签名实现 | 8h | ⭐⭐⭐⭐⭐ |

**总计**: 约84小时（约2周全职工作）

---

## 🚀 快速开始

### 立即开始第一步

```bash
# 1. 进入前端目录
cd D:\TradesProOld\tradespro\frontend

# 2. 确保依赖已安装
npm install

# 3. 启动开发服务器
quasar dev

# 4. 打开 src/pages/CalculatorPage.vue
# 5. 开始添加Pinia stores导入
```

### 第一个改动

```typescript
// 在 CalculatorPage.vue 的 <script setup> 开头添加：
import { useCalculationsStore, useSettingsStore } from '@/stores';
import { storeToRefs } from 'pinia';

const calculationsStore = useCalculationsStore();
const settingsStore = useSettingsStore();
```

---

## 📝 注意事项

### ⚠️ 重要提示

1. **备份代码** - 在大改动前先提交git
2. **逐步迁移** - 一次只改一个组件
3. **充分测试** - 每个改动后都要测试
4. **保持沟通** - 遇到问题及时讨论
5. **文档同步** - 更新相关文档

### ✅ 最佳实践

1. **使用storeToRefs** - 保持响应性
```typescript
// ✅ 正确
const { currentUser } = storeToRefs(userStore);

// ❌ 错误
const { currentUser } = userStore;
```

2. **Actions不需要storeToRefs** - 直接调用
```typescript
// ✅ 正确
await userStore.login(email, password);
```

3. **错误处理** - 总是处理异步错误
```typescript
try {
  await store.someAction();
} catch (err) {
  $q.notify({ type: 'negative', message: err.message });
}
```

---

## 🎉 成功标准

### 完成标志

当以下所有项都达成时，认为迁移完成：

- [ ] 所有组件都使用Pinia stores
- [ ] 没有本地ref/reactive状态（除UI临时状态）
- [ ] 所有测试通过
- [ ] 刷新页面数据保持
- [ ] 离线功能正常
- [ ] 无Console错误
- [ ] 文档已更新
- [ ] 代码已审查

---

## 📞 需要帮助？

遇到问题时：
1. 查看 `PINIA_STORES_GUIDE.md` - 使用指南
2. 查看 `V4.1_COMPLIANCE_REPORT.md` - 架构标准
3. 查看现有的已迁移组件作为参考
4. 在git commit前确保代码可运行

---

**制定人**: AI架构师  
**审核状态**: ✅ 待用户确认  
**下次更新**: 完成第一周任务后

**让我们开始吧！🚀**


