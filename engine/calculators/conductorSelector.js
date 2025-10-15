import fs from 'fs';
import path from 'path';

/**
 * lookupConductorFromTable:
 *  - currentA: required continuous current (A)
 *  - opts: { material: 'Cu'|'Al', insulationTempC: 75|90|60, ambientC: number, numConductorsInRaceway: number }
 *  - returns { selectedConductor, baseAmpacity, correctedAmpacity, appliedFactors, auditStep }
 */
export function lookupConductorFromTable(currentA, opts = {}) {
  const {
    material = 'Cu',
    insulationTempC = 75,
    ambientC = 30,
    numConductorsInRaceway = 1,
    tablePath = path.resolve(process.cwd(), 'tables', 'table2.json')
  } = opts;

  // Load table (synchronous for demo; engine should call this once in production)
  if (!fs.existsSync(tablePath)) {
    throw new Error(`Lookup table not found: ${tablePath}`);
  }
  const tableRaw = fs.readFileSync(tablePath, 'utf-8');
  const table = JSON.parse(tableRaw);

  // Simple ambient/temperature correction example table (demo values)
  const ambientCorrectionTable = [
    // ambientC threshold (<=), factor for 75°C insulation
    { maxAmbient: 21, factor75: 1.00, factor90: 1.00, factor60: 1.00 },
    { maxAmbient: 25, factor75: 0.97, factor90: 0.98, factor60: 0.96 },
    { maxAmbient: 30, factor75: 0.94, factor90: 0.96, factor60: 0.92 },
    { maxAmbient: 35, factor75: 0.88, factor90: 0.92, factor60: 0.84 },
    { maxAmbient: 40, factor75: 0.82, factor90: 0.85, factor60: 0.76 }
  ];

  // Simple grouping factor lookup (num conductors in raceway)
  // These numbers are illustrative; replace with code/official Table/Rule as needed.
  const groupingFactors = [
    { maxConductors: 1, factor: 1.0 },
    { maxConductors: 3, factor: 1.0 },
    { maxConductors: 6, factor: 0.8 },
    { maxConductors: 10, factor: 0.7 },
    { maxConductors: 20, factor: 0.5 }
  ];

  // 1) find ambient correction factor for the insulation temp
  let ambientFactor = 1.0;
  for (const row of ambientCorrectionTable) {
    if (ambientC <= row.maxAmbient) {
      if (String(insulationTempC) === '90') ambientFactor = row.factor90;
      else if (String(insulationTempC) === '75') ambientFactor = row.factor75;
      else ambientFactor = row.factor60;
      break;
    }
  }

  // 2) grouping factor
  let groupingFactor = 1.0;
  for (const g of groupingFactors) {
    if (numConductorsInRaceway <= g.maxConductors) { groupingFactor = g.factor; break; }
  }

  // 3) scan table: find smallest conductor whose ampacity * ambientFactor * groupingFactor >= currentA
  // only consider entries matching material
  const candidates = table
    .filter(r => String(r.material).toLowerCase() === String(material).toLowerCase())
    // keep conductor and ampacity for given insulationTempC (fall back if not found)
    .map(r => {
      const amp = r.ampacities && (r.ampacities[String(insulationTempC)] || Object.values(r.ampacities)[0]);
      return { conductor: r.conductor, baseAmpacity: Number(amp), notes: r.notes || '' };
    })
    .filter(r => !isNaN(r.baseAmpacity))
    .sort((a, b) => a.baseAmpacity - b.baseAmpacity);

  // compute corrected ampacity per candidate
  for (const c of candidates) {
    c.correctedAmpacity = Number((c.baseAmpacity * ambientFactor * groupingFactor).toFixed(3));
  }

  // find first candidate with correctedAmpacity >= currentA
  const selected = candidates.find(c => c.correctedAmpacity >= currentA) || candidates[candidates.length - 1];

  // Build audit step info
  const auditStep = {
    stepIndex: null, // 主引擎填入索引
    description: `Conductor lookup from Table 2 for ${material}`,
    formula: `Select smallest conductor where baseAmpacity * ambientFactor * groupingFactor >= requiredCurrent`,
    inputs: { requiredCurrentA: currentA, insulationTempC, ambientC, numConductorsInRaceway },
    tableUsed: path.basename(tablePath),
    selectedConductor: selected ? selected.conductor : null,
    baseAmpacity: selected ? selected.baseAmpacity : null,
    correctedAmpacity: selected ? selected.correctedAmpacity : null,
    appliedFactors: { ambientFactor, groupingFactor },
    note: selected ? selected.notes : 'No selection - table exhausted'
  };

  return { selectedConductor: selected ? selected.conductor : null, baseAmpacity: selected ? selected.baseAmpacity : null, correctedAmpacity: selected ? selected.correctedAmpacity : null, appliedFactors: { ambientFactor, groupingFactor }, auditStep };
}
