// @tradespro/calculation-engine/src/plugins/__tests__/loader.test.ts
// Tests for Plugin Loader

import { loadPlugin, validatePlugin, createPluginContext } from '../loader';
import type { CalculationPlugin, PluginContext } from '../types';

describe('Plugin Loader', () => {
  const createValidPlugin = (): CalculationPlugin => ({
    manifest: {
      id: 'test-loader-plugin',
      name: 'Test Loader Plugin',
      version: '1.0.0',
      description: 'Test plugin for loader',
      author: 'Test',
      license: 'MIT',
      domain: 'electrical',
      standards: ['CEC-2024'],
      buildingTypes: ['single-dwelling'],
      capabilities: {
        offline: true,
        audit: true,
        signing: true,
        preview: true,
      },
      entry: 'test.js',
      tables: [],
      tags: [],
    },
    calculate: async (inputs: any, context: PluginContext) => {
      return {
        bundle: {
          id: `test-${Date.now()}`,
          createdAt: new Date().toISOString(),
          domain: 'electrical' as const,
          calculationType: 'cec_load' as const,
          buildingType: 'single-dwelling' as const,
          engine: context.engine,
          ruleSets: [],
          inputs: inputs || {},
          steps: [],
          results: {
            computedLivingArea_m2: '0',
            basicVA: '0',
            appliancesSumVA: '0',
            continuousAdjustedVA: '0',
            itemA_total_W: '0',
            itemB_value_W: '0',
            chosenCalculatedLoad_W: '0',
            serviceCurrentA: '0',
            conductorSize: '',
            conductorAmpacity: '0',
            panelRatingA: '0',
            breakerSizeA: '0',
            demandVA: '0',
            demand_kVA: '0',
            sizingCurrentA: '0',
          },
          meta: {
            canonicalization_version: '1.0',
            numeric_format: 'decimal',
            calculation_standard: 'CEC-2024',
            tables_used: [],
            build_info: {
              commit: context.engine.commit || 'test',
              build_timestamp: new Date().toISOString(),
              environment: 'test',
            },
          },
          warnings: [],
        },
      };
    },
  });

  test('should load plugin from module with default export', async () => {
    const plugin = createValidPlugin();
    const pluginModule = { default: plugin };

    const loaded = await loadPlugin(pluginModule);
    expect(loaded).toBe(plugin);
    expect(loaded.manifest.id).toBe('test-loader-plugin');
  });

  test('should load plugin from module without default export', async () => {
    const plugin = createValidPlugin();
    const pluginModule = plugin;

    const loaded = await loadPlugin(pluginModule);
    expect(loaded).toBe(plugin);
  });

  test('should throw error for invalid plugin module', async () => {
    const invalidModule = { notAPlugin: true };

    await expect(loadPlugin(invalidModule)).rejects.toThrow(
      'Invalid plugin module: must export a CalculationPlugin'
    );
  });

  test('should validate valid plugin', () => {
    const plugin = createValidPlugin();
    expect(() => validatePlugin(plugin)).not.toThrow();
  });

  test('should throw error for plugin without manifest', () => {
    const invalidPlugin = {
      calculate: async () => ({ bundle: {} }),
    } as any;

    expect(() => validatePlugin(invalidPlugin)).toThrow('Plugin must have a manifest');
  });

  test('should throw error for plugin without id', () => {
    const invalidPlugin = {
      manifest: {
        version: '1.0.0',
        domain: 'electrical',
        standards: ['CEC-2024'],
        capabilities: {},
      },
      calculate: async () => ({ bundle: {} }),
    } as any;

    expect(() => validatePlugin(invalidPlugin)).toThrow('Plugin manifest must have an id');
  });

  test('should throw error for plugin without calculate method', () => {
    const invalidPlugin = {
      manifest: {
        id: 'test',
        version: '1.0.0',
        domain: 'electrical',
        standards: ['CEC-2024'],
        capabilities: {},
      },
    } as any;

    expect(() => validatePlugin(invalidPlugin)).toThrow('Plugin must implement calculate() method');
  });

  test('should create plugin context', () => {
    const engine = {
      name: 'test-engine',
      version: '1.0.0',
      commit: 'abc123',
    };
    const tables = {};
    const options = { mode: 'preview' as const, tier: 'free' as const };

    const context = createPluginContext(engine, tables, options);

    expect(context.engine).toBe(engine);
    expect(context.tables).toBe(tables);
    expect(context.options).toEqual(options);
    expect(context.logger).toBeDefined();
    expect(typeof context.logger.info).toBe('function');
    expect(typeof context.logger.warn).toBe('function');
    expect(typeof context.logger.error).toBe('function');
  });

  test('should set default tier to free if not provided', () => {
    const engine = {
      name: 'test-engine',
      version: '1.0.0',
      commit: 'abc123',
    };
    const tables = {};

    const context = createPluginContext(engine, tables);

    expect(context.options?.tier).toBe('free');
  });
});
