// @tradespro/calculation-engine/src/calculators/necBaseLoadCalculator.ts
// NEC Article 220 - General Lighting and Small Appliance Load Calculation
// Pure function - no side effects, deterministic

/**
 * NEC 220.12 - General Lighting Load
 * 
 * Calculate general lighting load based on area:
 * - Residential: 3 VA per square foot
 * 
 * @param livingArea_ft2 Living area in square feet
 * @returns General lighting load in VA
 */
export function calculateNECGeneralLighting(livingArea_ft2: number): number {
  if (livingArea_ft2 <= 0) return 0;
  
  // NEC 220.12: General lighting = 3 VA per square foot for residential
  return livingArea_ft2 * 3;
}

/**
 * NEC 220.52 - Small Appliance Branch Circuits
 * 
 * Small appliance circuits for residential:
 * - 2 circuits × 1500 VA (kitchen)
 * - 1 circuit × 1500 VA (laundry)
 * 
 * @returns Small appliance load in VA
 */
export function calculateNECSmallApplianceLoad(): number {
  // NEC 220.52: 2×1500 VA (kitchen) + 1500 VA (laundry) = 4500 VA
  return (2 * 1500) + 1500;
}

/**
 * NEC 220.82 - Optional Method for Single Dwelling
 * 
 * Calculate general load using optional method:
 * - General load = 3 VA/ft² × area
 * - First 10 kVA at 100%
 * - Remainder at 40%
 * 
 * @param livingArea_ft2 Living area in square feet
 * @param applianceVA Total appliance load in VA
 * @returns General load after demand factors in VA
 */
export function calculateNECOptionalGeneralLoad(
  livingArea_ft2: number,
  applianceVA: number
): number {
  // General load (lighting + small appliance + fixed appliances)
  const generalLoad = calculateNECGeneralLighting(livingArea_ft2) + 
                       calculateNECSmallApplianceLoad() + 
                       applianceVA;
  
  // NEC 220.82(B): First 10 kVA at 100%, remainder at 40%
  if (generalLoad <= 10000) {
    return generalLoad; // 100% of first 10 kVA
  }
  
  return 10000 + (generalLoad - 10000) * 0.4; // 100% first 10k + 40% remainder
}

