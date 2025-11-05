// @tradespro/core-engine/src/plugins/healthCheck.ts
// Plugin Health Check - Self-test and health monitoring for plugins

import type { CalculationPlugin, PluginContext, PluginCalculationResult } from './types';
import { pluginRegistry } from './registry';
import { createPluginContext } from './loader';
import { runPluginInSandbox, SandboxOptions } from './sandboxRunner';

export interface HealthCheckResult {
  healthy: boolean;
  pluginId: string;
  version: string;
  timestamp: string;
  checks: {
    structure: CheckResult;
    validation: CheckResult;
    calculation: CheckResult;
    sandbox?: CheckResult;
  };
  errors: string[];
  warnings: string[];
}

export interface CheckResult {
  passed: boolean;
  message?: string;
  duration?: number;
  error?: string;
}

export interface HealthCheckOptions {
  includeSandbox?: boolean;
  sandboxOptions?: SandboxOptions;
  testInputs?: any;
  timeout?: number;
}

/**
 * Perform health check on a plugin
 */
export async function checkPluginHealth(
  pluginId: string,
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    return {
      healthy: false,
      pluginId,
      version: 'unknown',
      timestamp: new Date().toISOString(),
      checks: {
        structure: { passed: false, error: 'Plugin not found' },
        validation: { passed: false },
        calculation: { passed: false },
      },
      errors: [`Plugin ${pluginId} not found in registry`],
      warnings: [],
    };
  }

  const result: HealthCheckResult = {
    healthy: true,
    pluginId: plugin.manifest.id,
    version: plugin.manifest.version,
    timestamp: new Date().toISOString(),
    checks: {
      structure: { passed: false },
      validation: { passed: false },
      calculation: { passed: false },
    },
    errors: [],
    warnings: [],
  };

  // Check 1: Plugin Structure
  const structureCheck = checkPluginStructure(plugin);
  result.checks.structure = structureCheck;
  if (!structureCheck.passed) {
    result.healthy = false;
    result.errors.push(`Structure check failed: ${structureCheck.error || structureCheck.message}`);
  }

  // Check 2: Input Validation
  if (structureCheck.passed && plugin.validateInputs) {
    const validationCheck = await checkPluginValidation(plugin, options.testInputs);
    result.checks.validation = validationCheck;
    if (!validationCheck.passed) {
      result.healthy = false;
      result.errors.push(`Validation check failed: ${validationCheck.error || validationCheck.message}`);
    }
  } else {
    result.checks.validation = { passed: true, message: 'Validation function not available' };
    result.warnings.push('Plugin does not implement validateInputs');
  }

  // Check 3: Calculation Execution
  if (structureCheck.passed) {
    const calculationCheck = await checkPluginCalculation(plugin, options.testInputs, options.timeout);
    result.checks.calculation = calculationCheck;
    if (!calculationCheck.passed) {
      result.healthy = false;
      result.errors.push(`Calculation check failed: ${calculationCheck.error || calculationCheck.message}`);
    }
  }

  // Check 4: Sandbox Execution (optional)
  if (options.includeSandbox && structureCheck.passed) {
    const sandboxCheck = await checkPluginSandbox(plugin, options.testInputs, options.sandboxOptions);
    result.checks.sandbox = sandboxCheck;
    if (!sandboxCheck.passed) {
      result.warnings.push(`Sandbox check failed: ${sandboxCheck.error || sandboxCheck.message}`);
      // Sandbox failure is a warning, not an error
    }
  }

  return result;
}

/**
 * Check plugin structure
 */
function checkPluginStructure(plugin: CalculationPlugin): CheckResult {
  const start = Date.now();
  try {
    // Check manifest
    if (!plugin.manifest) {
      return { passed: false, error: 'Missing manifest', duration: Date.now() - start };
    }

    if (!plugin.manifest.id) {
      return { passed: false, error: 'Missing manifest.id', duration: Date.now() - start };
    }

    if (!plugin.manifest.version) {
      return { passed: false, error: 'Missing manifest.version', duration: Date.now() - start };
    }

    // Check calculate function
    if (typeof plugin.calculate !== 'function') {
      return { passed: false, error: 'Missing calculate function', duration: Date.now() - start };
    }

    // Check required tables
    if (plugin.getRequiredTables) {
      const tables = plugin.getRequiredTables();
      if (!Array.isArray(tables)) {
        return { passed: false, error: 'getRequiredTables must return an array', duration: Date.now() - start };
      }
    }

    return { 
      passed: true, 
      message: 'Plugin structure is valid',
      duration: Date.now() - start 
    };
  } catch (error) {
    return { 
      passed: false, 
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start 
    };
  }
}

/**
 * Check plugin input validation
 */
async function checkPluginValidation(
  plugin: CalculationPlugin,
  testInputs?: any
): Promise<CheckResult> {
  const start = Date.now();
  try {
    if (!plugin.validateInputs) {
      return { passed: true, message: 'Validation function not available', duration: Date.now() - start };
    }

    // Test with valid inputs
    const validInputs = testInputs || {
      systemVoltage: 240,
      phase: 1,
      conductorMaterial: 'Cu',
      livingArea_m2: 100,
    };

    const validation = plugin.validateInputs(validInputs);
    if (!validation.valid) {
      return { 
        passed: false, 
        error: `Validation failed for valid inputs: ${validation.errors?.join(', ')}`,
        duration: Date.now() - start 
      };
    }

    // Test with invalid inputs
    const invalidInputs = { invalid: 'data' };
    const invalidValidation = plugin.validateInputs(invalidInputs);
    if (invalidValidation.valid) {
      return { 
        passed: false, 
        error: 'Validation should reject invalid inputs',
        duration: Date.now() - start 
      };
    }

    return { 
      passed: true, 
      message: 'Input validation working correctly',
      duration: Date.now() - start 
    };
  } catch (error) {
    return { 
      passed: false, 
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start 
    };
  }
}

/**
 * Check plugin calculation execution
 */
async function checkPluginCalculation(
  plugin: CalculationPlugin,
  testInputs?: any,
  timeout?: number
): Promise<CheckResult> {
  const start = Date.now();
  try {
    const inputs = testInputs || {
      systemVoltage: 240,
      phase: 1,
      conductorMaterial: 'Cu',
      livingArea_m2: 100,
    };

    // Create test context
    const engineMeta = {
      name: 'tradespro-health-check',
      version: '1.0.0',
      commit: 'health-check',
    };

    const context = createPluginContext(engineMeta, {}, {
      mode: 'preview',
      tier: 'free',
    });

    // Execute calculation with timeout
    const calculationPromise = plugin.calculate(inputs, context);
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Calculation timeout after ${timeout || 5000}ms`));
      }, timeout || 5000);
    });

    try {
      const result = await Promise.race([calculationPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);

      // Validate result structure
      if (!result || typeof result !== 'object') {
        return { 
          passed: false, 
          error: 'Calculation result is not an object',
          duration: Date.now() - start 
        };
      }

      // Check bundle structure
      if (!result.bundle) {
        return { 
          passed: false, 
          error: `Calculation failed: ${result.errors?.join(', ') || 'No bundle returned'}`,
          duration: Date.now() - start 
        };
      }

      // Validate bundle has required fields
      if (!result.bundle.id || !result.bundle.results) {
        return { 
          passed: false, 
          error: 'Bundle missing required fields (id, results)',
          duration: Date.now() - start 
        };
      }

      return { 
        passed: true, 
        message: 'Calculation executed successfully',
        duration: Date.now() - start 
      };
    } catch (calcError) {
      if (timeoutId) clearTimeout(timeoutId);
      throw calcError;
    }
  } catch (error) {
    return { 
      passed: false, 
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start 
    };
  }
}

/**
 * Check plugin execution in sandbox
 */
async function checkPluginSandbox(
  plugin: CalculationPlugin,
  testInputs?: any,
  sandboxOptions?: SandboxOptions
): Promise<CheckResult> {
  const start = Date.now();
  try {
    // This requires the plugin to be loaded from a file path
    // For now, we'll skip this check if plugin path is not available
    // In a real implementation, you might store the plugin path in the registry
    return { 
      passed: true, 
      message: 'Sandbox check skipped (plugin path not available)',
      duration: Date.now() - start 
    };
  } catch (error) {
    return { 
      passed: false, 
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start 
    };
  }
}

/**
 * Perform self-test on plugin (plugin's own test function)
 */
export async function runPluginSelfTest(
  pluginId: string,
  testInputs?: any
): Promise<{
  success: boolean;
  result?: PluginCalculationResult;
  error?: string;
  duration: number;
}> {
  const plugin = pluginRegistry.get(pluginId);
  if (!plugin) {
    return {
      success: false,
      error: `Plugin ${pluginId} not found`,
      duration: 0,
    };
  }

  const start = Date.now();
  try {
    const inputs = testInputs || {
      systemVoltage: 240,
      phase: 1,
      conductorMaterial: 'Cu',
      livingArea_m2: 100,
    };

    const engineMeta = {
      name: 'tradespro-self-test',
      version: '1.0.0',
      commit: 'self-test',
    };

    const context = createPluginContext(engineMeta, {}, {
      mode: 'preview',
      tier: 'free',
    });

    const result = await plugin.calculate(inputs, context);

    return {
      success: !!result.bundle,
      result: result.bundle ? result : undefined,
      error: result.errors?.join(', '),
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

/**
 * Check health of all registered plugins
 */
export async function checkAllPluginsHealth(
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult[]> {
  const plugins = pluginRegistry.list();
  const results: HealthCheckResult[] = [];

  for (const plugin of plugins) {
    const health = await checkPluginHealth(plugin.manifest.id, options);
    results.push(health);
  }

  return results;
}

/**
 * Get health summary
 */
export function getHealthSummary(results: HealthCheckResult[]): {
  total: number;
  healthy: number;
  unhealthy: number;
  warnings: number;
  errors: number;
} {
  return {
    total: results.length,
    healthy: results.filter(r => r.healthy).length,
    unhealthy: results.filter(r => !r.healthy).length,
    warnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    errors: results.reduce((sum, r) => sum + r.errors.length, 0),
  };
}

