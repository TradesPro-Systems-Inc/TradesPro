// @tradespro/core-engine/src/tools/dependencyChecker.ts
// Dependency Checker CLI - Check and resolve plugin dependencies
// Usage: node dependencyChecker.js <plugin-id> [options]

import {
  resolveDependencies,
  canInstallPlugin,
  getInstallationOrder,
  checkVersionConflicts,
  parseVersionRange,
  satisfiesVersion,
  compareVersions,
} from '../plugins/versionManager';
import { pluginRegistry } from '../plugins/registry';

/**
 * CLI entry point
 */
export async function runDependencyChecker(args: string[]): Promise<void> {
  const command = args[0];
  const pluginId = args[1];

  try {
    switch (command) {
      case 'check':
        if (!pluginId) {
          console.error('Usage: dependencyChecker check <plugin-id>');
          process.exit(1);
        }
        handleCheck(pluginId);
        break;

      case 'resolve':
        if (!pluginId) {
          console.error('Usage: dependencyChecker resolve <plugin-id>');
          process.exit(1);
        }
        handleResolve(pluginId);
        break;

      case 'order':
        handleOrder(args.slice(1));
        break;

      case 'conflicts':
        handleConflicts();
        break;

      case 'compare':
        if (args.length < 3) {
          console.error('Usage: dependencyChecker compare <version1> <version2>');
          process.exit(1);
        }
        handleCompare(args[1], args[2]);
        break;

      case 'satisfies':
        if (args.length < 3) {
          console.error('Usage: dependencyChecker satisfies <version> <range>');
          process.exit(1);
        }
        handleSatisfies(args[1], args[2]);
        break;

      default:
        console.error('Unknown command:', command);
        console.error('Available commands: check, resolve, order, conflicts, compare, satisfies');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Handle check command
 */
function handleCheck(pluginId: string): void {
  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    console.error(`❌ Plugin not found: ${pluginId}`);
    process.exit(1);
  }

  console.log(`🔍 Checking dependencies for: ${pluginId} v${plugin.manifest.version}`);
  const resolution = resolveDependencies(plugin);

  console.log('\n📋 Dependencies:');
  for (const dep of resolution.dependencies) {
    const status = dep.installed 
      ? (dep.compatible ? '✅' : '⚠️')
      : '❌';
    console.log(`   ${status} ${dep.pluginId}${dep.installedVersion ? ` v${dep.installedVersion}` : ''}`);
    if (dep.versionRange) {
      console.log(`      Range: ${JSON.stringify(dep.versionRange)}`);
    }
  }

  if (resolution.conflicts.length > 0) {
    console.log('\n⚠️  Conflicts:');
    resolution.conflicts.forEach(conflict => console.log(`   - ${conflict}`));
  }

  if (resolution.missing.length > 0) {
    console.log('\n❌ Missing dependencies:');
    resolution.missing.forEach(missing => console.log(`   - ${missing}`));
  }

  if (resolution.errors.length > 0) {
    console.log('\n❌ Errors:');
    resolution.errors.forEach(error => console.log(`   - ${error}`));
  }

  if (resolution.resolved) {
    console.log('\n✅ All dependencies resolved!');
  } else {
    console.log('\n❌ Dependency resolution failed');
    process.exit(1);
  }
}

/**
 * Handle resolve command
 */
function handleResolve(pluginId: string): void {
  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    console.error(`❌ Plugin not found: ${pluginId}`);
    process.exit(1);
  }

  console.log(`🔍 Checking if plugin can be installed: ${pluginId}`);
  const result = canInstallPlugin(plugin);

  if (result.canInstall) {
    console.log('✅ Plugin can be installed (all dependencies satisfied)');
  } else {
    console.log('❌ Plugin cannot be installed:');
    if (result.resolution.missing.length > 0) {
      console.log('   Missing:', result.resolution.missing.join(', '));
    }
    if (result.resolution.conflicts.length > 0) {
      console.log('   Conflicts:', result.resolution.conflicts.join(', '));
    }
    process.exit(1);
  }
}

/**
 * Handle order command
 */
function handleOrder(pluginIds: string[]): void {
  const plugins = pluginIds.map(id => {
    const plugin = pluginRegistry.get(id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${id}`);
    }
    return plugin;
  });

  console.log(`🔍 Calculating installation order for ${plugins.length} plugins...`);
  const result = getInstallationOrder(plugins);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.log(`   - ${error}`));
    process.exit(1);
  }

  console.log('\n📋 Installation order:');
  result.order.forEach((plugin, index) => {
    console.log(`   ${index + 1}. ${plugin.manifest.id} v${plugin.manifest.version}`);
  });
}

/**
 * Handle conflicts command
 */
function handleConflicts(): void {
  const plugins = pluginRegistry.list();
  console.log(`🔍 Checking for version conflicts among ${plugins.length} plugins...`);
  
  const result = checkVersionConflicts(plugins);

  if (result.conflicts.length === 0) {
    console.log('✅ No version conflicts detected');
  } else {
    console.log('\n⚠️  Version conflicts detected:');
    result.conflicts.forEach(conflict => {
      console.log(`   ${conflict.pluginId}: ${conflict.conflict}`);
    });
  }
}

/**
 * Handle compare command
 */
function handleCompare(v1: string, v2: string): void {
  try {
    const result = compareVersions(v1, v2);
    let comparison: string;
    
    if (result < 0) {
      comparison = `${v1} < ${v2}`;
    } else if (result > 0) {
      comparison = `${v1} > ${v2}`;
    } else {
      comparison = `${v1} === ${v2}`;
    }

    console.log(`📊 Version comparison: ${comparison}`);
  } catch (error) {
    console.error(`❌ Invalid version: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Handle satisfies command
 */
function handleSatisfies(version: string, range: string): void {
  try {
    const result = satisfiesVersion(version, range);
    const status = result ? '✅' : '❌';
    console.log(`${status} Version ${version} ${result ? 'satisfies' : 'does not satisfy'} range ${range}`);
    
    if (!result) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// CLI entry point if run directly
if (require.main === module) {
  runDependencyChecker(process.argv.slice(2)).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}



