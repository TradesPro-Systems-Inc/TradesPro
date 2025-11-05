// @tradespro/calculation-engine/src/plugins/__tests__/signatureVerifier.test.ts
// Tests for Signature Verifier

import {
  computeChecksum,
  verifyChecksum,
  signManifest,
  verifySignature,
} from '../signatureVerifier';
import crypto from 'crypto';

describe('Signature Verifier', () => {
  const createTestManifest = () => ({
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    domain: 'electrical',
    standards: ['CEC-2024'],
    buildingTypes: ['single-dwelling'],
    capabilities: {
      offline: true,
      audit: true,
      signing: true,
      preview: true,
    },
  });

  test('should compute checksum for manifest', () => {
    const manifest = createTestManifest();
    const checksum = computeChecksum(manifest);

    expect(checksum).toBeTruthy();
    expect(typeof checksum).toBe('string');
    expect(checksum.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  test('should produce same checksum for identical manifests', () => {
    const manifest1 = createTestManifest();
    const manifest2 = createTestManifest();

    const checksum1 = computeChecksum(manifest1);
    const checksum2 = computeChecksum(manifest2);

    expect(checksum1).toBe(checksum2);
  });

  test('should produce different checksums for different manifests', () => {
    const manifest1 = createTestManifest();
    const manifest2 = { ...createTestManifest(), version: '1.0.1' };

    const checksum1 = computeChecksum(manifest1);
    const checksum2 = computeChecksum(manifest2);

    expect(checksum1).not.toBe(checksum2);
  });

  test('should verify correct checksum', () => {
    const manifest = createTestManifest();
    const checksum = computeChecksum(manifest);

    expect(verifyChecksum(manifest, checksum)).toBe(true);
  });

  test('should reject incorrect checksum', () => {
    const manifest = createTestManifest();
    const wrongChecksum = 'a'.repeat(64); // Invalid checksum

    expect(verifyChecksum(manifest, wrongChecksum)).toBe(false);
  });

  test('should sign and verify manifest with RSA key', () => {
    // Generate RSA key pair for testing
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const manifest = createTestManifest();
    const signature = signManifest(manifest, privateKey);

    expect(signature).toBeTruthy();
    expect(typeof signature).toBe('string');

    const isValid = verifySignature(manifest, signature, publicKey);
    expect(isValid).toBe(true);
  });

  test('should reject signature for modified manifest', () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const manifest = createTestManifest();
    const signature = signManifest(manifest, privateKey);

    const modifiedManifest = { ...manifest, version: '1.0.1' };
    const isValid = verifySignature(modifiedManifest, signature, publicKey);

    expect(isValid).toBe(false);
  });

  test('should reject signature with wrong key', () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const { publicKey: wrongPublicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const manifest = createTestManifest();
    const signature = signManifest(manifest, privateKey);

    const isValid = verifySignature(manifest, signature, wrongPublicKey);
    expect(isValid).toBe(false);
  });
});





