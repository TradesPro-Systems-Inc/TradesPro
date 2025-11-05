// @tradespro/calculation-engine/src/index.ts
// Main entry point for the shared calculation engine

// Export all types
export * from './core/types';

// Export all calculators
export * from './calculators/baseLoadCalculator';
export * from './calculators/heatingCoolingCalculator';
export * from './calculators/applianceLoadCalculator';

// Export table lookup functions and manager
export * from './core/tableLookups';

// Export table manager - environment-specific
// Default to Node.js version (for backend), browser version available via explicit import
// Frontend should use: import { tableManager } from '@tradespro/calculation-engine/core/tables.browser'
export * from './core/tables';
// Explicitly export tableManager for easier imports
export { tableManager } from './core/tables';

// Also export browser version for frontend convenience
// Frontend can import: import { tableManagerBrowser } from '@tradespro/calculation-engine'
export { tableManager as tableManagerBrowser } from './core/tables.browser';

// Export main calculation coordinator
export * from './rules/8-200-single-dwelling';

// Export NEC calculation coordinator
export * from './rules/220-single-dwelling';

// Re-export main functions for convenience
export { computeSingleDwelling } from './rules/8-200-single-dwelling';
export { computeNECSingleDwelling } from './rules/220-single-dwelling';

// Export plugin system (V4.1 Plugin Architecture)
// Note: Only export browser-safe plugin types and core registry
export { pluginRegistry } from './plugins/registry';
export { cecSingleDwellingPlugin, necSingleDwellingPlugin } from './plugins';
export type {
  PluginManifest,
  PluginInputSchema,
  PluginContext,
  PluginCalculationResult,
  CalculationPlugin,
} from './plugins/types';

// Server-only exports (loader, signatureVerifier, sandboxRunner) should not be imported in browser code
// If you need these, import them directly from '@tradespro/calculation-engine/plugins/loader' etc.
