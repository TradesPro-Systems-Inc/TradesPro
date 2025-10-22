<template>
  <q-card>
    <q-card-section class="row items-center">
      <div class="text-h6">{{ $t('calculator.auditTrail.title') }}</div>
      <q-space />
      <q-btn flat round dense icon="close" @click="$emit('close')" />
    </q-card-section>

    <q-separator />

    <q-card-section class="scroll" style="max-height: 80vh">
      <q-timeline color="primary">
        <q-timeline-entry
          v-for="step in steps"
          :key="step.stepIndex"
          :title="`${$t('calculator.auditTrail.step')} ${step.stepIndex}: ${translateOperationId(step.operationId)}`"
          :subtitle="step.formulaRef"
          :icon="getStepIcon(step.operationId)"
        >
          <div class="text-caption q-mb-sm">{{ translateNote(step) }}</div>

          <!-- Input References -->
          <div v-if="step.inputRefs && step.inputRefs.length > 0" class="q-mb-sm">
            <div class="text-weight-medium text-grey-7">{{ $t('calculator.auditTrail.inputs') }}:</div>
            <q-chip
              v-for="(ref, idx) in step.inputRefs"
              :key="idx"
              size="sm"
              color="grey-3"
              class="q-mr-xs q-mt-xs"
            >
              {{ ref }}
            </q-chip>
          </div>

          <!-- Intermediate Values -->
          <div v-if="step.intermediateValues" class="q-mb-sm">
            <div class="text-weight-medium text-grey-7">{{ $t('calculator.auditTrail.intermediateValues') }}:</div>
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
            <div class="text-weight-medium text-grey-7">{{ $t('calculator.auditTrail.outputs') }}:</div>
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
            <div class="text-weight-medium text-grey-7">{{ $t('calculator.auditTrail.tableReferences') }}:</div>
            <q-chip
              v-for="(ref, idx) in step.tableReferences"
              :key="idx"
              size="sm"
              color="purple-1"
              class="q-mr-xs q-mt-xs"
            >
              {{ ref.tableId }} ({{ ref.version }})
              <span v-if="ref.rowIndex !== undefined"> - {{ $t('common.row') }} {{ ref.rowIndex }}</span>
              <span v-if="ref.columnUsed"> - {{ $t('common.column') }} {{ ref.columnUsed }}</span>
            </q-chip>
          </div>

          <!-- Rule Citations -->
          <div v-if="step.ruleCitations && step.ruleCitations.length > 0" class="q-mt-sm">
            <div class="text-weight-medium text-grey-7">{{ $t('calculator.auditTrail.ruleCitations') }}:</div>
            <q-badge
              v-for="(citation, idx) in step.ruleCitations"
              :key="idx"
              color="grey-7"
              class="q-mr-xs"
            >
              {{ citation }}
            </q-badge>
          </div>

          <!-- Warnings -->
          <div v-if="step.warnings && step.warnings.length > 0" class="q-mt-sm">
            <q-chip
              v-for="(warning, idx) in step.warnings"
              :key="idx"
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
import { computed, getCurrentInstance } from 'vue';

// Access i18n in legacy mode
const instance = getCurrentInstance();
const locale = computed(() => instance?.proxy?.$i18n?.locale || 'en-CA');
const t = instance?.proxy?.$t || ((key: string, params?: any) => key);

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

function translateOperationId(operationId: string): string {
  const translations: Record<string, Record<string, string>> = {
    'en-CA': {
      'calculate_basic_load_method_a': 'Basic Load (Method A)',
      'calculate_hvac_load': 'HVAC Load',
      'calculate_range_load': 'Electric Range',
      'calculate_water_heater_load': 'Water Heater',
      'calculate_evse_load': 'EVSE',
      'calculate_other_large_loads': 'Other Large Loads',
      'total_method_a': 'Method A Total',
      'minimum_load_method_b': 'Minimum Load (Method B)',
      'choose_greater_load': 'Final Load Selection',
      'calculate_service_current': 'Service Current',
      'select_conductor': 'Conductor Selection',
      'select_breaker': 'Breaker Sizing'
    },
    'fr-CA': {
      'calculate_basic_load_method_a': 'Charge de base (Méthode A)',
      'calculate_hvac_load': 'Charge CVCA',
      'calculate_range_load': 'Cuisinière électrique',
      'calculate_water_heater_load': 'Chauffe-eau',
      'calculate_evse_load': 'EVSE',
      'calculate_other_large_loads': 'Autres charges importantes',
      'total_method_a': 'Total méthode A',
      'minimum_load_method_b': 'Charge minimale (Méthode B)',
      'choose_greater_load': 'Sélection de la charge finale',
      'calculate_service_current': 'Courant de service',
      'select_conductor': 'Sélection du conducteur',
      'select_breaker': 'Dimensionnement du disjoncteur'
    },
    'zh-CN': {
      'calculate_basic_load_method_a': '基础负载（方法A）',
      'calculate_hvac_load': 'HVAC负载',
      'calculate_range_load': '电炉灶',
      'calculate_water_heater_load': '热水器',
      'calculate_evse_load': 'EV充电设备',
      'calculate_other_large_loads': '其他大负载',
      'total_method_a': '方法A总计',
      'minimum_load_method_b': '最小负载（方法B）',
      'choose_greater_load': '最终负载选择',
      'calculate_service_current': '服务电流',
      'select_conductor': '导体选择',
      'select_breaker': '断路器尺寸'
    }
  };
  
  return translations[locale.value]?.[operationId] || operationId;
}

function translateNote(step: CalculationStep): string {
  const vals = step.intermediateValues || {};
  const out = step.output || {};
  
  switch (step.operationId) {
    case 'calculate_basic_load_method_a':
      return t('auditTrail.notes.basicLoad', {
        area: vals.livingArea_m2,
        load: out.basicLoad_W
      });
    
    case 'calculate_hvac_load':
      return t('auditTrail.notes.hvacLoad', {
        heating: vals.heatingDemand_W,
        cooling: vals.coolingLoad_W,
        interlocked: vals.isInterlocked === 'Yes' ? t('common.yes') : t('common.no')
      });
    
    case 'calculate_range_load':
      if (vals.hasRange === 'Yes') {
        return t('auditTrail.notes.rangeLoad', {
          load: out.rangeLoad_W,
          rating: vals.rangeRating_kW
        });
      }
      return t('auditTrail.notes.noRange');
    
    case 'calculate_water_heater_load':
      if (vals.type && vals.type !== 'none') {
        return t('auditTrail.notes.waterHeaterLoad', {
          type: vals.type,
          load: out.waterHeaterLoad_W,
          factor: vals.demandFactor
        });
      }
      return t('auditTrail.notes.noWaterHeater');
    
    case 'calculate_evse_load':
      if (vals.hasEVSE === 'Yes') {
        return t('auditTrail.notes.evseLoad', {
          load: out.evseLoad_W
        });
      }
      return t('auditTrail.notes.noEVSE');
    
    case 'calculate_other_large_loads':
      return t('auditTrail.notes.otherLoads', {
        load: out.otherLargeLoads_W,
        factor: vals.demandFactor
      });
    
    case 'total_method_a':
      return t('auditTrail.notes.methodATotal', {
        basic: vals.basicLoad,
        hvac: vals.hvacLoad,
        range: vals.rangeLoad,
        water: vals.waterHeaterLoad,
        other: vals.otherLoads,
        total: out.totalLoadA_W
      });
    
    case 'minimum_load_method_b':
      return t('auditTrail.notes.methodB', {
        area: vals.livingArea_m2,
        minimum: out.minimumLoad_W,
        threshold: vals.threshold
      });
    
    case 'choose_greater_load':
      return t('auditTrail.notes.finalLoad', {
        load: out.chosenLoad_W,
        method: vals.reason || ''
      });
    
    case 'calculate_service_current':
      return t('auditTrail.notes.serviceCurrent', {
        current: out.serviceCurrent_A,
        voltage: vals.voltage_V,
        phase: vals.phase
      });
    
    case 'select_conductor':
      return t('auditTrail.notes.conductor', {
        size: out.conductorSize,
        material: out.material,
        base: vals.baseAmpacity,
        correction: vals.tempCorrection,
        rated: out.conductorAmpacity_A
      });
    
    case 'select_breaker':
      return t('auditTrail.notes.breaker', {
        size: out.breakerSize_A
      });
    
    default:
      return step.note || '';
  }
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
