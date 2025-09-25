export type ConductorMaterial = "copper" | "aluminum";
export type InsulationTemp = "60C" | "75C" | "90C";

// Wire size as string keys, values are ampacities
export type AmpacityTable = Record<string, number>;

// Full table type
export interface AmpacityData {
  [material: string]: {
    [temp: string]: AmpacityTable;
  };
}
