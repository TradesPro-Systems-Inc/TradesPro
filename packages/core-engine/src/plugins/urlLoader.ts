// @tradespro/core-engine/src/plugins/urlLoader.ts
// Plugin URL Loader - Load plugins from HTTP/HTTPS URLs
// Supports downloading and caching plugin packages

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { createHash } from 'crypto';
// tar will be loaded dynamically if available
let tarModule: any = null;
function tryRequireTar() {
  if (!tarModule) {
    try {
      tarModule = require('tar');
    } catch {
      return null;
    }
  }
  return tarModule;
}
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import type { CalculationPlugin, PluginManifest } from './types';
import { loadPlugin, validatePlugin } from './loader';
import { verifyManifestIntegrity, loadPemFromFile, type VerificationResult } from './signatureVerifier';

export interface UrlLoadOptions {
  cacheDir?: string;           // Directory to cache downloaded plugins
  verifySignature?: boolean;   // Verify plugin signature
  verifyChecksum?: boolean;    // Verify plugin checksum
  publicKeyPath?: string;      // Path to public key for verification
  publicKeyPem?: string;       // Public key PEM string
  allowUnverified?: boolean;    // Allow unverified plugins
  timeout?: number;            // Download timeout in ms
}

/**
 * Download file from URL
 */
async function downloadFile(url: string, destPath: string, timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const file = createWriteStream(destPath);
    let timeoutId: NodeJS.Timeout;

    const request = protocol.get(url, (response) => {
      // Clear timeout on response
      if (timeoutId) clearTimeout(timeoutId);

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      file.close();
      if (existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      reject(err);
    });

    // Set timeout
    timeoutId = setTimeout(() => {
      request.destroy();
      file.close();
      if (existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      reject(new Error('Download timeout'));
    }, timeout);
  });
}

/**
 * Extract tarball to directory
 */
async function extractTarball(tarballPath: string, destDir: string): Promise<void> {
  const tar = tryRequireTar();
  if (!tar) {
    throw new Error('tar module is required for extracting plugins. Install with: npm install tar');
  }
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(tarballPath);
    stream.pipe(
      tar.extract({ cwd: destDir, strip: 1 })
    ).on('finish', () => {
      resolve();
    }).on('error', (err: Error) => {
      reject(err);
    });
  });
}

/**
 * Get cache key from URL
 */
function getCacheKey(url: string): string {
  const hash = createHash('sha256').update(url).digest('hex');
  return hash.substring(0, 16);
}

/**
 * Load plugin from URL
 */
export async function loadPluginFromUrl(
  url: string,
  options: UrlLoadOptions = {}
): Promise<{
  plugin: CalculationPlugin;
  cachePath: string;
}> {
  const cacheDir = options.cacheDir || path.join(process.cwd(), '.plugin-cache');
  const cacheKey = getCacheKey(url);
  const cachePath = path.join(cacheDir, cacheKey);

  // Check cache first
  if (existsSync(cachePath)) {
    const manifestPath = path.join(cachePath, 'manifest.json');
    if (existsSync(manifestPath)) {
      console.log(`📦 Loading plugin from cache: ${cachePath}`);
      return loadPluginFromPath(cachePath, options);
    }
  }

  // Create cache directory
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  // Download plugin
  console.log(`📥 Downloading plugin from: ${url}`);
  const tempTarball = path.join(cacheDir, `${cacheKey}.tar.gz`);
  
  try {
    await downloadFile(url, tempTarball, options.timeout || 30000);
    
    // Extract tarball
    if (!existsSync(cachePath)) {
      mkdirSync(cachePath, { recursive: true });
    }
    await extractTarball(tempTarball, cachePath);
    
    // Clean up tarball
    if (existsSync(tempTarball)) {
      fs.unlinkSync(tempTarball);
    }
    
    // Load plugin from extracted path
    return loadPluginFromPath(cachePath, options);
  } catch (error) {
    // Clean up on error
    if (existsSync(tempTarball)) {
      fs.unlinkSync(tempTarball);
    }
    if (existsSync(cachePath)) {
      fs.rmSync(cachePath, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * Load plugin from extracted directory
 */
async function loadPluginFromPath(
  pluginDir: string,
  options: UrlLoadOptions
): Promise<{
  plugin: CalculationPlugin;
  cachePath: string;
}> {
  const manifestPath = path.join(pluginDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest: PluginManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Verify integrity if requested
  if (options.verifySignature || options.verifyChecksum) {
    const verification = verifyManifestIntegrity(manifest, {
      expectedChecksum: manifest.checksum,
      signature: manifest.signature,
      publicKeyPath: options.publicKeyPath,
      publicKeyPem: options.publicKeyPem,
    });

    if ((options.verifyChecksum && !verification.checksumValid) || 
        (options.verifySignature && !verification.signatureValid)) {
      if (!options.allowUnverified) {
        throw new Error(`Plugin verification failed: ${verification.errors.join(', ')}`);
      }
      console.warn(`⚠️  Plugin verification failed, but allowing unverified: ${verification.errors.join(', ')}`);
    }
  }

  // Load plugin module
  const entryPath = path.join(pluginDir, manifest.entry || 'dist/index.js');
  if (!existsSync(entryPath)) {
    throw new Error(`Plugin entry point not found: ${entryPath}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pluginModule = require(entryPath);
  const plugin: CalculationPlugin = pluginModule.default || pluginModule.cecSingleDwellingPlugin || pluginModule;

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
    cachePath: pluginDir,
  };
}


