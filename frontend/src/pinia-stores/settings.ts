// TradesPro - Application Settings Store
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Language, FontSize, Theme, AppSettings } from './types';
import { Preferences } from '@capacitor/preferences';

export const useSettingsStore = defineStore('settings', () => {
  // State - Load from localStorage if available
  const language = ref<Language>((localStorage.getItem('tradespro-locale') as Language) || 'en-CA');
  const fontSize = ref<FontSize>((localStorage.getItem('tradespro-font-size') as FontSize) || 'medium');
  const theme = ref<Theme>((localStorage.getItem('tradespro-theme') as Theme) || 'auto');
  const autoSave = ref(true);
  const showCalculationSteps = ref(true);
  const cecVersion = ref('2024');
  const offlineMode = ref(false);

  // Getters
  const isLargeFont = computed(() => fontSize.value === 'large');
  const isSmallFont = computed(() => fontSize.value === 'small');
  const isDarkTheme = computed(() => {
    if (theme.value === 'dark') return true;
    if (theme.value === 'light') return false;
    // Auto mode - check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const fontSizeScale = computed(() => {
    switch (fontSize.value) {
      case 'small': return 0.875;
      case 'large': return 1.125;
      default: return 1.0;
    }
  });

  // Actions
  function setLanguage(lang: Language) {
    language.value = lang;
    
    // Update localStorage for vue-i18n
    localStorage.setItem('tradespro-locale', lang);
    
    // Update document language attribute
    document.documentElement.setAttribute('lang', lang);
    
    // Save to Capacitor Preferences for native apps
    Preferences.set({ key: 'tradespro-language', value: lang });
  }

  function setFontSize(size: FontSize) {
    fontSize.value = size;
    
    // Update CSS variable
    document.documentElement.style.setProperty('--font-scale', fontSizeScale.value.toString());
    
    // Update body class
    document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    document.body.classList.add(`font-size-${size}`);
    
    // Save to Capacitor Preferences
    Preferences.set({ key: 'tradespro-font-size', value: size });
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    
    // Save to localStorage immediately
    localStorage.setItem('tradespro-theme', newTheme);
    
    // Save to Capacitor Preferences
    Preferences.set({ key: 'tradespro-theme', value: newTheme });
    
    // Apply theme after saving
    applyTheme();
  }

  function applyTheme() {
    const isDark = isDarkTheme.value;
    
    // Update document body classes
    if (isDark) {
      document.body.classList.add('body--dark', 'dark');
      document.body.classList.remove('body--light');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.add('body--light');
      document.body.classList.remove('body--dark', 'dark');
      document.body.setAttribute('data-theme', 'light');
    }
    
    // Update documentElement (html tag) as well
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
    }
    
    // Update Quasar dark mode - try multiple methods
    if (typeof window !== 'undefined') {
      // Method 1: Via Quasar API if available
      if ((window as any).Quasar?.Dark) {
        (window as any).Quasar.Dark.set(isDark);
      }
      
      // Method 2: Directly via $q if available (in components)
      // This will be handled by components using useQuasar()
    }
  }
  
  // Initialize theme on store creation
  function initializeTheme() {
    // Simply apply theme based on current value (applyTheme handles auto mode via isDarkTheme computed)
    applyTheme();
  }

  function toggleTheme() {
    if (theme.value === 'light') {
      setTheme('dark');
    } else if (theme.value === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  }

  function setAutoSave(enabled: boolean) {
    autoSave.value = enabled;
  }

  function setShowCalculationSteps(show: boolean) {
    showCalculationSteps.value = show;
  }

  function setCecVersion(version: string) {
    cecVersion.value = version;
  }

  function setOfflineMode(enabled: boolean) {
    offlineMode.value = enabled;
  }

  function resetToDefaults() {
    language.value = 'en-CA';
    fontSize.value = 'medium';
    theme.value = 'auto';
    autoSave.value = true;
    showCalculationSteps.value = true;
    cecVersion.value = '2024';
    offlineMode.value = false;
    
    // Apply changes
    setLanguage(language.value);
    setFontSize(fontSize.value);
    applyTheme();
  }

  async function loadSettings() {
    try {
      // Load from Capacitor Preferences (for native apps)
      const savedLanguage = await Preferences.get({ key: 'tradespro-language' });
      const savedFontSize = await Preferences.get({ key: 'tradespro-font-size' });
      const savedTheme = await Preferences.get({ key: 'tradespro-theme' });
      
      if (savedLanguage.value) {
        language.value = savedLanguage.value as Language;
        setLanguage(language.value);
      }
      
      if (savedFontSize.value) {
        fontSize.value = savedFontSize.value as FontSize;
        setFontSize(fontSize.value);
      }
      
      if (savedTheme.value) {
        theme.value = savedTheme.value as Theme;
        applyTheme();
      }
    } catch (err) {
      console.warn('Failed to load settings from Capacitor Preferences:', err);
      // Fall back to localStorage (already handled by pinia-plugin-persistedstate)
    }
  }

  function getSettingsObject(): AppSettings {
    return {
      language: language.value,
      fontSize: fontSize.value,
      theme: theme.value,
      autoSave: autoSave.value,
      showCalculationSteps: showCalculationSteps.value,
      cecVersion: cecVersion.value,
    };
  }

  function updateSettings(settings: Partial<AppSettings>) {
    if (settings.language) setLanguage(settings.language);
    if (settings.fontSize) setFontSize(settings.fontSize);
    if (settings.theme) setTheme(settings.theme);
    if (settings.autoSave !== undefined) autoSave.value = settings.autoSave;
    if (settings.showCalculationSteps !== undefined) showCalculationSteps.value = settings.showCalculationSteps;
    if (settings.cecVersion) cecVersion.value = settings.cecVersion;
  }

  // Initialize theme immediately on store creation
  if (typeof window !== 'undefined') {
    initializeTheme();
    
    // Watch for system theme changes (for auto mode)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme();
      }
    });
  }

  return {
    // State
    language,
    fontSize,
    theme,
    autoSave,
    showCalculationSteps,
    cecVersion,
    offlineMode,
    
    // Getters
    isLargeFont,
    isSmallFont,
    isDarkTheme,
    fontSizeScale,
    
    // Actions
    setLanguage,
    setFontSize,
    setTheme,
    applyTheme,
    initializeTheme,
    toggleTheme,
    setAutoSave,
    setShowCalculationSteps,
    setCecVersion,
    setOfflineMode,
    resetToDefaults,
    loadSettings,
    getSettingsObject,
    updateSettings,
  };
}, {
  persist: true,
});

