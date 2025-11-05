<template>
  <q-btn-dropdown
    flat
    :label="iconOnly ? undefined : $t(`fontSize.${fontSize}`)"
    icon="text_fields"
    :color="$q?.dark?.isActive ? 'white' : 'dark'"
    class="font-size-control"
    :dense="iconOnly"
    :size="iconOnly ? 'sm' : undefined"
  >
    <q-list>
      <q-item
        v-for="(config, size) in fontSizeConfig"
        :key="size"
        clickable
        v-close-popup
        @click="setFontSize(size as FontSize)"
        :class="$q.dark.isActive 
          ? (fontSize === size ? 'bg-grey-8' : '') 
          : (fontSize === size ? 'bg-grey-2' : '')"
      >
        <q-item-section avatar>
          <q-icon 
            :name="fontSize === size ? 'radio_button_checked' : 'radio_button_unchecked'"
            :color="fontSize === size ? 'primary' : 'grey-5'"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t(`fontSize.${config.key}`) }}</q-item-label>
          <q-item-label caption>
            {{ $t('fontSize.scale') }}: {{ (config.scale * 100).toFixed(0) }}%
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div 
            class="font-preview"
            :style="{ fontSize: `${config.scale * 14}px` }"
          >
            Aa
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '../../pinia-stores';
import type { FontSize } from '../../pinia-stores/types';

// Props
defineProps<{
  iconOnly?: boolean;
}>();

// Use Quasar for theme detection
const $q = useQuasar();

// Use settings store
const settingsStore = useSettingsStore();
const { fontSize } = storeToRefs(settingsStore);

// Font size configuration
const fontSizeConfig = {
  small: { key: 'small', scale: 0.875 },
  medium: { key: 'medium', scale: 1.0 },
  large: { key: 'large', scale: 1.125 }
};

// Use store action directly
const setFontSize = settingsStore.setFontSize;
</script>

<style scoped>
.font-size-control {
  min-width: 120px;
}

.font-preview {
  font-weight: 500;
  color: var(--q-primary);
  line-height: 1;
}
</style>
