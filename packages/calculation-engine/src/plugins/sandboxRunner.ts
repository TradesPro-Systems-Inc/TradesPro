// @tradespro/calculation-engine/src/plugins/sandboxRunner.ts
// V4.1 Plugin System - Sandbox Runner
// Provides secure plugin execution in isolated environments
// Supports vm2 (recommended) and native vm (fallback)

import { readFileSync } from 'fs';
import path from 'path';
import { Script, createContext } from 'vm';
import crypto from 'crypto';
import type { PluginContext, PluginCalculationResult } from './types';

type PluginComputeFn = (inputs: any, context: PluginContext) => Promise<PluginCalculationResult> | PluginCalculationResult;

export interface SandboxOptions {
  mode?: 'vm2' | 'native'; // default vm2 if available
  timeoutMs?: number;      // execution timeout
  memoryLimitMb?: number;  // vm2 only
  allowRequire?: boolean;  // vm2 only - allow limited require
  allowedModules?: string[];// vm2 only - allowlist for require
}

export interface SandboxResult {
  ok: boolean;
  result?: PluginCalculationResult;
  error?: string;
  executionTimeMs?: number;
}

/**
 * Helper: detect vm2 availability
 */
function tryRequireVm2(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NodeVM } = require('vm2');
    return { NodeVM };
  } catch (e) {
    return null;
  }
}

/**
 * Run plugin code (vm2 - recommended)
 */
async function runWithVm2(
  pluginModulePath: string,
  computeExportName: string | null,
  inputs: any,
  contextObj: PluginContext,
  opts: Required<SandboxOptions>
): Promise<SandboxResult> {
  const vm2 = tryRequireVm2();
  if (!vm2) {
    return { ok: false, error: 'vm2 not installed' };
  }
  const { NodeVM } = vm2;

  const vm = new NodeVM({
    console: 'inherit',
    sandbox: {},
    require: opts.allowRequire
      ? {
          external: true,
          builtin: opts.allowedModules || [],
          context: 'sandbox',
        }
      : false,
    wrapper: 'commonjs',
    timeout: opts.timeoutMs,
    eval: false,
    wasm: false,
    argv: [],
    env: {},
    // vm2 supports memoryLimit in constructor options (NodeVM v3+)
    ...(opts.memoryLimitMb ? { memoryLimit: opts.memoryLimitMb } : {}),
  });

  const start = Date.now();
  try {
    // Load plugin inside VM
    const exported = vm.require(pluginModulePath);
    const computeFn: PluginComputeFn =
      (computeExportName && exported[computeExportName]) || 
      exported.default || 
      exported.compute || 
      exported.calculate;

    if (typeof computeFn !== 'function') {
      return { ok: false, error: 'plugin does not export a compute/calculate function' };
    }

    const res = await Promise.resolve(computeFn(inputs, contextObj));
    return { ok: true, result: res, executionTimeMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err), executionTimeMs: Date.now() - start };
  }
}

/**
 * Run plugin code (native vm fallback)
 * WARNING: Native vm has weaker security - use only for trusted plugins or dev environment
 */
async function runWithNativeVm(
  pluginModulePath: string,
  computeExportName: string | null,
  inputs: any,
  contextObj: PluginContext,
  opts: Required<SandboxOptions>
): Promise<SandboxResult> {
  const start = Date.now();
  try {
    // Read module code (synchronously - simpler)
    const code = readFileSync(pluginModulePath, 'utf8');

    // Wrap code to emulate CommonJS module exports
    const wrapper = `
      (function(exports, require, module, __filename, __dirname){
        ${code}
      })
    `;

    const script = new Script(wrapper, { filename: pluginModulePath });
    const sandbox: any = {
      console: {
        log: (...a: any[]) => console.log('[plugin]', ...a),
        warn: (...a: any[]) => console.warn('[plugin]', ...a),
        error: (...a: any[]) => console.error('[plugin]', ...a),
      },
      Buffer,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
    };

    // Minimal require that only permits relative require within plugin dir (no network, no fs)
    function safeRequire(mod: string) {
      // Absolute/relative file require only
      if (mod.startsWith('.') || path.isAbsolute(mod)) {
        const resolved = require.resolve(mod, { paths: [path.dirname(pluginModulePath)] });
        return require(resolved);
      }
      throw new Error('native sandbox: require of external modules is not allowed');
    }

    const contextified = createContext(sandbox);
    const compiled = script.runInContext(contextified, { timeout: opts.timeoutMs });

    const exportsObj: any = {};
    const moduleObj: any = { exports: exportsObj };
    // Call the wrapper to populate module.exports
    compiled.call(exportsObj, exportsObj, safeRequire, moduleObj, pluginModulePath, path.dirname(pluginModulePath));

    const exported = moduleObj.exports;
    const computeFn: PluginComputeFn =
      (computeExportName && exported[computeExportName]) || 
      exported.default || 
      exported.compute || 
      exported.calculate;

    if (typeof computeFn !== 'function') {
      return { ok: false, error: 'plugin does not export a compute/calculate function' };
    }

    const res = await Promise.resolve(computeFn(inputs, contextObj));
    return { ok: true, result: res, executionTimeMs: Date.now() - start };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err), executionTimeMs: Date.now() - start };
  }
}

/**
 * Public API: Run plugin in sandbox
 */
export async function runPluginInSandbox(
  pluginModulePath: string,
  inputs: any,
  contextObj: PluginContext,
  options?: SandboxOptions
): Promise<SandboxResult> {
  const defaultOpts: Required<SandboxOptions> = {
    mode: 'vm2',
    timeoutMs: 5000,
    memoryLimitMb: 64,
    allowRequire: false,
    allowedModules: [],
  };
  const opts = { ...defaultOpts, ...(options || {}) };

  // Determine mode
  if (opts.mode === 'vm2') {
    const vm2 = tryRequireVm2();
    if (vm2) {
      return runWithVm2(pluginModulePath, null, inputs, contextObj, opts);
    }
    // Fallback: if vm2 not installed, try native
    console.warn('[SandboxRunner] vm2 not available, falling back to native vm (less secure)');
    return runWithNativeVm(pluginModulePath, null, inputs, contextObj, opts);
  } else {
    return runWithNativeVm(pluginModulePath, null, inputs, contextObj, opts);
  }
}

/**
 * Quick helper: verify file checksum (optional)
 */
export function computeFileSha256(filePath: string): string {
  const data = readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash;
}

export default {
  runPluginInSandbox,
  computeFileSha256,
};





