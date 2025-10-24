// @tradespro/calculation-engine/src/core/tables.ts
// Table Manager for Shared Calculation Engine

import { RuleTables } from './types';

/**
 * Table version manager - loads correct version based on edition
 */
export class TableVersionManager {
  private cache: Map<string, RuleTables> = new Map();
  
  /**
   * Load tables for specific code and edition
   */
  async loadTables(
    code: 'cec' | 'nec' = 'cec',
    edition: '2021' | '2024' | '2027' = '2024'
  ): Promise<RuleTables> {
    const cacheKey = `${code}-${edition}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // For now, return empty tables - in a real implementation,
    // this would load the actual table data
    const tables: RuleTables = {
      edition,
      code
    };
    
    this.cache.set(cacheKey, tables);
    return tables;
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Global instance
export const tableManager = new TableVersionManager();
