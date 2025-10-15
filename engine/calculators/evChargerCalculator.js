// engine/calculators/evChargerCalculator.js
import { pushStep } from '../types.js';

/**
 * EV loads: if supplied from panelboard in dwelling unit -> 100% demand
 * evVA: combined VA of EVSE supplied from unit panelboard
 */
export function calculateEv(ctx, evVA = 0) {
  const P = Number(evVA || 0);
  pushStep(ctx, {
    description: "Electric vehicle supply equipment (EVSE) loads (if from dwelling panelboard, 100%)",
    codeFormula: "sum(ev_chargers) * 1.0",
    mathFormula: "P_{ev} = Σ rating (100%)",
    inputRefs: ["evVA"],
    intermediateValues: { evVA: String(P) },
    output: { evLoad: String(P) },
    units: { evLoad: "W" },
    ruleCitations: ["CEC 8-200 1)a)vi"]
  });
  return P;
}
