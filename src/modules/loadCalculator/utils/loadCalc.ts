// src/modules/loadCalculator/utils/loadCalc.ts
// Type definitions for electrical systems
export type CircuitType = 'feeder' | 'branch'
export type ConductorType = 'single' | 'multiple'
export type ServiceType = '80pct' | '100pct'
export type ACUnitType = 'window' | 'split' | 'central' | 'other'

// Add typical voltage configurations
const defaultACVoltages: Record<ACUnitType, number> = {
  window: 120,   // Typically 120V (standard outlet)
  split: 240,    // Most mini-splits are 240V in North America
  central: 240,  // Central AC units are 240V
  other: 120     // Conservative default
}

export interface ACUnitInput {
  type: 'watts' | 'btu' | 'current' | 'ton'
  value: number
  voltage?: number        // Optional now - will use defaults if not provided
  powerFactor?: number    
  acUnitType: ACUnitType  // Made required to ensure proper voltage selection
}

function getACVoltage(input: ACUnitInput): number {
  // Use provided voltage or default based on unit type
  return input.voltage || defaultACVoltages[input.acUnitType]
}

// AC Unit Conversion Utilities
export function btuToWatts(btu: number): number {
  // 1 BTU/h = 0.293071 Watts
  return btu * 0.293071
}

export function currentToWatts(current: number, voltage: number, powerFactor: number = 0.85): number {
  // P = V * I * PF (for single phase)
  // Default power factor is 0.85 for AC units if not specified
  return voltage * current * powerFactor
}

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
  acWatts?: number          // Optional now
  acUnit?: ACUnitInput      // New field for flexible AC unit input
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
  const baseLoad = 5000  // First 90m² gets 5000W
  const extraArea = Math.max(livingArea - 90, 0)  // Area beyond first 90m²
  const extraUnits = Math.ceil(extraArea / 90)    // Number of additional 90m² units (rounded up)
  const additionalLoad = extraUnits * 1000        // 1000W per additional 90m² unit
  
  return baseLoad + additionalLoad
}

function calculateHeatLoad(input: LoadInput): number {
  // First calculate AC watts from either direct input or AC unit
  const actualACWatts = calculateACLoad(input)
  
  return input.interlockedHeatAC ? 
    Math.max(input.spaceHeatingWatts, actualACWatts) : 
    input.spaceHeatingWatts
}

// function calculateACLoad(input: LoadInput): number {
//   return input.interlockedHeatAC ? 0 : input.acWatts
// }

function calculateACLoad(input: LoadInput): number {
  // If AC Unit data is provided, use that first
  if (input.acUnit) {
    switch (input.acUnit.type) {
      case 'btu':
        return btuToWatts(input.acUnit.value)
      case 'current':
        // Use default voltage if not specified
        const voltage = getACVoltage(input.acUnit)
        if (!input.acUnit.voltage) {
          throw new Error('Voltage required for current-based AC load calculation')
        }
        return currentToWatts(
          input.acUnit.value, 
          input.acUnit.voltage, 
          input.acUnit.powerFactor
        )
      default:
        return input.acUnit.value // watts
    }
  }
  
  // If no AC Unit data but acWatts is provided, use that
  if (input.acWatts !== undefined) {
    return input.interlockedHeatAC ? 0 : input.acWatts
  }
  
  // If no AC load specified at all, return 0
  return 0
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