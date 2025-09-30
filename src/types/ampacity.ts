export type TemperatureRating = "60c" | "75c" | "90c";

export interface AmpacityEntry {
  area: number; // mm²
  ampacity: Record<TemperatureRating, number>;
}

export interface Table1234Data {
  [wireSize: string]: AmpacityEntry;
}

export interface Table5CEntry {
  minConductors: number;
  maxConductors: number | null;
  correctionFactor: number;
}

export interface Table5C {
  ruleReference: string;
  description: string;
  entries: Table5CEntry[];
}

export interface AmpacityTables {
  table5C: Table5C;
  table2: Table1234Data;
  table4: Table1234Data;
}
