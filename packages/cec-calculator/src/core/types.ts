// @tradespro/calculation-engine/src/core/types.ts
// TradesPro Core Type Definitions - Multi-Version Support
// Version: 5.0.0

export type Timestamp = string;
export type CodeEdition = '2021' | '2024' | '2027';
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
export interface CalculationStep {
  stepIndex: number;
  operationId: string;
  formulaRef?: string;
  ruleCitations?: string[];
  intermediateValues?: Record<string, any>;
  output?: Record<string, any>;
  justification?: string;
  note?: string;
  timestamp: Timestamp;
  tableReferences?: Array<{ tableId: string; version?: string; rowIndex: number; columnUsed?: string }>;
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

export interface UnsignedBundle {
  id: string;
  createdAt: Timestamp;
  createdBy?: {
    userId?: string;
    name?: string;
  };
  domain: 'electrical';
  calculationType: 'cec_load';
  buildingType: 'single-dwelling';
  engine: EngineMeta;
  ruleSets: RuleSetRef[];
  inputs: CecInputsSingle;
  steps: CalculationStep[];
  results: CecResults;
  meta: CalculationMeta;
  warnings: string[];
}

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
