// load.ts
import type {
  HeaterDevice,
  ACDevice,
  RangeDevice,
  WaterHeaterDevice,
  ApplianceDevice,
  EVDevice
} from "./device";

export interface LoadInput {
  groundFloorArea: number;
  upperFloorArea: number;
  basementArea: number;
  basementHeight: number;

  voltage: number;
  circuitType: "service" | "feeder";
  voltageDropPercent: number;
  conductorType: "single" | "cablebus";
  serviceType: "100pct" | "80pct";
  isContinuousLoad: boolean;

  // Heating & Cooling
  interlockedHeatAC: boolean;
  hasThermostatControl: boolean;

  // Device groups
  heaters: HeaterDevice[];
  acUnits: ACDevice[];
  ranges: RangeDevice[];
  waterHeaters: WaterHeaterDevice[];
  otherAppliances: ApplianceDevice[];
  evChargers: EVDevice[];

  hasEVEMS: boolean;
}

export interface LoadResult {
  base: number;
  heatOrAC: number;
  ranges: number;
  waterHeaters: number;
  otherApps: number;
  evs: number;
  heaters: number;
  acs: number;

  totalLoad: number;
  finalLoad: number;
  current: number;

  panelSize?: string;
  breakerSize?: string;
  feederCable?: string;
}
