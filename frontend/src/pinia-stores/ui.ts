// TradesPro - UI State Store
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UIState } from './types';

export const useUIStore = defineStore('ui', () => {
  // State
  const sidebarOpen = ref(false);
  const showCalculationSteps = ref(false);
  const currentCalculationId = ref<string | undefined>(undefined);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  
  // Drawer/dialog states
  const showUserSettingsDialog = ref(false);
  const showProjectDialog = ref(false);
  const showCalculationDialog = ref(false);
  const showHelpDialog = ref(false);
  
  // Navigation state
  const currentRoute = ref<string>('/');
  const previousRoute = ref<string | null>(null);
  
  // Toast/notification state
  const notifications = ref<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timeout?: number;
  }>>([]);

  // Getters
  const hasError = computed(() => !!error.value);
  const hasSuccess = computed(() => !!successMessage.value);
  const isLoading = computed(() => loading.value);
  const hasNotifications = computed(() => notifications.value.length > 0);

  // Actions
  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
  }

  function openSidebar() {
    sidebarOpen.value = true;
  }

  function closeSidebar() {
    sidebarOpen.value = false;
  }

  function toggleCalculationSteps() {
    showCalculationSteps.value = !showCalculationSteps.value;
  }

  function openCalculationSteps(calculationId?: string) {
    showCalculationSteps.value = true;
    if (calculationId) {
      currentCalculationId.value = calculationId;
    }
  }

  function closeCalculationSteps() {
    showCalculationSteps.value = false;
    currentCalculationId.value = undefined;
  }

  function setLoading(isLoading: boolean) {
    loading.value = isLoading;
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage;
    if (errorMessage) {
      successMessage.value = null;
    }
  }

  function setSuccess(message: string | null) {
    successMessage.value = message;
    if (message) {
      error.value = null;
    }
  }

  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  function showUserSettings() {
    showUserSettingsDialog.value = true;
  }

  function hideUserSettings() {
    showUserSettingsDialog.value = false;
  }

  function showProject() {
    showProjectDialog.value = true;
  }

  function hideProject() {
    showProjectDialog.value = false;
  }

  function showCalculation() {
    showCalculationDialog.value = true;
  }

  function hideCalculation() {
    showCalculationDialog.value = false;
  }

  function showHelp() {
    showHelpDialog.value = true;
  }

  function hideHelp() {
    showHelpDialog.value = false;
  }

  function setCurrentRoute(route: string) {
    previousRoute.value = currentRoute.value;
    currentRoute.value = route;
  }

  function goBack(): string | null {
    return previousRoute.value;
  }

  function addNotification(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    timeout: number = 5000
  ) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    notifications.value.push({
      id,
      type,
      message,
      timeout,
    });

    // Auto remove after timeout
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }

    return id;
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearNotifications() {
    notifications.value = [];
  }

  function notifySuccess(message: string, timeout?: number) {
    return addNotification('success', message, timeout);
  }

  function notifyError(message: string, timeout?: number) {
    return addNotification('error', message, timeout);
  }

  function notifyWarning(message: string, timeout?: number) {
    return addNotification('warning', message, timeout);
  }

  function notifyInfo(message: string, timeout?: number) {
    return addNotification('info', message, timeout);
  }

  function resetUI() {
    sidebarOpen.value = false;
    showCalculationSteps.value = false;
    currentCalculationId.value = undefined;
    loading.value = false;
    error.value = null;
    successMessage.value = null;
    showUserSettingsDialog.value = false;
    showProjectDialog.value = false;
    showCalculationDialog.value = false;
    showHelpDialog.value = false;
    notifications.value = [];
  }

  return {
    // State
    sidebarOpen,
    showCalculationSteps,
    currentCalculationId,
    loading,
    error,
    successMessage,
    showUserSettingsDialog,
    showProjectDialog,
    showCalculationDialog,
    showHelpDialog,
    currentRoute,
    previousRoute,
    notifications,
    
    // Getters
    hasError,
    hasSuccess,
    isLoading,
    hasNotifications,
    
    // Actions
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toggleCalculationSteps,
    openCalculationSteps,
    closeCalculationSteps,
    setLoading,
    setError,
    setSuccess,
    clearMessages,
    showUserSettings,
    hideUserSettings,
    showProject,
    hideProject,
    showCalculation,
    hideCalculation,
    showHelp,
    hideHelp,
    setCurrentRoute,
    goBack,
    addNotification,
    removeNotification,
    clearNotifications,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    resetUI,
  };
}, {
  persist: true,
});

