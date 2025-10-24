import { ref, computed } from 'vue';

// ✅ V4.1 ARCHITECTURE: Frontend implements a complete, offline-first calculation engine.
// This logic is a mirror of the backend's `computeSingleDwelling` coordinator.
// In the future, this will be replaced by a single call to a shared `@tradespro/core-engine` package.

import { computeSingleDwelling } from '../../../services/calculation-service/dist/rules/8-200-single-dwelling';
import { tableManager } from '../../../services/calculation-service/dist/core/tables'; // Temporary direct import
import type { CecInputsSingle, UnsignedBundle, EngineMeta } from '../../../services/calculation-service/dist/core/types';

export function useOfflineCalculation() {
  const bundle = ref<UnsignedBundle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const results = computed(() => bundle.value?.results ?? null);
  const calculationTimeMs = ref(0);
  const hasResults = computed(() => !!bundle.value);
  const steps = computed(() => bundle.value?.steps || []);
  
  function downloadJSON() {
    if (!bundle.value) return;
    const dataStr = JSON.stringify(bundle.value, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `calculation-${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
  
  function reset() {
    bundle.value = null;
    error.value = null;
    calculationTimeMs.value = 0;
  }

  async function calculateLocally(inputs: CecInputsSingle): Promise<boolean> {
    loading.value = true;
    error.value = null;
    calculationTimeMs.value = 0;
    const startTime = Date.now();
    
    try {
      // ✅ CORRECT V4.1 OFFLINE-FIRST ARCHITECTURE:
      // 1. Define frontend engine metadata
      const engineMeta: EngineMeta = {
        name: 'tradespro-offline-engine',
        version: '1.0.0',
        commit: 'local-dev', // In a real build, this would be a git hash
      };

      // 2. Load tables locally (this is async)
      // In a real PWA/Capacitor app, tables would be pre-packaged or from IndexedDB.
      const ruleTables = await tableManager.loadTables('cec', inputs.codeEdition || '2024');

      // 3. Execute the complete calculation logic locally
      const resultBundle = computeSingleDwelling(inputs, engineMeta, ruleTables);

      bundle.value = resultBundle;
      calculationTimeMs.value = Date.now() - startTime;
      return true;
      
    } catch (e: any) {
      error.value = e.message || 'An unknown error occurred during offline calculation.';
      console.error("Offline calculation failed:", e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return { 
    bundle, 
    results, 
    loading, 
    error, 
    calculateLocally,
    calculationTimeMs,
    hasResults,
    steps,
    downloadJSON,
    reset
  };
}