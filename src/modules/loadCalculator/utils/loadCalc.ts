// src/utils/loadcalc.ts
/*
import type { LoadInput, LoadResult, LoadItem } from "../../../types/load";

/**
 * Base load per CEC 8-200 a) & b)

export function calculateBaseLoad(
  areaGround: number,
  areaAbove: number,
  areaBelow: number,
  bsmtHeight: number
): number {
  const bsmtArea = bsmtHeight > 1.8 ? areaBelow : 0;
  const livingArea = areaAbove + areaGround + bsmtArea * 0.75;

  // 8-200 a)
  let methodA = 5000;
  if (livingArea > 90) {
    methodA += Math.ceil((livingArea - 90) / 90) * 1000;
  }

  // 8-200 b)
  // const methodB = (areaAbove >= 80) ? 24000 : 14400
  return methodA;
  // return Math.max(methodA, methodB)
}
*/
/**
 * Electric ranges per CEC 8-200 a)(iv)
 */ /*
export function calculateRangeLoad(ranges: LoadItem[]): number {
  return ranges.reduce((sum, range) => {
    const kw = range.watts / 1000; // assume watts stored, convert → kW
    if (kw <= 12) return sum + 6000;
    return sum + 6000 + (kw - 12) * 400; // 40% of excess above 12 kW
  }, 0);
}

/**
 * Water heaters: 100% demand

export function calculateWaterHeaterLoad(waterHeaters: LoadItem[]): number {
  return waterHeaters.reduce((sum, w) => sum + w.watts, 0);
}*/

/**
 * Other appliances >1500 W
 * Rule: If range exists → 25%
 *       If no range → 100% up to 6000 W, 25% of excess

export function calculateOtherApplianceLoad(
  appliances: LoadItem[],
  hasRange: boolean
): number {
  const total = appliances.reduce((a, b) => a + b.watts, 0);
  if (hasRange) return total * 0.25;
  return total <= 6000 ? total : 6000 + (total - 6000) * 0.25;
}*/

/**
 * Main calculation entry

export function calculateFinalLoad(input: LoadInput): LoadResult {
  const baseLoad = calculateBaseLoad(
    input.groundFloorArea,
    input.upperFloorArea,
    input.basementArea,
    input.basementHeight
  );
  const rangeLoad = calculateRangeLoad(input.ranges);
  const waterHeaterLoad = calculateWaterHeaterLoad(input.waterHeaters);
  const otherLoads = calculateOtherApplianceLoad(
    input.otherAppliances,
    input.ranges.length > 0
  );

  // Handle HVAC interlock
  const hvacLoad = input.interlockedHeatAC
    ? Math.max(input.spaceHeatingWatts, input.acWatts)
    : input.spaceHeatingWatts + input.acWatts;

  // EV chargers
  const evLoad =
    input.hasEVEMS && input.evChargers.length > 0
      ? Math.max(...input.evChargers.map(ev => ev.watts))
      : input.evChargers.reduce((sum, ev) => sum + ev.watts, 0);

  const total =
    baseLoad + rangeLoad + waterHeaterLoad + otherLoads + evLoad + hvacLoad;

  const finalLoad =
    input.groundFloorArea >= 80 && total < 24000
      ? 24000
      : input.groundFloorArea < 80 && total < 14400
        ? 14400
        : total;
  // Design panel size (A) = final load (VA) / supply voltage (V)
  // Round up to next standard size (2400 VA increments)
  // e.g. 24000 VA / 240 V = 100 A → 100 A panel
  //      25000 VA / 240 V = 104.16 A → 120 A panel
  //      36000 VA / 240 V = 150 A → 160 A panel
  //      37000 VA / 240 V = 154.16 A → 200 A panel

  // Panel size rounded up to next 2400 VA (240 V x 10 A)
  // Breaker and feeder left empty for now
  return {
    base: baseLoad,
    heatOrAC: hvacLoad,
    ranges: rangeLoad,
    evs: evLoad,
    totalLoad: total,
    finalLoad: finalLoad,
    current: Math.ceil(finalLoad / 240), // assume 240 V supply
    breakerSize: "", // leave empty until feeder/breaker function added
    feederCable: "", // leave empty until feeder selection logic added
    waterHeaters: waterHeaterLoad,
    otherApps: otherLoads
  };
}
*/
