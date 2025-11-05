// @tradespro/core-engine/src/tools/verifyPlugin.ts
// Plugin Verification Tool - Verify plugin signature and checksum
// Usage: node verifyPlugin.js <plugin-dir> [--public-key <key-path>]

import fs from 'fs';
import path from 'path';
import { 
  verifyManifestIntegrity, 
  loadPemFromFile
} from '../plugins/signatureVerifier';
import { readPluginManifest as readManifest } from './pluginPackager';

export interface VerifyOptions {
  publicKeyPath?: string;
  publicKeyPem?: string;
  requireSignature?: boolean;
}

/**
 * Verify plugin package
 */
export function verifyPlugin(
  pluginDir: string,
  options: VerifyOptions = {}
): {
  valid: boolean;
  checksumValid: boolean;
  signatureValid: boolean;
  errors: string[];
} {
  try {
    // Read manifest
    const manifest = readManifest(pluginDir);

    // Load public key if provided
    let publicKeyPem: string | undefined = options.publicKeyPem;
    if (options.publicKeyPath && !publicKeyPem) {
      publicKeyPem = loadPemFromFile(options.publicKeyPath);
    }

    // Extract checksum and signature before verification
    const { checksum, signature, ...manifestWithoutChecksum } = manifest;
    
    // Verify integrity
    const result = verifyManifestIntegrity(manifestWithoutChecksum, {
      expectedChecksum: checksum,
      signature: signature,
      publicKeyPem,
      publicKeyPath: options.publicKeyPath,
      requireSignature: options.requireSignature,
    });

    return {
      valid: result.checksumValid && (result.signatureValid || !options.requireSignature),
      checksumValid: result.checksumValid,
      signatureValid: result.signatureValid,
      errors: result.errors,
    };
  } catch (error) {
    return {
      valid: false,
      checksumValid: false,
      signatureValid: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * CLI entry point
 */
export function runVerifier(args: string[]): void {
  const pluginDir = args[0];
  if (!pluginDir) {
    console.error('Usage: verifyPlugin <plugin-dir> [--public-key <key-path>] [--require-signature]');
    process.exit(1);
  }

  const options: VerifyOptions = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--public-key' && args[i + 1]) {
      options.publicKeyPath = args[i + 1];
      i++;
    } else if (args[i] === '--require-signature') {
      options.requireSignature = true;
    }
  }

  try {
    console.log(`🔍 Verifying plugin: ${pluginDir}`);
    const result = verifyPlugin(pluginDir, options);

    if (result.valid) {
      console.log(`✅ Plugin verification PASSED`);
      console.log(`   Checksum: ${result.checksumValid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Signature: ${result.signatureValid ? '✅ Valid' : '⚠️  Not verified'}`);
    } else {
      console.error(`❌ Plugin verification FAILED`);
      result.errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// CLI entry point if run directly
if (require.main === module) {
  runVerifier(process.argv.slice(2));
}

