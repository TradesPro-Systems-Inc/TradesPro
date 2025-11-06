// @tradespro/plugin-cec-8-200/src/plugin.ts
// V5 Plugin Implementation - CEC 8-200 Single Dwelling
// This file wraps the calculation coordinator as a plugin

import type { CalculationPlugin, PluginContext, PluginCalculationResult } from '@tradespro/core-engine';
import { computeSingleDwelling } from './coordinator';
import type { CecInputsSingle } from '@tradespro/core-engine';

export const cecSingleDwellingPlugin: CalculationPlugin = {
  manifest: {
    id: 'cec-single-dwelling-2024',
    name: 'CEC 2024 Single Dwelling Load Calculator',
    version: '1.0.0',
    description: 'Calculates electrical load for single dwelling units per CEC Section 8-200',
    author: 'TradesPro',
    license: 'MIT',
    domain: 'electrical',
    standards: ['CEC-2024', 'CEC-8-200'],
    buildingTypes: ['single-dwelling'],
    capabilities: {
      offline: true,
      audit: true,
      signing: true,
      preview: true,
    },
    entry: 'index.ts',
    tables: ['table2', 'table4', 'table5A', 'table5C'],
    tags: ['cec', 'single-dwelling', 'residential', 'load-calculation', 'canada'],
    homepage: 'https://github.com/tradespro/tradespro',
  },

  validateInputs(inputs: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    if (!inputs || typeof inputs !== 'object') {
      errors.push('Inputs must be an object');
      return { valid: false, errors };
    }

    if (typeof inputs.systemVoltage !== 'number' || inputs.systemVoltage <= 0) {
      errors.push('systemVoltage is required and must be a positive number');
    }

    if (inputs.livingArea_m2 !== undefined && (typeof inputs.livingArea_m2 !== 'number' || inputs.livingArea_m2 < 0)) {
      errors.push('livingArea_m2 must be a non-negative number if provided');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  getRequiredTables(): string[] {
    return ['table2', 'table4', 'table5A', 'table5C'];
  },

  async calculate(
    inputs: any,
    context: PluginContext
  ): Promise<PluginCalculationResult> {
    const validation = this.validateInputs!(inputs);
    if (!validation.valid) {
      throw new Error(`Input validation failed: ${validation.errors?.join(', ')}`);
    }

    // Ensure engine commit is set
    if (!context.engine.commit || context.engine.commit.startsWith('placeholder')) {
      context.logger.warn('Engine commit not set - using fallback value');
      context.engine.commit = context.engine.commit || 'plugin-dev';
    }

    // Execute calculation
    const startTime = Date.now();
    try {
      // Extract jurisdiction configuration from context options
      const jurisdictionConfig = context.options?.jurisdictionConfig;
      console.log('🔧 Plugin - Extracted jurisdictionConfig from context:', jurisdictionConfig);
      
      const bundle = computeSingleDwelling(
        inputs as CecInputsSingle,
        context.engine,
        context.tables,
        jurisdictionConfig
      );

      const executionTime = Date.now() - startTime;

      context.logger.info(`Calculation completed in ${executionTime}ms`);

      return {
        bundle,
        executionTimeMs: executionTime,
        warnings: bundle.warnings || [],
      };
    } catch (error) {
      context.logger.error(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },

  onLoad(): void {
    console.log('✅ CEC Single Dwelling Plugin loaded');
  },
};

export default cecSingleDwellingPlugin;

