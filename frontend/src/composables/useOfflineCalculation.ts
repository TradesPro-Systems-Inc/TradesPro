import { ref, computed } from 'vue';

// ✅ V4.1 ARCHITECTURE: Frontend should ONLY call shared calculation engine
// No calculation logic should be re-implemented here!

export function useOfflineCalculation() {
  const bundle = ref<any | null>(null);
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

  async function calculateLocally(inputs: any): Promise<boolean> {
    loading.value = true;
    error.value = null;
    calculationTimeMs.value = 0;
    const startTime = Date.now();
    
    try {
      // ✅ CORRECT V4.1 ARCHITECTURE: Call shared calculation engine
      // This should be a call to @tradespro/calculation-engine package
      
      // For now, we'll call the calculation service endpoint
      // In the future, this will be a direct import from the shared package
      const response = await fetch('/api/calculate/single-dwelling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        throw new Error(`Calculation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        bundle.value = result.bundle;
        calculationTimeMs.value = Date.now() - startTime;
        return true;
      } else {
        throw new Error(result.message || 'Calculation failed');
      }
      
    } catch (e: any) {
      error.value = e.message || 'An unknown error occurred during calculation.';
      console.error("Calculation failed:", e);
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