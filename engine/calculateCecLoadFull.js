// engine/calculateCecLoadFull.js
import { nowISO, pushStep } from './types.js';
import { calculateBaseLoad } from './calculators/baseLoadCalculator.js';
import { calculateHeatingCooling } from './calculators/heatingCoolingCalculator.js';
import { calculateRange } from './calculators/rangeCalculator.js';
import { calculateWaterHeater } from './calculators/waterHeaterCalculator.js';
import { calculateEv } from './calculators/evChargerCalculator.js';
import { calculateMisc } from './calculators/miscLoadCalculator.js';
import { calculateMethodB } from './calculators/methodBCalculator.js';
import { lookupConductorFromTable } from './calculators/conductorSelector.js';

/**
 * inputs: {
 *   livingArea_m2: number,
 *   systemVoltage: number,
 *   appliances: [{ type, va, kw, isInterlocked }],
 *   evVA?: number,
 *   heatingVA?: number,
 *   coolingVA?: number,
 *   extraLoads?: [VA numbers],
 *   range_kW?: number,
 *   conductorMaterial?: 'Cu'|'Al'
 * }
 *
 * Returns: unsignedBundle-like object with steps[] and results.
 */
export async function calculateCecLoadFull(inputs = {}) {
  const ctx = { inputs, steps: [] };

  // 1. base load (a)(i,ii)
  const a_base = calculateBaseLoad(ctx);

  // 2. heating & cooling (a)(iii)
  const heatingVA = Number(inputs.heatingVA || 0);
  const coolingVA = Number(inputs.coolingVA || 0);
  // decide interlock: if any appliance has isInterlocked true, treat as interlocked
  const interlocked = Array.isArray(inputs.appliances) && inputs.appliances.some(a => a.isInterlocked);
  const a_heatcool = calculateHeatingCooling(ctx, heatingVA, coolingVA, interlocked);

  // 3. electric range (a)(iv)
  const a_range = calculateRange(ctx, inputs.range_kW);

  // 4. water heaters etc (a)(v)
  const a_wh = calculateWaterHeater(ctx, inputs.waterHeaterVA || 0);

  // 5. EV (a)(vi)
  const a_ev = calculateEv(ctx, inputs.evVA || 0);

  // 6. other >1500W (a)(vii)
  const miscList = inputs.extraLoads || [];
  const hasRange = Boolean(inputs.range_kW && inputs.range_kW > 0);
  const a_misc = calculateMisc(ctx, miscList, hasRange);

  // total Item (a)
  const totalA = a_base + a_heatcool + a_range + a_wh + a_ev + a_misc;
  pushStep(ctx, {
    description: "Item (a) total demand (sum of a i->vii)",
    codeFormula: "sum(a_base,a_heatcool,a_range,a_wh,a_ev,a_misc)",
    mathFormula: "P_a_total = Σ components (a i → vii)",
    intermediateValues: {
      a_base: String(a_base),
      a_heatcool: String(a_heatcool),
      a_range: String(a_range),
      a_wh: String(a_wh),
      a_ev: String(a_ev),
      a_misc: String(a_misc)
    },
    output: { totalA: String(totalA) },
    units: { totalA: "W" },
    ruleCitations: ["CEC 8-200 1)a"]
  });

  // Item (b)
  const b_val = calculateMethodB(ctx, inputs.livingArea_m2);

  // choose greater
  const finalVA = Math.max(totalA, b_val);
  pushStep(ctx, {
    description: "Select greater of Item (a) or Item (b)",
    codeFormula: "finalVA = Math.max(totalA, b_val)",
    mathFormula: "P_final = max(P_a_total, P_b)",
    intermediateValues: { totalA: String(totalA), b_val: String(b_val) },
    output: { finalVA: String(finalVA) },
    units: { finalVA: "W" },
    ruleCitations: ["CEC 8-200 1)"]
  });

  // Service current
  const V = Number(inputs.systemVoltage || 240);
  const currentA = finalVA / V;
  pushStep(ctx, {
    description: "Service current I = VA ÷ V",
    codeFormula: "I = finalVA / V",
    mathFormula: "I = P_final ÷ V",
    intermediateValues: { finalVA: String(finalVA), V: String(V) },
    output: { serviceCurrentA: String(currentA) },
    units: { serviceCurrentA: "A" },
    ruleCitations: ["general electrical"]
  });

  // Conductor lookup (table)
  let conductor = "N/A";
  try {
    // required ampacity is service current (note: in real implementation consider correction factors)
    const requiredA = Number(currentA);
    conductor = await lookupConductorFromTable(ctx, requiredA, inputs.conductorMaterial || "Cu");
  } catch (err) {
    // push an error step
    pushStep(ctx, {
      description: "Conductor lookup error",
      codeFormula: "lookupConductorFromTable(...) failed",
      mathFormula: "查表失败",
      intermediateValues: { error: String(err && err.message) },
      output: { conductorSize: "ERROR" },
      ruleCitations: ["CEC Table 2"],
    });
  }

  const results = {
    demandVA: Number(finalVA.toFixed(2)),
    serviceCurrentA: Number(currentA.toFixed(2)),
    conductorSize: conductor
  };

  const bundle = {
    id: `cec-8-200-${Date.now()}`,
    inputs,
    results,
    steps: ctx.steps,
    meta: {
      engine: "cec-full-node-v1",
      ruleSet: "CEC 8-200",
      timestamp: nowISO()
    }
  };

  return bundle;
}
