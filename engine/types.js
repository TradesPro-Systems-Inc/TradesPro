/*export interface CecInputs {
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
*/
// engine/types.js
// Small shared types/helpers used by modules

export function nowISO() {
  return new Date().toISOString();
}

export function pushStep(ctx, step) {
  step.stepIndex = ctx.steps.length + 1;
  step.timestamp = nowISO();
  ctx.steps.push(step);
}
