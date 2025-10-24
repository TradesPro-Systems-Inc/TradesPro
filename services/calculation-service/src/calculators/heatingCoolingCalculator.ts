// services/calculation-service/src/calculators/heatingCoolingCalculator.ts
// Pure function calculator for HVAC loads per CEC 8-200 1)a)iii)

/**
 * Calculate heating and cooling loads per CEC 8-200 1)a)iii)
 * 
 * @param heatingLoadW - Heating load in watts
 * @param coolingLoadW - Cooling load in watts  
 * @param isInterlocked - Whether heating and AC are interlocked
 * @returns Total HVAC load in watts
 */
export function calculateHeatingCoolingLoad(
  heatingLoadW: number,
  coolingLoadW: number,
  isInterlocked: boolean = false
): number {
  if (heatingLoadW <= 0 && coolingLoadW <= 0) {
    return 0;
  }

  // If interlocked, use the larger of the two loads
  if (isInterlocked) {
    return Math.max(heatingLoadW, coolingLoadW);
  }

  // If not interlocked, sum both loads
  return heatingLoadW + coolingLoadW;
}
