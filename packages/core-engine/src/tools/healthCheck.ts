// @tradespro/core-engine/src/tools/healthCheck.ts
// CLI tool for plugin health checking
// Usage: node healthCheck.js [plugin-id] [options]

import {
  checkPluginHealth,
  checkAllPluginsHealth,
  runPluginSelfTest,
  getHealthSummary,
  type HealthCheckResult,
} from '../plugins/healthCheck';
import { pluginRegistry } from '../plugins/registry';

/**
 * CLI entry point
 */
export async function runHealthCheck(args: string[]): Promise<void> {
  const pluginId = args[0];
  const options: any = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--sandbox') {
      options.includeSandbox = true;
    } else if (args[i] === '--timeout' && args[i + 1]) {
      options.timeout = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--test-inputs' && args[i + 1]) {
      try {
        options.testInputs = JSON.parse(args[i + 1]);
        i++;
      } catch {
        console.error('Invalid JSON for test inputs');
        process.exit(1);
      }
    }
  }

  try {
    if (pluginId) {
      // Check specific plugin
      console.log(`🔍 Checking health of plugin: ${pluginId}`);
      const result = await checkPluginHealth(pluginId, options);
      printHealthResult(result);

      if (!result.healthy) {
        process.exit(1);
      }
    } else {
      // Check all plugins
      console.log(`🔍 Checking health of all registered plugins...`);
      const results = await checkAllPluginsHealth(options);
      const summary = getHealthSummary(results);

      console.log('\n📊 Health Summary:');
      console.log(`   Total plugins: ${summary.total}`);
      console.log(`   Healthy: ${summary.healthy} ✅`);
      console.log(`   Unhealthy: ${summary.unhealthy} ❌`);
      console.log(`   Warnings: ${summary.warnings} ⚠️`);
      console.log(`   Errors: ${summary.errors} ❌`);

      console.log('\n📋 Detailed Results:');
      for (const result of results) {
        printHealthResult(result);
        console.log('');
      }

      if (summary.unhealthy > 0) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Health check failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Print health check result
 */
function printHealthResult(result: HealthCheckResult): void {
  const status = result.healthy ? '✅' : '❌';
  console.log(`\n${status} Plugin: ${result.pluginId} v${result.version}`);
  console.log(`   Timestamp: ${result.timestamp}`);

  // Structure check
  const structureStatus = result.checks.structure.passed ? '✅' : '❌';
  console.log(`   ${structureStatus} Structure: ${result.checks.structure.message || result.checks.structure.error || 'N/A'}`);
  if (result.checks.structure.duration) {
    console.log(`      Duration: ${result.checks.structure.duration}ms`);
  }

  // Validation check
  const validationStatus = result.checks.validation.passed ? '✅' : '❌';
  console.log(`   ${validationStatus} Validation: ${result.checks.validation.message || result.checks.validation.error || 'N/A'}`);
  if (result.checks.validation.duration) {
    console.log(`      Duration: ${result.checks.validation.duration}ms`);
  }

  // Calculation check
  const calculationStatus = result.checks.calculation.passed ? '✅' : '❌';
  console.log(`   ${calculationStatus} Calculation: ${result.checks.calculation.message || result.checks.calculation.error || 'N/A'}`);
  if (result.checks.calculation.duration) {
    console.log(`      Duration: ${result.checks.calculation.duration}ms`);
  }

  // Sandbox check (if available)
  if (result.checks.sandbox) {
    const sandboxStatus = result.checks.sandbox.passed ? '✅' : '⚠️';
    console.log(`   ${sandboxStatus} Sandbox: ${result.checks.sandbox.message || result.checks.sandbox.error || 'N/A'}`);
    if (result.checks.sandbox.duration) {
      console.log(`      Duration: ${result.checks.sandbox.duration}ms`);
    }
  }

  // Errors
  if (result.errors.length > 0) {
    console.log(`   ❌ Errors:`);
    result.errors.forEach(error => console.log(`      - ${error}`));
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log(`   ⚠️  Warnings:`);
    result.warnings.forEach(warning => console.log(`      - ${warning}`));
  }
}

// CLI entry point if run directly
if (require.main === module) {
  runHealthCheck(process.argv.slice(2)).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

