<template>
  <q-btn-dropdown
    flat
    :label="iconOnly ? undefined : $t(`fontSize.${fontSize}`)"
    icon="text_fields"
    color="white"
    text-color="white"
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
        @click="applyFontSize(size as FontSize)"
        :class="{ 'bg-grey-1': fontSize === size }"
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
import { useFontSize, type FontSize } from '../../composables/useFontSize';

// Props
defineProps<{
  iconOnly?: boolean;
}>();

const {
  fontSize,
  fontSizeConfig,
  currentConfig,
  applyFontSize
} = useFontSize();
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
