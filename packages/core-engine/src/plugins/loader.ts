// @tradespro/core-engine/src/plugins/loader.ts
// V4.1 Plugin System - Plugin Loader
// Handles loading, validating, and initializing plugins

import type { CalculationPlugin, PluginManifest, PluginContext } from './types';
import { pluginRegistry } from './registry';
// Note: signatureVerifier and sandboxRunner use Node.js modules (crypto, fs, vm)
// These are only used in server-side functions (installPluginFromPath, executePluginInSandbox)
// They should not be imported in browser environments
import signatureVerifier, { verifyManifestIntegrity, VerificationResult } from './signatureVerifier';
import sandboxRunner, { SandboxOptions } from './sandboxRunner';
import fs from 'fs';
import path from 'path';
// Import URL and NPM loaders
import { loadPluginFromUrl, UrlLoadOptions } from './urlLoader';
import { loadPluginFromNpm, NpmLoadOptions } from './npmLoader';

export interface PluginLoadOptions {
  verifySignature?: boolean;
  verifyChecksum?: boolean;
  allowUnverified?: boolean;
  publicKeyPath?: string;        // Path to public key for signature verification
  publicKeyPem?: string;         // Public key PEM string (alternative to path)
  requireSignature?: boolean;    // Require signature in production
  useSandbox?: boolean;          // Use sandbox execution for untrusted plugins
  sandboxOptions?: SandboxOptions; // Sandbox configuration
}

/**
 * Load a plugin from a module or object
 */
export async function loadPlugin(
  pluginModule: any,
  options: PluginLoadOptions = {}
): Promise<CalculationPlugin> {
  // Extract plugin - can be the default export or a named export
  let plugin: CalculationPlugin;
  
  if (pluginModule.default && typeof pluginModule.default.calculate === 'function') {
    plugin = pluginModule.default;
  } else if (typeof pluginModule.calculate === 'function') {
    plugin = pluginModule;
  } else {
    throw new Error('Invalid plugin module: must export a CalculationPlugin');
  }

  // Validate plugin structure
  validatePlugin(plugin, options);

  return plugin;
}

/**
 * Load plugin from manifest and entry point
 */
export async function loadPluginFromManifest(
  manifest: PluginManifest,
  entryPoint: CalculationPlugin,
  options: PluginLoadOptions = {}
): Promise<CalculationPlugin> {
  // Verify manifest matches plugin
  if (entryPoint.manifest.id !== manifest.id) {
    throw new Error(`Plugin ID mismatch: manifest=${manifest.id}, plugin=${entryPoint.manifest.id}`);
  }

  // Verify version
  if (entryPoint.manifest.version !== manifest.version) {
    throw new Error(`Plugin version mismatch: manifest=${manifest.version}, plugin=${entryPoint.manifest.version}`);
  }

  // Validate plugin
  validatePlugin(entryPoint, options);

  return entryPoint;
}

/**
 * Validate plugin structure and requirements
 */
export function validatePlugin(
  plugin: CalculationPlugin,
  options: PluginLoadOptions = {}
): void {
  // Check required fields
  if (!plugin.manifest) {
    throw new Error('Plugin must have a manifest');
  }

  if (!plugin.manifest.id) {
    throw new Error('Plugin manifest must have an id');
  }

  if (!plugin.manifest.version) {
    throw new Error('Plugin manifest must have a version');
  }

  if (typeof plugin.calculate !== 'function') {
    throw new Error('Plugin must implement calculate() method');
  }

  // Validate manifest structure
  const m = plugin.manifest;
  if (!m.domain || !m.standards || !Array.isArray(m.standards)) {
    throw new Error('Plugin manifest must have domain and standards array');
  }

  if (!m.capabilities || typeof m.capabilities !== 'object') {
    throw new Error('Plugin manifest must have capabilities object');
  }

  // Verify checksum if required
  if (options.verifyChecksum && !options.allowUnverified) {
    if (!m.checksum) {
      throw new Error(`Plugin ${m.id} is missing checksum`);
    }
    if (!signatureVerifier.verifyChecksum(m, m.checksum)) {
      throw new Error(`Plugin ${m.id} checksum verification failed`);
    }
  }

  // Verify signature if required
  if (options.verifySignature && !options.allowUnverified) {
    if (!m.signature) {
      // Check if signature is required
      const requireSig = options.requireSignature ?? (process.env.NODE_ENV === 'production');
      if (requireSig) {
        throw new Error(`Plugin ${m.id} is missing signature and signature is required`);
      }
    } else {
      // Verify signature
      const publicKeyPem = options.publicKeyPem || 
        (options.publicKeyPath ? signatureVerifier.loadPemFromFile(options.publicKeyPath) : undefined);
      
      if (!publicKeyPem) {
        throw new Error(`Public key not provided for plugin ${m.id} signature verification`);
      }

      if (!signatureVerifier.verifySignature(m, m.signature, publicKeyPem)) {
        throw new Error(`Plugin ${m.id} signature verification failed`);
      }
    }
  }

  // Check dependencies
  if (m.dependencies?.plugins) {
    for (const depId of m.dependencies.plugins) {
      if (!pluginRegistry.has(depId)) {
        throw new Error(`Plugin ${m.id} depends on plugin ${depId} which is not installed`);
      }
    }
  }
}

/**
 * Create plugin context for execution
 */
export function createPluginContext(
  engine: PluginContext['engine'],
  tables: PluginContext['tables'],
  options?: PluginContext['options']
): PluginContext {
  return {
    engine,
    tables,
    options: {
      ...options,
      // 确保 tier 正确设置（如果未提供，默认使用 free）
      tier: options?.tier || 'free',
    },
    logger: {
      info: (msg: string) => console.log(`[Plugin] ${msg}`),
      warn: (msg: string) => console.warn(`[Plugin] ${msg}`),
      error: (msg: string) => console.error(`[Plugin] ${msg}`),
      debug: (msg: string) => {
        if (options?.mode === 'preview' || process.env.NODE_ENV === 'development') {
          console.debug(`[Plugin] ${msg}`);
        }
      },
    },
  };
}

/**
 * Execute a plugin calculation
 */
export async function executePlugin(
  pluginId: string,
  inputs: any,
  context: PluginContext
): Promise<import('./types').PluginCalculationResult> {
  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    throw new Error(`Plugin ${pluginId} not found`);
  }

  if (!pluginRegistry.isLoaded(pluginId)) {
    throw new Error(`Plugin ${pluginId} is not loaded`);
  }

  // Validate inputs if plugin provides validator
  if (plugin.validateInputs) {
    const validation = plugin.validateInputs(inputs);
    if (!validation.valid) {
      throw new Error(`Input validation failed: ${validation.errors?.join(', ')}`);
    }
  }

  // Execute calculation
  const startTime = Date.now();
  try {
    const result = await plugin.calculate(inputs, context);
    const executionTime = Date.now() - startTime;
    
    return {
      ...result,
      executionTimeMs: result.executionTimeMs ?? executionTime,
    };
  } catch (error) {
    context.logger.error(`Plugin ${pluginId} calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Install plugin from directory path
 * - Validates manifest integrity (checksum + signature)
 * - Optionally runs self-test in sandbox
 * - Registers plugin if all validations pass
 */
export async function installPluginFromPath(
  pluginDir: string,
  options?: PluginLoadOptions
): Promise<{ plugin: CalculationPlugin; verification: VerificationResult }> {
  const manifestPath = path.join(pluginDir, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  // Read manifest
  const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Verify manifest integrity
  const verification = verifyManifestIntegrity(manifest, {
    expectedChecksum: manifest.checksum,
    signature: manifest.signature,
    publicKeyPath: options?.publicKeyPath,
    publicKeyPem: options?.publicKeyPem,
    requireSignature: options?.requireSignature ?? (process.env.NODE_ENV === 'production'),
  });

  // Check verification results
  if (options?.verifyChecksum && !verification.checksumValid) {
    throw new Error(`Checksum verification failed: ${verification.errors.join(', ')}`);
  }

  if (options?.verifySignature && !verification.signatureValid) {
    const requireSig = options.requireSignature ?? (process.env.NODE_ENV === 'production');
    if (requireSig || !options.allowUnverified) {
      throw new Error(`Signature verification failed: ${verification.errors.join(', ')}`);
    }
    console.warn(`[PluginLoader] Plugin ${manifest.id} signature verification failed, but allowing unverified (dev mode)`);
  }

  // Load plugin module
  const entry = path.join(pluginDir, manifest.entry || 'index.js');
  
  if (!fs.existsSync(entry)) {
    throw new Error(`Plugin entry point not found: ${entry}`);
  }

  // Optionally run self-test in sandbox for untrusted plugins
  if (options?.useSandbox || (!verification.signatureValid && process.env.NODE_ENV === 'production')) {
    const testContext = createPluginContext(
      { name: 'tradespro-engine', version: '1.0.0', commit: process.env.GIT_COMMIT || 'dev' },
      {},
      { mode: 'official' }
    );

    const sandboxOpts: SandboxOptions = {
      mode: 'vm2',
      timeoutMs: 5000,
      memoryLimitMb: 64,
      allowRequire: false,
      ...options?.sandboxOptions,
    };

    const testRes = await sandboxRunner.runPluginInSandbox(
      entry,
      { __selfTest: true },
      testContext,
      sandboxOpts
    );

    if (!testRes.ok) {
      throw new Error(`Plugin self-test failed: ${testRes.error}`);
    }
  }

  // Load plugin module (in host environment for registration)
  // Note: In production, you may want to load from sandbox result instead
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pluginModule = require(entry);
  const plugin: CalculationPlugin = pluginModule.default || pluginModule;

  // Validate plugin structure
  validatePlugin(plugin, options);

  // Register plugin
  pluginRegistry.register(plugin);

  console.log(`✅ Installed plugin ${manifest.id}@${manifest.version}`);

  return { plugin, verification };
}

/**
 * Execute plugin in sandbox (for untrusted plugins)
 */
export async function executePluginInSandbox(
  pluginId: string,
  pluginModulePath: string,
  inputs: any,
  context: PluginContext,
  sandboxOptions?: SandboxOptions
): Promise<import('./types').PluginCalculationResult> {
  // Validate inputs if plugin provides validator
  const plugin = pluginRegistry.get(pluginId);
  if (plugin?.validateInputs) {
    const validation = plugin.validateInputs(inputs);
    if (!validation.valid) {
      throw new Error(`Input validation failed: ${validation.errors?.join(', ')}`);
    }
  }

  // Execute in sandbox
  const sandboxOpts: SandboxOptions = {
    mode: 'vm2',
    timeoutMs: 8000,
    memoryLimitMb: 128,
    allowRequire: false,
    ...sandboxOptions,
  };

  const result = await sandboxRunner.runPluginInSandbox(
    pluginModulePath,
    inputs,
    context,
    sandboxOpts
  );

  if (!result.ok) {
    throw new Error(`Sandbox execution failed: ${result.error}`);
  }

  if (!result.result) {
    throw new Error('Sandbox execution returned no result');
  }

  return result.result;
}

/**
 * Load plugin from URL (HTTP/HTTPS)
 * Downloads and caches the plugin package
 */
export async function installPluginFromUrl(
  url: string,
  options: PluginLoadOptions & UrlLoadOptions = {}
): Promise<{ plugin: CalculationPlugin; verification: VerificationResult }> {
  const result = await loadPluginFromUrl(url, options);
  
  // Register plugin
  pluginRegistry.register(result.plugin);
  
  console.log(`✅ Installed plugin from URL: ${url}`);
  
  return {
    plugin: result.plugin,
    verification: {
      checksumValid: true,
      signatureValid: options.verifySignature ? (options.allowUnverified !== false) : true,
      errors: [],
    },
  };
}

/**
 * Load plugin from npm package
 * Installs and loads the plugin from npm registry
 */
export async function installPluginFromNpm(
  packageSpec: string,
  options: PluginLoadOptions & NpmLoadOptions = {}
): Promise<{ plugin: CalculationPlugin; verification: VerificationResult }> {
  const result = await loadPluginFromNpm(packageSpec, options);
  
  // Register plugin
  pluginRegistry.register(result.plugin);
  
  console.log(`✅ Installed plugin from npm: ${packageSpec}`);
  
  return {
    plugin: result.plugin,
    verification: {
      checksumValid: true,
      signatureValid: options.verifySignature ? (options.allowUnverified !== false) : true,
      errors: [],
    },
  };
}
