//src/modules/loadCalculator/services/loadService.ts

import { calculateResidentialLoad, type LoadInput, type LoadResult } from '../utils/loadCalc'

export type { LoadInput, LoadResult }

export function computeLoadResult(input: LoadInput): LoadResult {
  const validationErrors = validateInput(input)
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join('; '))
  }
  
  return calculateResidentialLoad(input)
}

function validateInput(input: LoadInput): string[] {
  const errors: string[] = []
  
  if (input.voltage <= 0) {
    errors.push('System voltage must be greater than 0')
  }
  
  if (input.groundFloorArea < 0 || input.upperFloorArea < 0 || input.basementArea < 0) {
    errors.push('Floor area cannot be negative')
  }
  
  // Add more validation as needed
  
  return errors
}