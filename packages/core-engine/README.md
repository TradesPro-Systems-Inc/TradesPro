# @tradespro/core-engine

TradesPro Core Calculation Engine - Plugin System and Shared Interfaces

## V5 Architecture

This package provides the **"operating system"** for all calculation plugins. It contains:
- Plugin interfaces and types
- Plugin registry and loader
- Table lookup functions (pure functions, no I/O)
- Shared types and utilities

**It does NOT contain any specific calculation logic** (e.g., CEC 8-200 calculations).

## Installation

```bash
npm install @tradespro/core-engine
```

## Usage

### Using Plugin System

```typescript
import { 
  executePlugin, 
  createPluginContext,
  pluginRegistry 
} from '@tradespro/core-engine';
import { cecSingleDwellingPlugin } from '@tradespro/plugin-cec-8-200';

// Register plugin
pluginRegistry.registerDefault(cecSingleDwellingPlugin);

// Create context
const context = createPluginContext(engineMeta, tables, {
  mode: 'official',
  tier: 'premium'
});

// Execute calculation
const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
const bundle = result.bundle;
```

### Using Table Lookups

```typescript
import { lookupConductorSize } from '@tradespro/core-engine/tableLookups';

const conductor = lookupConductorSize(
  requiredAmps,
  'Cu',
  75,
  ruleTables,
  ambientTempC,
  numConductors
);
```

## Package Structure

```
src/
├── types.ts              # Core type definitions
├── tableLookups.ts      # Pure table lookup functions
├── plugins/
│   ├── types.ts         # Plugin interface definitions
│   ├── registry.ts      # Plugin registry
│   ├── loader.ts        # Plugin loader and executor
│   ├── signatureVerifier.ts  # Signature verification (Node.js only)
│   └── sandboxRunner.ts # Sandbox execution (Node.js only)
└── index.ts             # Main entry point
```

## Browser Compatibility

- ✅ Plugin registry and types work in browser
- ✅ `executePlugin` and `createPluginContext` work in browser
- ❌ `signatureVerifier` and `sandboxRunner` are Node.js only

## License

MIT






