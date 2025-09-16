import { defineStore } from 'pinia'
interface Device {
  name: string
  watts: number
}

export const useLoadStore = defineStore('load', {
  state: () => ({
    groundFloorArea: 0,
    upperFloorArea: 0,
    basementArea: 0,
    basementHeight: 0,
    spaceHeatingWatts: 0,
    acWatts: 0,
    interlockedHeatAC: false,
    hasThermostatControl: false,
    evChargerWatts: 0,
    hasEVEMS: false,
    voltage: 240,
    specialHeaters: [] as Device[],
    otherLoads: [] as Device[],

    result: {
      baseLoad: 0,
      totalWatts: 0,
      serviceAmps: 0
    }
  })
})
