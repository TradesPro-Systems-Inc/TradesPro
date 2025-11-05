/**
 * @file heatingCoolingCalculator.ts
 * @description Pure calculator for HVAC loads according to CEC 62-118 3) and 8-106 3).
 */

/**
 * Calculates the demand load for heating and cooling systems.
 * - Applies CEC 62-118 3) demand factor for space heating (>10kW).
 * - Applies CEC 8-106 3) for interlocked systems.
 * @param heatingLoadW - The total connected heating load in watts.
 * @param coolingLoadW - The total connected cooling load in watts.
 * @param isInterlocked - True if the heating and cooling systems are interlocked.
 * @returns The calculated HVAC demand load in watts.
 */
export function calculateHeatingCoolingLoad(heatingLoadW: number, coolingLoadW: number, isInterlocked: boolean): number {
  // CEC 62-118 3) Demand factor for space heating
  const heatingDemand = heatingLoadW <= 10000
    ? heatingLoadW
    : 10000 + (heatingLoadW - 10000) * 0.75;

  // CEC 8-106 3) Interlock rule
  return isInterlocked
    ? Math.max(heatingDemand, coolingLoadW)
    : heatingDemand + coolingLoadW;
}
