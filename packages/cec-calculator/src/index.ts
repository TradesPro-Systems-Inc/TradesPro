// @tradespro/calculation-engine/src/index.ts
// Main entry point for the shared calculation engine

// Export all types
export * from './core/types';

// Export all calculators
export * from './calculators/baseLoadCalculator';
export * from './calculators/heatingCoolingCalculator';
export * from './calculators/applianceLoadCalculator';

// Export table lookup functions and manager
export * from './core/tableLookups';
export * from './core/tables';

// Export main calculation coordinator
export * from './rules/8-200-single-dwelling';

// Re-export main function for convenience
export { computeSingleDwelling } from './rules/8-200-single-dwelling';
