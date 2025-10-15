// engine/calculators/waterHeaterCalculator.js
import { pushStep } from '../types.js';

/**
 * For tankless/pool/spa/heater loads — recorded at 100% per subsection
 * totalVA: combined VA rating of such devices
 */
export function calculateWaterHeater(ctx, totalVA = 0) {
  const P = Number(totalVA || 0);
  pushStep(ctx, {
    description: "Water-heater / tankless / pool / spa loads (100%)",
    codeFormula: "sum(devices) * 1.0",
    mathFormula: "P_{wh} = Σ rating (100%)",
    inputRefs: ["waterHeaterVA"],
    intermediateValues: { waterHeaterVA: String(P) },
    output: { waterHeaterLoad: String(P) },
    units: { waterHeaterLoad: "W" },
    ruleCitations: ["CEC 8-200 1)a)v"]
  });
  return P;
}
