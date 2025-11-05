// @tradespro/calculation-engine/src/core/tableLoader.node.ts
// Node.js-specific table loader using fs/promises
// This file is only used in Node.js environments (backend, calculation-service)

import fs from 'fs/promises';
import path from 'path';
import type { RuleTables, CodeEdition } from './types';

/**
 * Helper to read a table file safely. Returns an empty object if the file is missing.
 * @param tablesDir The directory where table files are located.
 * @param fileName The name of the JSON file to read.
 * @returns The parsed JSON object or an empty object.
 */
async function readTable(tablesDir: string, fileName: string): Promise<any> {
  try {
    const content = await fs.readFile(path.join(tablesDir, fileName), 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // Log a warning if a table is missing, but don't crash the application.
    console.warn(`[TableManager] Could not load or parse table "${fileName}". It may be missing. Calculation results may be incomplete.`);
    return {}; // Return an empty object for the missing table.
  }
}

/**
 * Table version manager for Node.js environment
 * Loads tables from filesystem using fs.readFile
 */
export class TableVersionManager {
  private cache: Map<string, RuleTables> = new Map();
  
  /**
   * Load tables for a specific code and edition from filesystem.
   */
  async loadTables(
    code: 'cec' | 'nec' = 'cec',
    edition: '2021' | '2024' | '2027' = '2024'
  ): Promise<RuleTables> {
    const cacheKey = `${code}-${edition}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // SSoT (Single Source of Truth): Use require.resolve to locate the package's data directory
    // This ensures we always load from the authoritative source, regardless of where the package is installed
    // (workspace, node_modules, or published package)
    try {
      // Resolve the package's main entry point
      const packageEntry = require.resolve('@tradespro/calculation-engine');
      // Navigate from dist/index.js to data/tables/{edition}
      const packageRoot = path.dirname(packageEntry); // dist/
      const tablesDir = path.join(packageRoot, '../data/tables', edition);
      
      // Verify the directory exists
      const fsSync = require('fs');
      if (!fsSync.existsSync(tablesDir)) {
        throw new Error(`Table directory does not exist: ${tablesDir}`);
      }

      // Load all tables concurrently and safely.
      const [table2, table4, table5A, table5C] = await Promise.all([
          readTable(tablesDir, 'table2.json'),
          readTable(tablesDir, 'table4.json'),
          readTable(tablesDir, 'table5A.json'),
          readTable(tablesDir, 'table5C.json'),
      ]);
      
      const tables: RuleTables = { 
          table2, 
          table4, 
          table5A, 
          table5C,
          edition: edition as CodeEdition,
          code: 'cec'
      };
      
      this.cache.set(cacheKey, tables);
      return tables;
    } catch (error) {
      console.error(`[TableManager] FATAL: Could not load rule tables from SSoT.`, error);
      throw new Error(`Failed to load authoritative rule tables from @tradespro/calculation-engine: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Global instance for Node.js
export const tableManager = new TableVersionManager();

