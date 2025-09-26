import type { LoadInput, LoadItem, LoadResult } from "../../../types/load";

// === Helper calculations ===

// Electric range load (Rule 8-200 1) a) iv)
function calculateRangeLoad(ranges: LoadItem[]): number {
  if (ranges.length === 0) return 0;

  return ranges.reduce((sum, range) => {
    // Base 6000 W for single range, plus 40% of any amount > 12kW
    if (range.watts <= 12000) {
      return sum + 6000;
    } else {
      const extra = (range.watts - 12000) * 0.4;
      return sum + 6000 + extra;
    }
  }, 0);
}

// Water heaters (Rule 8-200 1) a) v)
function calculateWaterHeaterLoad(heaters: LoadItem[]): number {
  return heaters.reduce((sum, heater) => sum + heater.watts, 0); // always 100%
}

// Other appliances >1500W (Rule 8-200 1) a) vii)
function calculateOtherApplianceLoad(
  appliances: LoadItem[],
  hasRange: boolean
): number {
  if (appliances.length === 0) return 0;

  const totalWatts = appliances.reduce((sum, a) => sum + a.watts, 0);

  if (hasRange) {
    // Only 25% of rating if range present
    return totalWatts * 0.25;
  } else {
    // No range → 100% up to 6000, plus 25% of excess
    if (totalWatts <= 6000) return totalWatts;
    return 6000 + (totalWatts - 6000) * 0.25;
  }
}

// EV chargers (Rule 8-200 1) a) vi + Rule 8-106 10–11
function calculateEVLoad(evChargers: LoadItem[], hasEVEMS: boolean): number {
  if (evChargers.length === 0) return 0;
  const totalWatts = evChargers.reduce((sum, ev) => sum + ev.watts, 0);
  return hasEVEMS ? Math.max(...evChargers.map(ev => ev.watts)) : totalWatts;
}

// Base dwelling demand (Rule 8-200 1) a) i–ii and Rule 8-110)
function calculateBaseLoad(input: LoadInput): number {
  const livingArea =
    input.groundFloorArea +
    input.upperFloorArea +
    (input.basementHeight > 1.8 ? input.basementArea * 0.75 : 0);

  let base = 5000; // 90 m²
  if (livingArea > 90) {
    const extraBlocks = Math.ceil((livingArea - 90) / 90);
    base += extraBlocks * 1000;
  }

  return base;
}

// === Main calculation ===
export function computeLoadResult(input: LoadInput): LoadResult {
  const base = calculateBaseLoad(input);
  const heating = input.spaceHeatingWatts;
  const ac = input.acWatts;

  // Rule 8-106 (3): if interlocked, only larger of heat or AC
  const heatOrAC = input.interlockedHeatAC
    ? Math.max(heating, ac)
    : heating + ac;

  const ranges = calculateRangeLoad(input.ranges);
  const waterHeaters = calculateWaterHeaterLoad(input.waterHeaters);
  const otherApps = calculateOtherApplianceLoad(
    input.otherAppliances,
    input.ranges.length > 0
  );
  const evs = calculateEVLoad(input.evChargers, input.hasEVEMS);

  const totalLoad = base + heatOrAC + ranges + waterHeaters + otherApps + evs;

  // Panel minimums (Rule 8-200 1) b)
  let finalLoad = totalLoad;
  if (input.groundFloorArea >= 80 && totalLoad < 24000) {
    finalLoad = 24000;
  } else if (input.groundFloorArea < 80 && totalLoad < 14400) {
    finalLoad = 14400;
  }

  // Convert W → A
  const current = finalLoad / input.voltage;

  return {
    base,
    heatOrAC,
    ranges,
    waterHeaters,
    otherApps,
    evs,
    totalLoad,
    finalLoad,
    current
  };
}
