# @tradespro/plugin-cec-8-200

TradesPro CEC 8-200 Single Dwelling Load Calculation Plugin

## V5 Architecture

This is a **calculation plugin** that implements CEC 8-200 single dwelling load calculations. It:
- Implements the `CalculationPlugin` interface from `@tradespro/core-engine`
- Contains all CEC 8-200 calculation logic
- Includes required table data (SSoT)

## Installation

```bash
npm install @tradespro/plugin-cec-8-200
```

## Usage

### As Plugin

```typescript
import { pluginRegistry, executePlugin, createPluginContext } from '@tradespro/core-engine';
import { cecSingleDwellingPlugin } from '@tradespro/plugin-cec-8-200';

// Register plugin
pluginRegistry.registerDefault(cecSingleDwellingPlugin);

// Use plugin
const context = createPluginContext(engineMeta, tables);
const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
```

### Direct Function Call (Legacy)

```typescript
import { computeSingleDwelling } from '@tradespro/plugin-cec-8-200';

const bundle = computeSingleDwelling(inputs, engineMeta, tables);
```

## Package Structure

```
src/
├── coordinator.ts       # Main calculation coordinator (8-200 logic)
├── plugin.ts            # Plugin wrapper
├── index.ts             # Main entry point
└── engine/              # Pure calculation functions
    ├── baseLoadCalculator.ts
    ├── heatingCoolingCalculator.ts
    ├── applianceLoadCalculator.ts
    └── ...
data/
└── tables/
    └── 2024/            # Table data (SSoT)
        ├── table2.json
        ├── table4.json
        ├── table5A.json
        └── table5C.json
```

## Plugin ID

`cec-single-dwelling-2024`

## Supported Standards

- CEC 2024
- Section 8-200

## License

MIT


