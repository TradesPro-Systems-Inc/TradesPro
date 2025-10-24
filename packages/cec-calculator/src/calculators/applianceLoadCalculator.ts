// @tradespro/calculation-engine/src/calculators/applianceLoadCalculator.ts
// Pure function calculators for appliance loads per CEC 8-200

/**
 * Calculate electric range load per CEC 8-200 1)a)iv)
 * 
 * @param rangeRatingkW - Range rating in kilowatts
 * @returns Range load in watts
 */
export function calculateRangeLoad(rangeRatingkW: number): number {
  if (rangeRatingkW <= 0) {
    return 0;
  }

  // CEC 8-200 1)a)iv) - Electric ranges
  // Use the rating as-is for now (simplified)
  return rangeRatingkW * 1000; // Convert kW to W
}

/**
 * Calculate other large loads per CEC 8-200 1)a)vii)
 * 
 * @param totalLargeLoadW - Total of all large loads (>1500W) in watts
 * @param hasRange - Whether there is an electric range
 * @returns Other large loads demand in watts
 */
export function calculateOtherLargeLoads(
  totalLargeLoadW: number,
  hasRange: boolean
): number {
  if (totalLargeLoadW <= 0) {
    return 0;
  }

  // CEC 8-200 1)a)vii) - Other large loads
  if (hasRange) {
    // 25% demand factor when range is present
    return totalLargeLoadW * 0.25;
  } else {
    // 100% up to 6000W + 25% above 6000W when no range
    if (totalLargeLoadW <= 6000) {
      return totalLargeLoadW;
    } else {
      return 6000 + (totalLargeLoadW - 6000) * 0.25;
    }
  }
}
