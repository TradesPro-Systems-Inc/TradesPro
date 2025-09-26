import { defineStore } from "pinia";
import { computeLoadResult } from "../services/loadService";
import type { LoadInput, LoadResult } from "../../../types/load";
import table2 from "../../../data/table2.json" assert { type: "json" };
import table4 from "../../../data/table4.json" assert { type: "json" };
import table5c from "../../../data/table5.json" assert { type: "json" };
import type {
  AmpacityTables,
  TemperatureRating
} from "../../../types/ampacity";
const conductorTable: AmpacityTables = {
  table2,
  table4,
  table5c: table5c.table5C
};

// import type { TemperatureRating } from '../../../types/ampacity'
function getAmpacity(
  tables: typeof conductorTable,
  wireSize: string,
  temp: TemperatureRating,
  material: "copper" | "aluminum"
): number | null {
  const table = material === "copper" ? tables.table2 : tables.table4;
  return table[wireSize]?.ampacity?.[temp] ?? null;
}
console.log(getAmpacity(conductorTable, "12", "90c", "copper"));

// import type { Table1234Data, AmpacityTables } from "../../../types/ampacity";

// const tbl2 = t2 as AmpacityTables.table2;
// const tbl5 = t5 as AmpacityTables.table5C;
/*
export function lookupCable(
  material: ConductorMaterial,
  temp: InsulationTemp,
  loadAmps: number,
  ambientTemp = 30
): string {
  const ampacities = table2[material]?.[temp]; // ✅ typed now
  if (!ampacities) return "Unknown";
  for (const [size, amps] of Object.entries(ampacities)) {
    if (amps >= loadAmps) return size;
  }
  return "Unknown";
}

import table2 from '@/data/table2.json'
import table4 from '@/data/table4.json'

function lookupCable(amps: number, material = 'copper', temp = '75C', ambient = 30): string {
  const ampacities = table2[material][temp]

  // apply correction factor
  const factor = table4[material][temp][ambient] || 1

  for (const [size, baseAmp] of Object.entries(ampacities)) {
    const corrected = baseAmp * factor
    if (corrected >= amps) {
      return `${size} ${material} (base ${baseAmp}A, corrected ${corrected.toFixed(0)}A)`
    }
  }

  return `> largest size in table`
}
*/

export const useLoadStore = defineStore("load", {
  state: (): {
    input: LoadInput;
    result: LoadResult | undefined;
    error: string | null;
  } => ({
    input: {
      groundFloorArea: 90,
      upperFloorArea: 0,
      basementArea: 0,
      basementHeight: 0,
      voltage: 240,
      circuitType: "feeder",
      voltageDropPercent: 3,
      conductorType: "single",
      serviceType: "100pct",
      isContinuousLoad: false,

      spaceHeatingWatts: 0,
      acWatts: 0,
      interlockedHeatAC: false,
      hasThermostatControl: true,

      ranges: [],
      waterHeaters: [],
      otherAppliances: [],
      evChargers: [],
      hasEVEMS: false
    },
    result: undefined,
    error: null
  }),

  actions: {
    compute() {
      try {
        this.error = null;
        this.result = computeLoadResult(this.input);
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Unknown error occurred";
        this.result = undefined;
      }
    },

    addRange(ratingKW: number) {
      this.input.ranges.push({
        name: `Range ${this.input.ranges.length + 1}`,
        watts: ratingKW * 1000,
        type: "range"
      });
    },
    removeRange(index: number) {
      this.input.ranges.splice(index, 1);
    },

    addWaterHeater(name: string, watts: number) {
      this.input.waterHeaters.push({ name, watts, type: "waterHeater" });
    },
    removeWaterHeater(index: number) {
      this.input.waterHeaters.splice(index, 1);
    },

    addOtherAppliance(name: string, watts: number) {
      if (watts > 1500) {
        this.input.otherAppliances.push({ name, watts, type: "appliance" });
      }
    },
    removeOtherAppliance(index: number) {
      this.input.otherAppliances.splice(index, 1);
    },

    addEVCharger(name: string, watts: number) {
      this.input.evChargers.push({ name, watts, type: "ev" });
    },
    removeEVCharger(index: number) {
      this.input.evChargers.splice(index, 1);
    },

    clearLoads() {
      this.input.ranges = [];
      this.input.waterHeaters = [];
      this.input.otherAppliances = [];
      this.input.evChargers = [];
    }
  }
});
