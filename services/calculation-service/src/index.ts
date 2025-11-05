// services/calculation-service/src/index.ts
// This is the public API for the @tradespro/calculation-service package.
// 
// Note: With V5 architecture, most calculation logic has been moved to:
// - @tradespro/core-engine (plugin system and interfaces)
// - @tradespro/plugin-cec-8-200 (CEC calculation logic)
//
// This service now only provides the HTTP API wrapper.

export { default } from './server';
