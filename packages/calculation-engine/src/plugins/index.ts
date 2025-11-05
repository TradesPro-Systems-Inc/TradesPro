// @tradespro/calculation-engine/src/plugins/index.ts
// V4.1 Plugin System - Main Entry Point

// Export types
export * from './types';

// Export registry
export { pluginRegistry } from './registry';

// ⚠️ Browser compatibility: loader, signatureVerifier, and sandboxRunner use Node.js modules (fs, vm, crypto)
// They are NOT exported by default to avoid breaking browser builds.
// Server-side code should import them directly:
//   import { loadPlugin } from '@tradespro/calculation-engine/src/plugins/loader';
//   import { verifyManifest } from '@tradespro/calculation-engine/src/plugins/signatureVerifier';

// Export built-in plugins
export { cecSingleDwellingPlugin } from './builtin/cec-single-dwelling-plugin';
export { necSingleDwellingPlugin } from './builtin/nec-single-dwelling-plugin';

// Auto-register built-in plugins on import
import { pluginRegistry } from './registry';
import { cecSingleDwellingPlugin } from './builtin/cec-single-dwelling-plugin';
import { necSingleDwellingPlugin } from './builtin/nec-single-dwelling-plugin';

// Register built-in plugins
pluginRegistry.registerDefault(cecSingleDwellingPlugin);
pluginRegistry.registerDefault(necSingleDwellingPlugin);
