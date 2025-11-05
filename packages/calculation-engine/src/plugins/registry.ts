// @tradespro/calculation-engine/src/plugins/registry.ts
// V4.1 Plugin System - Plugin Registry
// Central registry for all installed and registered plugins

import type { CalculationPlugin, PluginRegistryEntry, PluginInstallInfo } from './types';

class PluginRegistry {
  private plugins: Map<string, PluginRegistryEntry> = new Map();
  private defaultPlugins: Map<string, CalculationPlugin> = new Map();

  /**
   * Register a plugin
   */
  register(plugin: CalculationPlugin, installInfo?: Partial<PluginInstallInfo>): void {
    const pluginId = plugin.manifest.id;
    
    // Check if already registered
    if (this.plugins.has(pluginId)) {
      console.warn(`Plugin ${pluginId} is already registered. Overwriting...`);
    }

    // Create install info
    const fullInstallInfo: PluginInstallInfo = {
      pluginId,
      version: plugin.manifest.version,
      installedAt: new Date().toISOString(),
      status: 'installed',
      manifest: plugin.manifest,
      ...installInfo,
    };

    // Register plugin
    const entry: PluginRegistryEntry = {
      plugin,
      installInfo: fullInstallInfo,
      loaded: false,
    };

    this.plugins.set(pluginId, entry);

    // Call onLoad hook if available
    try {
      if (plugin.onLoad) {
        plugin.onLoad();
      }
      entry.loaded = true;
    } catch (error) {
      entry.loaded = false;
      entry.loadError = error instanceof Error ? error.message : 'Unknown error';
      entry.installInfo.status = 'error';
      console.error(`Failed to load plugin ${pluginId}:`, error);
    }

    console.log(`✅ Plugin registered: ${pluginId} v${plugin.manifest.version}`);
  }

  /**
   * Register a default/built-in plugin
   */
  registerDefault(plugin: CalculationPlugin): void {
    this.defaultPlugins.set(plugin.manifest.id, plugin);
    this.register(plugin, { status: 'active' });
  }

  /**
   * Get a plugin by ID
   */
  get(pluginId: string): CalculationPlugin | null {
    const entry = this.plugins.get(pluginId);
    return entry?.plugin || null;
  }

  /**
   * Get plugin entry with install info
   */
  getEntry(pluginId: string): PluginRegistryEntry | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Check if plugin is registered
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    const entry = this.plugins.get(pluginId);
    return entry?.loaded || false;
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): boolean {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      return false;
    }

    // Call onUninstall hook if available
    try {
      if (entry.plugin.onUninstall) {
        entry.plugin.onUninstall();
      }
    } catch (error) {
      console.error(`Error during plugin uninstall ${pluginId}:`, error);
    }

    this.plugins.delete(pluginId);
    console.log(`✅ Plugin unregistered: ${pluginId}`);
    return true;
  }

  /**
   * List all registered plugins
   */
  list(): CalculationPlugin[] {
    return Array.from(this.plugins.values()).map(entry => entry.plugin);
  }

  /**
   * List plugins by domain
   */
  listByDomain(domain: string): CalculationPlugin[] {
    return this.list().filter(p => p.manifest.domain === domain);
  }

  /**
   * List plugins by standard
   */
  listByStandard(standard: string): CalculationPlugin[] {
    return this.list().filter(p => 
      p.manifest.standards.some(s => s.toLowerCase().includes(standard.toLowerCase()))
    );
  }

  /**
   * List plugins by building type
   */
  listByBuildingType(buildingType: string): CalculationPlugin[] {
    return this.list().filter(p => 
      p.manifest.buildingTypes.includes(buildingType)
    );
  }

  /**
   * List all plugin entries with install info
   */
  listEntries(): PluginRegistryEntry[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get default plugins
   */
  getDefaultPlugins(): CalculationPlugin[] {
    return Array.from(this.defaultPlugins.values());
  }

  /**
   * Clear all plugins (except defaults)
   */
  clear(): void {
    const defaultIds = Array.from(this.defaultPlugins.keys());
    for (const [id] of this.plugins) {
      if (!defaultIds.includes(id)) {
        this.unregister(id);
      }
    }
  }

  /**
   * Get plugin count
   */
  count(): number {
    return this.plugins.size;
  }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistry();





