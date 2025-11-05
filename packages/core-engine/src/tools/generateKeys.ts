// @tradespro/core-engine/src/tools/generateKeys.ts
// Key Generation Tool - Generate RSA key pair for plugin signing

import fs from 'fs';
import path from 'path';
import { generateKeyPair } from './pluginPackager';

/**
 * Generate and save key pair
 */
export function generateAndSaveKeys(
  outputDir: string = './keys',
  keyName: string = 'plugin-signing'
): { privateKeyPath: string; publicKeyPath: string } {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate keys
  const { privateKey, publicKey } = generateKeyPair();

  // Save keys
  const privateKeyPath = path.join(outputDir, `${keyName}.private.pem`);
  const publicKeyPath = path.join(outputDir, `${keyName}.public.pem`);

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  // Set restrictive permissions on private key (Unix-like systems)
  if (process.platform !== 'win32') {
    fs.chmodSync(privateKeyPath, 0o600);
  }

  console.log(`✅ Key pair generated:`);
  console.log(`   Private key: ${privateKeyPath}`);
  console.log(`   Public key: ${publicKeyPath}`);
  console.log(`\n⚠️  Keep your private key secure! Never commit it to version control.`);

  return { privateKeyPath, publicKeyPath };
}

/**
 * CLI entry point
 */
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const outputDir = args[0] || './keys';
    const keyName = args[1] || 'plugin-signing';

    generateAndSaveKeys(outputDir, keyName);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

