// @tradespro/calculation-engine/src/core/tableLoader.browser.ts
// Browser-specific table loader using fetch API
// This file is only used in browser environments (frontend, PWA)

import type { RuleTables, CodeEdition } from './types';

/**
 * Helper to fetch a table file safely. Returns an empty object if the file is missing.
 * @param tablesBaseUrl The base URL where table files are located (e.g., '/data/tables/2024/').
 * @param fileName The name of the JSON file to fetch.
 * @returns The parsed JSON object or an empty object.
 */
async function fetchTable(tablesBaseUrl: string, fileName: string): Promise<any> {
  try {
    const url = `${tablesBaseUrl}${fileName}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Log a warning if a table is missing, but don't crash the application.
    console.warn(`[TableManager] Could not load or parse table "${fileName}". It may be missing. Calculation results may be incomplete.`, error);
    return {}; // Return an empty object for the missing table.
  }
}

/**
 * Table version manager for browser environment
 * Loads tables using fetch API
 */
export class TableVersionManager {
  private cache: Map<string, RuleTables> = new Map();
  private tablesBaseUrl: string;
  
  /**
   * Constructor - sets the base URL for table files
   * @param tablesBaseUrl Base URL where table files are located (default: '/data/tables/')
   */
  constructor(tablesBaseUrl: string = '/data/tables/') {
    this.tablesBaseUrl = tablesBaseUrl.endsWith('/') ? tablesBaseUrl : `${tablesBaseUrl}/`;
  }
  
  /**
   * Load tables for a specific code and edition from network/public assets.
   */
  async loadTables(
    code: 'cec' | 'nec' = 'cec',
    edition: '2021' | '2024' | '2027' = '2024'
  ): Promise<RuleTables> {
    const cacheKey = `${code}-${edition}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Build the base URL for this edition
    // Example: '/data/tables/2024/' -> fetches from '/data/tables/2024/table2.json', etc.
    const editionUrl = `${this.tablesBaseUrl}${edition}/`;

    // Load all tables concurrently and safely.
    const [table2, table4, table5A, table5C] = await Promise.all([
        fetchTable(editionUrl, 'table2.json'),
        fetchTable(editionUrl, 'table4.json'),
        fetchTable(editionUrl, 'table5A.json'),
        fetchTable(editionUrl, 'table5C.json'),
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
  }
  
  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Set the base URL for table files (useful for dynamic configuration)
   */
  setTablesBaseUrl(baseUrl: string): void {
    this.tablesBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.clearCache(); // Clear cache when URL changes
  }
}

// Global instance for browser
export const tableManager = new TableVersionManager();

