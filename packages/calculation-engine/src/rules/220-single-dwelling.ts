// @tradespro/calculation-engine/src/rules/220-single-dwelling.ts
// V4.1 Architecture: Pure Audit Coordinator for NEC Article 220 Single Dwelling Load Calculation
// 
// This file is STABLE and should NOT be frequently modified.
// It ONLY orchestrates calculations by calling pure calculator functions.
// All calculation logic is delegated to specialized calculator modules.

import { CecInputsSingle, CalculationStep, UnsignedBundle, EngineMeta, RuleTables, CecResults, Appliance } from '../core/types';
import { 
  calculateNECGeneralLighting, 
  calculateNECSmallApplianceLoad,
  calculateNECOptionalGeneralLoad 
} from '../calculators/necBaseLoadCalculator';
import {
  applyNECLightingDemandFactors,
  applyNECApplianceDemandFactor,
  calculateNECDryerLoad,
  calculateNECRangeLoad,
  calculateNECHVACLoad
} from '../calculators/necStandardMethodCalculator';

/**
 * V4.1 Architecture: Pure Audit Coordinator for NEC Article 220
 * 
 * This function ONLY orchestrates calculations and creates audit trails.
 * It contains NO calculation logic - all math is delegated to pure calculator modules:
 * 
 * NEC Article 220 - Residential Load Calculation
 * - Standard Method (Part III) or Optional Method (Part IV)
 * - General Lighting: 3 VA/ft² (NEC 220.12)
 * - Small Appliance Circuits: 2×1500 VA (kitchen) + 1500 VA (laundry) (NEC 220.52)
 * - Fixed Appliances: Nameplate rating (NEC 220.53)
 * - Demand Factors: Table 220.42, Table 220.54, Table 220.55
 */
export function computeNECSingleDwelling(
  inputs: CecInputsSingle,
  engineMeta: EngineMeta,
  ruleTables: RuleTables,
  useOptionalMethod: boolean = false
): UnsignedBundle {
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];
  let stepIndex = 1;
  const createdAt = new Date().toISOString();

  // Helper function to create audit steps consistently
  const pushStep = (step: Omit<CalculationStep, 'stepIndex' | 'timestamp'> & {
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    justification: string;
  }) => {
    steps.push({ ...step, stepIndex: stepIndex++, timestamp: createdAt } as CalculationStep);
  };

  const toFixedDigits = (n: number, digits: number = 2): string => {
    if (isNaN(n) || n === null) return '0.00';
    return Number(n).toFixed(digits);
  };

  // Extract input parameters
  const livingArea_m2 = inputs.livingArea_m2 || 0;
  const livingArea_ft2 = livingArea_m2 * 10.764; // Convert m² to ft²
  const voltage = inputs.systemVoltage || 240;
  const phase = inputs.phase || 1;
  const voltageDivisor = phase === 3 ? voltage * Math.sqrt(3) : voltage;

  // ============================================
  // OPTIONAL METHOD (NEC 220.82) - Part IV
  // ============================================
  if (useOptionalMethod) {
    return computeNECOptionalMethod(inputs, engineMeta, ruleTables, steps, warnings, pushStep, toFixedDigits, createdAt);
  }

  // ============================================
  // STANDARD METHOD (NEC Article 220 Part III)
  // ============================================

  // Step 1: General Lighting Load (NEC 220.12)
  // Residential: 3 VA/ft² (equivalent to 33 VA/m²)
  const generalLightingVA = calculateNECGeneralLighting(livingArea_ft2);
  
  pushStep({
    operationId: 'nec_general_lighting',
    displayName: 'General Lighting Load',
    formulaRef: 'NEC 220.12',
    inputs: {
      livingArea_m2: toFixedDigits(livingArea_m2),
      livingArea_ft2: toFixedDigits(livingArea_ft2)
    },
    outputs: {
      generalLightingVA: toFixedDigits(generalLightingVA)
    },
    justification: `General lighting: 3 VA per square foot × ${toFixedDigits(livingArea_ft2)} ft² = ${toFixedDigits(generalLightingVA)} VA (NEC 220.12)`,
    ruleCitations: ['NEC 220.12']
  });

  // Step 2: Small Appliance Circuits (NEC 220.52)
  const smallApplianceVA = calculateNECSmallApplianceLoad();
  
  pushStep({
    operationId: 'nec_small_appliance',
    displayName: 'Small Appliance and Laundry Circuits',
    formulaRef: 'NEC 220.52',
    inputs: {},
    outputs: {
      smallApplianceVA: toFixedDigits(smallApplianceVA)
    },
    justification: 'Small appliance circuits: 2×1500 VA (kitchen) + 1500 VA (laundry) = 4500 VA (NEC 220.52)',
    ruleCitations: ['NEC 220.52']
  });

  // Step 3: Combine Lighting and Small Appliance Loads
  const totalLightingVA = generalLightingVA + smallApplianceVA;
  
  pushStep({
    operationId: 'nec_combine_lighting',
    displayName: 'Combine Lighting and Small Appliance Loads',
    formulaRef: 'NEC 220.42',
    inputs: {
      generalLightingVA: toFixedDigits(generalLightingVA),
      smallApplianceVA: toFixedDigits(smallApplianceVA)
    },
    outputs: {
      totalLightingVA: toFixedDigits(totalLightingVA)
    },
    justification: `Total lighting load = ${toFixedDigits(generalLightingVA)} + ${toFixedDigits(smallApplianceVA)} = ${toFixedDigits(totalLightingVA)} VA`,
    ruleCitations: []
  });

  // Step 4: Apply Lighting Demand Factors (NEC 220.42, Table 220.42)
  const lightingAfterDemand = applyNECLightingDemandFactors(totalLightingVA);
  
  pushStep({
    operationId: 'nec_lighting_demand',
    displayName: 'Apply Lighting Demand Factors',
    formulaRef: 'NEC 220.42',
    inputs: {
      totalLightingVA: toFixedDigits(totalLightingVA)
    },
    outputs: {
      lightingAfterDemandVA: toFixedDigits(lightingAfterDemand)
    },
    justification: `Apply Table 220.42 demand factors: First 3000 VA @ 100% + remainder @ 35% (residential dwelling units)`,
    ruleCitations: ['NEC 220.42', 'Table 220.42']
  });

  // Step 5: Process Appliances
  const appliances = inputs.appliances || [];
  
  // Extract appliances by type
  let rangeVA = 0;
  let dryerVA = 0;
  let dryerCount = 0;
  let heatingVA = inputs.heatingLoadW || 0;
  let coolingVA = inputs.coolingLoadW || 0;
  let fixedAppliances: Appliance[] = [];
  let fixedApplianceVA = 0;

  // Check main form for range
  if (inputs.hasElectricRange && inputs.electricRangeRatingKW) {
    rangeVA = inputs.electricRangeRatingKW * 1000;
  }

  // Process appliance list
  for (const app of appliances) {
    const appVA = app.watts || 0;
    
    if (app.type === 'range') {
      if (rangeVA === 0) {
        rangeVA = appVA;
      } else {
        warnings.push('Multiple ranges detected - using first range only. Consider using multiple range calculation.');
      }
    } else if (app.type === 'water_heater' || app.type === 'tankless_water_heater') {
      fixedAppliances.push(app);
      fixedApplianceVA += appVA;
    } else if (app.type === 'space_heating') {
      heatingVA += appVA;
    } else if (app.type === 'air_conditioning') {
      coolingVA += appVA;
    } else if (app.type === 'other' && appVA > 0) {
      // Dryers or other fixed appliances
      if (app.name && app.name.toLowerCase().includes('dryer')) {
        dryerVA = Math.max(dryerVA, appVA); // Use largest dryer rating
        dryerCount++;
      } else {
        fixedAppliances.push(app);
        fixedApplianceVA += appVA;
      }
    }
  }

  // Step 6: Range Load (NEC 220.55)
  if (rangeVA > 0) {
    const rangeLoadVA = calculateNECRangeLoad(rangeVA, 1);
    
    pushStep({
      operationId: 'nec_range_load',
      displayName: 'Electric Range Load',
      formulaRef: 'NEC 220.55',
      inputs: {
        rangeVA: toFixedDigits(rangeVA),
        rangeKW: toFixedDigits(rangeVA / 1000)
      },
      outputs: {
        rangeLoadVA: toFixedDigits(rangeLoadVA)
      },
      justification: `Electric range: ${rangeVA / 1000} kW. Using Table 220.55 Column C = ${toFixedDigits(rangeLoadVA)} VA`,
      ruleCitations: ['NEC 220.55', 'Table 220.55']
    });
  }

  // Step 7: Dryer Load (NEC 220.54)
  if (dryerVA > 0 || dryerCount > 0) {
    const dryerLoadVA = calculateNECDryerLoad(dryerVA, Math.max(1, dryerCount));
    
    pushStep({
      operationId: 'nec_dryer_load',
      displayName: 'Electric Dryer Load',
      formulaRef: 'NEC 220.54',
      inputs: {
        dryerVA: toFixedDigits(dryerVA),
        dryerCount: dryerCount || 1
      },
      outputs: {
        dryerLoadVA: toFixedDigits(dryerLoadVA)
      },
      justification: `Electric dryer: ${toFixedDigits(dryerVA)} VA (or 5000 VA minimum). Apply Table 220.54 demand factors`,
      ruleCitations: ['NEC 220.54', 'Table 220.54']
    });
  }

  // Step 8: HVAC Load (NEC 220.60 - Noncoincident Loads)
  const hvacLoadVA = calculateNECHVACLoad(heatingVA, coolingVA);
  
  if (hvacLoadVA > 0) {
    pushStep({
      operationId: 'nec_hvac_load',
      displayName: 'Heating and Air Conditioning Load',
      formulaRef: 'NEC 220.60',
      inputs: {
        heatingVA: toFixedDigits(heatingVA),
        coolingVA: toFixedDigits(coolingVA)
      },
      outputs: {
        hvacLoadVA: toFixedDigits(hvacLoadVA)
      },
      justification: inputs.isHeatingAcInterlocked
        ? 'Heating and AC are interlocked - using maximum value (NEC 220.60)'
        : 'Heating and AC are noncoincident - using maximum value (NEC 220.60)',
      ruleCitations: ['NEC 220.60']
    });
  }

  // Step 9: Fixed Appliances (NEC 220.53)
  let fixedApplianceLoadVA = 0;
  if (fixedAppliances.length > 0) {
    // Apply demand factor for 4 or more fixed appliances
    fixedApplianceLoadVA = applyNECApplianceDemandFactor(fixedApplianceVA, fixedAppliances.length);
    
    pushStep({
      operationId: 'nec_fixed_appliances',
      displayName: 'Fixed Appliances Load',
      formulaRef: 'NEC 220.53',
      inputs: {
        fixedApplianceVA: toFixedDigits(fixedApplianceVA),
        applianceCount: fixedAppliances.length
      },
      outputs: {
        fixedApplianceLoadVA: toFixedDigits(fixedApplianceLoadVA)
      },
      justification: fixedAppliances.length >= 4
        ? `Four or more fixed appliances: apply 75% demand factor = ${toFixedDigits(fixedApplianceLoadVA)} VA`
        : `Less than 4 fixed appliances: 100% of nameplate = ${toFixedDigits(fixedApplianceLoadVA)} VA`,
      ruleCitations: ['NEC 220.53']
    });
  }

  // Step 10: Calculate Total Load
  const totalLoadVA = lightingAfterDemand + 
                      (rangeVA > 0 ? calculateNECRangeLoad(rangeVA, 1) : 0) +
                      (dryerVA > 0 ? calculateNECDryerLoad(dryerVA, Math.max(1, dryerCount)) : 0) +
                      hvacLoadVA +
                      fixedApplianceLoadVA;
  
  pushStep({
    operationId: 'nec_total_load',
    displayName: 'Total Calculated Load',
    formulaRef: 'NEC 220.40',
    inputs: {
      lightingAfterDemandVA: toFixedDigits(lightingAfterDemand),
      rangeLoadVA: rangeVA > 0 ? toFixedDigits(calculateNECRangeLoad(rangeVA, 1)) : '0',
      dryerLoadVA: dryerVA > 0 ? toFixedDigits(calculateNECDryerLoad(dryerVA, Math.max(1, dryerCount))) : '0',
      hvacLoadVA: toFixedDigits(hvacLoadVA),
      fixedApplianceLoadVA: toFixedDigits(fixedApplianceLoadVA)
    },
    outputs: {
      totalLoadVA: toFixedDigits(totalLoadVA)
    },
    justification: 'Sum of all loads after demand factors (NEC 220.40)',
    ruleCitations: ['NEC 220.40']
  });

  // Step 11: Service Current
  const serviceAmps = totalLoadVA / voltageDivisor;
  
  pushStep({
    operationId: 'nec_service_current',
    displayName: 'Service Current Calculation',
    formulaRef: 'NEC 220.60',
    inputs: {
      totalLoadVA: toFixedDigits(totalLoadVA),
      voltage: voltage,
      phase: phase
    },
    outputs: {
      serviceAmps: toFixedDigits(serviceAmps)
    },
    justification: `Service current = Total VA / Voltage = ${toFixedDigits(totalLoadVA)} / ${toFixedDigits(voltageDivisor)} = ${toFixedDigits(serviceAmps)} A`,
    ruleCitations: ['NEC 220.60']
  });

  // Create results object
  const results: CecResults = {
    computedLivingArea_m2: toFixedDigits(livingArea_m2),
    basicVA: toFixedDigits(generalLightingVA),
    appliancesSumVA: toFixedDigits(totalLoadVA),
    continuousAdjustedVA: toFixedDigits(totalLoadVA),
    itemA_total_W: toFixedDigits(totalLoadVA),
    itemB_value_W: '0', // NEC doesn't have Method B like CEC
    chosenCalculatedLoad_W: toFixedDigits(totalLoadVA),
    serviceCurrentA: toFixedDigits(serviceAmps),
    conductorSize: '', // TODO: Implement NEC conductor selection
    conductorAmpacity: '0',
    panelRatingA: '0',
    breakerSizeA: '0',
    demandVA: toFixedDigits(totalLoadVA),
    demand_kVA: toFixedDigits(totalLoadVA / 1000),
    sizingCurrentA: toFixedDigits(serviceAmps),
    hvacLoad: toFixedDigits(hvacLoadVA),
    rangeLoad: rangeVA > 0 ? toFixedDigits(calculateNECRangeLoad(rangeVA, 1)) : '0',
    waterHeaterLoad: toFixedDigits(fixedApplianceLoadVA),
    otherLargeLoadsTotal: toFixedDigits(fixedApplianceLoadVA)
  };

  // Create bundle
  const bundle: UnsignedBundle = {
    id: `nec-${Date.now()}`,
    createdAt: createdAt,
    domain: 'electrical',
    calculationType: 'nec_load',
    buildingType: 'single-dwelling',
    engine: engineMeta,
    ruleSets: [{
      ruleSetId: 'nec-220-single-dwelling',
      version: '2023',
      code: 'nec',
      jurisdiction: 'US'
    }],
    inputs: inputs,
    results: results,
    steps: steps,
    warnings: warnings,
    meta: {
      canonicalization_version: 'rfc8785-v1',
      numeric_format: 'fixed_decimals_2',
      calculation_standard: 'NEC-2023',
      tables_used: [],
      build_info: {
        commit: engineMeta.commit,
        build_timestamp: engineMeta.buildTimestamp || '',
        environment: 'service'
      }
    }
  };

  return bundle;
}

/**
 * NEC 220.82 - Optional Method for Single Dwelling Unit
 * 
 * This method applies to dwelling units with a single 120/240V or 208Y/120V
 * 3-wire service or feeder conductor with capacity of 100 A or greater.
 */
function computeNECOptionalMethod(
  inputs: CecInputsSingle,
  engineMeta: EngineMeta,
  ruleTables: RuleTables,
  steps: CalculationStep[],
  warnings: string[],
  pushStep: (step: any) => void,
  toFixedDigits: (n: number, digits?: number) => string,
  createdAt: string
): UnsignedBundle {
  const livingArea_m2 = inputs.livingArea_m2 || 0;
  const livingArea_ft2 = livingArea_m2 * 10.764;
  const voltage = inputs.systemVoltage || 240;
  const phase = inputs.phase || 1;
  const voltageDivisor = phase === 3 ? voltage * Math.sqrt(3) : voltage;

  // Step 1: General Load (Lighting + Small Appliance + Fixed Appliances)
  const generalLightingVA = calculateNECGeneralLighting(livingArea_ft2);
  const smallApplianceVA = calculateNECSmallApplianceLoad();
  
  // Calculate fixed appliance load
  let fixedApplianceVA = 0;
  const appliances = inputs.appliances || [];
  for (const app of appliances) {
    if (app.type !== 'range' && app.type !== 'space_heating' && app.type !== 'air_conditioning') {
      fixedApplianceVA += app.watts || 0;
    }
  }
  
  const totalGeneralLoad = generalLightingVA + smallApplianceVA + fixedApplianceVA;
  
  pushStep({
    operationId: 'nec_optional_general',
    displayName: 'General Load (Optional Method)',
    formulaRef: 'NEC 220.82(B)',
    inputs: {
      generalLightingVA: toFixedDigits(generalLightingVA),
      smallApplianceVA: toFixedDigits(smallApplianceVA),
      fixedApplianceVA: toFixedDigits(fixedApplianceVA)
    },
    outputs: {
      totalGeneralLoadVA: toFixedDigits(totalGeneralLoad)
    },
    justification: 'General load = Lighting + Small Appliance + Fixed Appliances (NEC 220.82(B))',
    ruleCitations: ['NEC 220.82(B)']
  });

  // Step 2: Apply Optional Method Demand Factors (NEC 220.82(B))
  // First 10 kVA @ 100% + remainder @ 40%
  const generalLoadAfterDemand = calculateNECOptionalGeneralLoad(livingArea_ft2, fixedApplianceVA);
  
  pushStep({
    operationId: 'nec_optional_demand',
    displayName: 'Apply Optional Method Demand Factors',
    formulaRef: 'NEC 220.82(B)',
    inputs: {
      totalGeneralLoadVA: toFixedDigits(totalGeneralLoad)
    },
    outputs: {
      generalLoadAfterDemandVA: toFixedDigits(generalLoadAfterDemand)
    },
    justification: 'First 10 kVA @ 100% + remainder @ 40% (NEC 220.82(B))',
    ruleCitations: ['NEC 220.82(B)']
  });

  // Step 3: Heating and Air Conditioning (NEC 220.82(C))
  const heatingVA = inputs.heatingLoadW || 0;
  const coolingVA = inputs.coolingLoadW || 0;
  const hvacLoadVA = calculateNECHVACLoad(heatingVA, coolingVA);
  
  pushStep({
    operationId: 'nec_optional_hvac',
    displayName: 'Heating and Air Conditioning Load',
    formulaRef: 'NEC 220.82(C)',
    inputs: {
      heatingVA: toFixedDigits(heatingVA),
      coolingVA: toFixedDigits(coolingVA)
    },
    outputs: {
      hvacLoadVA: toFixedDigits(hvacLoadVA)
    },
    justification: 'Use the larger of heating or air conditioning load (NEC 220.82(C))',
    ruleCitations: ['NEC 220.82(C)']
  });

  // Step 4: Total Load (Optional Method)
  const totalLoadVA = generalLoadAfterDemand + hvacLoadVA;
  const serviceAmps = totalLoadVA / voltageDivisor;

  pushStep({
    operationId: 'nec_optional_total',
    displayName: 'Total Load (Optional Method)',
    formulaRef: 'NEC 220.82',
    inputs: {
      generalLoadAfterDemandVA: toFixedDigits(generalLoadAfterDemand),
      hvacLoadVA: toFixedDigits(hvacLoadVA)
    },
    outputs: {
      totalLoadVA: toFixedDigits(totalLoadVA),
      serviceAmps: toFixedDigits(serviceAmps)
    },
    justification: 'Total load = General load (after demand) + HVAC load (NEC 220.82)',
    ruleCitations: ['NEC 220.82']
  });

  // Create results
  const results: CecResults = {
    computedLivingArea_m2: toFixedDigits(livingArea_m2),
    basicVA: toFixedDigits(generalLightingVA),
    appliancesSumVA: toFixedDigits(totalLoadVA),
    continuousAdjustedVA: toFixedDigits(totalLoadVA),
    itemA_total_W: toFixedDigits(totalLoadVA),
    itemB_value_W: '0', // NEC optional method doesn't have Method B
    chosenCalculatedLoad_W: toFixedDigits(totalLoadVA),
    serviceCurrentA: toFixedDigits(serviceAmps),
    conductorSize: '',
    conductorAmpacity: '0',
    panelRatingA: '0',
    breakerSizeA: '0',
    demandVA: toFixedDigits(totalLoadVA),
    demand_kVA: toFixedDigits(totalLoadVA / 1000),
    sizingCurrentA: toFixedDigits(serviceAmps),
    hvacLoad: toFixedDigits(hvacLoadVA)
  };

  const bundle: UnsignedBundle = {
    id: `nec-optional-${Date.now()}`,
    createdAt: createdAt,
    domain: 'electrical',
    calculationType: 'nec_load',
    buildingType: 'single-dwelling',
    engine: engineMeta,
    ruleSets: [{
      ruleSetId: 'nec-220-single-dwelling-optional',
      version: '2023',
      code: 'nec',
      jurisdiction: 'US'
    }],
    inputs: inputs,
    results: results,
    steps: steps,
    warnings: warnings,
    meta: {
      canonicalization_version: 'rfc8785-v1',
      numeric_format: 'fixed_decimals_2',
      calculation_standard: 'NEC-2023',
      tables_used: [],
      build_info: {
        commit: engineMeta.commit,
        build_timestamp: engineMeta.buildTimestamp || '',
        environment: 'service'
      }
    }
  };

  return bundle;
}
