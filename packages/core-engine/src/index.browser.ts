// @tradespro/core-engine/src/index.browser.ts
// Browser-safe entry point - excludes Node.js-only modules

// Export core types
export * from './types';

// Export table lookup functions (pure functions, no I/O)
export * from './tableLookups';

// Export plugin system (browser-safe parts only)
export * from './plugins/types';
export { pluginRegistry } from './plugins/registry';
export { 
  executePlugin, 
  createPluginContext,
  loadPlugin,
  validatePlugin,
  loadPluginFromManifest
  // Note: installPluginFromPath, executePluginInSandbox are Node.js-only
} from './plugins/loader';

// Note: The following are Node.js-only and NOT exported:
// - signatureVerifier (uses fs, crypto)
// - sandboxRunner (uses vm)
// - packagePlugin, generateKeyPair, etc. (uses fs, crypto)
// - loadPluginFromNpm (uses fs)
// - installPluginFromUrl, installPluginFromNpm (uses fs)

