export interface CecInputs {
  livingArea_m2: number;
  systemVoltage: number;
  appliances?: { name?: string; va: number; type?: string }[];
}

export interface CalculationStep {
  stepIndex: number;
  description: string;
  formula: string;
  value: number | string;
}

export interface CecResult {
  demandVA: number;
  serviceCurrentA: number;
  conductorSize: string;
}
