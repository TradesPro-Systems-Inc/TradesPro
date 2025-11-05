// @tradespro/core-engine/src/tools/dependencyCheckerCLI.ts
// Dependency Checker CLI - Standalone tool with plugin registration

import { runDependencyChecker } from './dependencyChecker';
import { pluginRegistry } from '../plugins/registry';

// Try to register default plugins if available
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pluginModule = require('@tradespro/plugin-cec-8-200');
  const plugin = pluginModule.default || pluginModule.cecSingleDwellingPlugin;
  if (plugin) {
    pluginRegistry.registerDefault(plugin);
  }
} catch (error) {
  // Plugin not available, continue without it
}

// Run dependency checker
runDependencyChecker(process.argv.slice(2)).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});



