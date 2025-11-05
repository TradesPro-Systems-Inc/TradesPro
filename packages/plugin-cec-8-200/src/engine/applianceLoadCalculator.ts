// @tradespro/calculation-engine/src/calculators/applianceLoadCalculator.ts
// Re-export specialized appliance calculators for backward compatibility

// Re-export range calculator
export { 
  calculateRangeLoad,
  calculateRangeLoadWithAudit,
  validateRangeRating
} from './rangeLoadCalculator';

// Re-export water heater calculator
export {
  calculateWaterHeaterLoad,
  calculateWaterHeaterLoadWithAudit,
  validateWaterHeaterRating,
  type WaterHeaterType
} from './waterHeaterCalculator';

// Re-export EVSE calculator
export {
  calculateEVSELoad,
  calculateEVSELoadWithAudit,
  validateEVSERating
} from './evseCalculator';

// Re-export large load calculator
export {
  calculateLargeLoads as calculateOtherLargeLoads,
  calculateLargeLoadsWithAudit,
  categorizeAppliances,
  validateLargeLoads
} from './largeLoadCalculator';
