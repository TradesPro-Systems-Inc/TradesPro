// engine/tables/tableLoader.js
import fs from 'fs/promises';
import path from 'path';

export async function loadTable(tableName) {
  // tableName: 'table2' -> resolves tables/table2.json relative to repo root
  const base = process.cwd(); // expect to run from repo root
  const p = path.join(base, 'tables', `${tableName}.json`);
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt);
  } catch (err) {
    const e = new Error(`Lookup table not found: ${p}`);
    e.code = 'TABLE_NOT_FOUND';
    throw e;
  }
}
