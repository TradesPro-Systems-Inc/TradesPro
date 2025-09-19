import { defineStore } from 'pinia'
import { computeLoadResult } from '../services/loadService'
import type { LoadInput, LoadResult } from '../services/loadService'

export const useLoadStore = defineStore('load', {
  state: (): {
    input: LoadInput
    result: LoadResult | undefined
    error: string | null
  } => ({
    input: {
      // Building Areas (Rule 8-110)
      groundFloorArea: 90, // m² - Base area for calculation
      upperFloorArea: 0,   // m² - 100% counted
      basementArea: 0,     // m² - 75% counted if height > 1.8m
      basementHeight: 0,   // m - basement height check

      // Voltage (Rule 8-100)
      voltage: 240,        // Standard voltages: 120, 208, 240, 277, 347, 416, 480, 600
      circuitType: 'feeder',
      voltageDropPercent: 3,
      conductorType: 'single',
      serviceType: '100pct',
      isContinuousLoad: false,

      // Heating and Cooling (Rule 62-118)
      spaceHeatingWatts: 0,
      acWatts: 0,
      interlockedHeatAC: false, // Rule 8-106 3)
      hasThermostatControl: true, // Rule 62-118 3)

      // Electric Range (Rule 8-200 1) a) iv)
      electricRanges: [], // 6000W base for single range + 40% over 12kW

      // Water Heating (Rule 8-200 1) a) v)
      waterHeaterWatts: 0, // 100% demand factor for tankless
      // Major Appliances
      evChargerWatts: 0,
      hasEVEMS: false,

      // Other Loads > 1500W (Rule 8-200 1) a) vii)
      otherLoads: [],     // 25% if range present, else special calculation
    },
    result: undefined,
    error: null
  }),

  actions: {
    compute() {
      try {
        this.error = null
        this.result = computeLoadResult(this.input)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error occurred'
        this.result = undefined
      }
    },

    // Helper methods for Rule 8-200 calculations
    addRange(ratingKW: number) {
      this.input.electricRanges.push({ ratingKW })
    },

    removeRange(index: number) {
      this.input.electricRanges.splice(index, 1)
    },

    addOtherLoad(name: string, watts: number) {
      if (watts > 1500) {
        this.input.otherLoads.push({ name, watts })
      }
    },

    removeOtherLoad(index: number) {
      this.input.otherLoads.splice(index, 1)
    },

    clearLoads() {
      this.input.electricRanges = []
      this.input.otherLoads = []
    }
  }
})