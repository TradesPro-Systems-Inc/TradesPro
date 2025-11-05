// Quasar Boot File - i18n Configuration
import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import enCA from '../i18n/en-CA.json';
import frCA from '../i18n/fr-CA.json';
import zhCN from '../i18n/zh-CN.json';

// Get saved language or default to English
// Language preference persists across logout/login sessions
const savedLocale = localStorage.getItem('tradespro-locale') || 'en-CA';

export const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: savedLocale,
  fallbackLocale: 'en-CA',
  messages: {
    'en-CA': enCA,
    'fr-CA': frCA,
    'zh-CN': zhCN
  },
  globalInjection: true,
  missingWarn: false,
  fallbackWarn: false
});

export default boot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
  
  // Set document language
  document.documentElement.setAttribute('lang', savedLocale);
  
  // Watch for locale changes and sync with localStorage
  // This ensures language preference persists across sessions
  i18n.global.locale.value = savedLocale;
});

