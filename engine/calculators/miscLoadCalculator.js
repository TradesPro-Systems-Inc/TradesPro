// engine/calculators/miscLoadCalculator.js
import { pushStep } from '../types.js';

/**
 * extraLoads: array of loads (VA) each >1500W that are to be considered per 1)a)vii
 * hasRange: boolean - whether an electric range is provided for the dwelling
 *
 * If range provided: 25% of rating of each load
 * If no range provided: 100% of combined load up to 6000 W plus 25% of combined load exceeding 6000 W
 */
export function calculateMisc(ctx, extraLoads = [], hasRange = false) {
  const list = Array.isArray(extraLoads) ? extraLoads.map(Number) : [];
  const combined = list.reduce((s, v) => s + (v > 1500 ? v : 0), 0);

  let P = 0;
  if (hasRange) {
    P = combined * 0.25;
    pushStep(ctx, {
      description: "Misc >1500W loads — range provided -> 25% of each rating",
      codeFormula: "0.25 * Σ(load_i > 1500)",
      mathFormula: "P_misc = 0.25 × Σ ratings (each > 1500 W)",
      intermediateValues: { combinedVA: String(combined) },
      output: { miscLoad: String(P) },
      units: { miscLoad: "W" },
      ruleCitations: ["CEC 8-200 1)a)vii A"]
    });
  } else {
    const upTo6000 = Math.min(6000, combined);
    const over = Math.max(0, combined - 6000);
    P = upTo6000 + 0.25 * over;
    pushStep(ctx, {
      description: "Misc >1500W loads — no range provided -> 100% up to 6000 W + 25% of remainder",
      codeFormula: "100% to 6000 + 25% of excess",
      mathFormula: "P_misc = min(Σ,6000) + 0.25 × max(0, Σ − 6000)",
      intermediateValues: { combinedVA: String(combined), upTo6000: String(upTo6000), over: String(over) },
      output: { miscLoad: String(P) },
      units: { miscLoad: "W" },
      ruleCitations: ["CEC 8-200 1)a)vii B"]
    });
  }

  return P;
}
