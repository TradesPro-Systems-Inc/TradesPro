<template>
  <q-card>
    <q-card-section class="row items-center">
      <div class="text-h6">{{ t('calculator.auditTrail.title') }}</div>
      <q-space />
      <q-btn flat round dense icon="close" @click="$emit('close')" />
    </q-card-section>

    <q-separator />

    <q-card-section class="scroll" style="max-height: 80vh">
      <q-timeline color="primary">
        <q-timeline-entry
          v-for="step in steps"
          :key="step.stepIndex"
          :title="`${t('calculator.auditTrail.step')} ${step.stepIndex}: ${t(`calculator.operations.${step.operationId}`, step.operationId)}`"
          :subtitle="step.formulaRef"
          :icon="getStepIcon(step.operationId)"
        >
          <div class="text-caption q-mb-sm">{{ translateNote(step) }}</div>

          <!-- Input References -->
          <div v-if="step.inputRefs && step.inputRefs.length > 0" class="q-mb-sm">
            <div class="text-weight-medium text-grey-7">{{ t('calculator.auditTrail.inputs') }}:</div>
            <q-chip
              v-for="ref in step.inputRefs"
              :key="ref"
              size="sm"
              color="grey-3"
              class="q-mr-xs q-mt-xs"
            >
              {{ ref }}
            </q-chip>
          </div>

          <!-- Intermediate Values -->
          <div v-if="step.intermediateValues" class="q-mb-sm">
            <div class="text-weight-medium text-grey-7">{{ t('calculator.auditTrail.intermediateValues') }}:</div>
            <q-chip
              v-for="(value, key) in step.intermediateValues"
              :key="key"
              size="sm"
              color="blue-1"
              class="q-mr-xs q-mt-xs"
            >
              {{ key }}: {{ value }}
            </q-chip>
          </div>

          <!-- Output Results -->
          <div v-if="step.output">
            <div class="text-weight-medium text-grey-7">{{ t('calculator.auditTrail.outputs') }}:</div>
            <q-chip
              v-for="(value, key) in step.output"
              :key="key"
              size="sm"
              color="positive"
              text-color="white"
              class="q-mr-xs q-mt-xs"
            >
              {{ key }}: {{ value }} {{ step.units?.[key] || '' }}
            </q-chip>
          </div>

          <!-- Table References -->
          <div v-if="step.tableReferences && step.tableReferences.length > 0" class="q-mt-sm">
            <div class="text-weight-medium text-grey-7">{{ t('calculator.auditTrail.tableReferences') }}:</div>
            <q-chip
              v-for="(ref, idx) in step.tableReferences"
              :key="idx"
              size="sm"
              color="purple-1"
              class="q-mr-xs q-mt-xs"
            >
              {{ ref.tableId }} ({{ ref.version }})
              <span v-if="ref.rowIndex !== undefined"> - {{ t('common.row') }} {{ ref.rowIndex }}</span>
              <span v-if="ref.columnUsed"> - {{ t('common.column') }} {{ ref.columnUsed }}</span>
            </q-chip>
          </div>

          <!-- Rule Citations -->
          <div v-if="step.ruleCitations && step.ruleCitations.length > 0" class="q-mt-sm">
            <div class="text-weight-medium text-grey-7">{{ t('calculator.auditTrail.ruleCitations') }}:</div>
            <q-badge
              v-for="citation in step.ruleCitations"
              :key="citation"
              color="grey-7"
              class="q-mr-xs"
            >
              {{ citation }}
            </q-badge>
          </div>

          <!-- Warnings -->
          <div v-if="step.warnings && step.warnings.length > 0" class="q-mt-sm">
            <q-chip
              v-for="(warning, index) in step.warnings"
              :key="index"
              size="sm"
              color="warning"
              text-color="white"
              icon="warning"
              class="q-mr-xs"
            >
              {{ warning }}
            </q-chip>
          </div>

          <!-- Timestamp -->
          <div class="text-caption text-grey-5 q-mt-sm">
            {{ formatTimestamp(step.timestamp) }}
          </div>
        </q-timeline-entry>
      </q-timeline>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// Temporary type definitions
interface CalculationStep {
  stepIndex: number;
  operationId: string;
  formulaRef: string;
  inputRefs?: string[];
  intermediateValues?: Record<string, string>;
  output?: Record<string, string>;
  units?: Record<string, string>;
  timestamp: string;
  note?: string;
  tableReferences?: Array<{
    tableId: string;
    version?: string;
    rowIndex?: number;
    columnUsed?: string;
  }>;
  warnings?: string[];
  ruleCitations?: string[];
}

interface Props {
  steps: CalculationStep[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

function translateNote(step: CalculationStep): string {
  const vals = step.intermediateValues || {};
  const out = step.output || {};
  const params = { ...vals, ...out };

  // Handle special cases where a different translation key is needed based on values
  if (step.operationId === 'calculate_range_load' && vals.hasRange !== 'Yes') {
    return t('calculator.auditTrail.notes.noRange');
  }
  if (step.operationId === 'calculate_water_heater_load' && (!vals.type || vals.type === 'none')) {
    return t('calculator.auditTrail.notes.noWaterHeater');
  }
  if (step.operationId === 'calculate_evse_load' && vals.hasEVSE !== 'Yes') {
    return t('calculator.auditTrail.notes.noEVSE');
  }

  const noteKey = `calculator.auditTrail.notes.${step.operationId}`;
  const translatedNote = t(noteKey, params);

  // Fallback to the original note if translation is not found
  return translatedNote === noteKey ? (step.note || '') : translatedNote;
}

function getStepIcon(operationId: string): string {
  const iconMap: Record<string, string> = {
    'validate_inputs': 'check_circle',
    'calculate_basic_load_method_a': 'home',
    'calculate_hvac_load': 'thermostat',
    'calculate_range_load': 'kitchen',
    'calculate_water_heater_load': 'water_drop',
    'calculate_evse_load': 'ev_station',
    'calculate_other_large_loads': 'power',
    'total_method_a': 'calculate',
    'minimum_load_method_b': 'rule',
    'choose_greater_load': 'check_circle',
    'calculate_service_current': 'bolt',
    'select_conductor': 'cable',
    'select_breaker': 'security'
  };
  
  return iconMap[operationId] || 'help';
}

function formatTimestamp(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString(locale.value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return timestamp;
  }
}
</script>

<style scoped>
.scroll {
  overflow-y: auto;
}

.q-timeline-entry {
  margin-bottom: 16px;
}
</style>
