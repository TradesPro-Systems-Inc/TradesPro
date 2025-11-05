<!-- Theme Switcher Component -->
<template>
  <q-btn-dropdown
    flat
    :color="$q?.dark?.isActive ? 'white' : 'dark'"
    :icon="themeIcon"
    :class="iconOnly ? '' : 'q-ml-sm'"
    :dense="iconOnly"
    :size="iconOnly ? 'sm' : undefined"
  >
    <template v-slot:label v-if="!iconOnly">
      <span class="q-ml-xs">{{ themeLabel }}</span>
    </template>
    
    <q-list>
      <q-item
        v-for="option in themeOptions"
        :key="option.value"
        clickable
        v-close-popup
        @click="changeTheme(option.value)"
        :active="currentTheme === option.value"
      >
        <q-item-section avatar>
          <q-icon :name="option.icon" :color="currentTheme === option.value ? 'primary' : 'grey-5'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ option.label }}</q-item-label>
          <q-item-label caption>{{ option.description }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="currentTheme === option.value">
          <q-icon name="check" color="primary" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '../../pinia-stores';
import type { Theme } from '../../pinia-stores/types';

// Props
defineProps<{
  iconOnly?: boolean;
}>();

// Use Quasar for theme detection
const $q = useQuasar();

// Use settings store
const settingsStore = useSettingsStore();
const { theme } = storeToRefs(settingsStore);

const currentTheme = computed(() => theme.value);

// Theme options
const themeOptions = [
  {
    value: 'light' as Theme,
    label: 'Light',
    description: '浅色模式',
    icon: 'light_mode'
  },
  {
    value: 'dark' as Theme,
    label: 'Dark',
    description: '深色模式',
    icon: 'dark_mode'
  },
  {
    value: 'auto' as Theme,
    label: 'Auto',
    description: '跟随系统',
    icon: 'brightness_auto'
  }
];

// Current theme icon and label
const themeIcon = computed(() => {
  if (currentTheme.value === 'dark') return 'dark_mode';
  if (currentTheme.value === 'light') return 'light_mode';
  return 'brightness_auto';
});

const themeLabel = computed(() => {
  if (currentTheme.value === 'dark') return 'Dark';
  if (currentTheme.value === 'light') return 'Light';
  return 'Auto';
});

function changeTheme(newTheme: Theme) {
  console.log('Changing theme to:', newTheme);
  
  // Determine if should be dark
  const shouldBeDark = newTheme === 'dark' || 
    (newTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Update Quasar dark mode FIRST
  $q.dark.set(shouldBeDark);
  
  // Force remove all dark classes for light mode
  if (newTheme === 'light') {
    document.body.classList.remove('dark', 'body--dark', 'quasar-dark');
    document.documentElement.classList.remove('dark');
    document.body.classList.add('body--light', 'quasar-light');
    document.body.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    // Force background color update
    document.body.style.backgroundColor = '';
    document.documentElement.style.backgroundColor = '';
    // Trigger a style recalculation
    void document.body.offsetHeight;
  }
  
  // Update store (which calls applyTheme internally)
  settingsStore.setTheme(newTheme);
  
  // Apply theme again to ensure everything is synced
  settingsStore.applyTheme();
  
  console.log('Theme changed successfully. isDark:', shouldBeDark, 'theme:', newTheme);
}
</script>

