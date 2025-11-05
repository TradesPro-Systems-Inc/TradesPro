import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CalculationBundle } from './types';
import api from '../services/api';

export const useCalculationsStore = defineStore('calculations', () => {
  // State
  const calculations = ref<CalculationBundle[]>([]);
  const currentCalculation = ref<CalculationBundle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const maxHistorySize = ref<number>(100);

  // Getters
  const calculationsCount = computed(() => calculations.value.length);
  const recentCalculations = computed(() =>
    [...calculations.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const calculationsByProject = computed(() => {
    const map: Record<string, CalculationBundle[]> = {};
    for (const c of calculations.value) {
      const pid = c.projectId || 'unassigned';
      if (!map[pid]) map[pid] = [];
      map[pid].push(c);
    }
    return map;
  });
  const hasCalculations = computed(() => calculations.value.length > 0);

  // Actions
  function addCalculation(bundle: CalculationBundle) {
    // Insert newest at top
    calculations.value.unshift(bundle);
    currentCalculation.value = bundle;
    clearOldCalculations();
  }

  function setCurrentCalculation(bundle: CalculationBundle | null) {
    currentCalculation.value = bundle;
  }

  function getCalculationById(id: string): CalculationBundle | undefined {
    return calculations.value.find(c => c.id === id);
  }

  function getCalculationsByProjectId(projectId: string): CalculationBundle[] {
    return calculations.value.filter(c => c.projectId === projectId);
  }

  function deleteCalculation(id: string): boolean {
    const idx = calculations.value.findIndex(c => c.id === id);
    if (idx !== -1) {
      const removed = calculations.value.splice(idx, 1);
      if (currentCalculation.value?.id === id) currentCalculation.value = null;
      return removed.length > 0;
    }
    return false;
  }

  function deleteCalculationsByProjectId(projectId: string) {
    calculations.value = calculations.value.filter(c => c.projectId !== projectId);
    if (currentCalculation.value?.projectId === projectId) currentCalculation.value = null;
  }

  function clearHistory() {
    calculations.value = [];
    currentCalculation.value = null;
  }

  function clearOldCalculations() {
    if (calculations.value.length > maxHistorySize.value) {
      calculations.value = calculations.value.slice(0, maxHistorySize.value);
    }
  }

  async function saveCalculationToServer(bundle: CalculationBundle) {
    loading.value = true;
    error.value = null;
    try {
      const payload = {
        project_id: bundle.projectId,
        bundle_id: bundle.id,
        bundle_data: bundle,
        notes: bundle.notes,
        tags: bundle.tags,
        calculation_type: 'single-dwelling', // Or derive from bundle
        code_edition: bundle.inputs.codeEdition,
        code_type: 'cec'
      };

      const response = await api.post('/calculations/sync', payload);
      console.log('Calculation synced with server:', response.data);
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.detail || err.message || '保存计算失败';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCalculations(projectId?: string) {
    loading.value = true;
    error.value = null;
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // API would return calculations from server
      // For now, we use locally stored calculations
      
      return projectId 
        ? getCalculationsByProjectId(projectId)
        : calculations.value;
    } catch (err: any) {
      error.value = err.message || '获取计算历史失败';
      return [];
    } finally {
      loading.value = false;
    }
  }

  function exportCalculationAsJSON(calculation: CalculationBundle) {
    const dataStr = JSON.stringify(calculation, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `calculation-${calculation.id}-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  function exportAllCalculationsAsJSON() {
    const dataStr = JSON.stringify(calculations.value, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `calculations-export-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  function importCalculationsFromJSON(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      if (Array.isArray(imported)) {
        // Import multiple calculations
        imported.forEach(calc => {
          if (calc.id && calc.inputs && calc.results) {
            // Check if calculation already exists
            const exists = calculations.value.some(c => c.id === calc.id);
            if (!exists) {
              calculations.value.push(calc);
            }
          }
        });
      } else if (imported.id && imported.inputs && imported.results) {
        // Import single calculation
        const exists = calculations.value.some(c => c.id === imported.id);
        if (!exists) {
          calculations.value.push(imported);
        }
      } else {
        throw new Error('Invalid calculation data format');
      }
      
      return true;
    } catch (err) {
      error.value = '导入失败：数据格式不正确';
      return false;
    }
  }

  return {
    // State
    calculations,
    currentCalculation,
    loading,
    error,
    maxHistorySize,
    
    // Getters
    calculationsCount,
    recentCalculations,
    calculationsByProject,
    hasCalculations,
    
    // Actions
    addCalculation,
    setCurrentCalculation,
    getCalculationById,
    getCalculationsByProjectId,
    deleteCalculation,
    deleteCalculationsByProjectId,
    clearHistory,
    clearOldCalculations,
    saveCalculationToServer,
    fetchCalculations,
    exportCalculationAsJSON,
    exportAllCalculationsAsJSON,
    importCalculationsFromJSON,
  };
}, {
  persist: true,
});

