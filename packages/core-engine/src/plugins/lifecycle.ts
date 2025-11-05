// @tradespro/core-engine/src/plugins/lifecycle.ts
// Plugin Lifecycle Management - Install, Uninstall, Update
// Handles plugin installation, removal, and version updates

import fs from 'fs';
import path from 'path';
import { pluginRegistry } from './registry';
import type { CalculationPlugin, PluginManifest, PluginRegistryEntry, PluginInstallInfo } from './types';
import { 
  installPluginFromPath, 
  installPluginFromUrl, 
  installPluginFromNpm,
  PluginLoadOptions 
} from './loader';
import { 
  checkPluginHealth,
  type HealthCheckOptions 
} from './healthCheck';
import { UrlLoadOptions } from './urlLoader';
import { NpmLoadOptions } from './npmLoader';
import { canInstallPlugin, resolveDependencies } from './versionManager';

export interface PluginInstallInfoExtended {
  pluginId: string;
  version: string;
  installedAt: string;
  source: 'path' | 'url' | 'npm' | 'builtin';
  sourcePath?: string;
  installPath?: string;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck?: string;
}

export interface PluginUpdateInfo {
  pluginId: string;
  currentVersion: string;
  availableVersion: string;
  updateAvailable: boolean;
  breakingChanges?: boolean;
  changelog?: string;
}

export interface InstallOptions extends PluginLoadOptions, Partial<UrlLoadOptions>, Partial<NpmLoadOptions> {
  skipHealthCheck?: boolean;
  skipDependencyCheck?: boolean;
  healthCheckOptions?: HealthCheckOptions;
}

/**
 * Install plugin from various sources
 */
export async function installPlugin(
  source: string,
  options: InstallOptions = {}
): Promise<{
  plugin: CalculationPlugin;
  installInfo: PluginInstallInfoExtended;
  healthCheck?: any;
}> {
  // First, we'll load the plugin to check dependencies
  // Note: This is a simplified approach - in production, you might want to
  // check dependencies before actually loading the plugin code
  let plugin: CalculationPlugin;
  let installInfo: PluginInstallInfoExtended;

  // Determine source type
  if (fs.existsSync(source) || path.isAbsolute(source)) {
    // File system path
    const result = await installPluginFromPath(source, options);
    plugin = result.plugin;
    installInfo = {
      pluginId: plugin.manifest.id,
      version: plugin.manifest.version,
      installedAt: new Date().toISOString(),
      source: 'path',
      sourcePath: source,
      installPath: source,
      healthStatus: 'unknown',
    };
  } else if (source.startsWith('http://') || source.startsWith('https://')) {
    // URL
    const result = await installPluginFromUrl(source, options);
    plugin = result.plugin;
    installInfo = {
      pluginId: plugin.manifest.id,
      version: plugin.manifest.version,
      installedAt: new Date().toISOString(),
      source: 'url',
      sourcePath: source,
      installPath: options.cacheDir,
      healthStatus: 'unknown',
    };
  } else {
    // NPM package
    const result = await installPluginFromNpm(source, options);
    plugin = result.plugin;
    installInfo = {
      pluginId: plugin.manifest.id,
      version: plugin.manifest.version,
      installedAt: new Date().toISOString(),
      source: 'npm',
      sourcePath: source,
      installPath: options.installDir,
      healthStatus: 'unknown',
    };
  }

  // Perform health check if requested
  let healthCheck: any = undefined;
  if (!options.skipHealthCheck) {
    try {
      healthCheck = await checkPluginHealth(plugin.manifest.id, options.healthCheckOptions);
      installInfo.healthStatus = healthCheck.healthy ? 'healthy' : 'unhealthy';
      installInfo.lastHealthCheck = new Date().toISOString();
    } catch (error) {
      installInfo.healthStatus = 'unknown';
      console.warn(`Health check failed for ${plugin.manifest.id}:`, error);
    }
  }

  // Check dependencies before registering
  if (!options.skipDependencyCheck) {
    const dependencyCheck = canInstallPlugin(plugin);
    if (!dependencyCheck.canInstall) {
      const errors: string[] = [];
      if (dependencyCheck.resolution.missing.length > 0) {
        errors.push(`Missing dependencies: ${dependencyCheck.resolution.missing.join(', ')}`);
      }
      if (dependencyCheck.resolution.conflicts.length > 0) {
        errors.push(`Conflicts: ${dependencyCheck.resolution.conflicts.join(', ')}`);
      }
      if (dependencyCheck.resolution.errors.length > 0) {
        errors.push(...dependencyCheck.resolution.errors);
      }
      throw new Error(`Cannot install plugin: ${errors.join('; ')}`);
    }
  }

  // Register plugin with install info
  const installInfoForRegistry: Partial<PluginInstallInfo> = {
    pluginId: installInfo.pluginId,
    version: installInfo.version,
    installedAt: installInfo.installedAt,
    status: 'installed',
    manifest: plugin.manifest,
    source: installInfo.source,
    sourcePath: installInfo.sourcePath,
    installPath: installInfo.installPath,
    healthStatus: installInfo.healthStatus,
    lastHealthCheck: installInfo.lastHealthCheck,
  };
  pluginRegistry.register(plugin, installInfoForRegistry);

  return {
    plugin,
    installInfo,
    healthCheck,
  };
}

/**
 * Uninstall plugin
 */
export async function uninstallPlugin(
  pluginId: string,
  options: {
    removeFiles?: boolean;
    removePath?: string;
  } = {}
): Promise<{
  success: boolean;
  pluginId: string;
  removed: boolean;
}> {
  const entry = pluginRegistry.getEntry(pluginId);
  if (!entry) {
    return {
      success: false,
      pluginId,
      removed: false,
    };
  }

  // Call onUninstall hook if available
  try {
    if (entry.plugin.onUninstall) {
      await Promise.resolve(entry.plugin.onUninstall());
    }
  } catch (error) {
    console.warn(`Error during plugin uninstall hook: ${error}`);
  }

  // Remove from registry
  const removed = pluginRegistry.unregister(pluginId);

  // Remove files if requested
  if (options.removeFiles && options.removePath) {
    try {
      if (fs.existsSync(options.removePath)) {
        fs.rmSync(options.removePath, { recursive: true, force: true });
        console.log(`🗑️  Removed plugin files: ${options.removePath}`);
      }
    } catch (error) {
      console.warn(`Failed to remove plugin files: ${error}`);
    }
  }

  return {
    success: removed,
    pluginId,
    removed,
  };
}

/**
 * Update plugin to a newer version
 */
export async function updatePlugin(
  pluginId: string,
  options: InstallOptions & {
    targetVersion?: string;
    force?: boolean;
  } = {}
): Promise<{
  success: boolean;
  pluginId: string;
  oldVersion?: string;
  newVersion?: string;
  updateInfo?: PluginUpdateInfo;
}> {
  const entry = pluginRegistry.getEntry(pluginId);
  if (!entry) {
    return {
      success: false,
      pluginId,
    };
  }

  const currentVersion = entry.plugin.manifest.version;
  const installInfo = entry.installInfo;
  
  // Check for updates based on source
  let updateInfo: PluginUpdateInfo | undefined;
  let newPlugin: CalculationPlugin | undefined;

  const source = installInfo?.source || 'builtin';
  
  if (source === 'npm') {
    // Check npm registry for updates
    const packageSpec = installInfo.sourcePath || pluginId;
    const targetSpec = options.targetVersion 
      ? `${packageSpec}@${options.targetVersion}`
      : packageSpec;

    try {
      // Install new version
      const result = await installPluginFromNpm(targetSpec, options);
      newPlugin = result.plugin;
      
      updateInfo = {
        pluginId,
        currentVersion,
        availableVersion: newPlugin.manifest.version,
        updateAvailable: newPlugin.manifest.version !== currentVersion,
      };

      // Compare versions
      if (updateInfo.updateAvailable || options.force) {
        // Uninstall old version
        await uninstallPlugin(pluginId, {
          removeFiles: false, // Keep files for npm packages
        });

        // Register new version
        pluginRegistry.register(newPlugin);

        return {
          success: true,
          pluginId,
          oldVersion: currentVersion,
          newVersion: newPlugin.manifest.version,
          updateInfo,
        };
      } else {
        return {
          success: false,
          pluginId,
          oldVersion: currentVersion,
          newVersion: currentVersion,
          updateInfo: {
            ...updateInfo,
            updateAvailable: false,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        pluginId,
        oldVersion: currentVersion,
      };
    }
  } else if (source === 'url') {
    // For URL sources, re-download to get latest
    const url = installInfo.sourcePath || '';
    if (!url) {
      return {
        success: false,
        pluginId,
        oldVersion: currentVersion,
      };
    }

    try {
      const result = await installPluginFromUrl(url, options);
      newPlugin = result.plugin;

      updateInfo = {
        pluginId,
        currentVersion,
        availableVersion: newPlugin.manifest.version,
        updateAvailable: newPlugin.manifest.version !== currentVersion,
      };

      if (updateInfo.updateAvailable || options.force) {
        await uninstallPlugin(pluginId);
        pluginRegistry.register(newPlugin);

        return {
          success: true,
          pluginId,
          oldVersion: currentVersion,
          newVersion: newPlugin.manifest.version,
          updateInfo,
        };
      }
    } catch (error) {
      return {
        success: false,
        pluginId,
        oldVersion: currentVersion,
      };
    }
  } else {
    // Path-based plugins - need manual update
    return {
      success: false,
      pluginId,
      oldVersion: currentVersion,
      updateInfo: {
        pluginId,
        currentVersion,
        availableVersion: currentVersion,
        updateAvailable: false,
      },
    };
  }

  return {
    success: false,
    pluginId,
    oldVersion: currentVersion,
    updateInfo,
  };
}

/**
 * Check for plugin updates
 */
export async function checkForUpdates(
  pluginId?: string
): Promise<PluginUpdateInfo[]> {
  const plugins = pluginId 
    ? [pluginRegistry.get(pluginId)].filter(Boolean) as CalculationPlugin[]
    : pluginRegistry.list();

  const updates: PluginUpdateInfo[] = [];

  for (const plugin of plugins) {
    const entry = pluginRegistry.getEntry(plugin.manifest.id);
    if (!entry || !entry.installInfo) {
      continue;
    }

    const installInfo = entry.installInfo;
    const currentVersion = plugin.manifest.version;
    const source = installInfo?.source || 'builtin';

    // Check npm registry for updates
    if (source === 'npm') {
      try {
        // In a real implementation, you would query npm registry API
        // For now, we'll return a placeholder
        updates.push({
          pluginId: plugin.manifest.id,
          currentVersion,
          availableVersion: currentVersion, // TODO: Query npm registry
          updateAvailable: false,
        });
      } catch (error) {
        // Skip on error
      }
    }
  }

  return updates;
}

/**
 * Get plugin installation information
 */
export function getPluginInstallInfo(pluginId: string): PluginInstallInfoExtended | null {
  const entry = pluginRegistry.getEntry(pluginId);
  if (!entry || !entry.installInfo) {
    return null;
  }

  const baseInfo: PluginInstallInfoExtended = {
    ...entry.installInfo,
    source: (entry.installInfo.source as 'path' | 'url' | 'npm' | 'builtin') || 'builtin',
    healthStatus: entry.loaded ? 'healthy' : 'unhealthy',
  };

  return baseInfo;
}

/**
 * List all installed plugins with installation info
 */
export function listInstalledPlugins(): PluginInstallInfoExtended[] {
  const entries = pluginRegistry.listEntries();
  return entries
    .filter(entry => entry.installInfo)
    .map(entry => ({
      ...entry.installInfo!,
      source: (entry.installInfo!.source as 'path' | 'url' | 'npm' | 'builtin') || 'builtin',
      healthStatus: entry.loaded ? 'healthy' : 'unhealthy' as const,
    }));
}

