import { calculateBaseLoad } from './calculators/baseLoadCalculator.js';
import { calculateMethodB } from './calculators/methodBCalculator.js';
import { lookupConductor } from './calculators/conductorSelector.js';

export function calculateCecLoadFull(inputs) {
  const steps = [];
  const base = calculateBaseLoad(inputs.livingArea_m2);
  steps.push(...base.steps);

  const applianceTotal = (inputs.appliances || []).reduce((s, a) => s + (a.va || 0), 0);
  steps.push({
    stepIndex: steps.length + 1,
    description: "Appliance total",
    formula: "sum(appliances.va)",
    value: applianceTotal
  });

  const totalA = base.value + applianceTotal;
  const methodB = calculateMethodB(inputs.livingArea_m2);
  steps.push(...methodB.steps);

  const finalVA = Math.max(totalA, methodB.value);
  steps.push({
    stepIndex: steps.length + 1,
    description: "Select greater of (a) or (b)",
    formula: "max(totalA, methodB)",
    value: finalVA
  });

  const current = finalVA / inputs.systemVoltage;
  steps.push({
    stepIndex: steps.length + 1,
    description: "Service current (A)",
    formula: "I = VA / V",
    value: current
  });

  const conductor = lookupConductor(current);
  steps.push({
    stepIndex: steps.length + 1,
    description: "Conductor size selection (CEC Table 2 Cu)",
    formula: "lookupConductor(current)",
    value: conductor
  });

  return {
    inputs,
    results: {
      demandVA: finalVA.toFixed(2),
      serviceCurrentA: current.toFixed(2),
      conductorSize: conductor
    },
    steps,
    meta: {
      engine: "js-v-full",
      ruleSet: "cec-8-200",
      timestamp: new Date().toISOString()
    }
  };
}
