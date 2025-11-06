# 司法管辖区配置系统设计 (Jurisdiction Configuration System)

## 设计目标

1. **可扩展性**：不仅支持 breaker size，还支持未来其他标准配置的自定义
2. **两层结构**：
   - 第1层：默认完整列表（标准列表）
   - 第2层：用户自定义配置文件（基于司法管辖区/电力公司）
3. **灵活性**：允许用户创建多个配置文件，并设置默认配置

## 数据结构设计

### 配置文件结构

```typescript
interface JurisdictionProfile {
  id: string;                    // 唯一ID，如 "epcor-edmonton"
  name: string;                   // 显示名称，如 "EPCOR - Edmonton"
  jurisdiction?: string;          // 司法管辖区，如 "Edmonton, AB"
  utility?: string;               // 电力公司，如 "EPCOR"
  
  // 计算规则覆盖配置
  calculationRules: {
    // Panel Breaker Sizes
    panelBreakerSizes?: {
      enabled: number[];          // 启用的尺寸列表，如 [60, 100, 125, 200]
      disabled?: number[];        // 禁用的尺寸列表（可选，用于验证）
    };
    
    // 未来扩展：其他标准配置
    // conductorSizes?: { ... };
    // voltageOptions?: { ... };
    // phaseOptions?: { ... };
  };
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;            // 是否为默认配置
}
```

### 用户设置扩展

```typescript
interface UserSettings {
  // 现有设置...
  language: Language;
  theme: Theme;
  // ...
  
  // 新增：司法管辖区配置
  jurisdictionProfiles: JurisdictionProfile[];
  defaultJurisdictionProfileId?: string;  // 当前使用的默认配置ID
}
```

## 实现方案

### 1. 前端实现

#### Settings Store 扩展
- 添加 `jurisdictionProfiles` 状态
- 添加 `defaultJurisdictionProfileId` 状态
- 添加方法：`createProfile`, `updateProfile`, `deleteProfile`, `setDefaultProfile`
- 添加 getter：`activeProfile`, `getPanelBreakerSizes()`

#### 计算逻辑集成
- 在计算函数中检查是否有激活的配置文件
- 如果有，使用配置文件中的 breaker sizes
- 如果没有，使用默认标准列表

### 2. 后端实现

#### UserSettings 模型扩展
```python
# 添加 JSONB 字段存储配置文件
jurisdiction_config = Column(JSONB, nullable=True)
# 格式：
# {
#   "profiles": [...],
#   "defaultProfileId": "epcor-edmonton"
# }
```

### 3. 计算逻辑修改

修改 `8-200-single-dwelling.ts` 和 `coordinator.ts`：
- 接受可选的 `jurisdictionConfig` 参数
- 如果提供，使用配置文件中的 breaker sizes
- 否则使用默认标准列表

## 使用示例

### 创建配置文件
```typescript
const profile: JurisdictionProfile = {
  id: 'epcor-edmonton',
  name: 'EPCOR - Edmonton',
  jurisdiction: 'Edmonton, AB',
  utility: 'EPCOR',
  calculationRules: {
    panelBreakerSizes: {
      enabled: [60, 100, 125, 200]  // 禁用 150A
    }
  }
};
```

### 在计算中使用
```typescript
// 获取激活的配置文件
const activeProfile = settingsStore.activeProfile;
const breakerSizes = activeProfile 
  ? activeProfile.calculationRules.panelBreakerSizes?.enabled 
  : standardMainPanelSizes;

// 在计算中使用
const breakerSize = breakerSizes.find(s => s >= requiredBreaker) || breakerSizes[breakerSizes.length - 1];
```

## 扩展性考虑

未来可以轻松添加其他配置：
- `conductorSizes`: 允许的导体尺寸
- `voltageOptions`: 允许的电压选项
- `phaseOptions`: 允许的相位选项
- `demandFactors`: 自定义需求系数
- 等等...

## UI 设计建议

1. **设置页面新增"司法管辖区配置"部分**
   - 显示当前激活的配置
   - 列表显示所有配置文件
   - 添加/编辑/删除配置按钮
   - 设置默认配置按钮

2. **配置编辑器**
   - 选择司法管辖区/电力公司
   - 配置 breaker sizes（复选框列表）
   - 保存配置

3. **计算页面**
   - 显示当前使用的配置（可选）
   - 允许临时切换配置（可选）


