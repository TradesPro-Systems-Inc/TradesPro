// @tradespro/calculation-engine/src/calculators/largeLoadCalculator.ts
// Pure function calculator for other large loads per CEC 8-200 1)a)vii

/**
 * Calculate demand for other large loads (>1500W) per CEC 8-200 1)a)vii
 * 
 * Rules:
 * A) If electric range is present: 25% of total large loads
 * B) If no electric range:
 *    - First 6000W at 100%
 *    - Excess over 6000W at 25%
 * 
 * @param totalLargeLoadW - Sum of all other large loads (>1500W each) in watts
 * @param hasElectricRange - Whether an electric range is present
 * @returns Demand load for other large loads in watts
 * 
 * @example
 * calculateLargeLoads(5000, false)   // Returns 5000W (no range, <=6000W)
 * calculateLargeLoads(8000, false)   // Returns 6500W (no range: 6000 + 0.25x2000)
 * calculateLargeLoads(8000, true)    // Returns 2000W (range present: 0.25x8000)
 */
export function calculateLargeLoads(
  totalLargeLoadW: number,
  hasElectricRange: boolean
): number {
  if (totalLargeLoadW <= 0) {
    return 0;
  }

  if (hasElectricRange) {
    // CEC 8-200 1)a)vii A): 25% demand factor when range present
    return totalLargeLoadW * 0.25;
  } else {
    // CEC 8-200 1)a)vii B): 100% up to 6000W + 25% of excess
    if (totalLargeLoadW <= 6000) {
      return totalLargeLoadW;
    } else {
      return 6000 + (totalLargeLoadW - 6000) * 0.25;
    }
  }
}

/**
 * Calculate large loads with detailed breakdown
 * @param totalLargeLoadW - Sum of all other large loads (>1500W each) in watts
 * @param hasElectricRange - Whether an electric range is present
 * @returns Detailed calculation result
 */
export function calculateLargeLoadsWithAudit(
  totalLargeLoadW: number,
  hasElectricRange: boolean
): {
  demandW: number;
  upTo6000W: number;
  over6000W: number;
  demandFactor: number;
  formula: string;
  ruleReference: string;
} {
  if (totalLargeLoadW <= 0) {
    return {
      demandW: 0,
      upTo6000W: 0,
      over6000W: 0,
      demandFactor: 0,
      formula: 'No large loads',
      ruleReference: ''
    };
  }

  if (hasElectricRange) {
    // Case A: Range present
    const demandW = totalLargeLoadW * 0.25;
    return {
      demandW,
      upTo6000W: 0,
      over6000W: 0,
      demandFactor: 0.25,
      formula: `Large loads (range present): ${totalLargeLoadW}W x 25% = ${demandW}W`,
      ruleReference: 'CEC 8-200 1)a)vii A)'
    };
  } else {
    // Case B: No range
    const upTo6000W = Math.min(totalLargeLoadW, 6000);
    const over6000W = Math.max(0, totalLargeLoadW - 6000);
    const demandW = upTo6000W + over6000W * 0.25;

    let formula: string;
    if (totalLargeLoadW <= 6000) {
      formula = `Large loads (no range): ${totalLargeLoadW}W x 100% = ${demandW}W`;
    } else {
      formula = `Large loads (no range): ${upTo6000W}W x 100% + ${over6000W}W x 25% = ${demandW}W`;
    }

    return {
      demandW,
      upTo6000W,
      over6000W,
      demandFactor: demandW / totalLargeLoadW,
      formula,
      ruleReference: 'CEC 8-200 1)a)vii B)'
    };
  }
}

/**
 * Categorize appliances into large (>1500W) and small (<=1500W)
 * @param appliances - Array of appliances with wattage ratings
 * @returns Categorized appliances
 */
export function categorizeAppliances(
  appliances: Array<{ watts: number; name?: string }>
): {
  largeLoads: Array<{ watts: number; name?: string }>;
  smallLoads: Array<{ watts: number; name?: string }>;
  totalLargeW: number;
  totalSmallW: number;
} {
  const largeLoads: Array<{ watts: number; name?: string }> = [];
  const smallLoads: Array<{ watts: number; name?: string }> = [];
  let totalLargeW = 0;
  let totalSmallW = 0;

  for (const appliance of appliances) {
    if (appliance.watts > 1500) {
      largeLoads.push(appliance);
      totalLargeW += appliance.watts;
    } else {
      smallLoads.push(appliance);
      totalSmallW += appliance.watts;
    }
  }

  return {
    largeLoads,
    smallLoads,
    totalLargeW,
    totalSmallW
  };
}

/**
 * Validate large load calculations
 * @param totalLargeLoadW - Total large loads to validate
 * @returns Validation result
 */
export function validateLargeLoads(totalLargeLoadW: number): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (totalLargeLoadW < 0) {
    errors.push('Total large loads cannot be negative');
  }

  if (totalLargeLoadW > 50000) {
    warnings.push(`Total large loads ${totalLargeLoadW}W is unusually high for a single dwelling`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}


