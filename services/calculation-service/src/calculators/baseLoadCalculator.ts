// services/calculation-service/src/calculators/baseLoadCalculator.ts
// Pure function calculator for CEC 8-200 basic load
// No I/O, no side effects, fully deterministic

/**
 * Calculate basic load per CEC 8-200 1)a)i-ii
 * 
 * Formula:
 * - First 90 m²: 5000W
 * - Additional area: 1000W per 90 m² portion (rounded up)
 * 
 * @param livingArea_m2 - Total living area in square meters
 * @returns Basic load in watts
 * 
 * @example
 * calculateBaseLoad(90)   // Returns 5000
 * calculateBaseLoad(91)   // Returns 6000
 * calculateBaseLoad(180)  // Returns 6000
 * calculateBaseLoad(181)  // Returns 7000
 */
export function calculateBaseLoad(livingArea_m2: number): number {
  if (livingArea_m2 <= 0) {
    throw new Error('Living area must be positive');
  }
  
  if (livingArea_m2 <= 90) {
    return 5000;
  }
  
  const additionalArea = livingArea_m2 - 90;
  const additionalPortions = Math.ceil(additionalArea / 90);
  
  return 5000 + (additionalPortions * 1000);
}

/**
 * Calculate intermediate values for audit trail
 * 
 * @param livingArea_m2 - Total living area
 * @returns Object with intermediate calculation values
 */
export function calculateBaseLoadWithAudit(livingArea_m2: number): {
  basicLoad_W: number;
  intermediateValues: {
    firstPortion_m2: number;
    additionalArea_m2: number;
    additionalPortions: number;
  };
} {
  const basicLoad_W = calculateBaseLoad(livingArea_m2);
  
  const firstPortion_m2 = Math.min(livingArea_m2, 90);
  const additionalArea_m2 = Math.max(0, livingArea_m2 - 90);
  const additionalPortions = additionalArea_m2 > 0 ? Math.ceil(additionalArea_m2 / 90) : 0;
  
  return {
    basicLoad_W,
    intermediateValues: {
      firstPortion_m2,
      additionalArea_m2,
      additionalPortions
    }
  };
}

/**
 * Validate living area input
 * 
 * @param livingArea_m2 - Area to validate
 * @returns Validation result with any warnings
 */
export function validateLivingArea(livingArea_m2: number): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (livingArea_m2 <= 0) {
    return { valid: false, warnings: ['Living area must be positive'] };
  }
  
  if (livingArea_m2 < 30) {
    warnings.push('Living area is unusually small (< 30 m²)');
  }
  
  if (livingArea_m2 > 1000) {
    warnings.push('Living area is unusually large (> 1000 m²). Consider using 8-202 for apartment buildings.');
  }
  
  return { valid: true, warnings };
}

/**
 * Calculate living area from floor specifications (CEC 8-110)
 * 
 * Rules:
 * - 100% of ground floor and upper floors
 * - 75% of basement areas with height > 1.8m
 * - 0% of basement areas with height <= 1.8m
 * 
 * @param floors - Array of floor specifications
 * @returns Total calculated living area
 */
export interface FloorSpec {
  area_m2: number;
  height_m?: number;
  type?: 'ground' | 'upper' | 'basement';
  description?: string;
}

export function calculateLivingAreaFromFloors(floors: FloorSpec[]): {
  totalArea_m2: number;
  breakdown: Array<{
    description: string;
    rawArea_m2: number;
    factor: number;
    countedArea_m2: number;
  }>;
} {
  const breakdown: Array<{
    description: string;
    rawArea_m2: number;
    factor: number;
    countedArea_m2: number;
  }> = [];
  
  let totalArea_m2 = 0;
  
  for (const floor of floors) {
    let factor = 1.0;
    let description = floor.description || floor.type || 'Unknown floor';
    
    // Apply CEC 8-110 rules
    if (floor.type === 'basement') {
      const height = floor.height_m || 0;
      if (height > 1.8) {
        factor = 0.75;
        description += ` (height ${height.toFixed(1)}m, counted at 75%)`;
      } else {
        factor = 0;
        description += ` (height ${height.toFixed(1)}m, not counted)`;
      }
    }
    
    const countedArea = floor.area_m2 * factor;
    totalArea_m2 += countedArea;
    
    breakdown.push({
      description,
      rawArea_m2: floor.area_m2,
      factor,
      countedArea_m2: countedArea
    });
  }
  
  return {
    totalArea_m2,
    breakdown
  };
}