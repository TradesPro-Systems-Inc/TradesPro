<!-- Language Switcher Component -->
<template>
  <q-btn-dropdown
    flat
    color="white"
    text-color="white"
    :class="iconOnly ? '' : 'q-ml-sm'"
    :dense="iconOnly"
    :size="iconOnly ? 'sm' : undefined"
  >
    <template v-slot:label>
      <div class="row items-center no-wrap">
        <span class="text-h6" style="line-height: 1;">{{ getCurrentFlag() }}</span>
        <span v-if="!iconOnly" class="q-ml-xs">{{ getCurrentLanguageLabel() }}</span>
      </div>
    </template>
    
    <q-list>
      <q-item
        v-for="lang in languages"
        :key="lang.value"
        clickable
        v-close-popup
        @click="changeLanguage(lang.value)"
        :active="currentLocale === lang.value"
      >
        <q-item-section avatar>
          <div class="text-h6">{{ lang.flag }}</div>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ lang.label }}</q-item-label>
          <q-item-label caption>{{ lang.nativeLabel }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="currentLocale === lang.value">
          <q-icon name="check" color="primary" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';

// Props
defineProps<{
  iconOnly?: boolean;
}>();

// Access i18n through global properties in legacy mode
const instance = getCurrentInstance();
const i18n = instance?.proxy?.$i18n;

const languages = [
  {
    value: 'en-CA',
    label: 'English',
    nativeLabel: 'English (Canada)',
    flag: '🇨🇦' // Canadian flag emoji
  },
  {
    value: 'fr-CA',
    label: 'Français',
    nativeLabel: 'Français (Canada)',
    flag: '🇫🇷' // French flag emoji
  },
  {
    value: 'zh-CN',
    label: 'Chinese',
    nativeLabel: '简体中文',
    flag: '🇨🇳' // Chinese flag emoji
  }
];

const currentLocale = computed(() => {
  if (i18n) {
    return i18n.locale;
  }
  return localStorage.getItem('tradespro-locale') || 'en-CA';
});

function changeLanguage(newLocale: string) {
  console.log('Changing language to:', newLocale);
  
  // Save to localStorage first
  localStorage.setItem('tradespro-locale', newLocale);
  
  // Update document language attribute
  document.documentElement.setAttribute('lang', newLocale);
  
  // Update i18n locale
  if (i18n) {
    i18n.locale = newLocale;
    console.log('i18n.locale updated to:', i18n.locale);
  }
  
  // Force a page reload to ensure all components update with the new locale
  console.log('Reloading page...');
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

function getCurrentFlag() {
  const current = languages.find(l => l.value === currentLocale.value);
  return current?.flag || 'language';
}

function getCurrentLanguageLabel() {
  const current = languages.find(l => l.value === currentLocale.value);
  return current?.label || 'Language';
}
</script>

