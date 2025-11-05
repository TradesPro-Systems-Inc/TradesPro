// @tradespro/core-engine/src/tools/healthCheckCLI.ts
// Standalone CLI tool that registers plugins first, then checks health

import { runHealthCheck } from './healthCheck';
import { pluginRegistry } from '../plugins/registry';

// Try to register default plugins if available
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pluginModule = require('@tradespro/plugin-cec-8-200');
  const plugin = pluginModule.default || pluginModule.cecSingleDwellingPlugin;
  if (plugin) {
    pluginRegistry.registerDefault(plugin);
    console.log('✅ Registered default plugin: cec-single-dwelling-2024');
  }
} catch (error) {
  // Plugin not available, continue without it
  console.log('ℹ️  Default plugin not available, checking registered plugins only');
}

// Run health check
runHealthCheck(process.argv.slice(2)).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

