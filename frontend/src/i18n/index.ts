// TradesPro Frontend - Internationalization (i18n) Configuration
// Supports: English (Canada), French (Canada), Chinese (Simplified)
// Default: English (en-CA)

import { createI18n } from 'vue-i18n';
import enCA from './en-CA.json';
import frCA from './fr-CA.json';
import zhCN from './zh-CN.json';

// Get saved language or default to English
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

export default i18n;


