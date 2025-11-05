# TradesPro 架构一致性审核报告

**审核日期:** 2025年10月27日
**审核基准:** `ARCHITECTURE_GUIDE.md` (架构白皮书)

---

### 1. 总体评价

项目在核心架构上**高度遵循**了白皮书的设计哲学，特别是成功实现了**“单一事实来源”**的共享计算核心。前端（离线优先）和后端计算微服务都正确地依赖此共享包，避免了代码重复和逻辑不一致的风险。这是一个巨大的成功。

当前的主要问题集中在一些**命名和配置的细节**上，以及**后端API功能大部分尚未实现**。项目的基础非常坚实，只需进行一些清理和完善，即可完全达到架构目标。

---

### 2. ✅ 架构符合项 (Positive Confirmations)

- **共享计算核心**: 项目的核心 `packages/cec-calculator` 包含了所有关键业务逻辑，特别是 `CEC 8-200` 的 `max(A, B)` 规则，并生成了详细的审计步骤。
- **单一事实来源**: `frontend` (`useOfflineCalculation.ts`) 和 `services/calculation-service` (`server.ts`) 都已重构，不再包含计算逻辑，而是统一调用共享的 `computeSingleDwelling` 函数。
- **技术栈一致**:
    - `docker-compose.yml` 正确定义了 `postgres`, `redis`, `calc-service` (Node.js), 和 `api` (Python) 服务，服务间网络配置清晰。
    - `backend/requirements.txt` 确认了 `FastAPI`, `SQLAlchemy` 等后端技术选型。
    - `frontend` 目录结构和 `package.json` 确认了 `Quasar/Vue3` 的使用。
- **离线优先**: 前端 `useOfflineCalculation.ts` 的实现确保了在本地执行完整计算的能力，完全符合“离线优先”原则。
- **项目结构**: 整体的 Monorepo 结构 (`pnpm-workspace.yaml`) 和各服务的目录划分（`backend`, `frontend`, `services`, `packages`）清晰合理。

---

### 3. ⚠️ 架构偏差项 (Deviations & Inconsistencies)

1.  **共享包命名不一致**:
    - **问题**: 架构指南中规定共享包名为 `@tradespro/cec-calculator`，但实际 `package.json` 中名称为 `@tradespro/calculation-engine`。
    - **影响**: 造成文档与实际代码不符，给新开发者带来困惑。

2.  **工作区依赖协议不规范**:
    - **问题**: `frontend/package.json` 和 `services/calculation-service/package.json` 中使用了 `file:../...` 的方式来依赖共享包。
    - **影响**: 在 `pnpm` 工作区中，标准实践是使用 `workspace:*` 协议。`file:` 协议可能绕过 pnpm 的一些优化和版本管理机制。

3.  **存在残留的计算逻辑**:
    - **问题**: `services/calculation-service/src/server.ts` 中存在一个旧的 `/api/calculate/test` 接口，其内部有独立的、简化的计算逻辑。
    - **影响**: 轻微违反了“单一事实来源”原则，可能在测试中引入不一致性。

---

### 4. 💡 改进建议 (Recommendations)

根据以上发现，建议按以下优先级进行调整：

1.  **[高优先级] 统一共享包名称**:
    - **操作**: 将 `packages/cec-calculator/package.json` 中的 `"name"` 修改为 `"@tradespro/cec-calculator"`。
    - **同步修改**: 相应地，更新 `frontend/package.json` 和 `services/calculation-service/package.json` 中的依赖名称。

2.  **[中优先级] 规范工作区依赖**:
    - **操作**: 在 `frontend/package.json` 和 `services/calculation-service/package.json` 中，将对共享包的依赖从 `file:..` 修改为 `workspace:*`。
    - **示例**: `"@tradespro/cec-calculator": "workspace:*"`。
    - **之后**: 运行 `pnpm install` 来更新 lockfile。

3.  **[低优先级] 移除遗留测试接口**:
    - **操作**: 从 `services/calculation-service/src/server.ts` 中移除 `/api/calculate/test` 接口及其相关逻辑。
    - **理由**: 所有计算测试都应通过调用核心引擎来完成，以保证一致性。

---

### 5. ❓ 缺失的实现 (Missing Implementations)

- **后端 API 功能**: `backend/app/main.py` 中的大部分功能（用户认证、项目管理、数据库交互、PDF生成等）目前都处于 `TODO` 状态。虽然这不属于架构偏差，但是项目后续开发需要完成的核心任务。下一步应重点根据 `FEATURE_SUMMARY.md` 和此处的存根来开发这些后端 API。