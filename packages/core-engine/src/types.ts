// @tradespro/core-engine/src/types.ts
// TradesPro Core Type Definitions - Multi-Version Support
// Version: 5.0.0

export type Timestamp = string;
export type CodeEdition = '2021' | '2024' | '2027' | '2023' | '2020';
export type CodeType = 'cec' | 'nec';

// ============================================
// Engine Metadata
// ============================================
export interface EngineMeta {
  name: string;
  version: string;
  commit: string; // MUST be injected by CI/CD
  buildTimestamp?: string;
}

// ============================================
// Rule Set References (Multi-Version)
// ============================================
export interface RuleSetRef {
  ruleSetId: string;
  version: CodeEdition;
  code: CodeType;
  jurisdiction: string;
  source?: string;
  checksum?: string;
}

// ============================================
// Table Structures (Multi-Version)
// ============================================
export interface TableEntry {
  [key: string]: any;
  size?: string;
  unit?: string;
  ambientTempC?: number;
  numConductorsRange?: string;
  correctionFactor?: number;
}

export interface Table {
  tableId: string;
  name?: string;
  version?: CodeEdition;
  code?: CodeType;
  checksum?: string;
  source?: string;
  entries: TableEntry[];
}

export interface RuleTables {
  table2?: Table;
  table4?: Table;
  table5A?: Table;
  table5C?: Table;
  edition?: CodeEdition;
  code?: CodeType;
}

// ============================================
// Calculation Step (Audit Trail)
// ============================================
/**
 * V4.1 Architecture: Calculation Step (Audit Trail)
 * 
 * This interface complies with V4.1 specification which requires:
 * - inputs: Record<string, any> (required) - Input values used in this calculation step
 * - outputs: Record<string, any> (required) - Output values from this calculation step
 * - justification: string (required) - Explanation of the calculation
 * - tableReferences: Array<...> (optional) - References to CEC tables used
 */
export interface CalculationStep {
  stepIndex: number;
  operationId: string;
  displayName?: string;  // Friendly display name for UI
  formulaRef?: string;
  ruleCitations?: string[];
  
  // V4.1 Specification: Required fields
  inputs: Record<string, any>;  // Input values used in this calculation (V4.1 required)
  outputs: Record<string, any>;  // Output values from this calculation (V4.1 required)
  justification: string;  // Explanation of the calculation (V4.1 required)
  
  // Optional fields for additional detail
  intermediateValues?: Record<string, any>;  // Intermediate calculation values (optional)
  tableReferences?: Array<{ tableId: string; version?: string; rowIndex: number; columnUsed?: string }>;  // CEC table references (optional)
  
  // Legacy fields (kept for backward compatibility)
  output?: Record<string, any>;  // DEPRECATED: Use 'outputs' instead (kept for backward compatibility)
  note?: string;  // DEPRECATED: Use 'justification' instead (kept for backward compatibility)
  
  timestamp: Timestamp;
}

// ============================================
// Input Types
// ============================================
export interface Appliance {
  id?: string;
  name?: string;
  watts?: number;
  type?: 'range' | 'space_heating' | 'air_conditioning' | 'tankless_water_heater' | 'pool_spa' | 'evse' | 'water_heater' | 'other';
  isContinuous?: boolean;
  rating_kW?: number;
  hasEVEMS?: boolean;
}

export interface CecInputsSingle {
  id?: string;
  project?: string;
  livingArea_m2?: number;
  systemVoltage: number;
  phase?: 1 | 3;
  appliances?: Appliance[];
  continuousLoads?: Appliance[];
  heatingLoadW?: number;
  coolingLoadW?: number;
  isHeatingAcInterlocked?: boolean;
  
  // Main form dedicated fields
  hasElectricRange?: boolean;
  electricRangeRatingKW?: number;
  hasEVSE?: boolean;
  evseRatingW?: number;
  evseHasEVEMS?: boolean;
  waterHeaterType?: 'none' | 'storage' | 'tankless' | 'pool_spa';
  waterHeaterRatingW?: number;
  
  conductorMaterial?: 'Cu' | 'Al';
  terminationTempC?: number;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
  codeEdition?: CodeEdition;
}

// ============================================
// Output Types
// ============================================
export interface CecResults {
  computedLivingArea_m2: string;
  basicVA: string;
  appliancesSumVA: string;
  continuousAdjustedVA: string;
  itemA_total_W: string;
  itemB_value_W: string;
  chosenCalculatedLoad_W: string;
  serviceCurrentA: string;
  conductorSize: string;
  conductorAmpacity: string;
  panelRatingA: string;
  breakerSizeA: string;
  demandVA: string;
  demand_kVA: string;
  sizingCurrentA: string;
  
  // ✅ Detailed load breakdown for UI display
  hvacLoad?: string;
  rangeLoad?: string;
  waterHeaterLoad?: string;
  poolSpaLoad?: string;
  evseLoad?: string;
  otherLargeLoadsTotal?: string;
  otherSmallLoadsTotal?: string;
}

export interface CalculationMeta {
  canonicalization_version: string;
  numeric_format: string;
  calculation_standard: string;
  tables_used: string[];
  build_info: {
    commit: string;
    build_timestamp: string;
    environment: string;
  };
}

/**
 * V4.1 Architecture: Unsigned Bundle
 * 
 * This is the complete calculation bundle returned from the calculation engine.
 * It contains all inputs, calculation steps, results, and metadata.
 * 
 * Note: V4.1 specification uses "UnsignedBundleV4" in documentation,
 * but we use "UnsignedBundle" in code for simplicity. Both refer to the same structure.
 */
export interface UnsignedBundle {
  id: string;
  createdAt: Timestamp;
  createdBy?: {
    userId?: string;
    name?: string;
  };
  domain: 'electrical';
  calculationType: 'cec_load' | 'nec_load';
  buildingType: 'single-dwelling';
  engine: EngineMeta;
  ruleSets: RuleSetRef[];
  inputs: CecInputsSingle;
  steps: CalculationStep[];  // V4.1: Each step includes inputs, outputs, justification (required)
  results: CecResults;
  meta: CalculationMeta;
  warnings: string[];
}

/**
 * V4.1 Architecture: Type alias for UnsignedBundle
 * 
 * This alias is provided to match V4.1 specification terminology.
 * Use UnsignedBundle or UnsignedBundleV4 - they are the same type.
 */
export type UnsignedBundleV4 = UnsignedBundle;

// ============================================
// Table Lookup Results
// ============================================
export interface ConductorResult {
  size: string;
  baseAmpacity: number;
  effectiveAmpacity?: number;
  tableReferences?: Array<{ tableId: string; version?: string; rowIndex: number; columnUsed?: string }>;
  warnings?: string[];
}

// ============================================
// Load Calculation Results
// ============================================
export interface BaseLoadResult {
  loadW: number;
  breakdown?: Array<{
    description: string;
    rawArea_m2: number;
    factor: number;
    countedArea_m2: number;
  }>;
}

export interface HVACLoadResult {
  loadW: number;
  heatingDemandW: number;
  coolingDemandW: number;
  isInterlocked: boolean;
}

export interface ApplianceLoadResult {
  rangeLoadW: number;
  otherLargeLoadsW: number;
  remainingLoadsW: number;
  totalLoadW: number;
}

// ============================================
// Validation Results
// ============================================
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// All types are already exported above using export interface/type
