// TradesPro - Store Entry Point
// Exports all stores for easy importing

// Named exports for components to use
export { useUserStore } from './user';
export { useProjectsStore } from './projects';
export { useCalculationsStore } from './calculations';
export { useSettingsStore } from './settings';
export { useUIStore } from './ui';

// Export types
export * from './types';

// Re-export pinia for convenience
export { storeToRefs } from 'pinia';

// NO default export - Quasar will use the boot file (src/boot/pinia.ts) instead

