import type { LoadInput, LoadResult } from "@/types/load";
import type {
  HeaterDevice,
  EVDevice,
  RangeDevice,
  WaterHeaterDevice,
  ApplianceDevice
} from "../../../types/device";
import { useLoadStore } from "../stores/useLoadStore";
// === Helper calculations ===
// Base dwelling demand (Rule 8-200 1) a) i–ii and Rule 8-110)
export function calculateBaseLoad(input: LoadInput): number {
  const livingArea =
    input.groundFloorArea + input.upperFloorArea + input.basementArea * 0.75;
  //input.basementHeight > 1.8 ?: 0
  let base = 5000; // 90 m²
  if (livingArea > 90) {
    const extraBlocks = Math.ceil((livingArea - 90) / 90);
    base += extraBlocks * 1000;
  }

  return base;
}

export function calculateHeatingLoad(
  heaters: HeaterDevice[],
  hasThermostat: boolean
): number {
  if (heaters.length === 0) return 0;
  const total = heaters.reduce((sum, h) => sum + 1000 * h.kw, 0);

  // section 62 规则 4: ETS, duct heater, furnace = 100%
  if (
    heaters.some(
      h =>
        h.heaterType === "ETS" ||
        h.heaterType === "duct" ||
        h.heaterType === "furnace"
    )
  ) {
    return total;
  }

  // section 62 规则 3: 有 thermostatic control -> 10kW + 剩余 75%
  if (hasThermostat) {
    const first10k = Math.min(total, 10000);
    const rest = Math.max(total - 10000, 0);
    return first10k + rest * 0.75;
  }

  // 默认规则: 100%
  return total;
}
// Water heaters (Rule 8-200 1) a) v)
export function calculateWaterHeaterLoad(heaters: WaterHeaterDevice[]): number {
  return heaters.reduce((sum, h) => sum + h.kw * 1000, 0); // always 100%
}

// EV chargers (Rule 8-200 1) a) vi + Rule 8-106 10–11
/*
export function calculateEVLoad(
  evChargers: EVDevice[],
  hasEVEMS: boolean
): number {
  if (evChargers.length === 0) return 0;
  const totalWatts = evChargers.reduce((sum, ev) => sum + ev.kw * 1000, 0);
  return hasEVEMS
    ? Math.max(...evChargers.map(ev => ev.kw * 1000))
    : totalWatts;
}
*/
export function calculateEVLoad(evChargers: EVDevice[]): number {
  if (evChargers.length === 0) return 0;

  const evemsControlled = evChargers.filter(ev => ev.hasAutoManagement);

  const evemsLoad = evemsControlled.reduce((sum, ev) => {
    return sum + (ev.maxAllowedByEVEMS ?? ev.kw * 1000);
  }, 0);

  const uncontrolledLoad = evChargers
    .filter(ev => !ev.hasAutoManagement)
    .reduce((sum, ev) => sum + ev.kw * 1000, 0);

  return evemsLoad + uncontrolledLoad;
}

// Electric range load (Rule 8-200 1) a) iv)
/**
 * Calculates total electric range load per CEC Rule 8-200(1)(a)(v).
 * Each range is counted as 6000 W plus 40% of any portion exceeding 12 kW.
 * Returns total in watts.
 */

export function calculateRangeLoad(ranges: RangeDevice[]): number {
  return ranges.reduce((sum, r) => {
    const watts = r.kw * 1000;
    const extra = watts > 12000 ? (watts - 12000) * 0.4 : 0;
    return sum + 6000 + extra;
  }, 0);
}

// Other appliances >1500W (Rule 8-200 1) a) vii)
export function calculateOtherApplianceLoad(
  appliances: ApplianceDevice[],
  hasRange: boolean
): number {
  if (appliances.length === 0) return 0;

  const totalWatts = appliances.reduce((sum, a) => sum + a.kw * 1000, 0);

  if (hasRange) {
    // Only 25% of rating if range present
    return totalWatts * 0.25;
  } else {
    // No range → 100% up to 6000, plus 25% of excess
    if (totalWatts <= 6000) return totalWatts;
    return 6000 + (totalWatts - 6000) * 0.25;
  }
}

// === Main calculation ===

export function computeLoadResult(input: LoadInput): LoadResult {
  // Panel minimums (Rule 8-200 1) b)
  const load = useLoadStore();
  let finalLoad = load.total.finalLoad;
  if (input.groundFloorArea >= 80 && finalLoad < 24000) {
    finalLoad = 24000;
  } else if (input.groundFloorArea < 80 && finalLoad < 14400) {
    finalLoad = 14400;
  }

  // Convert W → A
  const current = finalLoad / input.voltage;

  return {
    base: load.baseLoad,
    heatOrAC: load.total.heatOrAC.toFixed(2) as unknown as number,
    ranges: load.rangeLoad,
    waterHeaters: load.waterHeaterLoad,
    otherApps: load.otherAppLoad,
    evs: load.evLoad,
    heaters: load.heatingLoad,
    acs: load.acLoad,
    totalLoad: load.total.totalLoad.toFixed(2) as unknown as number,
    finalLoad: finalLoad.toFixed(2) as unknown as number,
    current
  };
}
