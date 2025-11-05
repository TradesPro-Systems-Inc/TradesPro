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
          :title="`${t('calculator.auditTrail.step')} ${step.stepIndex}: ${getStepDisplayName(step.operationId, step.displayName)}`"
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
//import { computed } from 'vue';
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

function getStepDisplayName(operationId: string, displayName?: string): string {
  // If displayName is provided by the calculation engine, use it
  if (displayName) {
    return displayName;
  }

  // Otherwise, convert operationId to friendly name
  const nameMap: Record<string, string> = {
    // Basic calculations
    'calc_base_load': 'Basic Load',
    'calculate_basic_load': 'Basic Load',
    'calculate_basic_load_method_a': 'Basic Load (Method A)',
    
    // HVAC
    'calc_space_heating': 'Space Heating',
    'calc_air_conditioning': 'Air Conditioning',
    'apply_hvac_interlock': 'HVAC Interlock',
    'calc_hvac_load': 'HVAC Load',
    'calculate_hvac_load': 'HVAC Load',
    
    // Appliances
    'calc_range_load': 'Electric Range',
    'calculate_range_load': 'Electric Range',
    'calc_water_heater': 'Water Heater',
    'calculate_water_heater_load': 'Water Heater',
    'calc_pool_spa': 'Pool/Spa Heater',
    'calc_evse': 'EVSE (EV Charger)',
    'exclude_evse_with_evems': 'EVSE (Managed by EVEMS)',
    'calculate_evse_load': 'EVSE (EV Charger)',
    
    // Large and small loads
    'calc_large_loads_with_range': 'Other Large Loads (with Range)',
    'calc_large_loads_no_range': 'Other Large Loads (no Range)',
    'calculate_other_large_loads': 'Other Large Loads',
    'calc_small_loads': 'Small Appliances',
    'calc_remaining_loads': 'Remaining Loads',
    
    // Summary steps
    'sum_appliances': 'Total Appliance Loads',
    'sum_method_A': 'Method A Total',
    'total_method_a': 'Method A Total',
    
    // Method B
    'calc_minimum_load_B': 'Method B (Minimum Load)',
    'minimum_load_method_b': 'Method B (Minimum Load)',
    
    // Final selection
    'select_final_load': 'Final Load Selection',
    'choose_greater_load': 'Final Load Selection',
    
    // Electrical sizing
    'calc_service_current': 'Service Current',
    'calculate_service_current': 'Service Current',
    'select_conductor': 'Conductor Selection',
    'select_breaker': 'Breaker & Panel Sizing',
    
    // Validation
    'validate_inputs': 'Input Validation',
    'use_provided_living_area': 'Living Area',
    'calculate_living_area_from_floors': 'Living Area from Floors'
  };
  
  // Return mapped name or convert operationId to title case
  return nameMap[operationId] || operationId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function getStepIcon(operationId: string): string {
  const iconMap: Record<string, string> = {
    'validate_inputs': 'check_circle',
    'calc_base_load': 'home',
    'calculate_basic_load': 'home',
    'calculate_basic_load_method_a': 'home',
    'calc_hvac_load': 'thermostat',
    'calc_space_heating': 'thermostat',
    'calc_air_conditioning': 'ac_unit',
    'apply_hvac_interlock': 'link',
    'calculate_hvac_load': 'thermostat',
    'calc_range_load': 'kitchen',
    'calculate_range_load': 'kitchen',
    'calc_water_heater': 'water_drop',
    'calculate_water_heater_load': 'water_drop',
    'calc_pool_spa': 'pool',
    'calc_evse': 'ev_station',
    'exclude_evse_with_evems': 'ev_station',
    'calculate_evse_load': 'ev_station',
    'calc_large_loads_with_range': 'power',
    'calc_large_loads_no_range': 'power',
    'calculate_other_large_loads': 'power',
    'calc_small_loads': 'electrical_services',
    'sum_appliances': 'functions',
    'sum_method_A': 'calculate',
    'total_method_a': 'calculate',
    'calc_minimum_load_B': 'rule',
    'minimum_load_method_b': 'rule',
    'select_final_load': 'done_all',
    'choose_greater_load': 'done_all',
    'calc_service_current': 'bolt',
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
