// @tradespro/core-engine/src/plugins/npmLoader.ts
// Plugin NPM Loader - Load plugins from npm package registry
// Supports loading from npm registry, local packages, and git repositories

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import type { CalculationPlugin, PluginManifest } from './types';
import { loadPlugin, validatePlugin } from './loader';
import { verifyManifestIntegrity, type VerificationResult } from './signatureVerifier';

export interface NpmLoadOptions {
  installDir?: string;         // Directory to install npm packages
  verifySignature?: boolean;   // Verify plugin signature
  publicKeyPath?: string;      // Path to public key for verification
  publicKeyPem?: string;       // Public key PEM string
  allowUnverified?: boolean;   // Allow unverified plugins
  registry?: string;           // Custom npm registry URL
}

/**
 * Load plugin from npm package
 */
export async function loadPluginFromNpm(
  packageSpec: string,
  options: NpmLoadOptions = {}
): Promise<{
  plugin: CalculationPlugin;
  installPath: string;
}> {
  const installDir = options.installDir || path.join(process.cwd(), '.plugin-npm');
  
  // Create install directory if needed
  if (!existsSync(installDir)) {
    mkdirSync(installDir, { recursive: true });
  }

  // Parse package spec
  // Supports: "package-name", "package-name@version", "@scope/package-name", "git+https://..."
  const packageName = extractPackageName(packageSpec);
  const packagePath = path.join(installDir, packageName.replace(/[\/@]/g, '_'));

  // Check if already installed
  if (existsSync(packagePath)) {
    const manifestPath = path.join(packagePath, 'manifest.json');
    if (existsSync(manifestPath)) {
      console.log(`📦 Loading plugin from cached npm package: ${packagePath}`);
      return loadPluginFromPackage(packagePath, options);
    }
  }

  // Install npm package
  console.log(`📥 Installing npm package: ${packageSpec}`);
  try {
    const npmCmd = options.registry
      ? `npm install ${packageSpec} --registry ${options.registry} --no-save`
      : `npm install ${packageSpec} --no-save`;
    
    execSync(npmCmd, {
      cwd: installDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });

    // Find installed package
    const nodeModulesPath = path.join(installDir, 'node_modules');
    const installedPath = findInstalledPackage(nodeModulesPath, packageName);
    
    if (!installedPath) {
      throw new Error(`Package installed but not found: ${packageName}`);
    }

    // Copy to cache location
    if (existsSync(packagePath)) {
      fs.rmSync(packagePath, { recursive: true, force: true });
    }
    copyDirectory(installedPath, packagePath);

    // Load plugin from package
    return loadPluginFromPackage(packagePath, options);
  } catch (error) {
    throw new Error(`Failed to install npm package ${packageSpec}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract package name from spec
 */
function extractPackageName(spec: string): string {
  // Remove version specifiers
  const withoutVersion = spec.replace(/@[^@]+$/, '');
  // Remove git+ prefix
  const withoutGit = withoutVersion.replace(/^git\+/, '');
  // Extract package name (last part of path)
  return path.basename(withoutGit, '.git');
}

/**
 * Find installed package in node_modules
 */
function findInstalledPackage(nodeModulesPath: string, packageName: string): string | null {
  // Try direct path
  const directPath = path.join(nodeModulesPath, packageName);
  if (existsSync(directPath)) {
    return directPath;
  }

  // Try scoped package
  if (packageName.startsWith('@')) {
    const [scope, name] = packageName.split('/');
    const scopedPath = path.join(nodeModulesPath, scope, name);
    if (existsSync(scopedPath)) {
      return scopedPath;
    }
  }

  // Search recursively
  return searchDirectory(nodeModulesPath, packageName);
}

/**
 * Search directory recursively for package
 */
function searchDirectory(dir: string, packageName: string): string | null {
  if (!existsSync(dir)) {
    return null;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Check package.json
      const packageJsonPath = path.join(fullPath, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.name === packageName) {
            return fullPath;
          }
        } catch {
          // Ignore invalid package.json
        }
      }
      // Recursively search
      const found = searchDirectory(fullPath, packageName);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Load plugin from installed package directory
 */
async function loadPluginFromPackage(
  packageDir: string,
  options: NpmLoadOptions
): Promise<{
  plugin: CalculationPlugin;
  installPath: string;
}> {
  const manifestPath = path.join(packageDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Verify integrity if requested
  if (options.verifySignature) {
    const verification = verifyManifestIntegrity(manifest, {
      expectedChecksum: manifest.checksum,
      signature: manifest.signature,
      publicKeyPath: options.publicKeyPath,
      publicKeyPem: options.publicKeyPem,
    });

    if (!verification.checksumValid || !verification.signatureValid) {
      if (!options.allowUnverified) {
        throw new Error(`Plugin verification failed: ${verification.errors.join(', ')}`);
      }
      console.warn(`⚠️  Plugin verification failed, but allowing unverified: ${verification.errors.join(', ')}`);
    }
  }

  // Load plugin module
  const entryPath = path.join(packageDir, manifest.entry || 'dist/index.js');
  if (!existsSync(entryPath)) {
    throw new Error(`Plugin entry point not found: ${entryPath}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pluginModule = require(entryPath);
  const plugin: CalculationPlugin = pluginModule.default || pluginModule;

  // Validate plugin
  validatePlugin(plugin, {
    verifySignature: options.verifySignature,
    verifyChecksum: true,
    allowUnverified: options.allowUnverified,
    publicKeyPath: options.publicKeyPath,
    publicKeyPem: options.publicKeyPem,
  });

  return {
    plugin,
    installPath: packageDir,
  };
}

/**
 * Copy directory recursively
 */
function copyDirectory(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

