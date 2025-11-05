// @tradespro/calculation-engine/src/calculators/waterHeaterCalculator.ts
// Pure function calculator for water heater loads per CEC 8-200 1)a)v

/**
 * Water heater types per CEC definitions
 */
export type WaterHeaterType = 'tankless' | 'storage' | 'pool_spa' | 'none';

/**
 * Calculate water heater load per CEC 8-200 1)a)v and Section 62
 * 
 * Rules:
 * - Tankless water heaters: 100% of nameplate rating
 * - Pool/spa heaters: 100% of nameplate rating
 * - Storage water heaters: 100% of nameplate rating (per CEC Section 62)
 * 
 * Note: All electric water heaters are calculated at 100% demand.
 * 
 * @param ratingW - Water heater nameplate rating in watts
 * @param type - Type of water heater
 * @returns Water heater demand load in watts
 * 
 * @example
 * calculateWaterHeaterLoad(4500, 'tankless')  // Returns 4500W
 * calculateWaterHeaterLoad(4500, 'storage')   // Returns 4500W
 * calculateWaterHeaterLoad(5500, 'pool_spa')  // Returns 5500W
 */
export function calculateWaterHeaterLoad(
  ratingW: number,
  type: WaterHeaterType = 'storage'
): number {
  if (ratingW <= 0 || type === 'none') {
    return 0;
  }

  // Per CEC 8-200 1)a)v and Section 62
  // All electric water heaters at 100% demand
  return ratingW;
}

/**
 * Calculate water heater load with detailed breakdown
 * @param ratingW - Water heater nameplate rating in watts
 * @param type - Type of water heater
 * @returns Detailed calculation result
 */
export function calculateWaterHeaterLoadWithAudit(
  ratingW: number,
  type: WaterHeaterType = 'storage'
): {
  demandW: number;
  demandFactor: number;
  formula: string;
  ruleReference: string;
} {
  if (ratingW <= 0 || type === 'none') {
    return {
      demandW: 0,
      demandFactor: 0,
      formula: 'No water heater',
      ruleReference: ''
    };
  }

  const demandFactor = 1.0; // 100% for all types
  const demandW = ratingW * demandFactor;

  let typeDescription: string;
  let ruleReference: string;

  switch (type) {
    case 'tankless':
      typeDescription = 'Tankless water heater';
      ruleReference = 'CEC 8-200 1)a)v';
      break;
    case 'pool_spa':
      typeDescription = 'Pool/spa heater';
      ruleReference = 'CEC 8-200 1)a)v';
      break;
    case 'storage':
    default:
      typeDescription = 'Storage water heater';
      ruleReference = 'CEC 8-200 1)a)v + Section 62';
      break;
  }

  const formula = `${typeDescription}: ${ratingW}W x 100% = ${demandW}W`;

  return {
    demandW,
    demandFactor,
    formula,
    ruleReference
  };
}

/**
 * Validate water heater rating input
 * @param ratingW - Rating to validate
 * @param type - Type of water heater
 * @returns Validation result
 */
export function validateWaterHeaterRating(
  ratingW: number,
  type: WaterHeaterType
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (ratingW < 0) {
    errors.push('Water heater rating cannot be negative');
  }

  if (type === 'tankless' && ratingW > 0 && ratingW < 3000) {
    warnings.push(`Tankless water heater rating ${ratingW}W is unusually low (typically 4000W+)`);
  }

  if (type === 'storage' && ratingW > 6000) {
    warnings.push(`Storage water heater rating ${ratingW}W is unusually high (typically <=6000W)`);
  }

  if (type === 'pool_spa' && ratingW > 15000) {
    warnings.push(`Pool/spa heater rating ${ratingW}W is unusually high`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}


