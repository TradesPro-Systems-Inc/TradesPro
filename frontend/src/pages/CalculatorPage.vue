<template>
  <q-page padding>
    <!-- Offline Status Indicator -->
    <q-banner v-if="!isOnline" class="bg-warning text-white q-mb-md">
      <template v-slot:avatar>
        <q-icon name="cloud_off" />
      </template>
      {{ $t('calculator.offlineMode') }}
    </q-banner>

    <q-card>
      <q-card-section>
        <div class="row items-center">
          <div class="text-h5">{{ $t('calculator.title') }}</div>
          <q-space />
          <q-chip 
            :color="isOnline ? 'positive' : 'grey'" 
            text-color="white"
            icon="cloud"
          >
            {{ isOnline ? $t('calculator.online') : $t('calculator.offline') }}
          </q-chip>
          <q-chip color="primary" text-color="white" icon="bolt">
            {{ $t('calculator.offlineCalc') }}
          </q-chip>
        </div>
        <div class="text-caption text-grey-7 q-mt-xs">
          {{ $t('calculator.workOffline') }}
        </div>
      </q-card-section>

      <q-separator />

      <!-- Input Form -->
      <q-card-section>
        <q-form @submit="onCalculate" class="q-gutter-md">
          <!-- Basic Information -->
          <div class="text-h6">{{ $t('calculator.basicInfo') }}</div>
          
          <q-input
            v-model="inputs.project"
            :label="$t('calculator.projectName')"
            filled
            :hint="$t('calculator.projectNameHint')"
          />

          <q-input
            v-model.number="inputs.livingArea_m2"
            type="number"
            :label="$t('calculator.livingArea')"
            filled
            :rules="[(val: number) => val > 0 || $t('calculator.livingAreaRule')]"
            :hint="$t('calculator.livingAreaHint')"
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="inputs.systemVoltage"
                :options="voltageOptions"
                :label="$t('calculator.systemVoltage')"
                filled
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="inputs.phase"
                :options="[1, 3]"
                :label="$t('calculator.phase')"
                filled
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-select
                v-model="inputs.conductorMaterial"
                :options="['Cu', 'Al']"
                :label="$t('calculator.conductorMaterial')"
                filled
                :hint="$t('calculator.conductorMaterialHint')"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                v-model="inputs.terminationTempC"
                :options="[60, 75, 90]"
                :label="$t('calculator.terminationTemp')"
                filled
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model.number="inputs.ambientTempC"
                type="number"
                :label="$t('calculator.ambientTemp')"
                filled
                :hint="$t('calculator.ambientTempHint')"
              />
            </div>
          </div>

          <q-input
            v-model.number="inputs.numConductorsInRaceway"
            type="number"
            :label="$t('calculator.numConductors')"
            filled
            :hint="$t('calculator.numConductorsHint')"
          />

          <q-separator />

          <!-- Step 1: HVAC Loads (CEC 8-200 1)a)iii)) -->
          <div class="text-h6 q-mt-md">{{ $t('calculator.hvac') }}</div>

          <q-input
            v-model.number="inputs.heatingLoadW"
            type="number"
            :label="$t('calculator.heatingLoad')"
            filled
            :hint="$t('calculator.heatingHint')"
          />

          <q-input
            v-model.number="inputs.coolingLoadW"
            type="number"
            :label="$t('calculator.coolingLoad')"
            filled
            :hint="$t('calculator.coolingHint')"
          />

          <q-toggle
            v-model="inputs.isHeatingAcInterlocked"
            :label="$t('calculator.interlocked')"
            :hint="$t('calculator.interlockedHint')"
          />

          <q-separator class="q-my-md" />

          <!-- Step 2: Electric Range (CEC 8-200 1)a)iv)) -->
          <div class="text-h6">{{ $t('calculator.range') }}</div>
          
          <q-toggle
            v-model="inputs.hasElectricRange"
            :label="$t('calculator.hasRange')"
            class="q-mb-md"
          />
          
          <q-input
            v-if="inputs.hasElectricRange"
            v-model.number="inputs.electricRangeRatingKW"
            type="number"
            :label="$t('calculator.rangeRating')"
            filled
            :hint="$t('calculator.rangeHint')"
            class="q-mb-md"
          >
            <template v-slot:append>
              <q-icon name="info">
                <q-tooltip>{{ $t('calculator.rangeTooltip') }}</q-tooltip>
              </q-icon>
            </template>
          </q-input>

          <q-banner v-if="inputs.hasElectricRange" class="bg-info text-white q-my-md">
            <template v-slot:avatar>
              <q-icon name="info" />
            </template>
            {{ $t('calculator.additionalRangesGuidance') }}
          </q-banner>

          <q-separator class="q-my-md" />

          <!-- Step 3: Water Heaters (CEC 8-200 1)a)v)) -->
          <div class="text-h6">{{ $t('calculator.waterHeater') }}</div>

          <q-select
            v-model="inputs.waterHeaterType"
            :options="waterHeaterTypes"
            :label="$t('calculator.waterHeaterType')"
            filled
            emit-value
            map-options
            class="q-mb-md"
          />

          <q-input
            v-if="inputs.waterHeaterType && inputs.waterHeaterType !== 'none'"
            v-model.number="inputs.waterHeaterRatingW"
            type="number"
            :label="$t('calculator.waterHeaterRating')"
            filled
            :hint="getWaterHeaterHint()"
          >
            <template v-slot:append>
              <q-icon name="info">
                <q-tooltip>
                  {{ getWaterHeaterTooltip() }}
                </q-tooltip>
              </q-icon>
            </template>
          </q-input>

          <q-separator class="q-my-md" />

          <!-- Step 4: EVSE (CEC 8-200 1)a)vi)) -->
          <div class="text-h6">{{ $t('calculator.evse') }}</div>
          
          <q-toggle
            v-model="inputs.hasEVSE"
            :label="$t('calculator.hasEVSE')"
            class="q-mb-md"
          />

          <q-input
            v-if="inputs.hasEVSE"
            v-model.number="inputs.evseRatingW"
            type="number"
            :label="$t('calculator.evseRating')"
            filled
            :hint="$t('calculator.evseHint')"
            class="q-mb-md"
          >
            <template v-slot:append>
              <q-icon name="info">
                <q-tooltip>{{ $t('calculator.evseTooltip') }}</q-tooltip>
              </q-icon>
            </template>
          </q-input>

          <q-separator class="q-my-md" />

          <!-- Step 5: Other Appliances (CEC 8-200 1)a)vii)) -->
          <div class="text-h6">{{ $t('calculator.appliancesSection') }}</div>

          <q-expansion-item :label="$t('calculator.addApplianceExpanded')" icon="add_circle">
            <q-card>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-select
                      v-model="newAppliance.type"
                      :options="filteredApplianceTypes"
                      :label="$t('calculator.applianceType')"
                      filled
                      emit-value
                      map-options
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="newAppliance.name"
                      :label="$t('calculator.applianceName')"
                      filled
                      :placeholder="$t('calculator.optional')"
                    />
                  </div>
                </div>

                <q-input
                  v-model.number="newAppliance.watts"
                  type="number"
                  :label="$t('calculator.applianceWatts')"
                  filled
                  class="q-mt-md"
                />

                <q-toggle
                  v-model="newAppliance.isContinuous"
                  :label="$t('calculator.continuousLoad')"
                  class="q-mt-sm"
                />

                <q-btn
                  color="primary"
                  :label="$t('calculator.addAppliance')"
                  icon="add"
                  @click="addAppliance"
                  class="q-mt-md full-width"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <!-- Added Appliances List -->
          <q-list bordered separator v-if="inputs.appliances && inputs.appliances.length > 0">
            <q-item v-for="(appliance, index) in inputs.appliances" :key="index">
              <q-item-section avatar>
                <q-icon :name="getApplianceIcon(appliance.type)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ appliance.name || appliance.type }}</q-item-label>
                <q-item-label caption>
                  {{ appliance.watts }}W
                  <q-badge v-if="appliance.isContinuous" color="orange" :label="$t('calculator.continuous')" class="q-ml-xs" />
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click="removeAppliance(index)"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-md" />

          <!-- Conductor Selection Parameters -->
          <div class="text-h6">{{ $t('calculator.conductorSelectionParams') }}</div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="inputs.conductorMaterial"
                :options="conductorMaterials"
                :label="$t('calculator.conductorMaterial')"
                filled
                emit-value
                map-options
              >
                <template v-slot:append>
                  <q-icon name="info">
                    <q-tooltip>{{ $t('calculator.conductorMaterialTooltip') }}</q-tooltip>
                  </q-icon>
                </template>
              </q-select>
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model.number="inputs.terminationTempC"
                :options="terminationTemps"
                :label="$t('calculator.terminationTemp')"
                filled
                emit-value
                map-options
              >
                <template v-slot:append>
                  <q-icon name="info">
                    <q-tooltip>{{ $t('calculator.terminationTempTooltip') }}</q-tooltip>
                  </q-icon>
                </template>
              </q-select>
            </div>
          </div>

          <q-input
            v-model.number="inputs.ambientTempC"
            type="number"
            :label="$t('calculator.ambientTemp')"
            filled
            :hint="$t('calculator.ambientTempTooltip')"
            class="q-mt-md"
          />

          <q-separator class="q-my-md" />

          <!-- Submit Buttons -->
          <div class="row q-gutter-sm">
            <q-btn
              type="submit"
              color="primary"
              :label="$t('calculator.calculate')"
              icon="calculate"
              :loading="loading"
              size="lg"
              class="col"
            />
            <q-btn
              flat
              color="grey"
              :label="$t('calculator.reset')"
              icon="refresh"
              @click="resetForm"
              :disable="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- 计算结果 -->
    <CalculationResults
      v-if="hasResults"
      :bundle="bundle"
      :calculation-time-ms="calculationTimeMs"
      :is-online="isOnline"
      @show-steps="showStepsDialog = true"
      @download-json="downloadJSON"
      @generate-pdf="generatePDF"
      @save-to-project="saveToProject"
    />

    <!-- 详细步骤对话框 -->
    <q-dialog v-model="showStepsDialog" maximized>
      <AuditTrail
        :steps="steps"
        @close="showStepsDialog = false"
      />
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { useOfflineCalculation } from '../composables/useOfflineCalculation';
import { generateLoadCalculationPDF } from '../services/pdfGenerator';
import CalculationResults from '../components/calculator/CalculationResults.vue';
import AuditTrail from '../components/audit/AuditTrail.vue';
// import type { CecInputsSingle, Appliance, ContinuousLoad } from '@tradespro/calculation-service';

// 临时类型定义
interface Appliance {
  id?: string;
  name?: string;
  watts?: number;
  type?: string;
  isContinuous?: boolean;
}

interface ContinuousLoad {
  id?: string;
  name?: string;
  watts: number;
  type?: string;
}

interface CecInputsSingle {
  id?: string;
  project?: string;
  livingArea_m2?: number;
  systemVoltage: number;
  phase?: 1 | 3;
  appliances?: Appliance[];
  continuousLoads?: ContinuousLoad[];
  heatingLoadW?: number;
  coolingLoadW?: number;
  isHeatingAcInterlocked?: boolean;
  hasElectricRange?: boolean;
  electricRangeRatingKW?: number;
  numAdditionalRanges?: number;
  hasEVSE?: boolean;
  evseRatingW?: number;
  waterHeaterType?: string;
  waterHeaterRatingW?: number;
  conductorMaterial?: string;
  terminationTempC?: number;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
  [key: string]: any;
}

// import { tableManager } from '@tradespro/calculation-service';

// 临时模拟tableManager
const tableManager = {
  loadTables: async () => ({ 
    table2: { entries: [] }, 
    table4: { entries: [] },
    table5A: { entries: [] },
    table5C: { entries: [] }
  })
};

onMounted(async () => {
  console.log('🔍 Testing table loading...');
  try {
    const tables = await tableManager.loadTables();
    console.log('✅ Tables loaded:', tables);
    console.log('📊 Table2:', tables.table2);
    console.log('📊 Table4:', tables.table4);
  } catch (error) {
    console.error('❌ Table loading failed:', error);
  }
});

// Access i18n in legacy mode
const instance = getCurrentInstance();
const locale = computed(() => instance?.proxy?.$i18n?.locale || 'en-CA');
// Use 'translate' instead of '$t' to avoid conflict with vue-i18n auto-injection
const translate = (key: string, params?: any) => {
  return instance?.proxy?.$t(key, params) || key;
};

const $q = useQuasar();
const {
  bundle,
  loading,
  error,
  calculationTimeMs,
  hasResults,
  steps,
  calculateLocally,
  downloadJSON: downloadJSONFile,
  reset
} = useOfflineCalculation();

const isOnline = ref(navigator.onLine);
const showStepsDialog = ref(false);

// 输入数据
const inputs = reactive<CecInputsSingle>({
  project: '',
  livingArea_m2: 150,
  systemVoltage: 240,
  phase: 1,
  conductorMaterial: 'Cu',
  terminationTempC: 75,
  ambientTempC: 30,
  numConductorsInRaceway: 3,
  appliances: [],
  continuousLoads: [],
  heatingLoadW: 0,
  coolingLoadW: 0,
  isHeatingAcInterlocked: false,
  hasElectricRange: false,
  electricRangeRatingKW: 12,
  numAdditionalRanges: 0,
  hasEVSE: false,
  evseRatingW: 0,
  waterHeaterType: 'none',
  waterHeaterRatingW: 0
});

// 新电器输入
const newAppliance = reactive({
  type: 'other',
  name: '',
  watts: 0,
  isContinuous: false
});

// Options Data - using computed for reactivity
const voltageOptions = [120, 208, 240, 277, 480, 600];

const conductorMaterials = computed(() => [
  { label: 'Copper (Cu)', value: 'Cu' },
  { label: 'Aluminum (Al)', value: 'Al' }
]);

const terminationTemps = computed(() => [
  { label: '60°C', value: 60 },
  { label: '75°C', value: 75 },
  { label: '90°C', value: 90 }
]);

const waterHeaterTypes = computed(() => [
  { label: translate('calculator.waterHeaterNone'), value: 'none' },
  { label: translate('calculator.waterHeaterStorage'), value: 'storage' },
  { label: translate('calculator.waterHeaterTankless'), value: 'tankless' },
  { label: translate('calculator.waterHeaterPoolSpa'), value: 'pool_spa' }
]);

const applianceTypes = computed(() => [
  { label: translate('applianceTypes.range'), value: 'range' },
  { label: translate('applianceTypes.space_heating'), value: 'space_heating' },
  { label: translate('applianceTypes.air_conditioning'), value: 'air_conditioning' },
  { label: translate('applianceTypes.tankless_water_heater'), value: 'tankless_water_heater' },
  { label: translate('applianceTypes.pool_spa'), value: 'pool_spa' },
  { label: translate('applianceTypes.evse'), value: 'evse' },
  { label: translate('applianceTypes.water_heater'), value: 'water_heater' },
  { label: translate('applianceTypes.other'), value: 'other' }
]);

// Filtered appliance types - only show 'range' if primary range is configured
const filteredApplianceTypes = computed(() => {
  const types = applianceTypes.value;
  
  // Only show 'range' option if hasElectricRange is true and has a rating
  if (!inputs.hasElectricRange || !inputs.electricRangeRatingKW || inputs.electricRangeRatingKW <= 0) {
    // Filter out 'range' option
    return types.filter(t => t.value !== 'range');
  }
  
  return types;
});

// 监听在线状态
onMounted(() => {
  window.addEventListener('online', () => { isOnline.value = true; });
  window.addEventListener('offline', () => { isOnline.value = false; });
});

// 添加电器
function addAppliance() {
  console.log('🔵 Adding appliance:', newAppliance);
  
  if (newAppliance.watts > 0) {
    // Initialize arrays if needed
    if (!inputs.appliances) inputs.appliances = [];
    if (!inputs.continuousLoads) inputs.continuousLoads = [];

    const appliance: Appliance = {
      type: newAppliance.type as Appliance['type'],
      name: newAppliance.name || undefined,
      watts: newAppliance.watts,
      isContinuous: newAppliance.isContinuous
    };

    // Always add to appliances array for display
    inputs.appliances.push(appliance);
    console.log('✅ Added to appliances');

    // If continuous, also add to continuousLoads for calculation
    if (newAppliance.isContinuous) {
      (inputs.continuousLoads as ContinuousLoad[]).push({
        name: newAppliance.name || newAppliance.type,
        watts: newAppliance.watts,
        type: newAppliance.type === 'space_heating' || newAppliance.type === 'air_conditioning' ? newAppliance.type : undefined,
      });
      console.log('✅ Also added to continuousLoads for calculation');
    }

    console.log('📊 Current appliances:', inputs.appliances);
    console.log('📊 Current continuousLoads:', inputs.continuousLoads);

    // 重置表单
    newAppliance.type = 'other';
    newAppliance.name = '';
    newAppliance.watts = 0;
    newAppliance.isContinuous = false;

    $q.notify({
      type: 'positive',
      message: translate('calculator.messages.applianceAdded'),
      position: 'top'
    });
  } else {
    console.log('⚠️ Watts must be greater than 0');
    $q.notify({
      type: 'warning',
      message: 'Please enter power (watts) greater than 0',
      position: 'top'
    });
  }
}

// 移除电器
function removeAppliance(index: number) {
  inputs.appliances!.splice(index, 1);
}

// 获取电器图标
function getApplianceIcon(type?: string): string {
  const icons: Record<string, string> = {
    range: 'kitchen',
    space_heating: 'thermostat',
    air_conditioning: 'ac_unit',
    tankless_water_heater: 'water_drop',
    pool_spa: 'pool',
    evse: 'ev_station',
    water_heater: 'water_heater',
    other: 'power'
  };
  return icons[type || 'other'] || 'power';
}

// 执行计算
async function onCalculate() {
  console.log('📤 Sending to engine:', inputs); 
  const result = await calculateLocally(inputs);

  if (result) {
    $q.notify({
      type: 'positive',
      message: translate('calculator.messages.calculationComplete', { time: calculationTimeMs.value.toFixed(0) }),
      position: 'top',
      icon: 'check_circle'
    });
  } else if (error.value) {
    $q.notify({
      type: 'negative',
      message: error.value,
      position: 'top'
    });
  }
}

// Water heater hints
function getWaterHeaterHint() {
  if (inputs.waterHeaterType === 'tankless' || inputs.waterHeaterType === 'pool_spa') {
    return translate('calculator.waterHeaterHintTanklessPoolSpa');
  }
  return translate('calculator.waterHeaterHintStorage');
}

function getWaterHeaterTooltip() {
  if (inputs.waterHeaterType === 'tankless') {
    return translate('calculator.waterHeaterTooltipTankless');
  } else if (inputs.waterHeaterType === 'pool_spa') {
    return translate('calculator.waterHeaterTooltipPoolSpa');
  } else if (inputs.waterHeaterType === 'storage') {
    return translate('calculator.waterHeaterTooltipStorage');
  }
  return '';
}

// 重置表单
function resetForm() {
  Object.assign(inputs, {
    project: '',
    livingArea_m2: 150,
    systemVoltage: 240,
    phase: 1,
    conductorMaterial: 'Cu',
    terminationTempC: 75,
    ambientTempC: 30,
    numConductorsInRaceway: 3,
    appliances: [],
    continuousLoads: [],
    isHeatingAcInterlocked: false,
    heatingLoadW: 0,
    coolingLoadW: 0
  });
  reset();
}

// Download JSON
function downloadJSON() {
  downloadJSONFile();
  $q.notify({
    type: 'positive',
    message: translate('calculator.messages.jsonDownloaded'),
    position: 'top'
  });
}

// Generate PDF
async function generatePDF() {
  console.log('🔵 PDF button clicked');
  console.log('Bundle exists:', !!bundle.value);
  
  if (!bundle.value) {
    console.log('⚠️ No bundle available');
    $q.notify({
      type: 'warning',
      message: translate('calculator.messages.pleaseCalculateFirst'),
      position: 'top'
    });
    return;
  }

  console.log('📄 Starting PDF generation...', { locale: locale.value });
  
  try {
    $q.loading.show({
      message: translate('calculator.messages.generatingPDF')
    });

    console.log('📦 Calling generateLoadCalculationPDF...');
    await generateLoadCalculationPDF(bundle.value, locale.value);
    console.log('✅ PDF generation completed');

    $q.loading.hide();
    $q.notify({
      type: 'positive',
      message: translate('calculator.messages.pdfGenerated'),
      position: 'top',
      icon: 'picture_as_pdf'
    });
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    $q.loading.hide();
    $q.notify({
      type: 'negative',
      message: translate('calculator.messages.pdfGenerationFailed', { error: error instanceof Error ? error.message : String(error) }),
      position: 'top'
    });
  }
}

// Save to Project (requires online)
function saveToProject() {
  if (!isOnline.value) {
    $q.notify({
      type: 'warning',
      message: translate('calculator.messages.networkRequired'),
      position: 'top'
    });
    return;
  }

  $q.notify({
    type: 'info',
    message: translate('calculator.messages.savingToCloud'),
    position: 'top'
  });
}
</script>

<style scoped>
.scroll {
  overflow-y: auto;
}
</style>