// @tradespro/core-engine/src/tools/pluginManager.ts
// Plugin Manager CLI - Manage plugin lifecycle
// Usage: node pluginManager.js <command> [args]

import {
  installPlugin,
  uninstallPlugin,
  updatePlugin,
  checkForUpdates,
  getPluginInstallInfo,
  listInstalledPlugins,
} from '../plugins/lifecycle';
import { pluginRegistry } from '../plugins/registry';

/**
 * CLI entry point
 */
export async function runPluginManager(args: string[]): Promise<void> {
  const command = args[0];
  const pluginId = args[1];

  try {
    switch (command) {
      case 'install':
        if (!pluginId) {
          console.error('Usage: pluginManager install <source> [options]');
          console.error('  source: file path, URL, or npm package name');
          process.exit(1);
        }
        await handleInstall(pluginId, args.slice(2));
        break;

      case 'uninstall':
        if (!pluginId) {
          console.error('Usage: pluginManager uninstall <plugin-id>');
          process.exit(1);
        }
        await handleUninstall(pluginId);
        break;

      case 'update':
        if (!pluginId) {
          console.error('Usage: pluginManager update <plugin-id> [--version <version>]');
          process.exit(1);
        }
        await handleUpdate(pluginId, args.slice(2));
        break;

      case 'check-updates':
        await handleCheckUpdates(pluginId);
        break;

      case 'list':
        handleList();
        break;

      case 'info':
        if (!pluginId) {
          console.error('Usage: pluginManager info <plugin-id>');
          process.exit(1);
        }
        handleInfo(pluginId);
        break;

      default:
        console.error('Unknown command:', command);
        console.error('Available commands: install, uninstall, update, check-updates, list, info');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Handle install command
 */
async function handleInstall(source: string, options: string[]): Promise<void> {
  const installOptions: any = {};

  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--skip-health-check') {
      installOptions.skipHealthCheck = true;
    } else if (options[i] === '--verify-signature') {
      installOptions.verifySignature = true;
    } else if (options[i] === '--public-key' && options[i + 1]) {
      installOptions.publicKeyPath = options[i + 1];
      i++;
    }
  }

  console.log(`📦 Installing plugin from: ${source}`);
  const result = await installPlugin(source, installOptions);

  console.log(`✅ Plugin installed successfully!`);
  console.log(`   Plugin ID: ${result.plugin.manifest.id}`);
  console.log(`   Version: ${result.plugin.manifest.version}`);
  console.log(`   Source: ${result.installInfo.source}`);

  if (result.healthCheck) {
    const status = result.healthCheck.healthy ? '✅ Healthy' : '❌ Unhealthy';
    console.log(`   Health Status: ${status}`);
  }
}

/**
 * Handle uninstall command
 */
async function handleUninstall(pluginId: string): Promise<void> {
  console.log(`🗑️  Uninstalling plugin: ${pluginId}`);
  const result = await uninstallPlugin(pluginId);

  if (result.success) {
    console.log(`✅ Plugin uninstalled successfully!`);
  } else {
    console.error(`❌ Failed to uninstall plugin: ${pluginId}`);
    process.exit(1);
  }
}

/**
 * Handle update command
 */
async function handleUpdate(pluginId: string, options: string[]): Promise<void> {
  const updateOptions: any = {};

  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--version' && options[i + 1]) {
      updateOptions.targetVersion = options[i + 1];
      i++;
    } else if (options[i] === '--force') {
      updateOptions.force = true;
    }
  }

  console.log(`🔄 Updating plugin: ${pluginId}`);
  const result = await updatePlugin(pluginId, updateOptions);

  if (result.success) {
    console.log(`✅ Plugin updated successfully!`);
    console.log(`   Old version: ${result.oldVersion}`);
    console.log(`   New version: ${result.newVersion}`);
  } else {
    if (result.updateInfo?.updateAvailable === false) {
      console.log(`ℹ️  Plugin is already up to date (${result.oldVersion})`);
    } else {
      console.error(`❌ Failed to update plugin: ${pluginId}`);
      process.exit(1);
    }
  }
}

/**
 * Handle check-updates command
 */
async function handleCheckUpdates(pluginId?: string): Promise<void> {
  console.log(`🔍 Checking for updates...`);
  const updates = await checkForUpdates(pluginId);

  if (updates.length === 0) {
    console.log(`✅ All plugins are up to date`);
    return;
  }

  const availableUpdates = updates.filter(u => u.updateAvailable);
  if (availableUpdates.length === 0) {
    console.log(`✅ All plugins are up to date`);
    return;
  }

  console.log(`\n📋 Available updates:`);
  for (const update of availableUpdates) {
    console.log(`   ${update.pluginId}: ${update.currentVersion} → ${update.availableVersion}`);
  }
}

/**
 * Handle list command
 */
function handleList(): void {
  const plugins = listInstalledPlugins();

  if (plugins.length === 0) {
    console.log('No plugins installed');
    return;
  }

  console.log(`\n📋 Installed plugins (${plugins.length}):`);
  for (const plugin of plugins) {
    const healthIcon = plugin.healthStatus === 'healthy' ? '✅' : 
                      plugin.healthStatus === 'unhealthy' ? '❌' : '⚠️';
    console.log(`\n${healthIcon} ${plugin.pluginId} v${plugin.version}`);
    console.log(`   Source: ${plugin.source}`);
    console.log(`   Installed: ${plugin.installedAt}`);
    if (plugin.lastHealthCheck) {
      console.log(`   Last health check: ${plugin.lastHealthCheck}`);
    }
  }
}

/**
 * Handle info command
 */
function handleInfo(pluginId: string): void {
  const info = getPluginInstallInfo(pluginId);
  if (!info) {
    console.error(`❌ Plugin not found: ${pluginId}`);
    process.exit(1);
  }

  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    console.error(`❌ Plugin not registered: ${pluginId}`);
    process.exit(1);
  }

  console.log(`\n📋 Plugin Information:`);
  console.log(`   ID: ${info.pluginId}`);
  console.log(`   Version: ${info.version}`);
  console.log(`   Name: ${plugin.manifest.name}`);
  console.log(`   Description: ${plugin.manifest.description}`);
  console.log(`   Source: ${info.source}`);
  if (info.sourcePath) {
    console.log(`   Source Path: ${info.sourcePath}`);
  }
  if (info.installPath) {
    console.log(`   Install Path: ${info.installPath}`);
  }
  console.log(`   Installed: ${info.installedAt}`);
  console.log(`   Health Status: ${info.healthStatus || 'unknown'}`);
  if (info.lastHealthCheck) {
    console.log(`   Last Health Check: ${info.lastHealthCheck}`);
  }
  console.log(`   Domain: ${plugin.manifest.domain}`);
  console.log(`   Standards: ${plugin.manifest.standards.join(', ')}`);
  console.log(`   Building Types: ${plugin.manifest.buildingTypes.join(', ')}`);
}

// CLI entry point if run directly
if (require.main === module) {
  runPluginManager(process.argv.slice(2)).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}



