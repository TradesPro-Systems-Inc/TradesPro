// @tradespro/calculation-engine/src/core/tables.ts
// Table Manager - Default to Node.js version (for backend)
// 
// ⚠️ IMPORTANT: This file exports the Node.js version by default.
// For browser environments, import from './tables.browser' explicitly.
//
// This approach avoids conditional exports which TypeScript doesn't support well.
// The build system (Vite/webpack) will handle tree-shaking and environment-specific builds.

// Default export: Node.js version (for backend services)
export { TableVersionManager, tableManager } from './tableLoader.node';

// Re-export types for convenience
export type { RuleTables, CodeEdition } from './types';