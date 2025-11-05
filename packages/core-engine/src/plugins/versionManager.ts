// @tradespro/core-engine/src/plugins/versionManager.ts
// Plugin Version Management - Semantic versioning and dependency resolution

import { pluginRegistry } from './registry';
import type { CalculationPlugin, PluginManifest } from './types';

export interface VersionRange {
  min?: string;
  max?: string;
  includeMin: boolean;
  includeMax: boolean;
}

export interface DependencyInfo {
  pluginId: string;
  versionRange?: VersionRange;
  required: boolean;
  installed: boolean;
  installedVersion?: string;
  compatible: boolean;
}

export interface DependencyResolution {
  resolved: boolean;
  dependencies: DependencyInfo[];
  conflicts: string[];
  missing: string[];
  errors: string[];
}

/**
 * Parse semantic version string
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
} {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  // Compare major
  if (parsed1.major !== parsed2.major) {
    return parsed1.major < parsed2.major ? -1 : 1;
  }

  // Compare minor
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor < parsed2.minor ? -1 : 1;
  }

  // Compare patch
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch < parsed2.patch ? -1 : 1;
  }

  // Prerelease versions are considered less than release versions
  if (parsed1.prerelease && !parsed2.prerelease) {
    return -1;
  }
  if (!parsed1.prerelease && parsed2.prerelease) {
    return 1;
  }
  if (parsed1.prerelease && parsed2.prerelease) {
    return parsed1.prerelease < parsed2.prerelease ? -1 : 
           parsed1.prerelease > parsed2.prerelease ? 1 : 0;
  }

  return 0;
}

/**
 * Parse version range string (e.g., ">=1.0.0 <2.0.0", "^1.0.0", "~1.0.0")
 */
export function parseVersionRange(range: string): VersionRange {
  range = range.trim();

  // Exact version
  if (/^\d+\.\d+\.\d+$/.test(range)) {
    return {
      min: range,
      max: range,
      includeMin: true,
      includeMax: true,
    };
  }

  // Caret range (^1.0.0 = >=1.0.0 <2.0.0)
  if (range.startsWith('^')) {
    const version = range.substring(1);
    const parsed = parseVersion(version);
    return {
      min: version,
      max: `${parsed.major + 1}.0.0`,
      includeMin: true,
      includeMax: false,
    };
  }

  // Tilde range (~1.0.0 = >=1.0.0 <1.1.0)
  if (range.startsWith('~')) {
    const version = range.substring(1);
    const parsed = parseVersion(version);
    return {
      min: version,
      max: `${parsed.major}.${parsed.minor + 1}.0`,
      includeMin: true,
      includeMax: false,
    };
  }

  // Range with spaces (e.g., ">=1.0.0 <2.0.0") - MUST check before simple operators
  // Check if range contains multiple operators (version followed by space and operator)
  if (/\d+\.\d+\.\d+\s+(>=|<=|>|<)/.test(range)) {
    // Extract version numbers and operators separately
    const minMatch = range.match(/(>=|>)\s*(\d+\.\d+\.\d+)/);
    const maxMatch = range.match(/(<=|<)\s*(\d+\.\d+\.\d+)/);
    
    let result: VersionRange = {
      includeMin: true,
      includeMax: false,
    };

    if (minMatch && minMatch.length >= 3) {
      result.min = minMatch[2]; // Group 2 is the version number
      result.includeMin = minMatch[1] === '>='; // Group 1 is the operator
    } else {
      result.min = '0.0.0';
      result.includeMin = true;
    }

    if (maxMatch && maxMatch.length >= 3) {
      result.max = maxMatch[2]; // Group 2 is the version number
      result.includeMax = maxMatch[1] === '<='; // Group 1 is the operator
    }

    return result;
  }

  // Greater than or equal
  if (range.startsWith('>=')) {
    const version = range.substring(2).trim();
    return {
      min: version,
      includeMin: true,
      includeMax: false,
    };
  }

  // Greater than
  if (range.startsWith('>')) {
    const version = range.substring(1).trim();
    return {
      min: version,
      includeMin: false,
      includeMax: false,
    };
  }

  // Less than or equal
  if (range.startsWith('<=')) {
    const version = range.substring(2).trim();
    return {
      min: '0.0.0',
      max: version,
      includeMin: true,
      includeMax: true,
    };
  }

  // Less than
  if (range.startsWith('<')) {
    const version = range.substring(1).trim();
    return {
      min: '0.0.0',
      max: version,
      includeMin: true,
      includeMax: false,
    };
  }

  // Fallback: if no pattern matched, throw error
  throw new Error(`Invalid version range format: ${range}`);
}

/**
 * Check if version satisfies range
 */
export function satisfiesVersion(version: string, range: string | VersionRange): boolean {
  let versionRange: VersionRange;
  
  // Parse range string if needed
  if (typeof range === 'string') {
    try {
      versionRange = parseVersionRange(range);
    } catch (error) {
      // If parsing fails, try as exact version match
      return version === range;
    }
  } else {
    versionRange = range;
  }

  // Check min bound
  if (versionRange.min) {
    const minCompare = compareVersions(version, versionRange.min);
    
    if (versionRange.includeMin) {
      if (minCompare < 0) return false;
    } else {
      if (minCompare <= 0) return false;
    }
  }

  // Check max bound
  if (versionRange.max) {
    const maxCompare = compareVersions(version, versionRange.max);
    
    if (versionRange.includeMax) {
      if (maxCompare > 0) return false;
    } else {
      if (maxCompare >= 0) return false;
    }
  }

  return true;
}

/**
 * Resolve plugin dependencies
 */
export function resolveDependencies(plugin: CalculationPlugin): DependencyResolution {
  const manifest = plugin.manifest;
  const dependencies: DependencyInfo[] = [];
  const conflicts: string[] = [];
  const missing: string[] = [];
  const errors: string[] = [];

  // Check plugin dependencies
  if (manifest.dependencies?.plugins) {
    for (const depId of manifest.dependencies.plugins) {
      const installed = pluginRegistry.has(depId);
      const entry = installed ? pluginRegistry.getEntry(depId) : null;
      const installedVersion = entry?.plugin.manifest.version;

      dependencies.push({
        pluginId: depId,
        required: true,
        installed,
        installedVersion,
        compatible: installed, // For now, assume compatible if installed
      });

      if (!installed) {
        missing.push(depId);
      }
    }
  }

  // Check core engine version requirement
  if (manifest.dependencies?.minEngineVersion) {
    try {
      const engineVersion = '1.0.0'; // TODO: Get from actual engine
      const compatible = satisfiesVersion(engineVersion, `>=${manifest.dependencies.minEngineVersion}`);
      
      if (!compatible) {
        conflicts.push(`Core engine version ${engineVersion} does not satisfy requirement >=${manifest.dependencies.minEngineVersion}`);
      }
    } catch (error) {
      errors.push(`Invalid core engine version requirement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    resolved: missing.length === 0 && conflicts.length === 0 && errors.length === 0,
    dependencies,
    conflicts,
    missing,
    errors,
  };
}

/**
 * Check if plugin can be installed (dependency check)
 */
export function canInstallPlugin(plugin: CalculationPlugin): {
  canInstall: boolean;
  resolution: DependencyResolution;
} {
  const resolution = resolveDependencies(plugin);
  
  return {
    canInstall: resolution.resolved,
    resolution,
  };
}

/**
 * Get installation order for plugins (topological sort)
 */
export function getInstallationOrder(plugins: CalculationPlugin[]): {
  order: CalculationPlugin[];
  errors: string[];
} {
  const errors: string[] = [];
  const order: CalculationPlugin[] = [];
  const installed = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(plugin: CalculationPlugin): void {
    const pluginId = plugin.manifest.id;

    if (visited.has(pluginId)) {
      return;
    }

    if (visiting.has(pluginId)) {
      errors.push(`Circular dependency detected involving plugin: ${pluginId}`);
      return;
    }

    visiting.add(pluginId);

    // Visit dependencies first
    if (plugin.manifest.dependencies?.plugins) {
      for (const depId of plugin.manifest.dependencies.plugins) {
        const depPlugin = plugins.find(p => p.manifest.id === depId);
        if (depPlugin) {
          visit(depPlugin);
        } else if (!pluginRegistry.has(depId) && !installed.has(depId)) {
          errors.push(`Dependency not found: ${depId} (required by ${pluginId})`);
        }
      }
    }

    visiting.delete(pluginId);
    visited.add(pluginId);
    installed.add(pluginId);
    order.push(plugin);
  }

  // Visit all plugins
  for (const plugin of plugins) {
    if (!visited.has(plugin.manifest.id)) {
      visit(plugin);
    }
  }

  return { order, errors };
}

/**
 * Check for version conflicts between plugins
 */
export function checkVersionConflicts(plugins: CalculationPlugin[]): {
  conflicts: Array<{
    pluginId: string;
    conflict: string;
  }>;
} {
  const conflicts: Array<{ pluginId: string; conflict: string }> = [];
  const pluginVersions = new Map<string, string[]>();

  // Collect all versions of each plugin
  for (const plugin of plugins) {
    const id = plugin.manifest.id;
    if (!pluginVersions.has(id)) {
      pluginVersions.set(id, []);
    }
    pluginVersions.get(id)!.push(plugin.manifest.version);
  }

  // Check for duplicate versions
  for (const [pluginId, versions] of pluginVersions.entries()) {
    const uniqueVersions = [...new Set(versions)];
    if (uniqueVersions.length > 1) {
      conflicts.push({
        pluginId,
        conflict: `Multiple versions detected: ${uniqueVersions.join(', ')}`,
      });
    }
  }

  return { conflicts };
}

/**
 * Get latest compatible version from available versions
 */
export function getLatestCompatibleVersion(
  versions: string[],
  range: string | VersionRange
): string | null {
  const compatibleVersions = versions.filter(v => satisfiesVersion(v, range));
  
  if (compatibleVersions.length === 0) {
    return null;
  }

  // Sort versions descending
  compatibleVersions.sort((a, b) => compareVersions(b, a));

  return compatibleVersions[0];
}

/**
 * Check if plugin version is compatible with installed version
 */
export function isCompatibleVersion(
  installedVersion: string,
  requiredRange: string
): boolean {
  try {
    return satisfiesVersion(installedVersion, requiredRange);
  } catch {
    return false;
  }
}

