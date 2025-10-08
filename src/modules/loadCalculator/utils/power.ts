// utils/power.ts
import type { ACUnitType, HeaterDevice } from "../../../types/device";
// import type { AmpacityTables } from "../../../types/ampacity";

export function acValueToWatts(
  value: number,
  unit: ACUnitType,
  voltage?: number
): number {
  switch (unit) {
    case "watts":
      return value;
    case "btu":
      return value / 3.412;
    case "ton":
      return value * 3517;
    case "current":
      if (voltage === undefined)
        throw new Error('voltage required for unit "current"');
      return value * voltage;
    default:
      return value;
  }
}

export function wattsToKW(w: number): number {
  return w / 1000;
}

export type OccupancyType = "residential" | "commercial";

export interface HeatingAmpacityInput {
  totalHeatingKw: number;
  thermalStorageKw: number;
  ductHeaterKw: number;
  furnaceKw: number;
  hasThermostatControl: boolean;
  hasCyclicHeating: boolean;
  occupancyType: OccupancyType;
  otherLoadsKw: number;
}

/**
 * Calculates heating ampacity for residential buildings.
 * Based on CEC Rule 62-116(3) and 62-116(4).
 */
export function getResidentialHeatingAmpacity(
  input: HeatingAmpacityInput
): number {
  const {
    totalHeatingKw,
    thermalStorageKw,
    ductHeaterKw,
    furnaceKw,
    hasThermostatControl
  } = input;

  const continuousFactor = 1.25;
  const fixedLoadKw = thermalStorageKw + ductHeaterKw + furnaceKw;
  const remainingKw = Math.max(totalHeatingKw - fixedLoadKw, 0);

  let demandKw = remainingKw;

  if (hasThermostatControl) {
    // CEC Rule 62-116(3): First 10 kW at 100%, remainder at 75%
    const first10 = Math.min(remainingKw, 10);
    const remainder = Math.max(remainingKw - 10, 0);
    demandKw = first10 + remainder * 0.75;
  }

  return (fixedLoadKw + demandKw) * continuousFactor;
}

/**
 * Calculates heating ampacity for commercial/industrial buildings.
 * Based on CEC Rule 62-116(4), 5(b), and 6.
 */
export function getCommercialHeatingAmpacity(
  input: HeatingAmpacityInput
): number {
  const {
    totalHeatingKw,
    thermalStorageKw,
    ductHeaterKw,
    furnaceKw,
    otherLoadsKw
  } = input;

  const continuousFactor = 1.25;
  const fixedLoadKw = thermalStorageKw + ductHeaterKw + furnaceKw;
  const remainingKw = Math.max(totalHeatingKw - fixedLoadKw, 0);

  const demandKw = remainingKw * 0.75;
  let totalKw = fixedLoadKw + demandKw;

  // CEC Rule 62-116(6): If other loads < 25% of heating, no demand factor allowed
  if (otherLoadsKw < 0.25 * totalKw) {
    totalKw = totalHeatingKw;
  }

  return totalKw * continuousFactor;
}

/**
 * Unified heating ampacity calculator.
 * Automatically selects logic based on occupancy type.
 */
export function getHeatingAmpacity(input: HeatingAmpacityInput): number {
  return input.occupancyType === "residential"
    ? getResidentialHeatingAmpacity(input)
    : getCommercialHeatingAmpacity(input);
}

export function calculateHeatingAmpacity(
  heaters: HeaterDevice[],
  hasThermostat: boolean,
  occupancyType: "residential" | "commercial",
  otherLoadsKw: number
): number {
  if (heaters.length === 0) return 0;

  const totalKw = heaters.reduce((sum, h) => sum + h.kw, 0);

  const fixedKw = heaters
    .filter(h => ["ETS", "duct", "furnace"].includes(h.heaterType))
    .reduce((sum, h) => sum + h.kw, 0);

  const variableKw = totalKw - fixedKw;

  let demandKw = 0;

  if (occupancyType === "residential") {
    // Rule 62-118(3)
    if (hasThermostat) {
      const first10 = Math.min(variableKw, 10);
      const remainder = Math.max(variableKw - 10, 0);
      demandKw = first10 + remainder * 0.75;
    } else {
      demandKw = variableKw;
    }
  } else {
    // Commercial / Industrial
    // Rule 62-118(5)(b)
    demandKw = variableKw * 0.75;

    // Rule 62-118(6) override
    const totalHeatingKw = fixedKw + demandKw;
    if (otherLoadsKw < 0.25 * totalHeatingKw) {
      return totalKw * 1.25;
    }
  }

  return (fixedKw + demandKw) * 1.25;
}
/*
export function findWireTypeTable(wireType) {
  for (const [table, types] of Object.entries(tables.table6.wireTypes)) {
    if (Array.isArray(types) && types.includes(wireType)) {
      return table;
    } else if (types === wireType) {
      return table;
    }
  }
  return null;
}

export function determineFeederSize(
  feederCurrent: number,
  conductorMaterial: "copper" | "aluminum",
  temperature: string,
  tables: AmpacityTables
): string {
  const ambientTemperature = 40;
  const insulationRating = temperature;

  const tempEntry = tables..table5a.find(
    (entry: Table5.table5a) => entry.ambientTemperature === ambientTemperature
  );
  const correctionFactorTemp =
    tempEntry?.correctionFactors[insulationRating] ?? 1;

  const numberOfConductors = 3;
  const conductorEntry = tables.tables.table5b.find(
    (entry: Table5.table5b) => entry.conductors === numberOfConductors
  );
  const correctionFactorConductors = conductorEntry?.correctionFactor ?? 1;

  const correctedAmpacity =
    feederCurrent / (correctionFactorTemp * correctionFactorConductors);

  const wireTable =
    conductorMaterial === "copper"
      ? tables.tables.table2
      : tables.tables.table4;

  const tempTable = wireTable.degree.find(
    entry => entry.temp === insulationRating
  );
  if (!tempTable) return "Unknown";

  const wireEntry = tempTable.amps.find(amp => amp >= correctedAmpacity);
  const wireSizeIndex = tempTable.amps.indexOf(wireEntry ?? -1);

  return wireTable.wireSize[wireSizeIndex] ?? "Unknown";
}*/
