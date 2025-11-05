import { ref, computed } from 'vue';

// ✅ V5 ARCHITECTURE: Frontend uses plugin system for offline-first calculation
// This uses the same plugin system as the backend, ensuring consistency

import { 
  executePlugin, 
  createPluginContext,
  pluginRegistry 
} from '@tradespro/core-engine';
import { cecSingleDwellingPlugin } from '@tradespro/plugin-cec-8-200';
// Use browser version of tableManager for frontend
import { tableManagerBrowser as tableManager } from '@tradespro/calculation-engine';
import type { CecInputsSingle, UnsignedBundle, EngineMeta, CodeType } from '@tradespro/core-engine';
import { usePermissions } from './usePermissions';
import { filterBundleByTier } from '../utils/permissionFilter';

export function useOfflineCalculation() {
  const { userTier } = usePermissions();
  const bundle = ref<UnsignedBundle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isPreview = ref(true); // V4.1: Frontend calculations are preview only

  // 根据用户权限过滤bundle
  const filteredBundle = computed(() => {
    return filterBundleByTier(bundle.value, userTier.value);
  });

  const results = computed(() => filteredBundle.value?.results ?? null);
  const calculationTimeMs = ref(0);
  const hasResults = computed(() => !!filteredBundle.value);
  const steps = computed(() => filteredBundle.value?.steps || []);
  
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

  async function calculateLocally(
    inputs: CecInputsSingle, 
    codeType: CodeType = 'cec',
    necMethod: 'standard' | 'optional' = 'standard'
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;
    calculationTimeMs.value = 0;
    const startTime = Date.now();
    
    try {
      // ⚠️ V4.1 ARCHITECTURE: PREVIEW MODE
      // Frontend calculations are for preview only - NOT trusted for official results
      // Official calculations must be executed on the backend for trusted audit trails
      // 1. Define frontend engine metadata
      const engineMeta: EngineMeta = {
        name: `tradespro-offline-engine-preview-${codeType}`,
        version: '1.0.0',
        commit: 'local-dev', // In a real build, this would be a git hash
      };

      // 2. Load tables locally (this is async)
      // In a real PWA/Capacitor app, tables would be pre-packaged or from IndexedDB.
      const codeEdition = (inputs.codeEdition || (codeType === 'nec' ? '2023' : '2024')) as '2021' | '2024' | '2027';
      const ruleTables = await tableManager.loadTables(codeType, codeEdition);

      // 3. Execute calculation using plugin system (PREVIEW ONLY)
      // V5 Architecture: Use plugin system for consistency with backend
      
      // Register plugin if not already registered
      if (!pluginRegistry.has('cec-single-dwelling-2024')) {
        pluginRegistry.registerDefault(cecSingleDwellingPlugin);
      }
      
      // Create plugin context
      const context = createPluginContext(engineMeta, ruleTables, {
        mode: 'preview',
        tier: 'free',
        locale: 'en-CA'
      });
      
      // Execute plugin
      let resultBundle: UnsignedBundle;
      if (codeType === 'nec') {
        // TODO: NEC plugin will be added separately
        // For now, fallback to old method (will be replaced)
        throw new Error('NEC calculation via plugin system not yet implemented');
      } else {
        // CEC calculation using plugin system
        const result = await executePlugin('cec-single-dwelling-2024', inputs, context);
        resultBundle = result.bundle;
      }
      
      // Mark as preview/unofficial
      // Note: meta.isPreview is not part of CalculationMeta type, but we add it for frontend use
      (resultBundle.meta as any).isPreview = true;
      (resultBundle.meta as any).generatedBy = `frontend-preview-${codeType}`;
      (resultBundle.meta as any).note = `This is a preview calculation (${codeType.toUpperCase()}). For official results, execute on backend.`;

      bundle.value = resultBundle;
      calculationTimeMs.value = Date.now() - startTime;
      isPreview.value = true; // Mark as preview
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
    isPreview,
    downloadJSON,
    reset
  };
}