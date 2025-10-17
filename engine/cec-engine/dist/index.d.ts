
export interface LookupResult {
  conductorSize: string | null;
  baseAmpacity: number | null;
  adjustedAmpacity: number | null;
  tempFactor: number;
  parallelFactor: number;
  requiredBaseAmpacity: number;
  tableUsed: string;
  formula: string;
}

export interface LookupOptions {
  material?: 'Cu' | 'Al';
  insulationTempC?: number;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
  tablesPath?: string;
}

export function lookupConductorFromTable(requiredCurrent: number, options?: LookupOptions): LookupResult;
