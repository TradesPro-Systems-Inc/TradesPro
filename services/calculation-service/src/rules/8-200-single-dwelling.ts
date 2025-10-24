import { calculateBaseLoad } from '../calculators/baseLoadCalculator';
import { calculateHeatingCoolingLoad } from '../calculators/heatingCoolingCalculator';
import { calculateRangeLoad, calculateOtherLargeLoads } from '../calculators/applianceLoadCalculator';
import { lookupConductorSize } from '../coretableLookups';
import { CecInputsSingle, CalculationStep, UnsignedBundle, EngineMeta, RuleTables, CecResults } from '../core/types';

export function computeSingleDwelling(
  inputs: CecInputsSingle,
  engineMeta: EngineMeta,
  ruleTables: RuleTables // Tables are PASSED IN
): UnsignedBundle {
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];
  let stepIndex = 1;
  const createdAt = new Date().toISOString();

  // ✅ FIX 1: Add pushStep helper
  const pushStep = (step: Omit<CalculationStep, 'stepIndex' | 'timestamp'>) => {
    steps.push({ ...step, stepIndex: stepIndex++, timestamp: createdAt });
  };

  const toFixedDigits = (n: number, digits: number = 2): string => {
    if (isNaN(n) || n === null) return '0.00';
    return Number(n).toFixed(digits);
  };

  // --- Main Calculation Logic ---
  const livingArea = inputs.livingArea_m2 || 0;
  const voltage = inputs.systemVoltage;
  const phase = inputs.phase || 1;
  const voltageDivisor = phase === 3 ? voltage * Math.sqrt(3) : voltage;

  // 1. Method A: Detailed Calculation
  const baseLoadW = calculateBaseLoad(inputs.livingArea_m2 || 0);
  pushStep({ operationId: 'calc_base_load_A', formulaRef: 'CEC 8-200 1)a)i-ii)', intermediateValues: { livingArea_m2: toFixedDigits(livingArea) }, output: { loadW: toFixedDigits(baseLoadW) }, note: `Method A: Basic load for ${livingArea}m²` });

  const hvacLoadW = calculateHeatingCoolingLoad(inputs.heatingLoadW || 0, inputs.coolingLoadW || 0, inputs.isHeatingAcInterlocked || false);
  pushStep({ operationId: 'calc_hvac_load', formulaRef: 'CEC 8-200 1)a)iii) + 62-118 3)', intermediateValues: { heating: toFixedDigits(inputs.heatingLoadW || 0), cooling: toFixedDigits(inputs.coolingLoadW || 0) }, output: { loadW: toFixedDigits(hvacLoadW) }, note: 'HVAC Load with demand factors' });

  // ✅ FIX 2: Add appliance load calculation
  let applianceLoadW = 0;
  const range = (inputs.appliances || []).find(a => a.type === 'range');
  const hasRange = !!range;
  if (hasRange) {
    const rangeRatingkW = range.rating_kW || (range.watts || 0) / 1000;
    const rangeDemand = calculateRangeLoad(rangeRatingkW);
    applianceLoadW += rangeDemand;
    pushStep({ operationId: 'calc_range_load', formulaRef: 'CEC 8-200 1)a)iv)', intermediateValues: { rating_kW: toFixedDigits(rangeRatingkW) }, output: { loadW: toFixedDigits(rangeDemand) }, note: 'Electric Range Load' });
  }
  const otherLargeLoadsW = (inputs.appliances || []).filter(a => a.type !== 'range' && (a.watts || 0) > 1500).reduce((sum, app) => sum + (app.watts || 0), 0);
  if (otherLargeLoadsW > 0) {
    const otherLargeLoadsDemand = calculateOtherLargeLoads(otherLargeLoadsW, hasRange);
    applianceLoadW += otherLargeLoadsDemand;
    pushStep({ operationId: 'calc_other_large_loads', formulaRef: 'CEC 8-200 1)a)viii)', intermediateValues: { totalLargeLoadW: toFixedDigits(otherLargeLoadsW), hasRange: hasRange.toString() }, output: { loadW: toFixedDigits(otherLargeLoadsDemand) }, note: 'Other Large Loads (>1500W)' });
  }
  const remainingLoads = (inputs.appliances || []).filter(a => a.type !== 'range' && (a.watts || 0) <= 1500).reduce((sum, app) => sum + (app.watts || 0), 0);
  applianceLoadW += remainingLoads;
  if (remainingLoads > 0) {
    pushStep({ operationId: 'calc_remaining_loads', formulaRef: 'CEC 8-200', output: { loadW: toFixedDigits(remainingLoads) }, note: 'Sum of remaining small loads' });
  }

  // ✅ FIX 8: Correct total load calculation
  const calculatedLoadA = baseLoadW + hvacLoadW + applianceLoadW;
  pushStep({ operationId: 'sum_method_A', formulaRef: 'CEC 8-200 1)a)', output: { totalW: toFixedDigits(calculatedLoadA) }, note: 'Total calculated load for Method A' });

  // ✅ FIX 3: Add Method B calculation
  const minimumLoadB = livingArea >= 80 ? 24000 : 14400;
  pushStep({ operationId: 'calc_minimum_load_B', formulaRef: 'CEC 8-200 1)b)', intermediateValues: { livingArea_m2: toFixedDigits(livingArea) }, output: { minimumW: toFixedDigits(minimumLoadB) }, note: `Method B: Minimum load for area ${livingArea >= 80 ? '≥ 80m²' : '< 80m²'}` });

  // ✅ FIX 4: Add final load selection
  const finalLoadW = Math.max(calculatedLoadA, minimumLoadB);
  let finalLoadNote = 'Final load is the greater of Method A or B. Using Method A.';
  if (finalLoadW === minimumLoadB && calculatedLoadA < minimumLoadB) {
    const warningMsg = `Calculated load (${toFixedDigits(calculatedLoadA)}W) is less than minimum, using CEC 8-200 1)b) minimum: ${toFixedDigits(minimumLoadB)}W`;
    warnings.push(warningMsg);
    finalLoadNote = `Final load is the greater of Method A or B. Using Method B (minimum). Warning: ${warningMsg}`;
  }
  pushStep({ operationId: 'select_final_load', formulaRef: 'CEC 8-200 1)', output: { finalLoadW: toFixedDigits(finalLoadW) }, note: finalLoadNote });

  const serviceCurrent_A = finalLoadW / voltageDivisor;
  pushStep({ operationId: 'calc_service_current', formulaRef: phase === 3 ? 'I = P / (V*√3)' : 'I = P/V', output: { serviceCurrentA: toFixedDigits(serviceCurrent_A) }, note: 'Service Current' });

  const conductorResult = lookupConductorSize(
      serviceCurrent_A,
      inputs.conductorMaterial || 'Cu',
      inputs.terminationTempC || 75,
      ruleTables, // Pass the tables object
      inputs.ambientTempC,
      inputs.numConductorsInRaceway
  );
  if (conductorResult.warnings) warnings.push(...conductorResult.warnings);
  pushStep({ operationId: 'select_conductor', formulaRef: 'CEC T2/T4, T5A, T5C', intermediateValues: { requiredAmps: toFixedDigits(serviceCurrent_A) }, output: { size: conductorResult.size, ampacity: toFixedDigits(conductorResult.effectiveAmpacity || conductorResult.baseAmpacity) }, note: 'Conductor Sizing', tableReferences: conductorResult.tableReferences });

  // ✅ FIX 5: Add panel/breaker sizing
  const standardSizes = [15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 400];
  const requiredBreaker = Math.ceil(serviceCurrent_A);
  const breakerSize = standardSizes.find(s => s >= requiredBreaker) || standardSizes[standardSizes.length - 1];

  // ✅ FIX 9: Create complete results object
  const results: CecResults = {
    computedLivingArea_m2: toFixedDigits(livingArea),
    basicVA: toFixedDigits(baseLoadW),
    appliancesSumVA: toFixedDigits(applianceLoadW),
    continuousAdjustedVA: '0.00', // Placeholder
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
  };

  // ✅ FIX 6 & 7: Assemble and return the final, complete bundle
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
      tables_used: [], // TODO: Populate this based on conductorResult.tableReferences
      build_info: { commit: engineMeta.commit, build_timestamp: engineMeta.buildTimestamp || '', environment: 'service' },
    },
    warnings,
  };

  return finalBundle;
}
