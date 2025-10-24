/**
 * @file applianceLoadCalculator.ts
 * @description Pure calculator for various appliance loads (range, other large loads).
 */

/**
 * Calculates the demand load for a single electric range.
 * CEC 8-200 1)a)iv)
 * @param rating_kW - The rating of the range in kW.
 * @returns The calculated demand load in watts.
 */
export function calculateRangeLoad(rating_kW: number): number {
  if (rating_kW <= 1.5) return 0; // Per 8-200 1)a)iv), applies to ranges > 1.5kW
  if (rating_kW <= 12) return 6000;
  return 6000 + (rating_kW * 1000 - 12000) * 0.4;
}

/**
 * Calculates the demand for other large, non-continuous loads.
 * CEC 8-200 1)a)viii)
 * @param totalLargeLoadW - The sum of all other large loads (>1500W).
 * @param hasRange - True if an electric range is present in the dwelling.
 * @returns The calculated demand load in watts.
 */
export function calculateOtherLargeLoads(totalLargeLoadW: number, hasRange: boolean): number {
  if (totalLargeLoadW === 0) return 0;

  if (hasRange) {
    // CEC 8-200 1)a)viii) A) - 25% of loads > 1500W
    return totalLargeLoadW * 0.25;
  } else {
    // CEC 8-200 1)a)viii) B) - 100% of first 6000W, 25% of remainder
    const first6000W = Math.min(totalLargeLoadW, 6000);
    const remainder = Math.max(0, totalLargeLoadW - 6000);
    return first6000W + remainder * 0.25;
  }
}