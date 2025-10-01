// utils/power.ts
import type { ACUnitType } from "../../../types/device";

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
