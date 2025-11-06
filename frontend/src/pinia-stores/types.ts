// TradesPro - Store Type Definitions

// User Tier Types
export type UserTier = 'guest' | 'tier1' | 'tier2' | 'tier3';

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  tier?: UserTier; // 用户等级：guest（非注册）, tier1, tier2, tier3
  licenseNumber?: string;
  company?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  licenseNumber?: string;
  company?: string;
  phone?: string;
  bio?: string;
}

// Project Types
export type ProjectStatus = 'inProgress' | 'completed' | 'onHold' | 'archived';

export interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
  client_name?: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  calculations_count: number;
  user_id?: string;
}

export interface ProjectCreateInput {
  name: string;
  description?: string;
  location?: string;
  client_name?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  location?: string;
  client_name?: string;
  status?: ProjectStatus;
}

// Calculation Types
export interface Appliance {
  name: string;
  ratingW: number;
  demandFactor: number;
  quantity?: number;
  type?: string;
}

export interface ContinuousLoad {
  name: string;
  loadW: number;
}

export interface CalculationInputs {
  id?: string;
  project?: string;
  projectId?: string;
  livingArea_m2: number;
  systemVoltage: number;
  phase: 1 | 3;
  appliances?: Appliance[];
  continuousLoads?: ContinuousLoad[];
  heatingLoadW?: number;
  coolingLoadW?: number;
  isHeatingAcInterlocked?: boolean;
  hasElectricRange?: boolean;
  electricRangeRatingKW?: number;
  numAdditionalRanges?: number;
  hasEVSE?: boolean;
  evseRatingW?: number;
  waterHeaterType?: string;
  waterHeaterRatingW?: number;
  conductorMaterial?: string;
  terminationTempC?: number;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
  [key: string]: any;
}

export interface CalculationResults {
  chosenCalculatedLoad_W?: number;
  serviceCurrentA?: number;
  conductorSize?: string;
  conductorMaterial?: string;
  conductorAmpacity?: number;
  protectionDeviceA?: number;
  [key: string]: any;
}

export interface CalculationStep {
  stepIndex: number;
  operationId: string;
  formulaRef?: string;
  inputRefs?: string[];
  intermediateValues?: Record<string, any>;
  outputValue?: any;
  outputRef?: string;
  note?: string;
}

export interface CalculationBundle {
  id: string;
  projectId?: string;
  inputs: CalculationInputs;
  results: CalculationResults;
  steps: CalculationStep[];
  calculationTimeMs: number;
  createdAt: string;
  cecVersion?: string;
  engineVersion?: string;
}

// Settings Types
export type Language = 'en-CA' | 'fr-CA' | 'zh-CN';
export type FontSize = 'small' | 'medium' | 'large';
export type Theme = 'light' | 'dark' | 'auto';

export interface AppSettings {
  language: Language;
  fontSize: FontSize;
  theme: Theme;
  autoSave: boolean;
  showCalculationSteps: boolean;
  cecVersion: string;
}

// Jurisdiction Configuration Types
export interface CalculationRulesConfig {
  panelBreakerSizes?: {
    enabled: number[];          // Enabled breaker sizes (e.g., [60, 100, 125, 200])
    disabled?: number[];        // Disabled sizes (optional, for validation)
  };
  // Future extensions:
  // conductorSizes?: { enabled: string[]; disabled?: string[] };
  // voltageOptions?: { enabled: number[]; disabled?: number[] };
  // phaseOptions?: { enabled: number[]; disabled?: number[] };
  // demandFactors?: { [key: string]: number };
}

export interface JurisdictionProfile {
  id: string;                    // Unique ID, e.g., "epcor-edmonton"
  name: string;                  // Display name, e.g., "EPCOR - Edmonton"
  jurisdiction?: string;         // Jurisdiction, e.g., "Edmonton, AB"
  utility?: string;              // Utility company, e.g., "EPCOR"
  calculationRules: CalculationRulesConfig;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;           // Whether this is the default profile
}

export interface JurisdictionConfig {
  profiles: JurisdictionProfile[];
  defaultProfileId?: string;     // ID of the currently active default profile
}

// UI State Types
export interface UIState {
  sidebarOpen: boolean;
  showCalculationSteps: boolean;
  currentCalculationId?: string;
  loading: boolean;
  error: string | null;
}

