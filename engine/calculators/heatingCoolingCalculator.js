// engine/calculators/heatingCoolingCalculator.js
import { pushStep } from '../types.js';

/**
 * heatingVA, coolingVA are numeric (W). interlocked boolean indicates Rule 8-106(3) behavior.
 */
export function calculateHeatingCooling(ctx, heatingVA = 0, coolingVA = 0, interlocked = false) {
  const H = Number(heatingVA || 0);
  const C = Number(coolingVA || 0);
  let result;
  if (interlocked) {
    result = Math.max(H, C);
    pushStep(ctx, {
      description: "Space-heating and air-conditioning (interlocked) — use the greater",
      codeFormula: "interlocked ? max(H,C) : H + C",
      mathFormula: "If interlocked → P_{hc} = max(P_h, P_c); else P_{hc} = P_h + P_c",
      inputRefs: ["heatingVA", "coolingVA"],
      intermediateValues: { heatingVA: String(H), coolingVA: String(C) },
      output: { heatingCoolingLoad: String(result) },
      units: { heatingCoolingLoad: "W" },
      ruleCitations: ["CEC 8-200 1)a)iii", "CEC 8-106 3"]
    });
  } else {
    result = H + C;
    pushStep(ctx, {
      description: "Space-heating and air-conditioning (additive)",
      codeFormula: "H + C",
      mathFormula: "P_{hc} = P_h + P_c",
      inputRefs: ["heatingVA", "coolingVA"],
      intermediateValues: { heatingVA: String(H), coolingVA: String(C) },
      output: { heatingCoolingLoad: String(result) },
      units: { heatingCoolingLoad: "W" },
      ruleCitations: ["CEC 8-200 1)a)iii"]
    });
  }
  return result;
}
