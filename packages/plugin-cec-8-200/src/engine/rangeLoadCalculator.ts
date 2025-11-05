// @tradespro/calculation-engine/src/calculators/rangeLoadCalculator.ts
// Pure function calculator for electric range loads per CEC 8-200 1)a)iv

/**
 * Calculate electric range load per CEC 8-200 1)a)iv
 * 
 * Formula:
 * - Rating ≤ 12kW: 6000W
 * - Rating > 12kW: 6000W + 40% of excess over 12kW
 * 
 * @param rangeRating_kW - Range nameplate rating in kilowatts
 * @returns Range demand load in watts
 * 
 * @example
 * calculateRangeLoad(12)   // Returns 6000W
 * calculateRangeLoad(14)   // Returns 6800W (6000 + 0.4 × 2000)
 * calculateRangeLoad(15)   // Returns 7200W (6000 + 0.4 × 3000)
 */
export function calculateRangeLoad(rangeRating_kW: number): number {
  if (rangeRating_kW <= 0) {
    return 0;
  }

  // CEC 8-200 1)a)iv - Electric range demand load
  if (rangeRating_kW <= 12) {
    return 6000;
  }

  const excessKW = rangeRating_kW - 12;
  return 6000 + 0.4 * excessKW * 1000;
}

/**
 * Calculate electric range load with detailed breakdown
 * @param rangeRating_kW - Range nameplate rating in kilowatts
 * @returns Detailed calculation result
 */
export function calculateRangeLoadWithAudit(rangeRating_kW: number): {
  demandW: number;
  baseLoad: number;
  excessKW: number;
  excessDemand: number;
  formula: string;
} {
  if (rangeRating_kW <= 0) {
    return {
      demandW: 0,
      baseLoad: 0,
      excessKW: 0,
      excessDemand: 0,
      formula: 'No range'
    };
  }

  const baseLoad = 6000;
  const excessKW = Math.max(0, rangeRating_kW - 12);
  const excessDemand = excessKW * 1000 * 0.4;
  const demandW = baseLoad + excessDemand;

  let formula: string;
  if (rangeRating_kW <= 12) {
    formula = '6000W (rating <= 12kW)';
  } else {
    formula = `6000W + 40% x (${rangeRating_kW.toFixed(1)}kW - 12kW) x 1000 = ${demandW.toFixed(0)}W`;
  }

  return {
    demandW,
    baseLoad,
    excessKW,
    excessDemand,
    formula
  };
}

/**
 * Validate range rating input
 * @param rangeRating_kW - Rating to validate
 * @returns Validation result
 */
export function validateRangeRating(rangeRating_kW: number): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rangeRating_kW < 0) {
    errors.push('Range rating cannot be negative');
  }

  if (rangeRating_kW > 20) {
    warnings.push(`Range rating ${rangeRating_kW}kW is unusually high for a residential range`);
  }

  if (rangeRating_kW > 0 && rangeRating_kW < 8) {
    warnings.push(`Range rating ${rangeRating_kW}kW is unusually low for an electric range`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}


