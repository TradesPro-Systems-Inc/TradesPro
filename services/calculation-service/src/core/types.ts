// services/calculation-service/src/core/types.ts
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
  table2?: Table;  // Cu ampacity
  table4?: Table;  // Al ampacity
  table5A?: Table; // Ambient correction
  table5C?: Table; // Conductor count correction
  tableD3?: Table; // Voltage drop (future)
  edition: CodeEdition;
  code: CodeType;
  [key: string]: Table | CodeEdition | CodeType | undefined | TableEntry[];
}

// ============================================
// Calculation Step (Audit Trail)
// ============================================
export interface CalculationStep {
  stepIndex: number;
  operationId: string;
  formulaRef: string;
  inputRefs?: string[];
  intermediateValues?: Record<string, string>;
  output?: Record<string, string>;
  units?: Record<string, string>;
  timestamp: Timestamp;
  note?: string;
  tableReferences?: Array<{
    tableId: string;
    version?: string;
    rowIndex?: number;
    columnUsed?: string;
  }>;
  warnings?: string[];
  ruleCitations?: string[];
  _hash?: string; // For deterministic verification
}

// ============================================
// Building Type Inputs
// ============================================
export interface FloorArea {
  description?: string;
  area_m2: number;
  height_m?: number;
  type?: 'ground' | 'upper' | 'basement';
}

export interface Appliance {
  id?: string;
  name?: string;
  watts?: number;
  va?: number;
  type?: 
    | 'range'
    | 'space_heating'
    | 'air_conditioning'
    | 'tankless_water_heater'
    | 'pool_spa'
    | 'evse'
    | 'water_heater'
    | 'other';
  rating_kW?: number;
  managedByEvms?: boolean;
  isContinuous?: boolean;
}

export interface ContinuousLoad {
  id?: string;
  name?: string;
  watts: number;
  type?: 'space_heating' | 'air_conditioning';
}

// ============================================
// Single Dwelling Inputs (8-200)
// ============================================
export interface CecInputsSingle {
  id?: string;
  createdAt?: string;
  createdBy?: { userId?: string; name?: string };
  project?: string;
  
  // Code version selection
  codeEdition?: CodeEdition;
  codeType?: CodeType;
  
  // Living area
  floors?: FloorArea[];
  livingArea_m2?: number;
  
  // Electrical system
  systemVoltage: number;
  phase?: 1 | 3;
  
  // Loads
  appliances?: Appliance[];
  continuousLoads?: ContinuousLoad[];
  isHeatingAcInterlocked?: boolean;
  
  // Additional load inputs
  heatingLoadW?: number;
  coolingLoadW?: number;
  
  // Conductor selection
  conductorMaterial?: 'Cu' | 'Al';
  terminationTempC?: 60 | 75 | 90;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
  
  // Calculation options
  calculationMode?: 'sync' | 'async';  // New: async support
  ruleSetId?: string;
}

// ============================================
// Dwelling Unit (for Apartments)
// ============================================
export interface DwellingUnit {
  id?: string;
  label?: string;
  inputs: CecInputsSingle;
}

// ============================================
// Apartment Inputs (8-202)
// ============================================
export interface CecInputsApartment {
  id?: string;
  createdAt?: string;
  createdBy?: { userId?: string; name?: string };
  project?: string;
  
  // Code version
  codeEdition?: CodeEdition;
  codeType?: CodeType;
  
  // Units
  dwellingUnits: DwellingUnit[];
  commonAreaLoads?: Appliance[];
  
  // Electrical system
  systemVoltage: number;
  phase?: 1 | 3;
  
  // Conductor selection
  conductorMaterial?: 'Cu' | 'Al';
  terminationTempC?: 60 | 75 | 90;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
}

// ============================================
// Results Structure
// ============================================
export interface CecResults {
  // Living area
  computedLivingArea_m2?: string;
  
  // Load breakdown
  basicVA?: string;
  appliancesSumVA?: string;
  continuousAdjustedVA?: string;
  
  // Calculated loads
  itemA_total_W?: string;
  itemB_value_W?: string;
  chosenCalculatedLoad_W: string;
  
  // Demand and current
  demandVA: string;
  demand_kVA: string;
  serviceCurrentA: string;
  sizingCurrentA: string;
  
  // Conductor and protection
  conductorSize: string;
  conductorAmpacity: string;
  panelRatingA: string;
  breakerSizeA: string;
  
  // Metadata
  notes?: string;
  error?: string;
  warnings?: string[];
}

// ============================================
// Unsigned Bundle (Main Output)
// ============================================
export interface UnsignedBundle {
  id?: string;
  createdAt: Timestamp;
  createdBy?: { userId?: string; name?: string };
  domain: 'electrical';
  calculationType: 'cec_load';
  buildingType?: string;
  engine: EngineMeta;
  ruleSets: RuleSetRef[];
  inputs: CecInputsSingle | CecInputsApartment;
  steps: CalculationStep[];
  results: CecResults;
  meta: {
    canonicalization_version: 'rfc8785-v1';
    numeric_format: string;
    calculation_standard: string;
    tables_used: Array<{
      tableId: string;
      version?: string;
      code?: CodeType;
      checksum?: string;
      usedColumn?: string;
      ambientFactor?: number;
      countFactor?: number;
    }>;
    build_info: {
      commit: string;
      build_timestamp: string;
      environment: string;
    };
    error?: string;
  };
  warnings: string[];
}

// ============================================
// Signed Bundle (With Cryptographic Signature)
// ============================================
export interface SignedBundle extends UnsignedBundle {
  signature: {
    algorithm: 'RS256' | 'ES256' | 'EdDSA';
    rootHash: string;  // SHA-256 of canonicalized bundle
    signatureValue: string;  // Base64 encoded signature
    signerInfo: {
      userId: string;
      name: string;
      licenseNumber?: string;
      timestamp: Timestamp;
    };
    publicKeyFingerprint: string;
  };
}

// ============================================
// Conductor Selection Result
// ============================================
export interface ConductorSelectionResult {
  size: string;
  baseAmpacity: number;
  effectiveAmpacity?: number;
  ambientFactor?: number;
  countFactor?: number;
  tableReferences: Array<{
    tableId: string;
    version?: string;
    rowIndex?: number;
    columnUsed?: string;
  }>;
  warnings?: string[];
}

// ============================================
// Async Calculation Job (New)
// ============================================
export interface CalculationJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  inputs: CecInputsSingle | CecInputsApartment;
  result?: UnsignedBundle;
  error?: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  estimatedTimeMs?: number;
}

// ============================================
// V4 Pure Function Types (for gradual migration)
// ============================================
export interface CalculatorFunction<TInput, TOutput> {
  (input: TInput, tables?: RuleTables): TOutput;
}

export interface AuditableCalculation<TInput, TOutput> {
  calculate: CalculatorFunction<TInput, TOutput>;
  generateStep: (
    input: TInput,
    output: TOutput,
    stepIndex: number,
    timestamp: Timestamp
  ) => CalculationStep;
}