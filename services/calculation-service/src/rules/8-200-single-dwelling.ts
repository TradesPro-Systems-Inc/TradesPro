// services/calculation-service/src/rules/8-200-single-dwelling.ts
// The TRUE Coordinator - Audit Orchestrator for CEC 8-200 Single Dwelling
// NO CALCULATION LOGIC - Only coordination and audit trail creation

import { calculateBaseLoad, calculateBaseLoadWithAudit } from '../calculators/baseLoadCalculator';
import { lookupConductorSize } from '../core/tables';
import { 
  CecInputsSingle, 
  CalculationStep, 
  UnsignedBundle, 
  EngineMeta, 
  RuleTables,
  Timestamp
} from '../core/types';

/**
 * TRUE COORDINATOR: CEC 8-200 Single Dwelling Audit Orchestrator
 * 
 * This module follows V4.1 architecture principles:
 * - NO calculation logic - only coordination and audit trail creation
 * - All calculations delegated to pure function modules
 * - Single responsibility: orchestrate the calculation flow and create detailed audit steps
 * 
 * @param inputs - Complete input parameters
 * @param engineMeta - Engine metadata
 * @param ruleTables - Rule tables for conductor selection
 * @returns Complete calculation bundle with audit trail
 */
export function computeSingleDwelling(
  inputs: CecInputsSingle,
  engineMeta: EngineMeta,
  ruleTables: RuleTables
): UnsignedBundle {
  const steps: CalculationStep[] = [];
  let stepIndex = 1;
  const createdAt = new Date().toISOString() as Timestamp;
  const warnings: string[] = [];

  // --- Step 1: Living Area Calculation ---
  const livingArea_m2 = inputs.livingArea_m2 || 0;
  steps.push({
    stepIndex: stepIndex++,
    operationId: 'living_area',
    formulaRef: 'Input Parameter',
    ruleCitations: [],
    inputs: { livingArea_m2 },
    outputs: { livingArea_m2 },
    justification: 'Living area provided as input parameter.',
    timestamp: createdAt,
  });

  // --- Step 2: Basic Load Calculation ---
  // ✅ CORRECT: Delegate to pure calculation module
  const baseLoadResult = calculateBaseLoadWithAudit(livingArea_m2);
  steps.push({
    stepIndex: stepIndex++,
    operationId: 'calc_base_load',
    formulaRef: 'CEC 8-200 1)a)i),ii)',
    ruleCitations: ['8-200 1)a)i)', '8-200 1)a)ii)'],
    inputs: { livingArea_m2 },
    outputs: { basicLoad_W: baseLoadResult.basicLoad_W },
    intermediateValues: baseLoadResult.intermediateValues,
    justification: `5000W for first 90m² + 1000W per additional 90m² portion.`,
    timestamp: createdAt,
  });
  let totalLoad_W = baseLoadResult.basicLoad_W;

  // --- Step 3: HVAC Load Calculation ---
  // TODO: Create pure calculator module for HVAC loads
  // For now, using simplified logic - this should be replaced with a pure calculator
  const hvacLoad_W = calculateHVACLoad(inputs);
  if (hvacLoad_W > 0) {
    steps.push({
      stepIndex: stepIndex++,
      operationId: 'calc_hvac_load',
      formulaRef: 'CEC 8-200 1)a)iii)',
      ruleCitations: ['8-200 1)a)iii)'],
      inputs: { 
        heatingLoad_W: inputs.heatingLoad_W || 0,
        coolingLoad_W: inputs.coolingLoad_W || 0
      },
      outputs: { hvacLoad_W },
      justification: 'HVAC loads calculated per CEC 8-200 1)a)iii).',
      timestamp: createdAt,
    });
    totalLoad_W += hvacLoad_W;
  }

  // --- Step 4: Electric Range Load Calculation ---
  // TODO: Create pure calculator module for range loads
  const rangeLoad_W = calculateRangeLoad(inputs);
  if (rangeLoad_W > 0) {
    steps.push({
      stepIndex: stepIndex++,
      operationId: 'calc_range_load',
      formulaRef: 'CEC 8-200 1)a)iv)',
      ruleCitations: ['8-200 1)a)iv)'],
      inputs: { rangeRating_W: inputs.rangeRating_W || 0 },
      outputs: { rangeLoad_W },
      justification: 'Electric range load calculated per CEC 8-200 1)a)iv).',
      timestamp: createdAt,
    });
    totalLoad_W += rangeLoad_W;
  }

  // --- Step 5: Water Heater Load Calculation ---
  // TODO: Create pure calculator module for water heater loads
  const waterHeaterLoad_W = calculateWaterHeaterLoad(inputs);
  if (waterHeaterLoad_W > 0) {
    steps.push({
      stepIndex: stepIndex++,
      operationId: 'calc_water_heater_load',
      formulaRef: 'CEC 8-200 1)a)v)',
      ruleCitations: ['8-200 1)a)v)'],
      inputs: { waterHeaterRating_W: inputs.waterHeaterRating_W || 0 },
      outputs: { waterHeaterLoad_W },
      justification: 'Water heater load calculated per CEC 8-200 1)a)v).',
      timestamp: createdAt,
    });
    totalLoad_W += waterHeaterLoad_W;
  }

  // --- Step 6: EVSE Load Calculation ---
  // TODO: Create pure calculator module for EVSE loads
  const evseLoad_W = calculateEVSELoad(inputs);
  if (evseLoad_W > 0) {
    steps.push({
      stepIndex: stepIndex++,
      operationId: 'calc_evse_load',
      formulaRef: 'CEC 8-200 1)a)vi)',
      ruleCitations: ['8-200 1)a)vi)'],
      inputs: { 
        evseRating_W: inputs.evseRating_W || 0,
        hasEVEMS: inputs.hasEVEMS || false
      },
      outputs: { evseLoad_W },
      justification: 'EVSE load calculated per CEC 8-200 1)a)vi).',
      timestamp: createdAt,
    });
    totalLoad_W += evseLoad_W;
  }

  // --- Step 7: Other Large Loads Calculation ---
  // TODO: Create pure calculator module for other large loads
  const otherLargeLoads_W = calculateOtherLargeLoads(inputs);
  if (otherLargeLoads_W > 0) {
    steps.push({
      stepIndex: stepIndex++,
      operationId: 'calc_other_large_loads',
      formulaRef: 'CEC 8-200 1)a)vii)',
      ruleCitations: ['8-200 1)a)vii)'],
      inputs: { appliances: inputs.appliances || [] },
      outputs: { otherLargeLoads_W },
      justification: 'Other large loads calculated per CEC 8-200 1)a)vii).',
      timestamp: createdAt,
    });
    totalLoad_W += otherLargeLoads_W;
  }

  // --- Step 8: Minimum Load Check ---
  // TODO: Create pure calculator module for minimum load
  const minimumLoad_W = calculateMinimumLoad(inputs);
  if (totalLoad_W < minimumLoad_W) {
    warnings.push(`Calculated load (${totalLoad_W}W) is less than minimum load (${minimumLoad_W}W). Using minimum load.`);
    totalLoad_W = minimumLoad_W;
    steps.push({
      stepIndex: stepIndex++,
      operationId: 'apply_minimum_load',
      formulaRef: 'CEC 8-200 1)b)',
      ruleCitations: ['8-200 1)b)'],
      inputs: { calculatedLoad_W: totalLoad_W, minimumLoad_W },
      outputs: { finalLoad_W: minimumLoad_W },
      justification: 'Minimum load applied as per CEC 8-200 1)b).',
      timestamp: createdAt,
      warnings: [`Applied minimum load: ${minimumLoad_W}W`]
    });
  }

  // --- Step 9: Service Current Calculation ---
  const systemVoltage = inputs.systemVoltage || 240;
  const serviceCurrent_A = totalLoad_W / systemVoltage;
  steps.push({
    stepIndex: stepIndex++,
    operationId: 'calc_service_current',
    formulaRef: 'I = P / V',
    ruleCitations: [],
    inputs: { totalLoad_W, systemVoltage },
    outputs: { serviceCurrent_A },
    justification: `Service current: ${totalLoad_W}W ÷ ${systemVoltage}V = ${serviceCurrent_A.toFixed(2)}A`,
    timestamp: createdAt,
  });

  // --- Step 10: Conductor Selection ---
  // ✅ CORRECT: Use the powerful tables engine, not simplified logic
  const conductorResult = lookupConductorSize(
    serviceCurrent_A,
    inputs.conductorMaterial || 'Cu',
    inputs.terminationTempC || 75,
    inputs.ambientTempC || 30,
    inputs.numConductorsInRaceway || 3,
    ruleTables
  );
  
  if (conductorResult.warnings) {
    warnings.push(...conductorResult.warnings);
  }

  steps.push({
    stepIndex: stepIndex++,
    operationId: 'select_conductor',
    formulaRef: 'CEC Table 2/4, 5A, 5C',
    ruleCitations: ['4-004', 'Table 2', 'Table 5A', 'Table 5C'],
    inputs: { 
      serviceCurrent_A,
      conductorMaterial: inputs.conductorMaterial || 'Cu',
      terminationTempC: inputs.terminationTempC || 75,
      ambientTempC: inputs.ambientTempC || 30,
      numConductorsInRaceway: inputs.numConductorsInRaceway || 3
    },
    outputs: { 
      conductorSize: conductorResult.size,
      conductorAmpacity: conductorResult.baseAmpacity,
      deratedAmpacity: conductorResult.effectiveAmpacity,
      tempCorrectionFactor: conductorResult.tempCorrectionFactor
    },
    justification: 'Smallest conductor where Derated Ampacity >= Service Current.',
    timestamp: createdAt,
    tableReferences: conductorResult.tableReferences,
  });

  // --- Step 11: Breaker Selection ---
  // TODO: Create pure calculator module for breaker selection
  const breakerSize_A = selectBreakerSize(serviceCurrent_A, conductorResult.baseAmpacity);
  steps.push({
    stepIndex: stepIndex++,
    operationId: 'select_breaker',
    formulaRef: 'CEC 14-104',
    ruleCitations: ['14-104'],
    inputs: { serviceCurrent_A, conductorAmpacity: conductorResult.baseAmpacity },
    outputs: { breakerSize_A },
    justification: 'Breaker sized to protect conductor and meet service current requirements.',
    timestamp: createdAt,
  });

  // --- Assemble the Final Bundle ---
  const finalBundle: UnsignedBundle = {
    inputs,
    results: {
      totalLoad_W,
      serviceCurrent_A,
      conductorSize: conductorResult.size,
      conductorAmpacity: conductorResult.baseAmpacity,
      deratedAmpacity: conductorResult.effectiveAmpacity,
      breakerSize_A,
      tempCorrectionFactor: conductorResult.tempCorrectionFactor
    },
    steps,
    warnings,
    meta: {
      engine: engineMeta,
      calculationId: `calc_${Date.now()}`,
      createdAt,
      completedAt: new Date().toISOString() as Timestamp,
      version: '5.0.0'
    }
  };
  
  return finalBundle;
}

// ============================================================================
// TEMPORARY CALCULATION FUNCTIONS - TO BE REPLACED WITH PURE CALCULATORS
// ============================================================================
// These functions are temporary and should be moved to separate pure calculator modules

function calculateHVACLoad(inputs: CecInputsSingle): number {
  // TODO: Move to hvacLoadCalculator.ts
  return (inputs.heatingLoad_W || 0) + (inputs.coolingLoad_W || 0);
}

function calculateRangeLoad(inputs: CecInputsSingle): number {
  // TODO: Move to rangeLoadCalculator.ts
  return inputs.rangeRating_W || 0;
}

function calculateWaterHeaterLoad(inputs: CecInputsSingle): number {
  // TODO: Move to waterHeaterLoadCalculator.ts
  return inputs.waterHeaterRating_W || 0;
}

function calculateEVSELoad(inputs: CecInputsSingle): number {
  // TODO: Move to evseLoadCalculator.ts
  if (inputs.hasEVEMS) return 0; // EVEMS exempts EVSE load
  return inputs.evseRating_W || 0;
}

function calculateOtherLargeLoads(inputs: CecInputsSingle): number {
  // TODO: Move to otherLargeLoadsCalculator.ts
  if (!inputs.appliances) return 0;
  return inputs.appliances.reduce((total, appliance) => total + (appliance.watts || 0), 0);
}

function calculateMinimumLoad(inputs: CecInputsSingle): number {
  // TODO: Move to minimumLoadCalculator.ts
  return 24000; // CEC 8-200 1)b) minimum load
}

function selectBreakerSize(serviceCurrent_A: number, conductorAmpacity_A: number): number {
  // TODO: Move to breakerSelectionCalculator.ts
  // Simplified logic - should use proper breaker selection tables
  return Math.ceil(serviceCurrent_A / 10) * 10; // Round up to nearest 10A
}
