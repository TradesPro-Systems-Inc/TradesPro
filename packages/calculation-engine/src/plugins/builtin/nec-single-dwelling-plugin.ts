// @tradespro/calculation-engine/src/plugins/builtin/nec-single-dwelling-plugin.ts
// V4.1 Plugin System - NEC Single Dwelling Load Calculator Plugin
// Wraps computeNECSingleDwelling as a plugin

import type { CalculationPlugin, PluginContext, PluginCalculationResult } from '../types';
import type { CecInputsSingle } from '../../core/types';
import { computeNECSingleDwelling } from '../../rules/220-single-dwelling';

export const necSingleDwellingPlugin: CalculationPlugin = {
  manifest: {
    id: 'nec-single-dwelling-2023',
    name: 'NEC 2023 Single Dwelling Load Calculator',
    version: '1.0.0',
    description: 'Calculates electrical load for single dwelling units per NEC Article 220 (Standard and Optional Methods)',
    author: 'TradesPro',
    license: 'MIT',
    domain: 'electrical',
    standards: ['NEC-2023', 'NEC-220'],
    buildingTypes: ['single-dwelling'],
    capabilities: {
      offline: true,
      audit: true,
      signing: true,
      preview: true,
    },
    entry: 'nec-single-dwelling-plugin.ts',
    tables: ['table2', 'table4', 'table5A', 'table5C'],
    tags: ['nec', 'single-dwelling', 'residential', 'load-calculation', 'usa'],
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
    // Validate inputs
    const validation = this.validateInputs!(inputs);
    if (!validation.valid) {
      throw new Error(`Input validation failed: ${validation.errors?.join(', ')}`);
    }

    // Ensure engine commit is set (required by V4.1)
    if (!context.engine.commit || context.engine.commit.startsWith('placeholder')) {
      context.logger.warn('Engine commit not set - using fallback value');
      context.engine.commit = context.engine.commit || 'plugin-dev';
    }

    // Determine if using optional method (from inputs or context options)
    const useOptionalMethod = (inputs as any).necMethod === 'optional' || 
                             (context.options as any)?.necMethod === 'optional';

    // Execute calculation
    const startTime = Date.now();
    try {
      const bundle = computeNECSingleDwelling(
        inputs as CecInputsSingle,
        context.engine,
        context.tables,
        useOptionalMethod
      );

      const executionTime = Date.now() - startTime;

      context.logger.info(`NEC calculation completed in ${executionTime}ms (method: ${useOptionalMethod ? 'Optional' : 'Standard'})`);

      return {
        bundle,
        executionTimeMs: executionTime,
        warnings: bundle.warnings || [],
      };
    } catch (error) {
      context.logger.error(`NEC calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  },

  onLoad(): void {
    console.log('✅ NEC Single Dwelling Plugin loaded');
  },
};

export default necSingleDwellingPlugin;





