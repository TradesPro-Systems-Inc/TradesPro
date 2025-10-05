// src/stores/useLoadStore.ts
import { defineStore } from "pinia";
import { acValueToWatts } from "../utils/power";
import type { LoadInput, LoadResult } from "../../../types/load";
import type { ACDevice } from "../../../types/device";
import {
  calculateBaseLoad,
  calculateHeatingLoad,
  calculateWaterHeaterLoad,
  calculateEVLoad,
  calculateOtherApplianceLoad,
  calculateRangeLoad
} from "../services/loadService";

export const useLoadStore = defineStore("load", {
  state: (): {
    input: LoadInput;
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

      interlockedHeatAC: false,
      hasThermostatControl: true,

      ranges: [],
      waterHeaters: [],
      otherAppliances: [],
      evChargers: [],
      heaters: [],
      acUnits: [],
      hasEVEMS: false
    },

    error: null
  }),

  getters: {
    // 🔹 拆成独立 getter
    rangeLoad: (state): number => calculateRangeLoad(state.input.ranges),
    waterHeaterLoad: (state): number =>
      calculateWaterHeaterLoad(state.input.waterHeaters),
    otherAppLoad: (state): number =>
      calculateOtherApplianceLoad(
        state.input.otherAppliances,
        state.input.ranges.length > 0
      ),
    evLoad: (state): number => calculateEVLoad(state.input.evChargers), // state.input.hasEVEMS),
    baseLoad: (state): number => calculateBaseLoad(state.input),
    heatingLoad: (state): number =>
      calculateHeatingLoad(
        state.input.heaters,
        state.input.hasThermostatControl
      ),
    acLoad: (state): number => {
      const acs = state.input.acUnits.filter(
        (d): d is ACDevice => d.type === "ac"
      );
      if (acs.length === 0) return 0;
      return acs.reduce((sum, ac) => {
        const voltage =
          ac.unit === "current"
            ? (ac.voltage ?? state.input.voltage)
            : ac.style === "window"
              ? 120
              : state.input.voltage;
        const watts = acValueToWatts(ac.value, ac.unit, voltage);
        return sum + watts;
      }, 0);
    },
    // 🔹 计算总负载
    total(state): LoadResult {
      const base = this.baseLoad;
      const heaters = this.heatingLoad;
      const acs = this.acLoad;
      const heatOrAC = state.input.interlockedHeatAC
        ? Math.max(heaters, acs)
        : heaters + acs;
      const ranges = this.rangeLoad;
      const waterHeaters = this.waterHeaterLoad;
      const otherApps = this.otherAppLoad;
      const evs = this.evLoad;

      const totalLoad =
        base + heatOrAC + ranges + waterHeaters + otherApps + evs;

      return {
        base,
        heatOrAC,
        heaters,
        acs,
        ranges,
        waterHeaters,
        otherApps,
        evs,
        totalLoad,
        finalLoad: totalLoad, // 可以加 demand factor 后再改
        current: parseFloat((totalLoad / state.input.voltage).toFixed(2))
      };
    }
  },

  actions: {
    setError(msg: string) {
      this.error = msg;
    }
  }
});
