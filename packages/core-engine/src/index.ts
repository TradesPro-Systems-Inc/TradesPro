// @tradespro/core-engine/src/index.ts
// TradesPro Core Engine - Main Entry Point
// V5 Architecture: This package provides plugin system and shared interfaces

// Export core types
export * from './types';

// Export table lookup functions (pure functions, no I/O)
export * from './tableLookups';

// Export plugin system
export * from './plugins/types';
export { pluginRegistry } from './plugins/registry';
export { 
  executePlugin, 
  createPluginContext,
  loadPlugin,
  validatePlugin,
  loadPluginFromManifest,
  installPluginFromPath,
  executePluginInSandbox
} from './plugins/loader';

// Note: signatureVerifier and sandboxRunner are Node.js-specific
// They are available but should only be used in server-side code
export { default as signatureVerifier } from './plugins/signatureVerifier';
export { default as sandboxRunner } from './plugins/sandboxRunner';

// Export plugin packager tools (Node.js only)
export { 
  packagePlugin, 
  generateKeyPair, 
  readPluginManifest 
} from './tools/pluginPackager';
export { generateAndSaveKeys } from './tools/generateKeys';
export { verifyPlugin, runVerifier } from './tools/verifyPlugin';
export { testSandbox, runSandboxTest } from './tools/testSandbox';

// Export plugin loaders (Node.js only)
// Note: These are lazy-loaded to avoid importing signatureVerifier in browser
// They will throw errors if called in browser environment
export {
  installPluginFromUrl,
  installPluginFromNpm
} from './plugins/loader';
export {
  checkPluginHealth,
  runPluginSelfTest,
  checkAllPluginsHealth,
  getHealthSummary,
  type HealthCheckResult,
  type HealthCheckOptions
} from './plugins/healthCheck';
export {
  installPlugin,
  uninstallPlugin,
  updatePlugin,
  checkForUpdates,
  getPluginInstallInfo,
  listInstalledPlugins,
  type PluginInstallInfoExtended,
  type PluginUpdateInfo,
  type InstallOptions
} from './plugins/lifecycle';
export {
  parseVersion,
  compareVersions,
  parseVersionRange,
  satisfiesVersion,
  resolveDependencies,
  canInstallPlugin,
  getInstallationOrder,
  checkVersionConflicts,
  getLatestCompatibleVersion,
  isCompatibleVersion,
  type VersionRange,
  type DependencyInfo,
  type DependencyResolution
} from './plugins/versionManager';




