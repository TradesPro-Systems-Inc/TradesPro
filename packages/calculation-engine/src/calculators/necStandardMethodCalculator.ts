// @tradespro/calculation-engine/src/calculators/necStandardMethodCalculator.ts
// NEC Article 220 Part III - Standard Method for Residential Load Calculation
// Pure function - no side effects, deterministic

/**
 * NEC 220.42 - Lighting Load Demand Factors
 * 
 * Apply demand factors to lighting and small appliance loads:
 * - First 3000 VA at 100%
 * - 3001-120000 VA at 35%
 * - Over 120000 VA at 25%
 * 
 * @param totalLightingVA Combined lighting and small appliance load in VA
 * @returns Load after demand factors in VA
 */
export function applyNECLightingDemandFactors(totalLightingVA: number): number {
  if (totalLightingVA <= 0) return 0;
  
  let demandVA = 0;
  
  // First 3000 VA at 100%
  if (totalLightingVA <= 3000) {
    return totalLightingVA;
  }
  
  demandVA = 3000; // First 3000 VA at 100%
  
  // 3001-120000 VA at 35%
  if (totalLightingVA <= 120000) {
    demandVA += (totalLightingVA - 3000) * 0.35;
    return demandVA;
  }
  
  // Over 120000 VA: first 120000 at above rates, remainder at 25%
  demandVA = 3000 + (120000 - 3000) * 0.35; // Up to 120k
  demandVA += (totalLightingVA - 120000) * 0.25; // Over 120k at 25%
  
  return demandVA;
}

/**
 * NEC 220.53 - Appliances Fastened in Place
 * 
 * Apply demand factor to fixed appliances:
 * - 4 or fewer appliances: 100% of nameplate
 * - More than 4 appliances: 75% of nameplate
 * 
 * @param applianceVA Total nameplate rating of fixed appliances in VA
 * @param applianceCount Number of fixed appliances
 * @returns Load after demand factor in VA
 */
export function applyNECApplianceDemandFactor(
  applianceVA: number,
  applianceCount: number
): number {
  if (applianceVA <= 0) return 0;
  
  // NEC 220.53: 75% if more than 4 appliances, otherwise 100%
  if (applianceCount > 4) {
    return applianceVA * 0.75;
  }
  
  return applianceVA;
}

/**
 * NEC 220.54 - Electric Clothes Dryers
 * 
 * Each dryer load: 5000 VA or nameplate rating, whichever is greater
 * Then apply demand factors from Table 220.54
 * 
 * Based on NEC 2023:
 * - Each dryer: 5000 VA or nameplate, whichever is larger
 * - Apply Table 220.54 demand factors for multiple dryers
 * 
 * @param dryerVA Nameplate rating of single dryer in VA (default 5000)
 * @param dryerCount Number of dryers
 * @returns Total dryer load in VA
 */
export function calculateNECDryerLoad(
  dryerVA: number = 5000,
  dryerCount: number = 1
): number {
  if (dryerCount <= 0) return 0;
  
  // NEC 220.54: Each dryer = 5000 VA or nameplate, whichever is larger
  const perDryerVA = Math.max(5000, dryerVA);
  
  // For single dryer, no demand factor
  if (dryerCount === 1) {
    return perDryerVA;
  }
  
  // Table 220.54 demand factors for multiple dryers
  // Common values:
  // 1-4 dryers: 100% each
  // 5 dryers: 85%
  // More dryers: Decreasing demand factors
  
  if (dryerCount <= 4) {
    return perDryerVA * dryerCount; // 100% each
  }
  
  if (dryerCount === 5) {
    return perDryerVA * dryerCount * 0.85; // 85% each
  }
  
  // For 6+ dryers, use decreasing demand factors
  // Simplified approach: use 85% base with gradual reduction
  const baseDemand = 0.85;
  const reduction = Math.min(0.15, (dryerCount - 5) * 0.02); // Max 15% reduction
  const demandFactor = Math.max(0.70, baseDemand - reduction);
  
  return perDryerVA * dryerCount * demandFactor;
}

/**
 * NEC 220.55 - Electric Ranges and Other Cooking Appliances
 * 
 * Calculate range load from Table 220.55:
 * - Single range ≤12 kW: 8000 VA (C column)
 * - Single range >12 kW to ≤27 kW: 8000 VA + 5% per kW over 12 kW
 * - Multiple ranges: Use Table 220.55 demand factors
 * 
 * Based on NEC 2023 Table 220.55:
 * - Column C: Maximum demand (kW) for ranges not exceeding 12 kW rating
 * - Note 1: For ranges over 12 kW to 27 kW, increase C column by 5% per kW over 12
 * 
 * @param rangeVA Nameplate rating of range in VA
 * @param rangeCount Number of ranges (default 1)
 * @returns Total range load in VA
 */
export function calculateNECRangeLoad(
  rangeVA: number,
  rangeCount: number = 1
): number {
  if (rangeVA <= 0) return 0;
  
  const rangeKW = rangeVA / 1000;
  
  // Single range (NEC 220.55 Table 220.55, Column C)
  if (rangeCount === 1) {
    if (rangeKW <= 12) {
      // Table 220.55 Column C: 8000 VA for single range ≤12 kW
      return 8000;
    } else if (rangeKW <= 27) {
      // Note 1: For ranges over 12 kW to 27 kW, increase by 5% per kW over 12
      const excessKW = rangeKW - 12;
      return 8000 + (excessKW * 1000 * 0.05);
    } else {
      // Range over 27 kW: Use nameplate rating
      return rangeVA;
    }
  }
  
  // Multiple ranges: Use Table 220.55 demand factors
  // Table values for multiple ranges (Column C):
  const table220_55: Record<number, number> = {
    1: 8000,
    2: 11000,
    3: 14000,
    4: 17000,
    5: 20000,
    6: 21000,
    7: 22000,
    8: 23000,
    9: 24000,
    10: 25000,
    11: 26000,
    12: 27000,
    13: 28000,
    14: 29000,
    15: 30000
  };
  
  if (rangeCount <= 15 && table220_55[rangeCount]) {
    return table220_55[rangeCount] * 1000; // Convert kW to VA
  }
  
  // For more than 15 ranges, use formula from table
  if (rangeCount <= 30) {
    // 26-30 ranges: 15 kW + 1 kW for each range
    return (15000 + (rangeCount - 25) * 1000);
  } else if (rangeCount <= 40) {
    // 31-40 ranges: 25 kW + 0.75 kW for each range
    return (25000 + (rangeCount - 30) * 750);
  } else {
    // 41+ ranges: Use demand factor from columns A or B
    // Simplified: use 30% demand factor for 41+ ranges
    return rangeVA * rangeCount * 0.30;
  }
}

/**
 * NEC 220.60 - Maximum Demand
 * 
 * For heating and air conditioning:
 * - Use the larger of heating or cooling load
 * - Do not add both (they are typically interlocked)
 * 
 * @param heatingVA Heating load in VA
 * @param coolingVA Air conditioning load in VA
 * @returns Larger of heating or cooling load in VA
 */
export function calculateNECHVACLoad(heatingVA: number, coolingVA: number): number {
  // NEC 220.60: Use the larger of heating or cooling
  return Math.max(heatingVA || 0, coolingVA || 0);
}

