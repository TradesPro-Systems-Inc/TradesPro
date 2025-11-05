// @tradespro/calculation-engine/src/plugins/__tests__/registry.test.ts
// Tests for Plugin Registry

import { pluginRegistry } from '../registry';
import type { CalculationPlugin } from '../types';

describe('PluginRegistry', () => {
  // Create a mock plugin for testing
  const createMockPlugin = (id: string, version: string = '1.0.0'): CalculationPlugin => ({
    manifest: {
      id,
      name: `Test Plugin ${id}`,
      version,
      description: 'Test plugin',
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
    calculate: async (inputs: any, context: any) => {
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

  beforeEach(() => {
    // Clear registry before each test
    const plugins = pluginRegistry.list();
    plugins.forEach(p => {
      if (!p.manifest.id.includes('cec-single-dwelling') && !p.manifest.id.includes('nec-single-dwelling')) {
        pluginRegistry.unregister(p.manifest.id);
      }
    });
  });

  test('should register a plugin', () => {
    const plugin = createMockPlugin('test-plugin-1');
    pluginRegistry.register(plugin);

    expect(pluginRegistry.has('test-plugin-1')).toBe(true);
    expect(pluginRegistry.get('test-plugin-1')).toBe(plugin);
  });

  test('should get plugin by id', () => {
    const plugin = createMockPlugin('test-plugin-2');
    pluginRegistry.register(plugin);

    const retrieved = pluginRegistry.get('test-plugin-2');
    expect(retrieved).toBe(plugin);
    expect(retrieved?.manifest.id).toBe('test-plugin-2');
  });

  test('should return null for non-existent plugin', () => {
    const plugin = pluginRegistry.get('non-existent-plugin');
    expect(plugin).toBeNull();
  });

  test('should list all plugins', () => {
    const plugin1 = createMockPlugin('test-plugin-3');
    const plugin2 = createMockPlugin('test-plugin-4');
    pluginRegistry.register(plugin1);
    pluginRegistry.register(plugin2);

    const plugins = pluginRegistry.list();
    expect(plugins.length).toBeGreaterThanOrEqual(2);
    expect(plugins.some(p => p.manifest.id === 'test-plugin-3')).toBe(true);
    expect(plugins.some(p => p.manifest.id === 'test-plugin-4')).toBe(true);
  });

  test('should list plugins by domain', () => {
    const plugin = createMockPlugin('test-plugin-5');
    pluginRegistry.register(plugin);

    const electricalPlugins = pluginRegistry.listByDomain('electrical');
    expect(electricalPlugins.some(p => p.manifest.id === 'test-plugin-5')).toBe(true);
  });

  test('should list plugins by standard', () => {
    const plugin = createMockPlugin('test-plugin-6');
    pluginRegistry.register(plugin);

    const cecPlugins = pluginRegistry.listByStandard('CEC-2024');
    expect(cecPlugins.some(p => p.manifest.id === 'test-plugin-6')).toBe(true);
  });

  test('should unregister a plugin', () => {
    const plugin = createMockPlugin('test-plugin-7');
    pluginRegistry.register(plugin);
    expect(pluginRegistry.has('test-plugin-7')).toBe(true);

    const result = pluginRegistry.unregister('test-plugin-7');
    expect(result).toBe(true);
    expect(pluginRegistry.has('test-plugin-7')).toBe(false);
  });

  test('should check if plugin is loaded', () => {
    const plugin = createMockPlugin('test-plugin-8');
    pluginRegistry.register(plugin);

    expect(pluginRegistry.isLoaded('test-plugin-8')).toBe(true);
  });

  test('should get plugin count', () => {
    const initialCount = pluginRegistry.count();
    const plugin1 = createMockPlugin('test-plugin-9');
    const plugin2 = createMockPlugin('test-plugin-10');
    pluginRegistry.register(plugin1);
    pluginRegistry.register(plugin2);

    expect(pluginRegistry.count()).toBe(initialCount + 2);
  });
});
