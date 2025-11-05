// @tradespro/calculation-engine/src/plugins/signatureVerifier.ts
// V4.1 Plugin System - Signature Verifier
// Provides manifest checksum and signature verification (SHA-256 + RSA/ECDSA)

import crypto from 'crypto';
import { readFileSync } from 'fs';

/**
 * Canonicalize object for stable JSON serialization
 */
function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

/**
 * Get canonical manifest bytes (excluding signature field)
 */
function canonicalManifestBytes(manifestObj: any, excludeSignature = true): Buffer {
  // Remove signature from manifest for signing/verification
  const toCanonicalize = excludeSignature && manifestObj.signature
    ? { ...manifestObj, signature: undefined }
    : manifestObj;
  return Buffer.from(canonicalize(toCanonicalize), 'utf8');
}

/**
 * computeChecksum(manifestObject)
 * - Computes SHA-256 hex of canonicalized JSON (for package integrity check)
 */
export function computeChecksum(manifestObj: any): string {
  const canon = canonicalize(manifestObj);
  const hash = crypto.createHash('sha256').update(canon, 'utf8').digest('hex');
  return hash;
}

/**
 * verifyChecksum(manifestObj, expectedChecksum)
 * - Verifies manifest checksum matches expected value
 */
export function verifyChecksum(manifestObj: any, expectedChecksum: string): boolean {
  const actual = computeChecksum(manifestObj);
  return actual === expectedChecksum;
}

/**
 * verifySignature(manifestObj, signatureBase64, publicKeyPem, algorithm)
 * - Verifies manifest signature using RSA/ECDSA public key
 * - signatureBase64: base64-encoded signature
 * - algorithm: signature algorithm (default "RSA-SHA256")
 */
export function verifySignature(
  manifestObj: any,
  signatureBase64: string,
  publicKeyPem: string,
  algorithm: 'RSA-SHA256' | 'RSA-SHA1' | 'ecdsa-with-SHA256' = 'RSA-SHA256'
): boolean {
  try {
    // Get canonical manifest bytes (excluding signature)
    const canon = canonicalManifestBytes(manifestObj, true);
    const signature = Buffer.from(signatureBase64, 'base64');
    
    // Create verifier
    const verify = crypto.createVerify('sha256');
    verify.update(canon);
    verify.end();
    
    // Verify signature
    return verify.verify(publicKeyPem, signature);
  } catch (error) {
    console.error('[SignatureVerifier] Verification error:', error);
    return false;
  }
}

/**
 * signManifest(manifestObj, privateKeyPem)
 * - Signs manifest and returns base64-encoded signature
 * - Used by plugin packager/installer
 */
export function signManifest(manifestObj: any, privateKeyPem: string): string {
  // Get canonical manifest bytes (excluding signature if present)
  const canon = canonicalManifestBytes(manifestObj, true);
  
  // Create signer
  const sign = crypto.createSign('sha256');
  sign.update(canon);
  sign.end();
  
  // Sign and return base64
  const sig = sign.sign(privateKeyPem);
  return sig.toString('base64');
}

/**
 * Load PEM file from path
 */
export function loadPemFromFile(pemPath: string): string {
  return readFileSync(pemPath, 'utf8');
}

/**
 * Verify manifest integrity (checksum + signature)
 * - Returns object with verification results
 */
export interface VerificationResult {
  checksumValid: boolean;
  signatureValid: boolean;
  errors: string[];
}

export function verifyManifestIntegrity(
  manifestObj: any,
  options?: {
    expectedChecksum?: string;
    signature?: string;
    publicKeyPem?: string;
    publicKeyPath?: string;
    requireSignature?: boolean;
  }
): VerificationResult {
  const errors: string[] = [];
  let checksumValid = true;
  let signatureValid = true;

  // Verify checksum if provided
  if (options?.expectedChecksum) {
    checksumValid = verifyChecksum(manifestObj, options.expectedChecksum);
    if (!checksumValid) {
      errors.push('Checksum verification failed');
    }
  }

  // Verify signature if provided
  if (options?.signature || manifestObj.signature) {
    const signature = options?.signature || manifestObj.signature;
    let publicKeyPem = options?.publicKeyPem;
    
    if (options?.publicKeyPath && !publicKeyPem) {
      publicKeyPem = loadPemFromFile(options.publicKeyPath);
    }

    if (!publicKeyPem) {
      errors.push('Public key not provided for signature verification');
      signatureValid = false;
    } else {
      signatureValid = verifySignature(manifestObj, signature, publicKeyPem);
      if (!signatureValid) {
        errors.push('Signature verification failed');
      }
    }
  } else if (options?.requireSignature) {
    errors.push('Signature required but not provided');
    signatureValid = false;
  }

  return {
    checksumValid,
    signatureValid,
    errors,
  };
}

export default {
  computeChecksum,
  verifyChecksum,
  signManifest,
  verifySignature,
  verifyManifestIntegrity,
  loadPemFromFile,
};
