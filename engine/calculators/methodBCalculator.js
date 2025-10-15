// engine/calculators/methodBCalculator.js
import { pushStep } from '../types.js';

export function calculateMethodB(ctx, livingArea_m2 = 0) {
  const A = Number(livingArea_m2 || 0);
  const value = A >= 80 ? 24000 : 14400;
  pushStep(ctx, {
    description: "Method (b) minimum service",
    codeFormula: "A >= 80 ? 24000 : 14400",
    mathFormula: "P_b = (A ≥ 80) ? 24,000 W : 14,400 W",
    inputRefs: ["livingArea_m2"],
    intermediateValues: { livingArea_m2: String(A) },
    output: { methodBLoad: String(value) },
    units: { methodBLoad: "W" },
    ruleCitations: ["CEC 8-200 1)b"]
  });
  return value;
}
