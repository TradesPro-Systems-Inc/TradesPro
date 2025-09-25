// Common type for all loads
export interface LoadItem {
  name: string;
  watts: number;
  type: "waterHeater" | "appliance" | "ev" | "range";
}

export interface LoadInput {
  // Building areas (Rule 8-110)
  groundFloorArea: number;
  upperFloorArea: number;
  basementArea: number; // basement area in m² where height > 1.8m
  basementHeight: number;

  // Voltage (Rule 8-100)
  voltage: number;
  circuitType: "service" | "feeder";
  voltageDropPercent: number;
  conductorType: "single" | "cablebus";
  serviceType: "100pct" | "80pct";
  isContinuousLoad: boolean;

  // Heating & Cooling
  spaceHeatingWatts: number;
  acWatts: number;
  interlockedHeatAC: boolean;
  hasThermostatControl: boolean;

  // Loads grouped by type
  ranges: LoadItem[]; // Electric ranges
  waterHeaters: LoadItem[]; // Tankless, spa, pool, steam, hottub
  otherAppliances: LoadItem[]; // >1500W appliances
  evChargers: LoadItem[]; // EV supply equipment
  hasEVEMS: boolean;
}

export interface LoadResult {
  // Detailed breakdown
  base: number;
  heatOrAC: number;
  ranges: number;
  waterHeaters: number;
  otherApps: number;
  evs: number;

  // Summaries
  totalLoad: number;
  finalLoad: number;
  current: number; // A

  // Derived design info (lookup from Table 2 / 4)
  panelSize?: string;
  breakerSize?: string;
  feederCable?: string;
}
