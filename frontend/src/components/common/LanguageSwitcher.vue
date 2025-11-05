<!-- Language Switcher Component -->
<template>
  <q-btn-dropdown
    flat
    :color="$q?.dark?.isActive ? 'white' : 'dark'"
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
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '../../pinia-stores';
import type { Language } from '../../pinia-stores/types';

// Props
defineProps<{
  iconOnly?: boolean;
}>();

// Use Quasar for theme detection
const $q = useQuasar();

// Use settings store
const settingsStore = useSettingsStore();
const { language } = storeToRefs(settingsStore);

// Access i18n through global properties for immediate UI update
const instance = getCurrentInstance();
const i18n = instance?.proxy?.$i18n;

const languages = [
  {
    value: 'en-CA' as Language,
    label: 'English',
    nativeLabel: 'English (Canada)',
    flag: '🇨🇦'
  },
  {
    value: 'fr-CA' as Language,
    label: 'Français',
    nativeLabel: 'Français (Canada)',
    flag: '🇫🇷'
  },
  {
    value: 'zh-CN' as Language,
    label: 'Chinese',
    nativeLabel: '简体中文',
    flag: '🇨🇳'
  }
];

const currentLocale = computed(() => language.value);

function changeLanguage(newLocale: Language) {
  console.log('Changing language to:', newLocale);
  
  // Update store (which updates localStorage and Capacitor)
  settingsStore.setLanguage(newLocale);
  
  // Update i18n locale immediately for UI
  if (i18n) {
    i18n.locale = newLocale;
    console.log('i18n.locale updated to:', i18n.locale);
  }
  
  // No page reload needed - Vue's reactivity will update the UI automatically
  // This preserves all user input data
  console.log('Language changed successfully. UI will update automatically.');
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

