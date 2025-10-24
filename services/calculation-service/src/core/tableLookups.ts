// services/calculation-service/src/core/tables.ts
// TradesPro Multi-Version Table Lookup Engine

import { Table, TableEntry, RuleTables, ConductorSelectionResult } from './types';

const FIXED_DECIMALS = 6;

export function toFixedDigits(n: number): string {
  const s = Number(n || 0).toFixed(FIXED_DECIMALS);
  return s.replace(/\.?0+$/, '') || '0';
}

/**
 * Select best ampacity column from a table row
 * Supports multiple naming conventions: ampacity75C, 75C, ampacity75, etc.
 */
export function selectAmpacityColumn(
  row: TableEntry,
  tempRating: number
): string | null {
  // Try standard formats in order of preference
  const candidates = [
    `ampacity${tempRating}C`,
    `ampacity${tempRating}`,
    `${tempRating}C`,
    `factor${tempRating}C`,
    `factor${tempRating}`,
    'ampacity75C', // fallback
    'ampacity',
  ];

  for (const candidate of candidates) {
    if (
      Object.prototype.hasOwnProperty.call(row, candidate) &&
      row[candidate] !== null &&
      row[candidate] !== undefined
    ) {
      return candidate;
    }
  }

  // Last resort: find any column starting with 'ampacity'
  for (const key of Object.keys(row)) {
    if (
      key.toLowerCase().startsWith('ampacity') &&
      typeof row[key] === 'number'
    ) {
      return key;
    }
  }

  return null;
}

/**
 * Lookup ambient temperature correction factor from Table 5A
 */
export function lookupAmbientFactor(
  table5A: Table | undefined,
  ambientTempC: number | undefined,
  tempRating: number
): {
  factor: number;
  tableId?: string;
  version?: string;
  rowIndex: number;
  columnUsed?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // Handle missing table or temperature
  if (!table5A) {
    warnings.push('Table 5A missing; using default factor 1.0');
    return { factor: 1.0, rowIndex: -1, warnings };
  }

  if (ambientTempC === undefined || ambientTempC <= 30) {
    // Base temperature is 30°C, no correction needed
    return {
      factor: 1.0,
      tableId: table5A.tableId,
      version: table5A.version,
      rowIndex: -1,
      warnings: ambientTempC === undefined ? ['No ambient temp provided; using 1.0'] : undefined,
    };
  }

  // Sort entries by temperature
  const entries = [...(table5A.entries || [])].sort(
    (a, b) => (a.ambientTempC ?? -Infinity) - (b.ambientTempC ?? -Infinity)
  );

  // Find closest temperature entry (not exceeding ambient)
  let chosenIndex = -1;
  for (let i = 0; i < entries.length; i++) {
    const rowTemp = entries[i].ambientTempC ?? -Infinity;
    if (rowTemp <= ambientTempC) {
      chosenIndex = i;
    } else {
      break;
    }
  }

  if (chosenIndex === -1) {
    warnings.push(`Ambient temp ${ambientTempC}°C below table range; using first entry`);
    chosenIndex = 0;
  }

  const row = entries[chosenIndex];

  // Find factor column
  const columnCandidates = [
    `factor${tempRating}C`,
    `factor${tempRating}`,
    'factor',
  ];

  let columnUsed: string | undefined;
  for (const col of columnCandidates) {
    if (Object.prototype.hasOwnProperty.call(row, col) && row[col] !== null) {
      columnUsed = col;
      break;
    }
  }

  if (!columnUsed) {
    warnings.push(`No factor column found for ${tempRating}°C; using 1.0`);
    return {
      factor: 1.0,
      tableId: table5A.tableId,
      version: table5A.version,
      rowIndex: chosenIndex,
      warnings,
    };
  }

  const factor = Number(row[columnUsed]);
  if (isNaN(factor)) {
    warnings.push(`Invalid factor value; using 1.0`);
    return {
      factor: 1.0,
      tableId: table5A.tableId,
      version: table5A.version,
      rowIndex: chosenIndex,
      columnUsed,
      warnings,
    };
  }

  return {
    factor,
    tableId: table5A.tableId,
    version: table5A.version,
    rowIndex: chosenIndex,
    columnUsed,
  };
}

/**
 * Lookup conductor count correction factor from Table 5C
 */
export function lookupCountFactor(
  table5C: Table | undefined,
  numConductors: number | undefined
): {
  factor: number;
  tableId?: string;
  version?: string;
  rowIndex: number;
  columnUsed: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  if (!table5C) {
    warnings.push('Table 5C missing; using default factor 1.0');
    return { factor: 1.0, rowIndex: -1, columnUsed: 'correctionFactor', warnings };
  }

  if (numConductors === undefined || numConductors <= 3) {
    // Base case: 1-3 conductors = 1.0
    return {
      factor: 1.0,
      tableId: table5C.tableId,
      version: table5C.version,
      rowIndex: 0,
      columnUsed: 'correctionFactor',
    };
  }

  // Match conductor count range
  for (let i = 0; i < (table5C.entries || []).length; i++) {
    const row = table5C.entries[i];
    const rangeStr = (row.numConductorsRange ?? '').replace(/\s/g, '');

    if (!rangeStr) continue;

    // Handle "43+" format
    if (rangeStr.includes('+')) {
      const min = Number(rangeStr.replace('+', ''));
      if (numConductors >= min) {
        return {
          factor: Number(row.correctionFactor),
          tableId: table5C.tableId,
          version: table5C.version,
          rowIndex: i,
          columnUsed: 'correctionFactor',
        };
      }
    }

    // Handle "4–6" or "4-6" format
    if (rangeStr.includes('–') || rangeStr.includes('-')) {
      const separator = rangeStr.includes('–') ? '–' : '-';
      const [minStr, maxStr] = rangeStr.split(separator);
      const min = Number(minStr);
      const max = Number(maxStr);

      if (numConductors >= min && numConductors <= max) {
        return {
          factor: Number(row.correctionFactor),
          tableId: table5C.tableId,
          version: table5C.version,
          rowIndex: i,
          columnUsed: 'correctionFactor',
        };
      }
    }

    // Handle exact number
    const exact = Number(rangeStr);
    if (!isNaN(exact) && numConductors === exact) {
      return {
        factor: Number(row.correctionFactor),
        tableId: table5C.tableId,
        version: table5C.version,
        rowIndex: i,
        columnUsed: 'correctionFactor',
      };
    }
  }

  warnings.push(`No matching conductor count range for ${numConductors}; using 1.0`);
  return {
    factor: 1.0,
    tableId: table5C.tableId,
    version: table5C.version,
    rowIndex: -1,
    columnUsed: 'correctionFactor',
    warnings,
  };
}

/**
 * Compare wire sizes for sorting
 */
function compareWireSizes(a: string, b: string): number {
  const sizeOrder = [
    '14', '12', '10', '8', '6', '4', '3', '2', '1',
    '1/0', '2/0', '3/0', '4/0',
    '250', '300', '350', '400', '500', '600', '700', '750', '800', '900', '1000',
    '1250', '1500', '1750', '2000'
  ];
  
  const indexA = sizeOrder.indexOf(a);
  const indexB = sizeOrder.indexOf(b);
  
  // If not found, put at end
  if (indexA === -1 && indexB === -1) return 0;
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  
  return indexA - indexB;
}

/**
 * Lookup conductor size from ampacity table (Table 2 for Cu, Table 4 for Al)
 * Applies ambient and count corrections
 */
export function lookupConductorSize(
  requiredAmps: number,
  material: 'Cu' | 'Al',
  tempRating: 60 | 75 | 90,
  ruleTables: RuleTables,
  ambientTempC?: number,
  numConductors?: number
): ConductorSelectionResult {
  const warnings: string[] = [];
  const tableReferences: ConductorSelectionResult['tableReferences'] = [];

  // Select appropriate table
  const table = material === 'Cu' ? ruleTables.table2 : ruleTables.table4;
  const tableName = material === 'Cu' ? 'Table 2 (Cu)' : 'Table 4 (Al)';

  if (!table || !Array.isArray(table.entries) || table.entries.length === 0) {
    warnings.push(`${tableName} missing or empty`);
    return {
      size: 'UNKNOWN',
      baseAmpacity: 0,
      tableReferences: [{ tableId: table?.tableId ?? 'missing' }],
      warnings,
    };
  }

  // Get correction factors
  const ambientResult = lookupAmbientFactor(
    ruleTables.table5A,
    ambientTempC,
    tempRating
  );
  if (ambientResult.warnings) warnings.push(...ambientResult.warnings);

  const countResult = lookupCountFactor(ruleTables.table5C, numConductors);
  if (countResult.warnings) warnings.push(...countResult.warnings);

  // Add correction table references
  if (ambientResult.tableId) {
    tableReferences.push({
      tableId: ambientResult.tableId,
      version: ambientResult.version,
      rowIndex: ambientResult.rowIndex,
      columnUsed: ambientResult.columnUsed,
    });
  }
  if (countResult.tableId) {
    tableReferences.push({
      tableId: countResult.tableId,
      version: countResult.version,
      rowIndex: countResult.rowIndex,
      columnUsed: countResult.columnUsed,
    });
  }

  // Build sorted list of conductors with ampacities
  const conductors: Array<{
    entry: TableEntry;
    ampVal: number;
    col: string;
    idx: number;
  }> = [];

  for (let i = 0; i < table.entries.length; i++) {
    const entry = table.entries[i];
    const col = selectAmpacityColumn(entry, tempRating);
    if (!col) continue;

    const val = Number(entry[col]);
    if (isNaN(val)) continue;

    conductors.push({ entry, ampVal: val, col, idx: i });
  }

  if (conductors.length === 0) {
    warnings.push(`No valid ampacity column found in ${tableName}`);
    return {
      size: 'UNKNOWN',
      baseAmpacity: 0,
      tableReferences: [{ tableId: table.tableId, version: table.version }],
      warnings,
    };
  }

  // Sort by size (not ampacity) to ensure consistent selection
  conductors.sort((a, b) => compareWireSizes(a.entry.size || '', b.entry.size || ''));

  // Find first conductor with sufficient corrected ampacity
  for (const conductor of conductors) {
    const correctedAmpacity = Math.floor(
      conductor.ampVal * ambientResult.factor * countResult.factor
    );

    if (correctedAmpacity >= requiredAmps) {
      tableReferences.unshift({
        tableId: table.tableId,
        version: table.version,
        rowIndex: conductor.idx,
        columnUsed: conductor.col,
      });

      return {
        size: `${conductor.entry.size} ${conductor.entry.unit || ''} ${material}`.trim(),
        baseAmpacity: conductor.ampVal,
        effectiveAmpacity: correctedAmpacity,
        ambientFactor: ambientResult.factor,
        countFactor: countResult.factor,
        tableReferences,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }

  // No conductor sufficient - return largest available
  const largest = conductors[conductors.length - 1];
  const correctedAmpacity = Math.floor(
    largest.ampVal * ambientResult.factor * countResult.factor
  );

  warnings.push(
    `Required ${requiredAmps}A exceeds table maximum corrected ampacity (${correctedAmpacity}A); using largest available`
  );

  tableReferences.unshift({
    tableId: table.tableId,
    version: table.version,
    rowIndex: largest.idx,
    columnUsed: largest.col,
  });

  return {
    size: `${largest.entry.size} ${largest.entry.unit || ''} ${material} (OVERSIZE)`.trim(),
    baseAmpacity: largest.ampVal,
    effectiveAmpacity: correctedAmpacity,
    ambientFactor: ambientResult.factor,
    countFactor: countResult.factor,
    tableReferences,
    warnings,
  };
}