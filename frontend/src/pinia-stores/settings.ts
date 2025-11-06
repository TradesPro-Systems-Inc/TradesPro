// TradesPro - Application Settings Store
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Language, FontSize, Theme, AppSettings, JurisdictionProfile, JurisdictionConfig, CalculationRulesConfig } from './types';
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
  
  // Jurisdiction Configuration
  const jurisdictionConfig = ref<JurisdictionConfig>({
    profiles: [],
    defaultProfileId: undefined
  });

  // Getters
  const isLargeFont = computed(() => fontSize.value === 'large');
  const isSmallFont = computed(() => fontSize.value === 'small');
  const isDarkTheme = computed(() => {
    if (theme.value === 'dark') return true;
    if (theme.value === 'light') return false;
    // Auto mode - check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Jurisdiction Configuration Getters
  const activeProfile = computed(() => {
    if (!jurisdictionConfig.value.defaultProfileId) return null;
    return jurisdictionConfig.value.profiles.find(
      p => p.id === jurisdictionConfig.value.defaultProfileId
    ) || null;
  });
  
  // Get panel breaker sizes from active profile or return default standard sizes
  const getPanelBreakerSizes = computed(() => {
    const profile = activeProfile.value;
    console.log('🔍 getPanelBreakerSizes computed - activeProfile:', profile);
    if (profile && profile.calculationRules.panelBreakerSizes?.enabled) {
      const sizes = profile.calculationRules.panelBreakerSizes.enabled;
      console.log('✅ Using profile breaker sizes:', sizes);
      return sizes;
    }
    // Default standard main panel breaker sizes
    const defaultSizes = [60, 100, 125, 150, 200, 225, 250, 300, 400];
    console.log('📋 Using default breaker sizes:', defaultSizes);
    return defaultSizes;
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

  // Jurisdiction Configuration Actions
  function createJurisdictionProfile(profile: Omit<JurisdictionProfile, 'id' | 'createdAt' | 'updatedAt'>): JurisdictionProfile {
    const newProfile: JurisdictionProfile = {
      ...profile,
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: profile.isDefault || false
    };
    
    jurisdictionConfig.value.profiles.push(newProfile);
    
    // If this is set as default, update defaultProfileId
    if (newProfile.isDefault) {
      jurisdictionConfig.value.defaultProfileId = newProfile.id;
      // Clear default flag from other profiles
      jurisdictionConfig.value.profiles.forEach(p => {
        if (p.id !== newProfile.id) p.isDefault = false;
      });
    }
    
    saveJurisdictionConfig();
    return newProfile;
  }

  function updateJurisdictionProfile(profileId: string, updates: Partial<JurisdictionProfile>): JurisdictionProfile | null {
    const index = jurisdictionConfig.value.profiles.findIndex(p => p.id === profileId);
    if (index === -1) return null;
    
    const updatedProfile: JurisdictionProfile = {
      ...jurisdictionConfig.value.profiles[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    jurisdictionConfig.value.profiles[index] = updatedProfile;
    
    // If setting as default, update defaultProfileId
    if (updates.isDefault === true) {
      jurisdictionConfig.value.defaultProfileId = profileId;
      // Clear default flag from other profiles
      jurisdictionConfig.value.profiles.forEach(p => {
        if (p.id !== profileId) p.isDefault = false;
      });
    }
    
    saveJurisdictionConfig();
    return updatedProfile;
  }

  function deleteJurisdictionProfile(profileId: string): boolean {
    const index = jurisdictionConfig.value.profiles.findIndex(p => p.id === profileId);
    if (index === -1) return false;
    
    // If deleting the default profile, clear defaultProfileId
    if (jurisdictionConfig.value.defaultProfileId === profileId) {
      jurisdictionConfig.value.defaultProfileId = undefined;
    }
    
    jurisdictionConfig.value.profiles.splice(index, 1);
    saveJurisdictionConfig();
    return true;
  }

  function setDefaultJurisdictionProfile(profileId: string): boolean {
    const profile = jurisdictionConfig.value.profiles.find(p => p.id === profileId);
    if (!profile) return false;
    
    jurisdictionConfig.value.defaultProfileId = profileId;
    // Update isDefault flags
    jurisdictionConfig.value.profiles.forEach(p => {
      p.isDefault = p.id === profileId;
    });
    
    saveJurisdictionConfig();
    return true;
  }

  function saveJurisdictionConfig() {
    try {
      const configJson = JSON.stringify(jurisdictionConfig.value);
      localStorage.setItem('tradespro-jurisdiction-config', configJson);
      Preferences.set({ key: 'tradespro-jurisdiction-config', value: configJson });
    } catch (err) {
      console.warn('Failed to save jurisdiction config:', err);
    }
  }

  function loadJurisdictionConfig() {
    try {
      // Try Capacitor Preferences first
      Preferences.get({ key: 'tradespro-jurisdiction-config' }).then(result => {
        if (result.value) {
          const config = JSON.parse(result.value) as JurisdictionConfig;
          jurisdictionConfig.value = config;
        }
      }).catch(() => {
        // Fall back to localStorage
        const saved = localStorage.getItem('tradespro-jurisdiction-config');
        if (saved) {
          const config = JSON.parse(saved) as JurisdictionConfig;
          jurisdictionConfig.value = config;
        }
      });
    } catch (err) {
      console.warn('Failed to load jurisdiction config:', err);
    }
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

  // Initialize jurisdiction config on store creation
  // Also load config immediately if window is available
  if (typeof window !== 'undefined') {
    // Load config immediately on store creation
    loadJurisdictionConfig();
    
    // Also reload config when window becomes visible (handles tab switching)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          loadJurisdictionConfig();
        }
      });
    }
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
    jurisdictionConfig,
    
    // Getters
    isLargeFont,
    isSmallFont,
    isDarkTheme,
    fontSizeScale,
    activeProfile,
    getPanelBreakerSizes,
    
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
    // Jurisdiction Configuration Actions
    createJurisdictionProfile,
    updateJurisdictionProfile,
    deleteJurisdictionProfile,
    setDefaultJurisdictionProfile,
    loadJurisdictionConfig,
  };
}, {
  persist: true,
});

