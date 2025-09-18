// src/modules/loadCalculator/utils/loadCalc.ts
// Type definitions for electrical systems
export type CircuitType = 'feeder' | 'branch'
export type ConductorType = 'single' | 'multiple'
export type ServiceType = '80pct' | '100pct'

export interface LoadInput {
  // Building Areas (Rule 8-110)
  groundFloorArea: number    // Base area for calculation (m²)
  upperFloorArea: number     // 100% counted (m²)
  basementArea: number       // 75% counted if height > 1.8m (m²)
  basementHeight: number     // For basement area calculation (m)

  // Electrical System (Rules 8-100, 8-102, 8-104)
  voltage: number           // Standard voltages: 120, 208, 240, 277, 347, 416, 480, 600
  circuitType: CircuitType  // For voltage drop calculation
  voltageDropPercent: number // Max 3% for feeders, 5% total
  conductorType: ConductorType // For ampacity calculation
  serviceType: ServiceType  // For continuous operation marking
  isContinuousLoad: boolean // Rule 8-104 3) - Load persistence check

  // Heating and Cooling (Rule 62-118)
  spaceHeatingWatts: number // Electric space heating load
  acWatts: number          // Air conditioning load
  interlockedHeatAC: boolean // Rule 8-106 3) - Heat/AC interlock
  hasThermostatControl: boolean // Rule 62-118 3) - Per room control

  // Major Appliances (Rule 8-200)
  electricRanges: Array<{ ratingKW: number }> // Electric range loads
  waterHeaterWatts: number // Water heater load
  evChargerWatts: number   // EV charger load
  hasEVEMS: boolean        // EV Energy Management System

  // Other Loads (Rule 8-200 1.a.vii)
  otherLoads: Array<{
    name: string;
    watts: number;
  }> // Loads >1500W with demand factor based on range presence

}

export interface LoadResult {
  livingArea: number
  baseLoad: number
  heatLoad: number
  acLoad: number
  rangeLoad: number
  waterHeaterLoad: number
  evLoad: number
  otherLoad: number
  totalWatts: number
  serviceAmps: number
}

export function calculateResidentialLoad(input: LoadInput): LoadResult {
  // 基础负载计算
  const livingArea = calculateLivingArea(input)
  const baseLoad = calculateBaseLoad(livingArea)
  
  // 各项负载计算
  const heatLoad = calculateHeatLoad(input)
  const acLoad = calculateACLoad(input)
  const rangeLoad = calculateRangeLoad(input)
  const waterHeaterLoad = input.waterHeaterWatts
  const evLoad = calculateEVLoad(input)
  const otherLoad = calculateOtherLoad(input)
  
  // 总负载计算
  const totalWatts = calculateTotalLoad({
    baseLoad,
    heatLoad,
    acLoad,
    rangeLoad,
    waterHeaterLoad,
    evLoad,
    otherLoad
  })
  
  return {
    livingArea,
    baseLoad,
    heatLoad,
    acLoad,
    rangeLoad,
    waterHeaterLoad,
    evLoad,
    otherLoad,
    totalWatts,
    serviceAmps: calculateServiceAmps(totalWatts, input.voltage)
  }
}

// 内部辅助函数
function calculateLivingArea(input: LoadInput): number {
  const basementFactor = input.basementHeight > 1.8 ? 0.75 : 0
  return input.groundFloorArea + input.upperFloorArea + input.basementArea * basementFactor
}

function calculateBaseLoad(livingArea: number): number {
  return 5000 + Math.max(livingArea - 90, 0) * 25
}

function calculateHeatLoad(input: LoadInput): number {
  return input.interlockedHeatAC ? 
    Math.max(input.spaceHeatingWatts, input.acWatts) : 
    input.spaceHeatingWatts
}

function calculateACLoad(input: LoadInput): number {
  return input.interlockedHeatAC ? 0 : input.acWatts
}

function calculateRangeLoad(input: LoadInput): number {
  return input.electricRanges.reduce((sum, range) => sum + range.ratingKW * 1000, 0)
}

function calculateEVLoad(input: LoadInput): number {
  return input.hasEVEMS ? input.evChargerWatts * 0.75 : input.evChargerWatts
}

function calculateOtherLoad(input: LoadInput): number {
  return input.otherLoads.reduce((sum, load) => sum + load.watts, 0)
}

function calculateTotalLoad(loads: {
  baseLoad: number
  heatLoad: number
  acLoad: number
  rangeLoad: number
  waterHeaterLoad: number
  evLoad: number
  otherLoad: number
}): number {
  return Object.values(loads).reduce((sum, load) => sum + load, 0)
}

function calculateServiceAmps(totalWatts: number, voltage: number): number {
  return Math.ceil(totalWatts / voltage)
}
// Export these functions that might be used elsewhere
export {
  calculateLivingArea,
  calculateBaseLoad,
  calculateHeatLoad,
  calculateACLoad,
  calculateRangeLoad,
  calculateEVLoad,
  calculateOtherLoad,
  calculateTotalLoad,
  calculateServiceAmps
}

// Add back alias for backwards compatibility
export const calculateMinimumServiceAmps = calculateServiceAmps