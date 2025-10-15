// engine/calculators/rangeCalculator.js
import { pushStep } from '../types.js';

/**
 * rating_kW: number (kW rating of range). If absent, assume no range provided -> return 0
 */
export function calculateRange(ctx, rating_kW) {
  const kW = Number(rating_kW || 0);
  if (kW <= 0) {
    // no range provided
    pushStep(ctx, {
      description: "Electric range: none provided",
      codeFormula: "no range -> 0",
      mathFormula: "No range provided → P_r = 0",
      output: { rangeLoad: "0" },
      units: { rangeLoad: "W" },
      ruleCitations: ["CEC 8-200 1)a)iv"]
    });
    return 0;
  }
  let P;
  if (kW <= 12) {
    P = 6000;
  } else {
    // 40% of amount by which rating exceeds 12 kW
    P = 6000 + 0.4 * (kW - 12) * 1000;
  }
  pushStep(ctx, {
    description: "Electric range load",
    codeFormula: "6000 + 0.4 * max(0, (kW - 12)) * 1000",
    mathFormula: "P_r = 6000 + 0.4 × (kW − 12) × 1000 (if kW > 12)",
    inputRefs: ["range_kW"],
    intermediateValues: { range_kW: String(kW) },
    output: { rangeLoad: String(P) },
    units: { rangeLoad: "W" },
    ruleCitations: ["CEC 8-200 1)a)iv"]
  });
  return P;
}
