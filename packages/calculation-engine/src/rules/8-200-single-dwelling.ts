// @tradespro/calculation-engine/src/rules/8-200-single-dwelling.ts
// V4.1 Architecture: Pure Audit Coordinator for CEC 8-200 Single Dwelling Load Calculation
// 
// This file is STABLE and should NOT be frequently modified.
// It ONLY orchestrates calculations by calling pure calculator functions.
// All calculation logic is delegated to specialized calculator modules.

import { calculateBaseLoad } from '../calculators/baseLoadCalculator';
import { calculateHeatingCoolingLoad } from '../calculators/heatingCoolingCalculator';
import { 
  calculateRangeLoadWithAudit,
  calculateWaterHeaterLoadWithAudit,
  calculateEVSELoadWithAudit,
  calculateLargeLoadsWithAudit,
  categorizeAppliances,
  type WaterHeaterType
} from '../calculators/applianceLoadCalculator';
import { lookupConductorSize } from '../core/tableLookups';
import { CecInputsSingle, CalculationStep, UnsignedBundle, EngineMeta, RuleTables, CecResults, Appliance } from '../core/types';

/**
 * V4.1 Architecture: Pure Audit Coordinator
 * 
 * This function ONLY orchestrates calculations and creates audit trails.
 * It contains NO calculation logic - all math is delegated to pure calculator modules:
 * 
 * - baseLoadCalculator.ts: Living area → base load (CEC 8-200 1)a)i-ii)
 * - heatingCoolingCalculator.ts: HVAC loads (CEC 62-118, 8-106 3)
 * - rangeLoadCalculator.ts: Electric range demand (CEC 8-200 1)a)iv)
 * - waterHeaterCalculator.ts: Water heater demand (CEC 8-200 1)a)v)
 * - evseCalculator.ts: EVSE demand (CEC 8-200 1)a)vi, 8-106 11)
 * - largeLoadCalculator.ts: Other large loads (CEC 8-200 1)a)vii)
 */
export function computeSingleDwelling(
  inputs: CecInputsSingle,
  engineMeta: EngineMeta,
  ruleTables: RuleTables,
  jurisdictionConfig?: {
    panelBreakerSizes?: number[];
  }
): UnsignedBundle {
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];
  let stepIndex = 1;
  const createdAt = new Date().toISOString();

  // Helper function to create audit steps consistently
  // V4.1 Specification: inputs, outputs, justification are now required fields
  const pushStep = (step: Omit<CalculationStep, 'stepIndex' | 'timestamp'> & {
    inputs: Record<string, any>;  // V4.1 required
    outputs: Record<string, any>;  // V4.1 required
    justification: string;  // V4.1 required
  }) => {
    steps.push({ ...step, stepIndex: stepIndex++, timestamp: createdAt } as CalculationStep);
  };

  const toFixedDigits = (n: number, digits: number = 2): string => {
    if (isNaN(n) || n === null) return '0.00';
    return Number(n).toFixed(digits);
  };

  // --- Extract input parameters ---
  const livingArea = inputs.livingArea_m2 || 0;
  const voltage = inputs.systemVoltage;
  const phase = inputs.phase || 1;
  const voltageDivisor = phase === 3 ? voltage * Math.sqrt(3) : voltage;

  // ============================================
  // Step 1: Basic Load (CEC 8-200 1)a)i-ii)
  // ============================================
  const baseLoadW = calculateBaseLoad(livingArea);
  const excess_m2 = Math.max(0, livingArea - 90);
  const extraPortions = Math.ceil(excess_m2 / 90);
  
  pushStep({ 
    operationId: 'calc_base_load',
    displayName: 'Basic Load Calculation',
    formulaRef: 'CEC 8-200 1)a)i-ii', 
    // V4.1 Specification: inputs (required) - input values used in this calculation
    inputs: { 
      livingArea_m2: livingArea
    },
    // V4.1 Specification: outputs (required) - output values from this calculation
    outputs: { basicVA: toFixedDigits(baseLoadW) },
    // V4.1 Specification: justification (required) - explanation of the calculation
    justification: '5000W for first 90m² + 1000W per additional 90m² portion',
    intermediateValues: { 
      livingArea_m2: toFixedDigits(livingArea),
      firstPortion: '90',
      excessArea: toFixedDigits(excess_m2),
      extraPortions: String(extraPortions)
    }, 
    output: { basicVA: toFixedDigits(baseLoadW) }, // Keep for backward compatibility
    note: '5000W for first 90m2 + 1000W per additional 90m2 portion', // Keep for backward compatibility
    ruleCitations: ['CEC 8-200 1)a)i', 'CEC 8-200 1)a)ii']
  });

  // ============================================
  // Pre-process: Convert Main Form Fields to Appliances
  // IMPORTANT: Main form appliances are inserted at the BEGINNING
  // to ensure they are processed first (especially for Range priority)
  // ============================================
  const mainFormAppliances: Appliance[] = [];
  
  // Add Range from main form if present
  if (inputs.hasElectricRange && inputs.electricRangeRatingKW) {
    mainFormAppliances.push({
      type: 'range',
      name: 'Electric Range (Main Form)',
      watts: inputs.electricRangeRatingKW * 1000,
      rating_kW: inputs.electricRangeRatingKW,
      isContinuous: false
    });
    console.log(`🔥 Added Range from main form: ${inputs.electricRangeRatingKW}kW`);
  }
  
  // Add Water Heater from main form if present
  if (inputs.waterHeaterType && inputs.waterHeaterType !== 'none' && inputs.waterHeaterRatingW) {
    const whType = inputs.waterHeaterType === 'tankless' ? 'tankless_water_heater' : 'water_heater';
    mainFormAppliances.push({
      type: whType,
      name: `Water Heater (${inputs.waterHeaterType})`,
      watts: inputs.waterHeaterRatingW,
      isContinuous: false
    });
    console.log(`💧 Added Water Heater from main form: ${inputs.waterHeaterRatingW}W (${inputs.waterHeaterType})`);
  }
  
  // Add EVSE from main form if present
  if (inputs.hasEVSE && inputs.evseRatingW) {
    mainFormAppliances.push({
      type: 'evse',
      name: 'EVSE (Main Form)',
      watts: inputs.evseRatingW,
      hasEVEMS: inputs.evseHasEVEMS || false,
      isContinuous: false
    });
    console.log(`⚡ Added EVSE from main form: ${inputs.evseRatingW}W, EVEMS: ${inputs.evseHasEVEMS || false}`);
  }
  
  // Merge: Main form appliances FIRST, then user-added appliances
  const allAppliances: Appliance[] = [...mainFormAppliances, ...(inputs.appliances || [])];

  // ============================================
  // Step 2: Categorize Appliances by Type
  // ============================================
  const appliances = allAppliances;
  const categories: Record<string, { raw: number; items: Appliance[] }> = {};
  
  function addTo(category: string, appliance: Appliance) {
    if (!categories[category]) {
      categories[category] = { raw: 0, items: [] };
    }
    const watts = appliance.watts || 0;
    categories[category].raw += watts;
    categories[category].items.push(appliance);
  }
  
  // Categorize each appliance by type
  for (const appliance of appliances) {
    console.log(`🔍 Categorizing appliance:`, appliance);
    
    // Check for continuous loads first (regardless of type)
    if (appliance.isContinuous) {
      addTo('continuous', appliance);
    }
    
    switch (appliance.type) {
      case 'range':
        console.log('✅ Identified as RANGE');
        addTo('range', appliance);
        break;
      case 'space_heating':
        addTo('heating', appliance);
        break;
      case 'air_conditioning':
        addTo('cooling', appliance);
        break;
      case 'tankless_water_heater':
      case 'water_heater':
        addTo('water_heaters', appliance);
        break;
      case 'pool_spa':
        addTo('pool_spa', appliance);
        break;
      case 'evse':
        addTo('evse', appliance);
        break;
      case 'other':
        // 'other' type: categorize by size (continuous loads also categorized here)
        if ((appliance.watts || 0) > 1500) {
          addTo('other_large', appliance);
        } else {
          addTo('other_small', appliance);
        }
        break;
      default:
        // Unknown type: categorize by size
        console.log(`⚠️ Appliance type '${appliance.type}' not recognized, categorizing by size`);
        if ((appliance.watts || 0) > 1500) {
          addTo('other_large', appliance);
        } else {
          addTo('other_small', appliance);
        }
    }
  }
  
  console.log('📊 Final categories:', {
    range: categories['range']?.items?.length || 0,
    heating: categories['heating']?.items?.length || 0,
    cooling: categories['cooling']?.items?.length || 0,
    water_heaters: categories['water_heaters']?.items?.length || 0,
    pool_spa: categories['pool_spa']?.items?.length || 0,
    evse: categories['evse']?.items?.length || 0,
    continuous: categories['continuous']?.items?.length || 0,
    other_large: categories['other_large']?.items?.length || 0,
    other_small: categories['other_small']?.items?.length || 0
  });

  let applianceLoadW = 0;

  // ============================================
  // Step 3: HVAC Load (CEC 8-200 1)a)iii + Section 62)
  // ============================================
  console.log('🌡️ HVAC Debug:', {
    'categories.heating': categories['heating']?.raw ?? 'undefined',
    'inputs.heatingLoadW': inputs.heatingLoadW,
    'categories.cooling': categories['cooling']?.raw ?? 'undefined',
    'inputs.coolingLoadW': inputs.coolingLoadW,
    'inputs.isHeatingAcInterlocked': inputs.isHeatingAcInterlocked,
    'note': categories['heating'] ? 'Using appliance categories' : 'Falling back to input fields'
  });
  
  let heatingTotal = categories['heating']?.raw || inputs.heatingLoadW || 0;
  let coolingTotal = categories['cooling']?.raw || inputs.coolingLoadW || 0;
  let hvacContribution = 0;
  
  console.log('🌡️ HVAC Totals:', {
    heatingTotal,
    coolingTotal
  });

  if (heatingTotal > 0) {
    // Apply CEC 62-118 3) demand factor for heating >10kW
    const heatingDemand = heatingTotal <= 10000
      ? heatingTotal
      : 10000 + (heatingTotal - 10000) * 0.75;
    
    pushStep({
      operationId: 'calc_space_heating',
      formulaRef: 'CEC 62-118 3)',
      // V4.1 Specification: inputs (required)
      inputs: {
        heatingLoad_W: heatingTotal
      },
      // V4.1 Specification: outputs (required)
      outputs: { heatingDemand_W: toFixedDigits(heatingDemand) },
      // V4.1 Specification: justification (required)
      justification: heatingTotal > 10000 
        ? 'Space heating: 10000W @ 100% + excess @ 75%'
        : 'Space heating at 100%',
      intermediateValues: { 
        heatingRaw: toFixedDigits(heatingTotal),
        first10kW: toFixedDigits(Math.min(heatingTotal, 10000)),
        excess: toFixedDigits(Math.max(0, heatingTotal - 10000)),
        demandFactor: heatingTotal > 10000 ? '0.75 for excess' : '1.00'
      },
      output: { heatingDemand_W: toFixedDigits(heatingDemand) }, // Keep for backward compatibility
      note: heatingTotal > 10000 
        ? 'Space heating: 10000W @ 100% + excess @ 75%'
        : 'Space heating at 100%', // Keep for backward compatibility
      ruleCitations: ['CEC 8-200 1)a)iii', 'CEC 62-118 3)']
    });
    
    heatingTotal = heatingDemand; // Use demand value for interlock calculation
  }

  if (coolingTotal > 0) {
    pushStep({
      operationId: 'calc_air_conditioning',
      formulaRef: 'CEC 8-200 1)a)iii',
      // V4.1 Specification: inputs (required)
      inputs: {
        coolingLoad_W: coolingTotal
      },
      // V4.1 Specification: outputs (required)
      outputs: { coolingTotal_W: toFixedDigits(coolingTotal) },
      // V4.1 Specification: justification (required)
      justification: 'Air conditioning at 100%',
      intermediateValues: { coolingRaw: toFixedDigits(coolingTotal) },
      output: { coolingTotal_W: toFixedDigits(coolingTotal) }, // Keep for backward compatibility
      note: 'Air conditioning at 100%', // Keep for backward compatibility
      ruleCitations: ['CEC 8-200 1)a)iii', 'CEC 8-106 3)']
    });
  }

  // Apply interlock rule if specified (CEC 8-106 3))
  if (inputs.isHeatingAcInterlocked && heatingTotal > 0 && coolingTotal > 0) {
    hvacContribution = Math.max(heatingTotal, coolingTotal);
    pushStep({
      operationId: 'apply_hvac_interlock',
      formulaRef: 'CEC 8-106 3)',
      // V4.1 Specification: inputs (required)
      inputs: {
        heating_W: heatingTotal,
        cooling_W: coolingTotal
      },
      // V4.1 Specification: outputs (required)
      outputs: { hvacContribution_W: toFixedDigits(hvacContribution) },
      // V4.1 Specification: justification (required)
      justification: 'Heating and AC interlocked - using maximum value (CEC 8-106 3)',
      intermediateValues: {
        heating: toFixedDigits(heatingTotal),
        cooling: toFixedDigits(coolingTotal)
      },
      output: { hvacContribution_W: toFixedDigits(hvacContribution) }, // Keep for backward compatibility
      note: 'Heating and AC interlocked - using maximum value', // Keep for backward compatibility
      ruleCitations: ['CEC 8-106 3)']
    });
  } else {
    hvacContribution = heatingTotal + coolingTotal;
  }

  applianceLoadW += hvacContribution;

  // ============================================
  // Step 4: Range Load (CEC 8-200 1)a)iv)
  // ============================================
  let rangePresent = false;
  let rangeContribution = 0;

  const rangeItems = categories['range']?.items || [];
  if (rangeItems.length > 0) {
    const firstRange = rangeItems[0];
    rangePresent = true;

    const rating_kW = firstRange.rating_kW || (firstRange.watts || 12000) / 1000;
    
    // Call pure calculator function
    const rangeCalc = calculateRangeLoadWithAudit(rating_kW);
    rangeContribution = rangeCalc.demandW;
    applianceLoadW += rangeContribution;

    pushStep({
      operationId: 'calc_range_load',
      formulaRef: 'CEC 8-200 1)a)iv',
      // V4.1 Specification: inputs (required)
      inputs: {
        rangeRating_kW: rating_kW,
        rangeName: firstRange.name || 'Electric Range'
      },
      // V4.1 Specification: outputs (required)
      outputs: { rangeContribution_W: toFixedDigits(rangeContribution) },
      // V4.1 Specification: justification (required)
      justification: rangeCalc.formula || (rating_kW <= 12 
        ? `Electric range at ${toFixedDigits(rating_kW)}kW: 6000W base load (CEC 8-200 1)a)iv)`
        : `Electric range at ${toFixedDigits(rating_kW)}kW: 6000W + 40% × (${toFixedDigits(rating_kW)} - 12)kW = ${toFixedDigits(rangeContribution)}W (CEC 8-200 1)a)iv)`),
      intermediateValues: {
        name: firstRange.name || 'Electric Range',
        rating_kW: toFixedDigits(rating_kW),
        baseLoad: toFixedDigits(rangeCalc.baseLoad),
        excessKW: toFixedDigits(rangeCalc.excessKW),
        excessDemand: toFixedDigits(rangeCalc.excessDemand)
      },
      output: { rangeContribution_W: toFixedDigits(rangeContribution) }, // Keep for backward compatibility
      note: rangeCalc.formula, // Keep for backward compatibility
      ruleCitations: ['CEC 8-200 1)a)iv']
    });

    // Additional ranges treated as other loads
    for (let i = 1; i < rangeItems.length; i++) {
      addTo('other_large', rangeItems[i]);
    }
  }

  // ============================================
  // Step 5: Water Heaters (CEC 8-200 1)a)v)
  // ============================================
  let waterHeatersTotal = 0;
  
  if (categories['water_heaters']) {
    const waterHeaterItems = categories['water_heaters'].items;
    for (const wh of waterHeaterItems) {
      const whWatts = wh.watts || 0;
      const whType: WaterHeaterType = (wh.type === 'tankless_water_heater' ? 'tankless' : 'storage') as WaterHeaterType;
      
      // Call pure calculator function
      const whCalc = calculateWaterHeaterLoadWithAudit(whWatts, whType);
      waterHeatersTotal += whCalc.demandW;
      
      pushStep({
        operationId: 'calc_water_heater',
        formulaRef: whCalc.ruleReference,
        // V4.1 Specification: inputs (required)
        inputs: {
          waterHeaterRating_W: whWatts,
          waterHeaterType: whType,
          waterHeaterName: wh.name || 'Water Heater'
        },
        // V4.1 Specification: outputs (required)
        outputs: { waterHeaterLoad_W: toFixedDigits(whCalc.demandW) },
        // V4.1 Specification: justification (required)
        justification: whCalc.formula || `Water heater (${whType}) at ${toFixedDigits(whWatts)}W: ${toFixedDigits(whCalc.demandFactor)}% demand factor = ${toFixedDigits(whCalc.demandW)}W (${whCalc.ruleReference})`,
        intermediateValues: { 
          name: wh.name || 'Water Heater',
          rating_W: toFixedDigits(whWatts),
          type: whType,
          demandFactor: toFixedDigits(whCalc.demandFactor)
        },
        output: { waterHeaterLoad_W: toFixedDigits(whCalc.demandW) }, // Keep for backward compatibility
        note: whCalc.formula, // Keep for backward compatibility
        ruleCitations: [whCalc.ruleReference]
      });
    }
    applianceLoadW += waterHeatersTotal;
  }

  // ============================================
  // Step 6: Pool/Spa Heaters (CEC 8-200 1)a)v)
  // ============================================
  let poolSpaTotal = 0;
  
  if (categories['pool_spa']) {
    const poolSpaItems = categories['pool_spa'].items;
    for (const ps of poolSpaItems) {
      const psWatts = ps.watts || 0;
      
      // Call pure calculator function
      const psCalc = calculateWaterHeaterLoadWithAudit(psWatts, 'pool_spa');
      poolSpaTotal += psCalc.demandW;
      
      pushStep({
        operationId: 'calc_pool_spa',
        formulaRef: psCalc.ruleReference,
        // V4.1 Specification: inputs (required)
        inputs: {
          poolSpaRating_W: psWatts,
          poolSpaName: ps.name || 'Pool/Spa'
        },
        // V4.1 Specification: outputs (required)
        outputs: { poolSpaLoad_W: toFixedDigits(psCalc.demandW) },
        // V4.1 Specification: justification (required)
        justification: psCalc.formula || `Pool/Spa heater at ${toFixedDigits(psWatts)}W: ${toFixedDigits(psCalc.demandFactor)}% demand factor = ${toFixedDigits(psCalc.demandW)}W (${psCalc.ruleReference})`,
        intermediateValues: { 
          name: ps.name || 'Pool/Spa',
          rating_W: toFixedDigits(psWatts),
          demandFactor: toFixedDigits(psCalc.demandFactor)
        },
        output: { poolSpaLoad_W: toFixedDigits(psCalc.demandW) }, // Keep for backward compatibility
        note: psCalc.formula, // Keep for backward compatibility
        ruleCitations: [psCalc.ruleReference]
      });
    }
    applianceLoadW += poolSpaTotal;
  }

  // ============================================
  // Step 7: EVSE (CEC 8-200 1)a)vi + 8-106 11)
  // ============================================
  let evseTotal = 0;
  
  if (categories['evse']) {
    const evseItems = categories['evse'].items;
    for (const ev of evseItems) {
      const evWatts = ev.watts || 0;
      const hasEVEMS = ev.hasEVEMS || false;
      
      // Call pure calculator function
      const evCalc = calculateEVSELoadWithAudit(evWatts, hasEVEMS);
      evseTotal += evCalc.demandW;
      
      pushStep({
        operationId: evCalc.isExempted ? 'exclude_evse_with_evems' : 'calc_evse',
        formulaRef: evCalc.ruleReference,
        // V4.1 Specification: inputs (required)
        inputs: {
          evseRating_W: evWatts,
          hasEVEMS: hasEVEMS,
          evseName: ev.name || 'EVSE'
        },
        // V4.1 Specification: outputs (required)
        outputs: { evseLoad_W: toFixedDigits(evCalc.demandW) },
        // V4.1 Specification: justification (required)
        justification: evCalc.formula || (evCalc.isExempted
          ? `EVSE with EVEMS excluded from calculation (CEC 8-106 11)`
          : `EVSE at ${toFixedDigits(evWatts)}W: ${toFixedDigits(evCalc.demandFactor)}% demand factor = ${toFixedDigits(evCalc.demandW)}W (${evCalc.ruleReference})`),
        intermediateValues: { 
          name: ev.name || 'EVSE',
          rating_W: toFixedDigits(evWatts),
          hasEVEMS: String(hasEVEMS),
          demandFactor: toFixedDigits(evCalc.demandFactor)
        },
        output: { evseLoad_W: toFixedDigits(evCalc.demandW) }, // Keep for backward compatibility
        note: evCalc.formula, // Keep for backward compatibility
        ruleCitations: [evCalc.ruleReference]
      });
    }
    applianceLoadW += evseTotal;
  }

  // ============================================
  // Step 8: Other Large Loads >1500W (CEC 8-200 1)a)vii)
  // ============================================
  const otherLargeRaw = categories['other_large']?.raw || 0;
  let largeLoadContribution = 0;

  if (otherLargeRaw > 0) {
    // Call pure calculator function
    const largeLoadCalc = calculateLargeLoadsWithAudit(otherLargeRaw, rangePresent);
    largeLoadContribution = largeLoadCalc.demandW;

    // Create friendly note text
    const friendlyNote = rangePresent
      ? `Other loads >1500W with Range present: Apply 25% demand factor to ${toFixedDigits(otherLargeRaw)}W = ${toFixedDigits(largeLoadContribution)}W`
      : `Other loads >1500W without Range: First ${toFixedDigits(largeLoadCalc.upTo6000W)}W @ 100%, Excess ${toFixedDigits(largeLoadCalc.over6000W)}W @ 25% = ${toFixedDigits(largeLoadContribution)}W`;

    pushStep({
      operationId: rangePresent ? 'calc_large_loads_with_range' : 'calc_large_loads_no_range',
      formulaRef: largeLoadCalc.ruleReference,
      // V4.1 Specification: inputs (required)
      inputs: {
        otherLargeLoads_W: otherLargeRaw,
        hasRange: rangePresent
      },
      // V4.1 Specification: outputs (required)
      outputs: { largeLoadContribution_W: toFixedDigits(largeLoadContribution) },
      // V4.1 Specification: justification (required)
      justification: friendlyNote || (rangePresent
        ? `Other loads >1500W with Range present: Apply 25% demand factor (${largeLoadCalc.ruleReference})`
        : `Other loads >1500W without Range: First 6000W @ 100%, excess @ 25% (${largeLoadCalc.ruleReference})`),
      intermediateValues: {
        otherLargeRaw: toFixedDigits(otherLargeRaw),
        rangePresent: String(rangePresent),
        upTo6000: toFixedDigits(largeLoadCalc.upTo6000W),
        over6000: toFixedDigits(largeLoadCalc.over6000W),
        demandFactor: toFixedDigits(largeLoadCalc.demandFactor)
      },
      output: { largeLoadContribution_W: toFixedDigits(largeLoadContribution) }, // Keep for backward compatibility
      note: friendlyNote, // Keep for backward compatibility
      ruleCitations: [largeLoadCalc.ruleReference]
    });

    applianceLoadW += largeLoadContribution;
  }

  // ============================================
  // Step 9: Small Loads <=1500W
  // ============================================
  const smallLoadsRaw = categories['other_small']?.raw || 0;
  if (smallLoadsRaw > 0) {
    applianceLoadW += smallLoadsRaw;
    pushStep({
      operationId: 'calc_small_loads',
      formulaRef: 'CEC 8-200 1)a)',
      // V4.1 Specification: inputs (required)
      inputs: {
        smallLoads_W: smallLoadsRaw
      },
      // V4.1 Specification: outputs (required)
      outputs: { smallLoadsTotal_W: toFixedDigits(smallLoadsRaw) },
      // V4.1 Specification: justification (required)
      justification: `Small loads <=1500W: ${toFixedDigits(smallLoadsRaw)}W @ 100% demand factor (CEC 8-200 1)a)`,
      intermediateValues: { totalSmallLoads: toFixedDigits(smallLoadsRaw) },
      output: { smallLoadsTotal_W: toFixedDigits(smallLoadsRaw) }, // Keep for backward compatibility
      note: `Small loads <=1500W: ${toFixedDigits(smallLoadsRaw)}W @ 100%`, // Keep for backward compatibility
      ruleCitations: ['CEC 8-200 1)a)']
    });
  }

  // ============================================
  // Step 10: Total Appliances Summary
  // ============================================
  pushStep({
    operationId: 'sum_appliances',
    formulaRef: 'CEC 8-200 1)a) summary',
    // V4.1 Specification: inputs (required)
    inputs: {
      hvacContribution_W: hvacContribution,
      rangeContribution_W: rangeContribution,
      waterHeatersTotal_W: waterHeatersTotal,
      poolSpaTotal_W: poolSpaTotal,
      evseTotal_W: evseTotal,
      largeLoadContribution_W: largeLoadContribution,
      smallLoads_W: smallLoadsRaw
    },
    // V4.1 Specification: outputs (required)
    outputs: { appliancesSumVA: toFixedDigits(applianceLoadW) },
    // V4.1 Specification: justification (required)
    justification: `Sum of all appliance loads: ${toFixedDigits(hvacContribution)}W (HVAC) + ${toFixedDigits(rangeContribution)}W (Range) + ${toFixedDigits(waterHeatersTotal)}W (Water Heaters) + ${toFixedDigits(poolSpaTotal)}W (Pool/Spa) + ${toFixedDigits(evseTotal)}W (EVSE) + ${toFixedDigits(largeLoadContribution)}W (Large) + ${toFixedDigits(smallLoadsRaw)}W (Small) = ${toFixedDigits(applianceLoadW)}W (CEC 8-200 1)a)`,
    intermediateValues: {
      hvac: toFixedDigits(hvacContribution),
      range: toFixedDigits(rangeContribution),
      waterHeaters: toFixedDigits(waterHeatersTotal),
      poolSpa: toFixedDigits(poolSpaTotal),
      evse: toFixedDigits(evseTotal),
      largeLoads: toFixedDigits(largeLoadContribution),
      smallLoads: toFixedDigits(smallLoadsRaw)
    },
    output: { appliancesSumVA: toFixedDigits(applianceLoadW) }, // Keep for backward compatibility
    note: 'Sum of all appliance loads', // Keep for backward compatibility
    ruleCitations: ['CEC 8-200 1)a)']
  });

  // ============================================
  // Step 11: Method A Total
  // ============================================
  const calculatedLoadA = baseLoadW + applianceLoadW;
  pushStep({ 
    operationId: 'sum_method_A', 
    formulaRef: 'CEC 8-200 1)a)', 
    // V4.1 Specification: inputs (required)
    inputs: {
      basicLoad_W: baseLoadW,
      appliancesLoad_W: applianceLoadW
    },
    // V4.1 Specification: outputs (required)
    outputs: { itemA_total_W: toFixedDigits(calculatedLoadA) },
    // V4.1 Specification: justification (required)
    justification: `Method A: ${toFixedDigits(baseLoadW)}W (basic load) + ${toFixedDigits(applianceLoadW)}W (appliances) = ${toFixedDigits(calculatedLoadA)}W (CEC 8-200 1)a)`,
    intermediateValues: {
      basicLoad: toFixedDigits(baseLoadW),
      appliancesLoad: toFixedDigits(applianceLoadW)
    },
    output: { itemA_total_W: toFixedDigits(calculatedLoadA) }, // Keep for backward compatibility
    note: `Method A: ${toFixedDigits(baseLoadW)}W (basic) + ${toFixedDigits(applianceLoadW)}W (appliances) = ${toFixedDigits(calculatedLoadA)}W`, // Keep for backward compatibility
    ruleCitations: ['CEC 8-200 1)a)']
  });

  // ============================================
  // Step 12: Method B - Minimum Load
  // ============================================
  const minimumLoadB = livingArea >= 80 ? 24000 : 14400;
  pushStep({ 
    operationId: 'calc_minimum_load_B', 
    formulaRef: 'CEC 8-200 1)b)', 
    // V4.1 Specification: inputs (required)
    inputs: {
      livingArea_m2: livingArea
    },
    // V4.1 Specification: outputs (required)
    outputs: { itemB_value_W: toFixedDigits(minimumLoadB) },
    // V4.1 Specification: justification (required)
    justification: `Method B: Minimum ${minimumLoadB}W for dwelling ${livingArea >= 80 ? '>= 80m²' : '< 80m²'} (CEC 8-200 1)b)`,
    intermediateValues: { 
      livingArea_m2: toFixedDigits(livingArea),
      threshold: '80'
    }, 
    output: { itemB_value_W: toFixedDigits(minimumLoadB) }, // Keep for backward compatibility
    note: `Method B: Minimum ${minimumLoadB}W for dwelling ${livingArea >= 80 ? '>= 80m2' : '< 80m2'}`, // Keep for backward compatibility
    ruleCitations: ['CEC 8-200 1)b)']
  });

  // ============================================
  // Step 13: Final Load Selection
  // ============================================
  const finalLoadW = Math.max(calculatedLoadA, minimumLoadB);
  const usedMethod = finalLoadW === minimumLoadB ? 'B (minimum)' : 'A (calculated)';
  
  if (finalLoadW === minimumLoadB && calculatedLoadA < minimumLoadB) {
    const warningMsg = `Calculated load (${toFixedDigits(calculatedLoadA)}W) is less than minimum, using CEC 8-200 1)b) minimum: ${toFixedDigits(minimumLoadB)}W`;
    warnings.push(warningMsg);
  }
  
  pushStep({ 
    operationId: 'select_final_load', 
    formulaRef: 'CEC 8-200 1)', 
    // V4.1 Specification: inputs (required)
    inputs: {
      methodA_W: calculatedLoadA,
      methodB_W: minimumLoadB
    },
    // V4.1 Specification: outputs (required)
    outputs: { chosenCalculatedLoad_W: toFixedDigits(finalLoadW) },
    // V4.1 Specification: justification (required)
    justification: `Final load = max(${toFixedDigits(calculatedLoadA)}W (Method A), ${toFixedDigits(minimumLoadB)}W (Method B)) = ${toFixedDigits(finalLoadW)}W using Method ${usedMethod} (CEC 8-200 1)`,
    intermediateValues: {
      methodA: toFixedDigits(calculatedLoadA),
      methodB: toFixedDigits(minimumLoadB),
      usedMethod: usedMethod
    },
    output: { chosenCalculatedLoad_W: toFixedDigits(finalLoadW) }, // Keep for backward compatibility
    note: `Final load = max(${toFixedDigits(calculatedLoadA)}W, ${toFixedDigits(minimumLoadB)}W) = ${toFixedDigits(finalLoadW)}W using Method ${usedMethod}`, // Keep for backward compatibility
    ruleCitations: ['CEC 8-200 1)']
  });

  // ============================================
  // Step 14: Service Current Calculation
  // ============================================
  const serviceCurrent_A = finalLoadW / voltageDivisor;
  pushStep({ 
    operationId: 'calc_service_current', 
    formulaRef: phase === 3 ? 'I = P / (V x sqrt3)' : 'I = P/V', 
    // V4.1 Specification: inputs (required)
    inputs: {
      load_W: finalLoadW,
      voltage_V: voltage,
      phase: phase
    },
    // V4.1 Specification: outputs (required)
    outputs: { serviceCurrentA: toFixedDigits(serviceCurrent_A) },
    // V4.1 Specification: justification (required)
    justification: `Service current: ${toFixedDigits(finalLoadW)}W / ${toFixedDigits(voltageDivisor)}V = ${toFixedDigits(serviceCurrent_A)}A (CEC 8-104)`,
    intermediateValues: {
      load_W: toFixedDigits(finalLoadW),
      voltage: toFixedDigits(voltage),
      phase: String(phase)
    },
    output: { serviceCurrentA: toFixedDigits(serviceCurrent_A) }, // Keep for backward compatibility
    note: `Service current: ${toFixedDigits(finalLoadW)}W / ${toFixedDigits(voltageDivisor)}V = ${toFixedDigits(serviceCurrent_A)}A`, // Keep for backward compatibility
    ruleCitations: ['CEC 8-104']
  });

  // ============================================
  // Step 15: Conductor Selection
  // ============================================
  const conductorResult = lookupConductorSize(
    serviceCurrent_A,
    inputs.conductorMaterial || 'Cu',
    (inputs.terminationTempC || 75) as 60 | 75 | 90,
    ruleTables,
    inputs.ambientTempC,
    inputs.numConductorsInRaceway
  );
  if (conductorResult.warnings) warnings.push(...conductorResult.warnings);
  pushStep({ 
    operationId: 'select_conductor', 
    formulaRef: 'CEC Table 2, Table 4, Table 5A, Table 5C', 
    // V4.1 Specification: inputs (required)
    inputs: {
      requiredAmps: serviceCurrent_A,
      conductorMaterial: inputs.conductorMaterial || 'Cu',
      terminationTempC: inputs.terminationTempC || 75,
      ambientTempC: inputs.ambientTempC,
      numConductors: inputs.numConductorsInRaceway
    },
    // V4.1 Specification: outputs (required)
    outputs: { 
      conductorSize: conductorResult.size, 
      conductorAmpacity: toFixedDigits(conductorResult.effectiveAmpacity || conductorResult.baseAmpacity) 
    },
    // V4.1 Specification: justification (required)
    justification: `Selected ${conductorResult.size} conductor with ${toFixedDigits(conductorResult.effectiveAmpacity || conductorResult.baseAmpacity)}A capacity (CEC Table 2/4, corrected by Table 5A/5C if applicable)`,
    intermediateValues: { 
      requiredAmps: toFixedDigits(serviceCurrent_A),
      material: inputs.conductorMaterial || 'Cu',
      terminationTemp: String(inputs.terminationTempC || 75)
    }, 
    output: { 
      conductorSize: conductorResult.size, 
      conductorAmpacity: toFixedDigits(conductorResult.effectiveAmpacity || conductorResult.baseAmpacity) 
    }, // Keep for backward compatibility
    note: `Selected ${conductorResult.size} conductor with ${toFixedDigits(conductorResult.effectiveAmpacity || conductorResult.baseAmpacity)}A capacity`, // Keep for backward compatibility
    tableReferences: conductorResult.tableReferences,
    ruleCitations: ['CEC 4-004', 'CEC 4-006']
  });

  // ============================================
  // Step 16: Panel/Breaker Sizing
  // ============================================
  // Use jurisdiction-specific breaker sizes if provided, otherwise use standard sizes
  // Standard residential main panel breaker sizes (common in North America)
  // Note: 110A is not a standard residential panel breaker size
  // Standard sizes: 60, 100, 125, 150, 200A for main panels
  // For branch circuits: 15, 20, 30, 40, 50, 60A are common
  const standardMainPanelSizes = [60, 100, 125, 150, 200, 225, 250, 300, 400];
  const availableBreakerSizes = jurisdictionConfig?.panelBreakerSizes || standardMainPanelSizes;
  const requiredBreaker = Math.ceil(serviceCurrent_A);
  
  // Debug logging
  if (jurisdictionConfig?.panelBreakerSizes) {
    console.log('🔧 Using jurisdiction-specific breaker sizes:', jurisdictionConfig.panelBreakerSizes);
  } else {
    console.log('📋 Using standard breaker sizes:', standardMainPanelSizes);
  }
  console.log('⚡ Required breaker size:', requiredBreaker, 'A');
  console.log('📊 Available breaker sizes:', availableBreakerSizes);
  
  const breakerSize = availableBreakerSizes.find(s => s >= requiredBreaker) || availableBreakerSizes[availableBreakerSizes.length - 1];
  
  console.log('✅ Selected breaker size:', breakerSize, 'A');
  
  pushStep({
    operationId: 'select_breaker',
    formulaRef: 'CEC 8-104',
    // V4.1 Specification: inputs (required)
    inputs: {
      requiredAmps: serviceCurrent_A
    },
    // V4.1 Specification: outputs (required)
    outputs: {
      breakerSizeA: String(breakerSize),
      panelRatingA: String(breakerSize)
    },
    // V4.1 Specification: justification (required)
    justification: `Selected ${breakerSize}A breaker/panel (next standard size >= ${toFixedDigits(serviceCurrent_A)}A) (CEC 8-104)`,
    intermediateValues: {
      requiredAmps: toFixedDigits(serviceCurrent_A),
      minimumBreaker: String(requiredBreaker)
    },
    output: {
      breakerSizeA: String(breakerSize),
      panelRatingA: String(breakerSize)
    }, // Keep for backward compatibility
    note: `Selected ${breakerSize}A breaker/panel (next standard size >= ${toFixedDigits(serviceCurrent_A)}A)`, // Keep for backward compatibility
    ruleCitations: ['CEC 8-104']
  });

  // ============================================
  // Assemble Results
  // ============================================
  const results: CecResults = {
    computedLivingArea_m2: toFixedDigits(livingArea),
    basicVA: toFixedDigits(baseLoadW),
    appliancesSumVA: toFixedDigits(applianceLoadW),
    continuousAdjustedVA: '0.00',
    itemA_total_W: toFixedDigits(calculatedLoadA),
    itemB_value_W: toFixedDigits(minimumLoadB),
    chosenCalculatedLoad_W: toFixedDigits(finalLoadW),
    serviceCurrentA: toFixedDigits(serviceCurrent_A),
    conductorSize: conductorResult.size,
    conductorAmpacity: toFixedDigits(conductorResult.effectiveAmpacity || conductorResult.baseAmpacity),
    panelRatingA: toFixedDigits(breakerSize, 0),
    breakerSizeA: toFixedDigits(breakerSize, 0),
    demandVA: toFixedDigits(finalLoadW),
    demand_kVA: toFixedDigits(finalLoadW / 1000),
    sizingCurrentA: toFixedDigits(serviceCurrent_A),
    
    // ✅ Add detailed load breakdown for UI display
    hvacLoad: toFixedDigits(hvacContribution),
    rangeLoad: toFixedDigits(rangeContribution),
    waterHeaterLoad: toFixedDigits(waterHeatersTotal),
    poolSpaLoad: toFixedDigits(poolSpaTotal),
    evseLoad: toFixedDigits(evseTotal),
    otherLargeLoadsTotal: toFixedDigits(largeLoadContribution),
    otherSmallLoadsTotal: toFixedDigits(smallLoadsRaw)
  };

  // ============================================
  // Assemble Final Bundle
  // ============================================
  const finalBundle: UnsignedBundle = {
    id: `calc-service-${Date.now()}`,
    createdAt: createdAt,
    domain: 'electrical',
    calculationType: 'cec_load',
    buildingType: 'single-dwelling',
    engine: engineMeta,
    ruleSets: [{ ruleSetId: 'cec-2024', version: '2024', code: 'cec', jurisdiction: 'CA-CEC' }],
    inputs: {
      ...inputs,
      project: inputs.project || 'Unnamed Project',
      livingArea_m2: inputs.livingArea_m2 || 0,
      systemVoltage: inputs.systemVoltage,
      phase: inputs.phase || 1,
      appliances: inputs.appliances || [],
      continuousLoads: inputs.continuousLoads || [],
    },
    steps,
    results,
    meta: {
      canonicalization_version: 'rfc8785-v1',
      numeric_format: 'fixed_decimals_2',
      calculation_standard: 'CEC-2024',
      tables_used: [],
      build_info: { 
        commit: engineMeta.commit, 
        build_timestamp: engineMeta.buildTimestamp || '', 
        environment: 'service' 
      },
    },
    warnings,
  };

  return finalBundle;
}
