// @tradespro/calculation-engine/src/calculators/evseCalculator.ts
// Pure function calculator for EVSE (Electric Vehicle Supply Equipment) loads per CEC 8-200 1)a)vi and 8-106 11

/**
 * Calculate EVSE load per CEC 8-200 1)a)vi and CEC 8-106 11
 * 
 * Rules:
 * - EVSE with EVEMS (Energy Management System): 0W (exempted per 8-106 11)
 * - EVSE without EVEMS: 100% of nameplate rating
 * 
 * @param ratingW - EVSE nameplate rating in watts
 * @param hasEVEMS - Whether the EVSE is managed by an Energy Management System
 * @returns EVSE demand load in watts
 * 
 * @example
 * calculateEVSELoad(7200, false)  // Returns 7200W (100%, no EVEMS)
 * calculateEVSELoad(7200, true)   // Returns 0W (exempted by EVEMS)
 */
export function calculateEVSELoad(
  ratingW: number,
  hasEVEMS: boolean = false
): number {
  if (ratingW <= 0) {
    return 0;
  }

  // CEC 8-106 11: EVSE with EVEMS can be exempted from load calculation
  if (hasEVEMS) {
    return 0;
  }

  // CEC 8-200 1)a)vi: EVSE without EVEMS at 100%
  return ratingW;
}

/**
 * Calculate EVSE load with detailed breakdown
 * @param ratingW - EVSE nameplate rating in watts
 * @param hasEVEMS - Whether the EVSE is managed by an Energy Management System
 * @returns Detailed calculation result
 */
export function calculateEVSELoadWithAudit(
  ratingW: number,
  hasEVEMS: boolean = false
): {
  demandW: number;
  demandFactor: number;
  formula: string;
  ruleReference: string;
  isExempted: boolean;
} {
  if (ratingW <= 0) {
    return {
      demandW: 0,
      demandFactor: 0,
      formula: 'No EVSE',
      ruleReference: '',
      isExempted: false
    };
  }

  if (hasEVEMS) {
    return {
      demandW: 0,
      demandFactor: 0,
      formula: `EVSE ${ratingW}W exempted (managed by EVEMS)`,
      ruleReference: 'CEC 8-106 11',
      isExempted: true
    };
  }

  return {
    demandW: ratingW,
    demandFactor: 1.0,
    formula: `EVSE: ${ratingW}W x 100% = ${ratingW}W (no EVEMS)`,
    ruleReference: 'CEC 8-200 1)a)vi',
    isExempted: false
  };
}

/**
 * Validate EVSE rating input
 * @param ratingW - Rating to validate
 * @returns Validation result
 */
export function validateEVSERating(ratingW: number): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (ratingW < 0) {
    errors.push('EVSE rating cannot be negative');
  }

  // Common EVSE power levels
  const commonLevels = [
    { level: 'Level 1 (120V, 12A)', watts: 1440 },
    { level: 'Level 1 (120V, 16A)', watts: 1920 },
    { level: 'Level 2 (240V, 16A)', watts: 3840 },
    { level: 'Level 2 (240V, 20A)', watts: 4800 },
    { level: 'Level 2 (240V, 30A)', watts: 7200 },
    { level: 'Level 2 (240V, 40A)', watts: 9600 },
    { level: 'Level 2 (240V, 50A)', watts: 12000 },
    { level: 'Level 2 (240V, 60A)', watts: 14400 },
  ];

  if (ratingW > 0 && ratingW < 1400) {
    warnings.push(`EVSE rating ${ratingW}W is unusually low for residential charging`);
  }

  if (ratingW > 20000) {
    warnings.push(`EVSE rating ${ratingW}W exceeds typical residential Level 2 charging (suggest verifying rating)`);
  }

  // Check if rating matches common levels (with 5% tolerance)
  const matchesCommon = commonLevels.some(level => 
    Math.abs(ratingW - level.watts) / level.watts < 0.05
  );

  if (ratingW > 1400 && ratingW < 20000 && !matchesCommon) {
    const nearest = commonLevels.reduce((prev, curr) => 
      Math.abs(curr.watts - ratingW) < Math.abs(prev.watts - ratingW) ? curr : prev
    );
    warnings.push(`EVSE rating ${ratingW}W doesn't match common levels. Nearest: ${nearest.level} (${nearest.watts}W)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}


