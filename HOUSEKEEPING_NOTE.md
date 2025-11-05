# 维护说明

## calculation-service 构建问题

**问题**: TypeScript 编译器在 `calculation-service` 中无法找到

**原因**: 
- 在 monorepo 结构中，TypeScript 可能通过依赖链接共享
- PowerShell 的路径解析问题
- npm scripts 的执行环境问题

**临时解决方案**:
- 使用 `dev` 脚本进行开发（`npm run dev`），它使用 `ts-node-dev` 直接运行 TypeScript
- 对于生产构建，需要确保 TypeScript 正确安装在本地 `node_modules` 中

**推荐方案**:
1. 在 monorepo 根目录安装 TypeScript（如果还没有）
2. 确保每个需要构建的包都有 TypeScript 作为 devDependency
3. 使用 `npm run build` 时，npm 会自动将 `node_modules/.bin` 添加到 PATH

**当前状态**:
- ✅ `core-engine` 和 `plugin-cec-8-200` 构建正常
- ⚠️ `calculation-service` 构建需要进一步调试

**建议**:
- 使用 `npm run dev` 进行开发测试
- 生产构建时确保所有依赖正确安装


