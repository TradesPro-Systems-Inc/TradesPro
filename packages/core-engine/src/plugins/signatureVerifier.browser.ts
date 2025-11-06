// @tradespro/core-engine/src/plugins/signatureVerifier.browser.ts
// Browser-safe stub for signature verifier
// This module is disabled in the browser for security and compatibility reasons.

export interface VerificationResult {
  checksumValid: boolean;
  signatureValid: boolean;
  errors: string[];
}

export const computeChecksum = () => 'browser-stub';
export const verifyChecksum = () => true;
export const verifySignature = () => true;
export const signManifest = () => 'browser-stub';
export const loadPemFromFile = () => 'browser-stub';
export const verifyManifestIntegrity = (): VerificationResult => ({
  checksumValid: true,
  signatureValid: true,
  errors: [],
});

export default {
  computeChecksum,
  verifyChecksum,
  signManifest,
  verifySignature,
  verifyManifestIntegrity,
  loadPemFromFile,
};