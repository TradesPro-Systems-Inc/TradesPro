// services/calculation-service/src/index.ts
// This is the public API for the @tradespro/calculation-service package.
// It exports functions and types intended for use by other packages, like the frontend.

// Core Types
export * from './core/types';

// Core Table Utilities
export * from './core/tables';

// Calculators
export * from './calculators/baseLoadCalculator';
export * from './calculators/cecLoadCalculator';

// Main Calculation Orchestrators
export { calculateSingleDwelling } from './calculators/cecLoadCalculator';