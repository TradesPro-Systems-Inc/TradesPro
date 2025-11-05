// @tradespro/calculation-engine/src/plugins/__tests__/integration.test.ts
// Integration tests demonstrating real-world plugin system usage

import { pluginRegistry, executePlugin, createPluginContext } from '../index';
import type { CecInputsSingle } from '../../core/types';

describe('Plugin System Integration', () => {
  // Create a realistic test context
  const createTestContext = () => {
    return createPluginContext(
      {
        name: 'tradespro-engine',
        version: '1.0.0',
        commit: 'test-commit-abc123',
      },
      {}, // Empty tables for now - in real usage, load actual rule tables
      {
        mode: 'preview',
        tier: 'free',
      }
    );
  };

  test('should execute CEC single dwelling calculation through plugin', async () => {
    const plugin = pluginRegistry.get('cec-single-dwelling-2024');
    expect(plugin).toBeTruthy();

    const inputs: CecInputsSingle = {
      systemVoltage: 240,
      phase: 1,
      livingArea_m2: 150,
      hasElectricRange: true,
      electricRangeRatingKW: 8,
    };

    const context = createTestContext();
    const result = await executePlugin('cec-single-dwelling-2024', inputs, context);

    expect(result).toBeTruthy();
    expect(result.bundle).toBeTruthy();
    expect(result.bundle.domain).toBe('electrical');
    expect(result.bundle.calculationType).toBe('cec_load');
    expect(result.bundle.buildingType).toBe('single-dwelling');
    expect(result.bundle.results).toBeTruthy();
    expect(result.bundle.steps).toBeTruthy();
    expect(Array.isArray(result.bundle.steps)).toBe(true);
  });

  test('should execute NEC single dwelling calculation through plugin', async () => {
    const plugin = pluginRegistry.get('nec-single-dwelling-2023');
    expect(plugin).toBeTruthy();

    const inputs: CecInputsSingle = {
      systemVoltage: 240,
      phase: 1,
      livingArea_m2: 2000, // 2000 sq ft (converted from ~186 m²)
      hasElectricRange: true,
      electricRangeRatingKW: 12,
    };

    const context = createTestContext();
    const result = await executePlugin('nec-single-dwelling-2023', inputs, context);

    expect(result).toBeTruthy();
    expect(result.bundle).toBeTruthy();
    expect(result.bundle.domain).toBe('electrical');
    expect(result.bundle.calculationType).toBe('nec_load');
    expect(result.bundle.buildingType).toBe('single-dwelling');
    expect(result.bundle.results).toBeTruthy();
  });

  test('should validate inputs before execution', async () => {
    const plugin = pluginRegistry.get('cec-single-dwelling-2024');
    expect(plugin).toBeTruthy();

    if (plugin?.validateInputs) {
      // Test with invalid inputs
      const invalidInputs = {
        systemVoltage: -100, // Invalid negative voltage
      };

      const validation = plugin.validateInputs(invalidInputs);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeTruthy();
      expect(validation.errors!.length).toBeGreaterThan(0);

      // Test with valid inputs
      const validInputs: CecInputsSingle = {
        systemVoltage: 240,
        phase: 1,
        livingArea_m2: 150,
      };

      const validValidation = plugin.validateInputs(validInputs);
      expect(validValidation.valid).toBe(true);
    }
  });

  test('should list available plugins by domain', () => {
    const electricalPlugins = pluginRegistry.listByDomain('electrical');
    expect(electricalPlugins.length).toBeGreaterThanOrEqual(2);

    const pluginIds = electricalPlugins.map(p => p.manifest.id);
    expect(pluginIds).toContain('cec-single-dwelling-2024');
    expect(pluginIds).toContain('nec-single-dwelling-2023');
  });

  test('should list available plugins by standard', () => {
    const cecPlugins = pluginRegistry.listByStandard('CEC');
    expect(cecPlugins.length).toBeGreaterThanOrEqual(1);

    const necPlugins = pluginRegistry.listByStandard('NEC');
    expect(necPlugins.length).toBeGreaterThanOrEqual(1);
  });

  test('should list available plugins by building type', () => {
    const singleDwellingPlugins = pluginRegistry.listByBuildingType('single-dwelling');
    expect(singleDwellingPlugins.length).toBeGreaterThanOrEqual(2);

    const pluginIds = singleDwellingPlugins.map(p => p.manifest.id);
    expect(pluginIds).toContain('cec-single-dwelling-2024');
    expect(pluginIds).toContain('nec-single-dwelling-2023');
  });

  test('should provide plugin metadata', () => {
    const plugin = pluginRegistry.get('cec-single-dwelling-2024');
    expect(plugin).toBeTruthy();

    if (plugin) {
      expect(plugin.manifest.id).toBe('cec-single-dwelling-2024');
      expect(plugin.manifest.name).toContain('CEC');
      expect(plugin.manifest.version).toBeTruthy();
      expect(plugin.manifest.domain).toBe('electrical');
      expect(plugin.manifest.standards).toContain('CEC-2024');
      expect(plugin.manifest.buildingTypes).toContain('single-dwelling');
      expect(plugin.manifest.capabilities.offline).toBe(true);
      expect(plugin.manifest.capabilities.audit).toBe(true);
    }
  });

  test('should handle plugin execution errors gracefully', async () => {
    const invalidInputs: any = {
      systemVoltage: 0, // Invalid: zero voltage
    };

    const context = createTestContext();

    await expect(
      executePlugin('cec-single-dwelling-2024', invalidInputs, context)
    ).rejects.toThrow();
  });
});





