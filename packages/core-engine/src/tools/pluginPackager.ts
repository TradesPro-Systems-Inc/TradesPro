// @tradespro/core-engine/src/tools/pluginPackager.ts
// Plugin Packager - CLI tool for packaging and signing plugins
// Usage: node pluginPackager.js <plugin-dir> [options]

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { signManifest, computeChecksum, loadPemFromFile } from '../plugins/signatureVerifier';
import type { PluginManifest } from '../plugins/types';

export interface PackagerOptions {
  privateKeyPath?: string;
  privateKeyPem?: string;
  outputDir?: string;
  includeSource?: boolean;
  includeTests?: boolean;
  minify?: boolean;
}

/**
 * Generate key pair for plugin signing
 * Returns { privateKey, publicKey } in PEM format
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKey, publicKey };
}

/**
 * Read plugin manifest from directory
 */
export function readPluginManifest(pluginDir: string): PluginManifest {
  const manifestPath = path.join(pluginDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

/**
 * Package plugin directory into distributable format
 */
export async function packagePlugin(
  pluginDir: string,
  options: PackagerOptions = {}
): Promise<{
  manifest: PluginManifest;
  packagePath: string;
  checksum: string;
  signature?: string;
}> {
  // Read manifest
  const manifest = readPluginManifest(pluginDir);

  // Validate manifest structure
  if (!manifest.id || !manifest.version) {
    throw new Error('Manifest must have id and version');
  }

  // Compute checksum
  const checksum = computeChecksum(manifest);

  // Load private key if provided
  let privateKeyPem: string | undefined;
  if (options.privateKeyPem) {
    privateKeyPem = options.privateKeyPem;
  } else if (options.privateKeyPath) {
    privateKeyPem = fs.readFileSync(options.privateKeyPath, 'utf8');
  }

  // Sign manifest if private key provided
  let signature: string | undefined;
  if (privateKeyPem) {
    signature = signManifest(manifest, privateKeyPem);
  }

  // Update manifest with checksum and signature
  const finalManifest: PluginManifest = {
    ...manifest,
    checksum,
    ...(signature ? { signature } : {}),
  };

  // Create output directory
  const outputDir = options.outputDir || path.join(pluginDir, 'dist-package');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Copy plugin files
  // Copy dist files
  const distDir = path.join(pluginDir, 'dist');
  if (fs.existsSync(distDir)) {
    copyDirectory(distDir, path.join(outputDir, 'dist'));
  }

  // Copy data files
  const dataDir = path.join(pluginDir, 'data');
  if (fs.existsSync(dataDir)) {
    copyDirectory(dataDir, path.join(outputDir, 'data'));
  }

  // Copy source files if requested
  if (options.includeSource) {
    const srcDir = path.join(pluginDir, 'src');
    if (fs.existsSync(srcDir)) {
      copyDirectory(srcDir, path.join(outputDir, 'src'));
    }
  }

  // Copy README if exists
  const readmePath = path.join(pluginDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    fs.copyFileSync(readmePath, path.join(outputDir, 'README.md'));
  }

  // Write final manifest
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(finalManifest, null, 2));

  // Write package.json for npm compatibility
  const packageJson = {
    name: manifest.id,
    version: manifest.version,
    description: manifest.description || '',
    main: manifest.entry || 'dist/index.js',
    types: 'dist/index.d.ts',
    files: ['dist/**/*', 'data/**/*', 'manifest.json', 'README.md'],
  };
  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  return {
    manifest: finalManifest,
    packagePath: outputDir,
    checksum,
    signature,
  };
}

/**
 * Helper: Copy directory recursively
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
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

/**
 * CLI entry point
 */
export async function runPackager(args: string[]): Promise<void> {
  const pluginDir = args[0];
  if (!pluginDir) {
    console.error('Usage: pluginPackager <plugin-dir> [--key <key-path>] [--output <output-dir>]');
    process.exit(1);
  }

  const options: PackagerOptions = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--key' && args[i + 1]) {
      options.privateKeyPath = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--include-source') {
      options.includeSource = true;
    }
  }

  try {
    console.log(`📦 Packaging plugin from: ${pluginDir}`);
    const result = await packagePlugin(pluginDir, options);
    
    console.log(`✅ Plugin packaged successfully!`);
    console.log(`   Package: ${result.packagePath}`);
    console.log(`   Checksum: ${result.checksum}`);
    if (result.signature) {
      console.log(`   Signature: ${result.signature.substring(0, 20)}...`);
    }
  } catch (error) {
    console.error('❌ Packaging failed:', error instanceof Error ? error.message : String(error));
    console.error(error instanceof Error ? error.stack : '');
    process.exit(1);
  }
}

// CLI entry point if run directly
if (require.main === module) {
  runPackager(process.argv.slice(2)).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

