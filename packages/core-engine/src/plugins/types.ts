// @tradespro/core-engine/src/plugins/types.ts
// V4.1 Plugin System - Core Type Definitions
// Standard interface for calculation plugins

import type { EngineMeta, RuleTables, UnsignedBundle } from '../types';

/**
 * Plugin Manifest - Metadata about the plugin
 * Each plugin must provide a manifest.json file with this structure
 */
export interface PluginManifest {
  // Plugin identification
  id: string;                    // Unique plugin ID, e.g., "cec-single-dwelling-2024"
  name: string;                  // Human-readable name, e.g., "CEC 2024 Single Dwelling Load Calculator"
  version: string;               // Semantic version, e.g., "1.0.0"
  description: string;           // Plugin description
  author?: string;               // Plugin author/developer
  license?: string;              // License type

  // Plugin capabilities
  domain: 'electrical' | 'hvac' | 'plumbing' | 'gas' | 'fire_alarm' | 'other';
  standards: string[];           // Standards supported, e.g., ["CEC-2024", "CEC-8-200"]
  buildingTypes: string[];       // Building types supported, e.g., ["single-dwelling", "apartment"]
  
  // Runtime capabilities
  capabilities: {
    offline: boolean;            // Can run offline
    audit: boolean;              // Supports audit trail generation
    signing: boolean;            // Supports signing
    preview: boolean;            // Supports preview mode
  };

  // Plugin structure
  entry: string;                 // Entry point file, e.g., "index.ts" or "plugin.js"
  tables?: string[];             // Required table files, e.g., ["table2.json", "table4.json"]
  schema?: string;               // Input schema file path, e.g., "schema.json"
  
  // Dependencies
  dependencies?: {
    plugins?: string[];          // Other plugin IDs this depends on
    tables?: string[];           // Required table IDs
    minEngineVersion?: string;   // Minimum engine version required
  };

  // Security & verification
  signature?: string;            // Plugin signature for verification
  checksum?: string;             // SHA-256 checksum of plugin files
  
  // Metadata
  tags?: string[];               // Searchable tags
  icon?: string;                 // Icon path or URL
  homepage?: string;             // Plugin homepage/documentation
  repository?: string;           // Source code repository
}

/**
 * Plugin Input Schema - Defines what inputs the plugin expects
 */
export interface PluginInputSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Plugin Context - Runtime context provided to plugins
 */
export interface PluginContext {
  // Engine metadata
  engine: EngineMeta;
  
  // Rule tables
  tables: RuleTables;
  
  // Runtime options
  options?: {
    locale?: string;
    mode?: 'preview' | 'official';
    tier?: 'free' | 'premium' | 'enterprise';
    // Jurisdiction-specific configuration
    jurisdictionConfig?: {
      panelBreakerSizes?: number[];
      // Future extensions:
      // conductorSizes?: string[];
      // voltageOptions?: number[];
    };
  };
  
  // Logging interface (restricted to prevent malicious I/O)
  logger: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug?: (message: string) => void;
  };
}

/**
 * Plugin Calculation Result
 */
export interface PluginCalculationResult {
  bundle: UnsignedBundle;
  executionTimeMs?: number;
  warnings?: string[];
  errors?: string[];
}

/**
 * Calculation Plugin Interface
 * All calculation plugins must implement this interface
 */
export interface CalculationPlugin {
  // Plugin metadata (from manifest)
  manifest: PluginManifest;
  
  // Input validation
  validateInputs?(inputs: any): { valid: boolean; errors?: string[] };
  
  // Main calculation function
  calculate(
    inputs: any,
    context: PluginContext
  ): PluginCalculationResult | Promise<PluginCalculationResult>;
  
  // Optional: Get required tables
  getRequiredTables?(): string[];
  
  // Optional: Get input schema
  getInputSchema?(): PluginInputSchema;
  
  // Optional: Plugin lifecycle hooks
  onInstall?(): void | Promise<void>;
  onUninstall?(): void | Promise<void>;
  onLoad?(): void | Promise<void>;
}

/**
 * Plugin Installation Info
 */
export interface PluginInstallInfo {
  pluginId: string;
  version: string;
  installedAt: string;
  installedBy?: string;
  status: 'installed' | 'active' | 'disabled' | 'error';
  error?: string;
  manifest: PluginManifest;
  // Extended fields (optional)
  source?: 'path' | 'url' | 'npm' | 'builtin';
  sourcePath?: string;
  installPath?: string;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck?: string;
}

/**
 * Plugin Registry Entry
 */
export interface PluginRegistryEntry {
  plugin: CalculationPlugin;
  installInfo: PluginInstallInfo;
  loaded: boolean;
  loadError?: string;
}
