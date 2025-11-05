<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from './pinia-stores/user';
import { useSettingsStore } from './pinia-stores/settings';
import { useI18n } from 'vue-i18n';
import api from './services/api';

// IMPORTANT: useI18n() must be called at the top level of setup function
const { locale } = useI18n();

// Initialize stores on app startup
onMounted(async () => {
  const userStore = useUserStore();
  
  // Initialize user store (will fetch user if token exists)
  await userStore.initialize();
  
  // Initialize settings store and apply saved theme
  const settingsStore = useSettingsStore();
  // Initialize theme (will detect system preference if auto mode)
  settingsStore.initializeTheme();
  
  // Sync language to i18n
  const savedLanguage = localStorage.getItem('tradespro-locale') || 'en-CA';
  if (savedLanguage !== locale.value) {
    locale.value = savedLanguage;
  }
  
  // Log initialization status
  console.log('🚀 App initialized:', {
    apiBaseURL: api.defaults.baseURL,
    hasToken: !!userStore.token,
    isAuthenticated: userStore.isAuthenticated,
    language: savedLanguage
  });
});
</script>