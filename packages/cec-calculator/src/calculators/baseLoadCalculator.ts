// @tradespro/calculation-engine/src/calculators/baseLoadCalculator.ts
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
  return 5000 + additionalPortions * 1000;
}

/**
 * Calculate basic load with detailed audit trail
 * @param livingArea_m2 - Total living area in square meters
 * @returns Detailed breakdown of basic load calculation
 */
export function calculateBaseLoadWithAudit(livingArea_m2: number): {
  loadW: number;
  breakdown: string;
} {
  if (livingArea_m2 <= 0) {
    throw new Error('Living area must be positive');
  }
  
  if (livingArea_m2 <= 90) {
    return {
      loadW: 5000,
      breakdown: `First 90m²: 5000W`
    };
  }
  
  const additionalArea = livingArea_m2 - 90;
  const additionalPortions = Math.ceil(additionalArea / 90);
  const totalLoad = 5000 + additionalPortions * 1000;
  
  return {
    loadW: totalLoad,
    breakdown: `First 90m²: 5000W + ${additionalPortions} additional portions × 1000W = ${totalLoad}W`
  };
}

/**
 * Validate living area input
 * @param livingArea_m2 - Area to validate
 * @returns Validation result with errors/warnings
 */
export function validateLivingArea(livingArea_m2: number): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (livingArea_m2 < 0) {
    errors.push('Living area cannot be negative');
  }
  
  if (livingArea_m2 === 0) {
    warnings.push('Living area is 0 - basic load will be 0W');
  }
  
  if (livingArea_m2 > 1000) {
    warnings.push('Living area is unusually large (>1000m²)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Floor specification for area calculation
 */
export interface FloorSpec {
  area_m2: number;
  height_m?: number;
  isCountable?: boolean;
}

/**
 * Calculate living area from floor specifications
 * @param floors - Array of floor specifications
 * @returns Total countable living area with breakdown
 */
export function calculateLivingAreaFromFloors(floors: FloorSpec[]): {
  totalArea_m2: number;
  breakdown: Array<{
    description: string;
    rawArea_m2: number;
    factor: number;
    countedArea_m2: number;
  }>;
} {
  let totalArea_m2 = 0;
  const breakdown: Array<{
    description: string;
    rawArea_m2: number;
    factor: number;
    countedArea_m2: number;
  }> = [];
  
  for (const floor of floors) {
    let factor = 1;
    let description = `Floor: ${floor.area_m2}m²`;
    
    // Apply height factor if specified
    if (floor.height_m !== undefined) {
      if (floor.height_m >= 2.4) {
        factor = 1;
        description += ` (height ${floor.height_m.toFixed(1)}m, full area)`;
      } else if (floor.height_m >= 1.8) {
        factor = 0.5;
        description += ` (height ${floor.height_m.toFixed(1)}m, 50% factor)`;
      } else {
        factor = 0;
        description += ` (height ${floor.height_m.toFixed(1)}m, not counted)`;
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
