// @tradespro/calculation-engine/src/plugins/__tests__/builtin-plugins.test.ts
// Tests for Built-in Plugins

import { pluginRegistry, createPluginContext } from '../index';

describe('Built-in Plugins', () => {
  const createTestContext = () => {
    return createPluginContext(
      {
        name: 'test-engine',
        version: '1.0.0',
        commit: 'test-commit-123',
      },
      {}, // Empty tables for now
      { mode: 'preview' }
    );
  };

  test('CEC single dwelling plugin should be registered', () => {
    const plugin = pluginRegistry.get('cec-single-dwelling-2024');
    expect(plugin).toBeTruthy();
    expect(plugin?.manifest.id).toBe('cec-single-dwelling-2024');
    expect(plugin?.manifest.name).toContain('CEC');
    expect(plugin?.manifest.domain).toBe('electrical');
  });

  test('NEC single dwelling plugin should be registered', () => {
    const plugin = pluginRegistry.get('nec-single-dwelling-2023');
    expect(plugin).toBeTruthy();
    expect(plugin?.manifest.id).toBe('nec-single-dwelling-2023');
    expect(plugin?.manifest.name).toContain('NEC');
    expect(plugin?.manifest.domain).toBe('electrical');
  });

  test('CEC plugin should validate inputs correctly', () => {
    const plugin = pluginRegistry.get('cec-single-dwelling-2024');
    expect(plugin).toBeTruthy();

    if (plugin?.validateInputs) {
      // Valid inputs
      const validInputs = {
        systemVoltage: 240,
        livingArea_m2: 150,
        phase: 1,
      };
      const validResult = plugin.validateInputs(validInputs);
      expect(validResult.valid).toBe(true);

      // Invalid inputs
      const invalidInputs = {
        systemVoltage: -100, // Negative voltage is invalid
      };
      const invalidResult = plugin.validateInputs(invalidInputs);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors!.length).toBeGreaterThan(0);
    }
  });

  test('CEC plugin should get required tables', () => {
    const plugin = pluginRegistry.get('cec-single-dwelling-2024');
    expect(plugin).toBeTruthy();

    if (plugin?.getRequiredTables) {
      const tables = plugin.getRequiredTables();
      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);
    }
  });

  test('should list plugins by domain', () => {
    const electricalPlugins = pluginRegistry.listByDomain('electrical');
    expect(electricalPlugins.length).toBeGreaterThanOrEqual(2); // At least CEC and NEC

    const pluginIds = electricalPlugins.map(p => p.manifest.id);
    expect(pluginIds).toContain('cec-single-dwelling-2024');
    expect(pluginIds).toContain('nec-single-dwelling-2023');
  });

  test('should list plugins by standard', () => {
    const cecPlugins = pluginRegistry.listByStandard('CEC');
    expect(cecPlugins.length).toBeGreaterThanOrEqual(1);

    const necPlugins = pluginRegistry.listByStandard('NEC');
    expect(necPlugins.length).toBeGreaterThanOrEqual(1);
  });

  test('should list plugins by building type', () => {
    const singleDwellingPlugins = pluginRegistry.listByBuildingType('single-dwelling');
    expect(singleDwellingPlugins.length).toBeGreaterThanOrEqual(2);

    const pluginIds = singleDwellingPlugins.map(p => p.manifest.id);
    expect(pluginIds).toContain('cec-single-dwelling-2024');
    expect(pluginIds).toContain('nec-single-dwelling-2023');
  });
});
