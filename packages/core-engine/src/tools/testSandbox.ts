// @tradespro/core-engine/src/tools/testSandbox.ts
// Sandbox Test Tool - Test plugin execution in sandbox
// Usage: node testSandbox.js <plugin-path> [options]

import path from 'path';
import fs from 'fs';
import { runPluginInSandbox, computeFileSha256 } from '../plugins/sandboxRunner';
import { createPluginContext } from '../plugins/loader';
import type { SandboxOptions } from '../plugins/sandboxRunner';

/**
 * Test plugin execution in sandbox
 */
export async function testSandbox(
  pluginPath: string,
  testInputs: any,
  options: SandboxOptions = {}
): Promise<{
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs?: number;
  fileChecksum?: string;
}> {
  // Resolve to absolute path
  const absolutePath = path.isAbsolute(pluginPath) 
    ? pluginPath 
    : path.resolve(process.cwd(), pluginPath);
  
  // Check if plugin file exists
  if (!fs.existsSync(absolutePath)) {
    return {
      success: false,
      error: `Plugin file not found: ${absolutePath}`,
    };
  }

  // Compute file checksum
  const fileChecksum = computeFileSha256(absolutePath);

  // Create test context
  const engineMeta = {
    name: 'tradespro-test-engine',
    version: '1.0.0',
    commit: 'test',
  };

  const context = createPluginContext(engineMeta, {}, {
    mode: 'preview',
    tier: 'free',
  });

  // Run in sandbox
  const startTime = Date.now();
  const sandboxResult = await runPluginInSandbox(
    absolutePath,
    testInputs,
    context,
    {
      mode: 'vm2',
      timeoutMs: 10000,
      memoryLimitMb: 128,
      allowRequire: false,
      ...options,
    }
  );

  if (!sandboxResult.ok) {
    return {
      success: false,
      error: sandboxResult.error || 'Unknown error',
      executionTimeMs: sandboxResult.executionTimeMs,
      fileChecksum,
    };
  }

  return {
    success: true,
    result: sandboxResult.result,
    executionTimeMs: sandboxResult.executionTimeMs,
    fileChecksum,
  };
}

/**
 * CLI entry point
 */
export async function runSandboxTest(args: string[]): Promise<void> {
  const pluginPath = args[0];
  if (!pluginPath) {
    console.error('Usage: testSandbox <plugin-path> [--inputs <json-file>] [--mode vm2|native]');
    process.exit(1);
  }

  const options: SandboxOptions = {};
  let inputsFile: string | undefined;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--inputs' && args[i + 1]) {
      inputsFile = args[i + 1];
      i++;
    } else if (args[i] === '--mode' && args[i + 1]) {
      options.mode = args[i + 1] as 'vm2' | 'native';
      i++;
    } else if (args[i] === '--timeout' && args[i + 1]) {
      options.timeoutMs = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--memory' && args[i + 1]) {
      options.memoryLimitMb = parseInt(args[i + 1], 10);
      i++;
    }
  }

  // Load test inputs
  let testInputs: any = {
    livingArea_m2: 200,
    systemVoltage: 240,
    phase: 1,
    conductorMaterial: 'Cu',
  };

  if (inputsFile && fs.existsSync(inputsFile)) {
    testInputs = JSON.parse(fs.readFileSync(inputsFile, 'utf8'));
  }

  try {
    console.log(`🧪 Testing sandbox execution: ${pluginPath}`);
    console.log(`   Mode: ${options.mode || 'vm2'}`);
    console.log(`   Inputs:`, JSON.stringify(testInputs, null, 2));

    const result = await testSandbox(pluginPath, testInputs, options);

    if (result.success) {
      console.log(`✅ Sandbox test PASSED`);
      console.log(`   Execution time: ${result.executionTimeMs}ms`);
      console.log(`   File checksum: ${result.fileChecksum}`);
      console.log(`   Result:`, JSON.stringify(result.result, null, 2));
    } else {
      console.error(`❌ Sandbox test FAILED`);
      console.error(`   Error: ${result.error}`);
      if (result.executionTimeMs) {
        console.error(`   Execution time: ${result.executionTimeMs}ms`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// CLI entry point if run directly
if (require.main === module) {
  runSandboxTest(process.argv.slice(2)).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

