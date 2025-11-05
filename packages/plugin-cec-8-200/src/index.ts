// @tradespro/plugin-cec-8-200/src/index.ts
// V5 Plugin Package - Main Entry Point
// This file exports both the calculation function and the plugin interface

// Export the calculation coordinator (for direct use if needed)
export { computeSingleDwelling } from './coordinator';

// Export the plugin (for plugin system)
export { cecSingleDwellingPlugin, default } from './plugin';
