#!/usr/bin/env node
// engine/cli.js
// Usage: node engine/cli.js path/to/input.json
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateCecLoadFull } from './calculateCecLoadFull.js';

async function main() {
  try {
    const arg = process.argv[2];
    if (!arg) {
      console.error("Usage: node engine/cli.js input.json");
      process.exit(2);
    }
    const p = path.resolve(arg);
    const txt = await fs.readFile(p, 'utf8');
    const inputs = JSON.parse(txt);
    const out = await calculateCecLoadFull(inputs);
    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error("ENGINE_ERROR", String(err && err.stack ? err.stack : err));
    process.exit(3);
  }
}

if (import.meta.url === `file://${process.cwd()}/engine/cli.js` || true) {
  // we don't strictly check import.meta — just run
  main();
}
