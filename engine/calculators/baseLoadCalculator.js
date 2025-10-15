// engine/calculators/baseLoadCalculator.js
import { pushStep } from '../types.js';

export function calculateBaseLoad(ctx) {
  const A = Number(ctx.inputs.livingArea_m2 || 0);
  let baseLoad = 5000;
  if (A > 90) {
    const extraUnits = Math.ceil((A - 90) / 90);
    const extra = extraUnits * 1000;
    baseLoad += extra;
    pushStep(ctx, {
      description: "Basic load: 5000 W for first 90 m² + 1000 W per additional 90 m²",
      codeFormula: "A <= 90 ? 5000 : 5000 + ceil((A - 90)/90)*1000",
      mathFormula: "P_a = 5000 + ⌈(A − 90)/90⌉ × 1000 (W)",
      inputRefs: ["livingArea_m2"],
      intermediateValues: {
        livingArea_m2: String(A),
        extraUnits: String(extraUnits),
        extraW: String(extra)
      },
      output: { baseLoad: String(baseLoad) },
      units: { baseLoad: "W" },
      ruleCitations: ["CEC 8-200 1)a)i, ii"]
    });
  } else {
    pushStep(ctx, {
      description: "Basic load: 5000 W for first 90 m²",
      codeFormula: "A <= 90 ? 5000 : ...",
      mathFormula: "P_a = 5000 (if A ≤ 90)",
      inputRefs: ["livingArea_m2"],
      output: { baseLoad: String(baseLoad) },
      units: { baseLoad: "W" },
      ruleCitations: ["CEC 8-200 1)a)i"]
    });
  }
  return baseLoad;
}
