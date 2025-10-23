// TradesPro Frontend - Offline Calculation Composable
// REFACTORED: V4.1 Architecture - No calculation logic, only coordination

import { ref, computed } from "vue";
// ✅ CRITICAL: Import the TRUE calculation engine, not a mock.
// This assumes you have set up an NPM workspace named '@tradespro/calculation-engine'.
// import { calculateSimple, calculateDetailed } from '@tradespro/calculation-engine'; 
// import { tableManager } from '@tradespro/calculation-engine'; // Also import the table manager

// Temporary types until we set up the shared package
// interface EngineMeta {
//   name: string;
//   version: string;
//   commit: string;
//   buildTimestamp?: string;
// }

interface CecInputsSingle {
  id?: string;
  project?: string;
  livingArea_m2?: number;
  systemVoltage: number;
  phase?: 1 | 3;
  appliances?: any[];
  continuousLoads?: any[];
  [key: string]: any;
}

interface CecResults {
  chosenCalculatedLoad_W?: string;
  serviceCurrentA?: string;
  conductorSize?: string;
  panelRatingA?: string;
  breakerSizeA?: string;
  [key: string]: any;
}

interface UnsignedBundle {
  id?: string;
  createdAt: string;
  inputs: CecInputsSingle;
  results: CecResults;
  steps: any[];
  warnings?: string[];
  [key: string]: any;
}

/**
 * Offline Calculation Composable - REFACTORED for V4.1 Architecture
 * 
 * This composable now follows V4.1 principles:
 * - NO calculation logic - only coordination with the shared engine
 * - Single responsibility: manage offline calculation state and call shared engine
 * - Same calculation logic as backend for consistency
 */
export function useOfflineCalculation() {
  const bundle = ref<UnsignedBundle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const hasResults = computed(() => bundle.value !== null);

  /**
   * Calculate locally using the shared calculation engine
   * ✅ CORRECT: No re-implementation of logic - delegates to shared engine
   */
  async function calculateLocally(inputs: CecInputsSingle): Promise<UnsignedBundle | null> {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('🔄 Starting offline calculation with shared engine...');
      
      // TODO: Once shared package is set up, replace this with:
      // const ruleTables = await tableManager.loadTables('cec', '2024');
      // const result = calculateSimple(inputs, {
      //   engine: { name: 'offline-engine', version: '5.0.0', commit: 'local' },
      //   ruleTables,
      // });

      // TEMPORARY: For now, call the calculation service API
      // This ensures we use the SAME calculation logic as the backend
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
      
      if (!result.success) {
        throw new Error(result.message || 'Calculation failed');
      }

      // Update the UI with the result from the shared engine
      bundle.value = result.bundle;
      
      console.log('✅ Offline calculation completed successfully');
      return result.bundle;

    } catch (err: any) {
      console.error('❌ Offline calculation failed:', err);
      error.value = err.message || 'Offline calculation failed';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Save calculation to local storage
   */
  function saveCalculation(bundle: UnsignedBundle): void {
    try {
      const calculations = getSavedCalculations();
      const id = bundle.id || `calc_${Date.now()}`;
      
      const calculationToSave = {
        ...bundle,
        id,
        savedAt: new Date().toISOString(),
      };
      
      calculations[id] = calculationToSave;
      localStorage.setItem('tradespro_calculations', JSON.stringify(calculations));
      
      console.log('💾 Calculation saved to local storage:', id);
    } catch (err) {
      console.error('❌ Failed to save calculation:', err);
    }
  }

  /**
   * Load calculation from local storage
   */
  function loadCalculation(id: string): UnsignedBundle | null {
    try {
      const calculations = getSavedCalculations();
      const calculation = calculations[id];
      
      if (calculation) {
        bundle.value = calculation;
        console.log('📁 Calculation loaded from local storage:', id);
        return calculation;
      }
      
      return null;
    } catch (err) {
      console.error('❌ Failed to load calculation:', err);
      return null;
    }
  }

  /**
   * Get all saved calculations
   */
  function getSavedCalculations(): Record<string, UnsignedBundle> {
    try {
      const saved = localStorage.getItem('tradespro_calculations');
      return saved ? JSON.parse(saved) : {};
    } catch (err) {
      console.error('❌ Failed to get saved calculations:', err);
      return {};
    }
  }

  /**
   * Delete calculation from local storage
   */
  function deleteCalculation(id: string): boolean {
    try {
      const calculations = getSavedCalculations();
      if (calculations[id]) {
        delete calculations[id];
        localStorage.setItem('tradespro_calculations', JSON.stringify(calculations));
        console.log('🗑️ Calculation deleted from local storage:', id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Failed to delete calculation:', err);
      return false;
    }
  }

  /**
   * Clear all calculations from local storage
   */
  function clearAllCalculations(): void {
    try {
      localStorage.removeItem('tradespro_calculations');
      console.log('🧹 All calculations cleared from local storage');
    } catch (err) {
      console.error('❌ Failed to clear calculations:', err);
    }
  }

  /**
   * Get calculation history (sorted by creation date)
   */
  function getCalculationHistory(): UnsignedBundle[] {
    try {
      const calculations = getSavedCalculations();
      return Object.values(calculations).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.error('❌ Failed to get calculation history:', err);
      return [];
    }
  }

  /**
   * Export calculation to JSON
   */
  function exportCalculation(bundle: UnsignedBundle): string {
    try {
      return JSON.stringify(bundle, null, 2);
    } catch (err) {
      console.error('❌ Failed to export calculation:', err);
      return '';
    }
  }

  /**
   * Import calculation from JSON
   */
  function importCalculation(jsonString: string): UnsignedBundle | null {
    try {
      const bundle = JSON.parse(jsonString);
      
      // Validate the bundle structure
      if (!bundle.inputs || !bundle.results || !bundle.createdAt) {
        throw new Error('Invalid calculation format');
      }
      
      return bundle;
    } catch (err) {
      console.error('❌ Failed to import calculation:', err);
      error.value = 'Failed to import calculation: ' + (err as Error).message;
      return null;
    }
  }

  return {
    // State
    bundle,
    loading,
    error,
    hasResults,
    
    // Methods
    calculateLocally,
    saveCalculation,
    loadCalculation,
    getSavedCalculations,
    deleteCalculation,
    clearAllCalculations,
    getCalculationHistory,
    exportCalculation,
    importCalculation,
  };
}