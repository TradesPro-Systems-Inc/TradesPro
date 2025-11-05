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
          <div class="text-h5" :class="$q.dark.isActive ? '' : 'text-dark'">{{ $t('calculator.title') }}</div>
          <q-space />
          <!-- History Button -->
          <q-btn
            flat
            round
            icon="history"
            color="primary"
            @click="showHistoryDrawer = true"
            class="q-mr-sm"
          >
            <q-tooltip>{{ $t('calculator.calculationHistory') }}</q-tooltip>
            <q-badge v-if="calculationsStore.calculationsCount > 0" color="red" floating>
              {{ calculationsStore.calculationsCount }}
            </q-badge>
          </q-btn>
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
          <q-chip 
            :color="codeType === 'cec' ? 'red' : 'blue'" 
            text-color="white"
            icon="description"
            class="text-weight-bold"
          >
            {{ codeType.toUpperCase() }} {{ codeReference }}
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
          <div class="text-h6" :class="$q.dark.isActive ? '' : 'text-dark'">{{ $t('calculator.basicInfo') }}</div>
          
          <!-- Project Selection -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-select
                v-model="selectedProjectId"
                :options="projectOptions"
                :label="$t('calculator.selectProject')"
                filled
                clearable
                use-input
                input-debounce="0"
                emit-value
                map-options
                option-value="value"
                option-label="label"
                @filter="filterProjects"
                @update:model-value="onProjectSelected"
                :hint="$t('calculator.projectSelectionHint')"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption v-if="scope.opt.client_name || scope.opt.location">
                        {{ [scope.opt.client_name, scope.opt.location].filter(Boolean).join(' • ') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      {{ $t('calculator.noProjectsFound') }}
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col-12 col-md-4">
              <q-btn
                flat
                color="primary"
                icon="add"
                :label="$t('calculator.createProject')"
                @click="goToProjectsPage"
                class="full-width"
              />
            </div>
          </div>
          
          <!-- Custom project name (for preview mode only) -->
          <q-input
            v-if="!selectedProjectId"
            v-model="inputs.project"
            :label="$t('calculator.projectName')"
            filled
            :hint="$t('calculator.customProjectNameHint')"
          />

          <!-- Code Type Selection (CEC/NEC) -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="codeType"
                :options="codeTypeOptions"
                :label="$t('calculator.codeType')"
                filled
                :hint="$t('calculator.codeTypeHint')"
                emit-value
                map-options
              >
                <template v-slot:selected>
                  <span v-if="codeType" class="text-h6 q-mr-sm">
                    {{ codeTypeOptions.find(opt => opt.value === codeType)?.flag }}
                  </span>
                  <span>{{ codeTypeOptions.find(opt => opt.value === codeType)?.label || '' }}</span>
                </template>
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <span class="text-h5">{{ scope.opt.flag }}</span>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
            <div class="col-12 col-sm-6" v-if="codeType === 'nec'">
              <q-select
                v-model="necMethod"
                :options="necMethodOptions"
                :label="$t('calculator.necMethod')"
                filled
                :hint="$t('calculator.necMethodHint')"
                emit-value
                map-options
              />
            </div>
          </div>

          <q-input
            v-model.number="inputs.livingArea_m2"
            type="number"
            :label="$t('calculator.livingArea')"
            filled
            :rules="[(val: number) => val > 0 || $t('calculator.livingAreaRule')]"
            :hint="codeType === 'cec' ? $t('calculator.livingAreaHint') : $t('calculator.livingAreaHintNec')"
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

          <!-- Step 1: HVAC Loads -->
          <div class="text-h6 q-mt-md" :class="$q.dark.isActive ? '' : 'text-dark'">
            {{ step1Title }}
            <q-chip size="sm" :color="codeType === 'cec' ? 'red' : 'blue'" text-color="white" class="q-ml-sm">
              {{ codeReference }}
            </q-chip>
          </div>

          <q-input
            v-model.number="inputs.heatingLoadW"
            type="number"
            :label="$t('calculator.heatingLoad')"
            filled
            :hint="step1Hint"
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
            :label="codeType === 'cec' ? $t('calculator.interlocked') : ($t('calculator.interlockedNec') || $t('calculator.interlocked'))"
            :hint="codeType === 'cec' ? $t('calculator.interlockedHint') : ($t('calculator.interlockedHintNec') || $t('calculator.interlockedHint'))"
          />

          <q-separator class="q-my-md" />

          <!-- Step 2: Electric Range -->
          <div class="text-h6" :class="$q.dark.isActive ? '' : 'text-dark'">
            {{ step2Title }}
            <q-chip size="sm" :color="codeType === 'cec' ? 'red' : 'blue'" text-color="white" class="q-ml-sm">
              {{ codeReference }}
            </q-chip>
          </div>
          
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
            :hint="step2Hint"
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

          <!-- Step 3: Water Heaters -->
          <div class="text-h6" :class="$q.dark.isActive ? '' : 'text-dark'">
            {{ step3Title }}
            <q-chip size="sm" :color="codeType === 'cec' ? 'red' : 'blue'" text-color="white" class="q-ml-sm">
              {{ codeReference }}
            </q-chip>
          </div>

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

          <!-- Step 4: EVSE -->
          <div class="text-h6" :class="$q.dark.isActive ? '' : 'text-dark'">
            {{ step4Title }}
            <q-chip size="sm" :color="codeType === 'cec' ? 'red' : 'blue'" text-color="white" class="q-ml-sm">
              {{ codeReference }}
            </q-chip>
          </div>
          
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
            :hint="step4Hint"
            class="q-mb-md"
          >
            <template v-slot:append>
              <q-icon name="info">
                <q-tooltip>{{ $t('calculator.evseTooltip') }}</q-tooltip>
              </q-icon>
            </template>
          </q-input>

          <q-separator class="q-my-md" />

          <!-- Step 5: Other Appliances -->
          <div class="text-h6" :class="$q.dark.isActive ? '' : 'text-dark'">
            {{ step5Title }}
            <q-chip size="sm" :color="codeType === 'cec' ? 'red' : 'blue'" text-color="white" class="q-ml-sm">
              {{ codeReference }}
            </q-chip>
          </div>

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

                <!-- EVEMS toggle for EVSE only -->
                <q-toggle
                  v-if="newAppliance.type === 'evse'"
                  v-model="newAppliance.hasEVEMS"
                  label="Has EVEMS (Energy Management System)"
                  class="q-mt-sm"
                  color="green"
                >
                  <q-tooltip>
                    If EVSE is managed by an Energy Management System (EVEMS), 
                    it can be exempted from load calculation per CEC 8-106 11)
                  </q-tooltip>
                </q-toggle>

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
          <div class="text-h6" :class="$q.dark.isActive ? '' : 'text-dark'">{{ $t('calculator.conductorSelectionParams') }}</div>

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
          <div class="row justify-center q-gutter-md q-mt-md">
            <q-btn
              type="submit"
              color="primary"
              :label="$t('calculator.calculate')"
              icon="calculate"
              :loading="loading"
              size="md"
              unelevated
              class="q-px-xl"
            />
            <q-btn
              flat
              color="grey"
              :label="$t('calculator.reset')"
              icon="refresh"
              @click="resetForm"
              :disable="loading"
              size="md"
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
      :is-preview="isPreview"
      :is-signed="isSigned"
      :signing="officialLoading"
      @show-steps="showStepsDialog = true"
      @download-json="downloadJSON"
      @generate-pdf="generatePDF"
      @save-to-project="saveToProject"
      @execute-official="executeOfficialCalculation"
      @sign-bundle="handleSignBundle"
    />

    <!-- Detailed steps dialog -->
    <q-dialog v-model="showStepsDialog" maximized>
      <AuditTrail
        :steps="steps as any"
        @close="showStepsDialog = false"
      />
    </q-dialog>

    <!-- ✅ Calculation History Drawer -->
    <q-drawer
      v-model="showHistoryDrawer"
      side="right"
      bordered
      overlay
      :width="400"
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header class="text-h6">
            <q-icon name="history" class="q-mr-sm" />
            {{ $t('calculator.calculationHistory') }}
            <q-chip size="sm" color="primary" text-color="white" class="q-ml-sm">
              {{ calculationsStore.calculationsCount }}
            </q-chip>
          </q-item-label>

          <q-separator class="q-mb-md" />

          <div v-if="recentCalculations.length === 0" class="q-pa-md text-center text-grey-6">
            <q-icon name="history" size="48px" class="q-mb-md" />
            <div>{{ $t('calculator.noHistory') }}</div>
          </div>

          <q-item
            v-for="calc in recentCalculations"
            :key="calc.id"
            clickable
            v-ripple
            class="q-mb-sm"
            @click="loadCalculation(calc)"
          >
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ calc.inputs.project || $t('calculator.untitledProject') }}
              </q-item-label>
              <q-item-label caption>
                <q-icon name="home" size="xs" />
                {{ calc.inputs.livingArea_m2 }}m² · 
                <q-icon name="bolt" size="xs" />
                {{ calc.results.serviceCurrentA }}A
              </q-item-label>
              <q-item-label caption class="text-grey-6">
                <q-icon name="access_time" size="xs" />
                {{ new Date(calc.createdAt).toLocaleString() }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="delete"
                size="sm"
                color="negative"
                @click.stop="deleteCalculation(calc.id)"
              >
                <q-tooltip>{{ $t('calculator.deleteCalculation') }}</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" v-if="recentCalculations.length > 0" />

          <q-item clickable v-ripple @click="exportHistory" v-if="recentCalculations.length > 0">
            <q-item-section avatar>
              <q-icon name="download" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('calculator.exportHistory') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="confirmClearHistory" v-if="recentCalculations.length > 0">
            <q-item-section avatar>
              <q-icon name="delete_sweep" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('calculator.clearHistory') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, getCurrentInstance } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useOfflineCalculation } from '../composables/useOfflineCalculation';
import { useCecCalculation } from '../composables/useCecCalculation';
import { generateLoadCalculationPDF } from '../services/pdfGenerator';
import CalculationResults from '../components/calculator/CalculationResults.vue';
import AuditTrail from '../components/audit/AuditTrail.vue';
// Pinia Stores Integration
import { useCalculationsStore, useSettingsStore, useProjectsStore, useUserStore } from '../pinia-stores';
import { storeToRefs } from 'pinia';
// Import browser version of tableManager
import { tableManagerBrowser as tableManager } from '@tradespro/calculation-engine';

// Type definitions (temporary until calculation-engine types are properly exported)
interface Appliance {
  id?: string;
  name?: string;
  watts?: number;
  type?: 'range' | 'space_heating' | 'air_conditioning' | 'tankless_water_heater' | 'pool_spa' | 'evse' | 'water_heater' | 'other';
  isContinuous?: boolean;
  rating_kW?: number;  // For range: kW rating
  hasEVEMS?: boolean;  // For EVSE: Energy Management System
}

interface ContinuousLoad {
  id?: string;
  name?: string;
  watts: number;
  type?: 'range' | 'space_heating' | 'air_conditioning' | 'tankless_water_heater' | 'pool_spa' | 'evse' | 'water_heater' | 'other';
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
  conductorMaterial?: 'Cu' | 'Al';
  terminationTempC?: number;
  ambientTempC?: number;
  numConductorsInRaceway?: number;
  [key: string]: any;
}

onMounted(async () => {
  console.log('🔍 Testing table loading...');
  try {
    // Load tables for the selected code type and edition
    const codeEdition = codeType.value === 'nec' ? '2023' : '2024';
    const tables = await tableManager.loadTables(codeType.value, codeEdition as '2021' | '2024' | '2027');
    console.log('✅ Tables loaded:', tables);
    console.log('📊 Table2 entries:', tables.table2?.entries?.length || 0);
    console.log('📊 Table4 entries:', tables.table4?.entries?.length || 0);
  } catch (error) {
    console.error('❌ Table loading failed:', error);
  }
  
  // Fetch projects on mount (only if user is authenticated)
  const userStore = useUserStore();
  if (userStore.isAuthenticated && projects.value.length === 0) {
    await projectsStore.fetchProjects();
  } else if (!userStore.isAuthenticated) {
    // User not authenticated, skip fetching projects
    // This prevents unnecessary 401/403 errors
    console.log('ℹ️ User not authenticated, skipping project fetch');
  }
  
  // If currentProject is set, sync with selectedProjectId
  if (currentProject.value) {
    selectedProjectId.value = currentProject.value.id;
    inputs.project = currentProject.value.name;
  } else if (projects.value.length > 0) {
    // Auto-select first project if available and no current project is set
    // (Optional - comment out if you don't want auto-selection)
    // selectedProjectId.value = projects.value[0].id;
    // projectsStore.setCurrentProject(projects.value[0]);
    // inputs.project = projects.value[0].name;
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
const router = useRouter();

// Initialize Pinia Stores
const calculationsStore = useCalculationsStore();
const settingsStore = useSettingsStore();
const projectsStore = useProjectsStore();

const { cecVersion } = storeToRefs(settingsStore);

// Code Type Selection (CEC/NEC)
const codeType = ref<'cec' | 'nec'>('cec');
const necMethod = ref<'standard' | 'optional'>('standard');

// Computed properties for dynamic text based on code type
const step1Title = computed(() => {
  return codeType.value === 'cec' 
    ? translate('calculator.hvac')
    : translate('calculator.hvac') || 'Heating and Cooling'; // Use same for now, can add NEC-specific later
});

const step1Hint = computed(() => {
  return codeType.value === 'cec'
    ? translate('calculator.heatingHint')
    : translate('calculator.heatingHintNec') || translate('calculator.heatingHint');
});

const step2Title = computed(() => {
  return codeType.value === 'cec'
    ? translate('calculator.range')
    : translate('calculator.rangeNec') || translate('calculator.range');
});

const step2Hint = computed(() => {
  return codeType.value === 'cec'
    ? translate('calculator.rangeHint')
    : translate('calculator.rangeHintNec') || translate('calculator.rangeHint');
});

const step3Title = computed(() => {
  return codeType.value === 'cec'
    ? translate('calculator.waterHeater')
    : translate('calculator.waterHeaterNec') || translate('calculator.waterHeater');
});

const step4Title = computed(() => {
  return codeType.value === 'cec'
    ? translate('calculator.evse')
    : translate('calculator.evseNec') || translate('calculator.evse');
});

const step4Hint = computed(() => {
  return codeType.value === 'cec'
    ? translate('calculator.evseHint')
    : translate('calculator.evseHintNec') || translate('calculator.evseHint');
});

const step5Title = computed(() => {
  return codeType.value === 'cec'
    ? translate('calculator.appliancesSection')
    : translate('calculator.appliancesSectionNec') || translate('calculator.appliancesSection');
});

const codeReference = computed(() => {
  if (codeType.value === 'cec') {
    return 'CEC 8-200';
  } else {
    return necMethod.value === 'optional' ? 'NEC 220.82' : 'NEC 220';
  }
});

const codeTypeOptions = [
  {
    value: 'cec',
    label: translate('calculator.codeTypeCEC'),
    description: translate('calculator.codeTypeCECDesc'),
    flag: '🇨🇦', // Canada flag
    icon: 'flag', // Keep for backward compatibility
    color: 'red'
  },
  {
    value: 'nec',
    label: translate('calculator.codeTypeNEC'),
    description: translate('calculator.codeTypeNECDesc'),
    flag: '🇺🇸', // United States flag
    icon: 'flag', // Keep for backward compatibility
    color: 'blue'
  }
];

const necMethodOptions = [
  {
    value: 'standard',
    label: translate('calculator.necMethodStandard'),
    description: translate('calculator.necMethodStandardDesc')
  },
  {
    value: 'optional',
    label: translate('calculator.necMethodOptional'),
    description: translate('calculator.necMethodOptionalDesc')
  }
];
const { currentProject, projects } = storeToRefs(projectsStore);
const { recentCalculations } = storeToRefs(calculationsStore);

// Offline calculation composable (for preview)
const {
  bundle: previewBundle,
  loading: previewLoading,
  error: previewError,
  calculationTimeMs: previewCalculationTimeMs,
  hasResults: hasPreviewResults,
  steps: previewSteps,
  calculateLocally,
  isPreview,
  downloadJSON: downloadJSONFile,
  reset: resetPreview
} = useOfflineCalculation();

// Official calculation composable (V4.1 Architecture)
const {
  bundle: officialBundle,
  loading: officialLoading,
  error: officialError,
  calculationTimeMs: officialCalculationTimeMs,
  hasResults: hasOfficialResults,
  steps: officialSteps,
  isSigned,
  executeCalculation,
  signCalculation,
  reset: resetOfficial
} = useCecCalculation();

// Combined state (preview or official)
const bundle = computed(() => officialBundle.value || previewBundle.value);
const loading = computed(() => officialLoading.value || previewLoading.value);
const error = computed(() => officialError.value || previewError.value);
const calculationTimeMs = computed(() => officialCalculationTimeMs.value || previewCalculationTimeMs.value);
const hasResults = computed(() => hasOfficialResults.value || hasPreviewResults.value);
const steps = computed(() => officialSteps.value.length > 0 ? officialSteps.value : previewSteps.value);

const isOnline = ref(navigator.onLine);
const showStepsDialog = ref(false);
const showHistoryDrawer = ref(false);

// Project selection
const selectedProjectId = ref<string | null>(null);
const projectFilterQuery = ref('');

// Computed project options for select
const projectOptions = computed(() => {
  let filtered = projects.value || [];
  
  // Apply filter if search query exists
  if (projectFilterQuery.value) {
    const query = projectFilterQuery.value.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.location?.toLowerCase().includes(query) ||
      p.client_name?.toLowerCase().includes(query)
    );
  }
  
  // Convert to select options format
  return filtered.map(p => ({
    value: p.id,
    label: p.name,
    description: p.description,
    location: p.location,
    client_name: p.client_name
  }));
});

// Filter projects for select dropdown
function filterProjects(val: string, update: (callback: () => void) => void) {
  projectFilterQuery.value = val;
  update(() => {
    // Options are already filtered in computed property
  });
}

// Handle project selection
function onProjectSelected(projectOption: any) {
  if (!projectOption) {
    selectedProjectId.value = null;
    projectsStore.clearCurrentProject();
    inputs.project = '';
    return;
  }
  
  // Extract project ID from option object or string
  const projectId = projectOption.value || projectOption;
  const project = projects.value.find(p => p.id === String(projectId));
  
  if (project) {
    selectedProjectId.value = project.id;
    projectsStore.setCurrentProject(project);
    inputs.project = project.name; // Set project name for display
    
    $q.notify({
      type: 'positive',
      message: translate('calculator.projectSelected') || `Selected project: ${project.name}`,
      position: 'top',
      timeout: 2000,
      icon: 'check_circle'
    });
  }
}

// Navigate to projects page to create new project
function goToProjectsPage() {
  router.push('/projects');
}

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
  isContinuous: false,
  hasEVEMS: false  // For EVSE
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

// All appliance types are available
// No filtering needed - users can add any appliance type directly
const filteredApplianceTypes = computed(() => {
  return applianceTypes.value;
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

    // For range: calculate rating_kW
    if (newAppliance.type === 'range') {
      appliance.rating_kW = newAppliance.watts / 1000;
      console.log(`🔥 Range: ${newAppliance.watts}W = ${appliance.rating_kW}kW`);
    }

    // For EVSE: add hasEVEMS flag
    if (newAppliance.type === 'evse') {
      appliance.hasEVEMS = newAppliance.hasEVEMS;
      console.log(`⚡ EVSE: ${newAppliance.watts}W, EVEMS: ${appliance.hasEVEMS}`);
    }

    // Always add to appliances array for display
    inputs.appliances.push(appliance);
    console.log('✅ Added to appliances:', appliance);

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
    newAppliance.hasEVEMS = false;

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

// Execute calculation (preview mode)
async function onCalculate() {
  console.log('📤 Preview calculation:', inputs);
  
  // Prepare inputs with correct types
  const calculationInputs: any = {
    ...inputs,
    waterHeaterType: inputs.waterHeaterType as 'pool_spa' | 'none' | 'storage' | 'tankless' | undefined
  };
  
  const result = await calculateLocally(calculationInputs, codeType.value, necMethod.value);

  if (result && bundle.value) {
    // Save calculation to history (preview mode)
    const calculationToSave = {
      ...bundle.value,
      projectId: currentProject.value?.id || selectedProjectId.value || undefined,
      project: inputs.project || currentProject.value?.name || 'Untitled',
      isPreview: true
    };
    
    calculationsStore.addCalculation(calculationToSave as any);
    
    $q.notify({
      type: 'info',
      message: translate('calculator.messages.previewComplete', { time: calculationTimeMs.value.toFixed(0) }),
      position: 'top',
      icon: 'visibility'
    });
    
    console.log('✅ Preview calculation saved to history. Total:', calculationsStore.calculationsCount);
  } else if (error.value) {
    $q.notify({
      type: 'negative',
      message: error.value,
      position: 'top'
    });
  }
}

// V4.1 Architecture: Execute official calculation on backend
async function executeOfficialCalculation() {
  // Check if user is authenticated
  const userStore = useUserStore();
  const { isAuthenticated } = storeToRefs(userStore);
  
  if (!isAuthenticated.value) {
    $q.dialog({
      title: translate('calculator.errors.authenticationRequired'),
      message: translate('calculator.errors.loginRequired'),
      ok: true,
      persistent: true
    }).onOk(() => {
      // Navigate to login page or show login dialog
      // For now, just show a message
      $q.notify({
        type: 'info',
        message: translate('calculator.errors.pleaseLogin'),
        position: 'top',
        timeout: 3000,
        icon: 'login'
      });
    });
    return;
  }

  // Use selectedProjectId if currentProject is not set
  const projectToUse = currentProject.value || (selectedProjectId.value ? projects.value.find(p => p.id === selectedProjectId.value) : null);
  
  if (!projectToUse?.id) {
    $q.dialog({
      title: translate('calculator.errors.noProject'),
      message: translate('calculator.errors.selectProjectFirst'),
      ok: true
    });
    return;
  }
  
  // Ensure currentProject is set
  if (!currentProject.value) {
    projectsStore.setCurrentProject(projectToUse);
  }

  if (!isOnline.value) {
    $q.notify({
      type: 'negative',
      message: translate('calculator.errors.notFound'),
      position: 'top',
      timeout: 5000,
      icon: 'cloud_off'
    });
    return;
  }

  // Validate inputs before sending
  if (!inputs.livingArea_m2 || inputs.livingArea_m2 <= 0) {
    $q.notify({
      type: 'negative',
      message: translate('calculator.errors.invalidLivingArea') || 'Living area must be a positive number. Please enter a valid living area.',
      position: 'top',
      timeout: 5000,
      icon: 'error'
    });
    return;
  }

  // Use useCecCalculation composable
  // Convert inputs to proper format (fix type issues)
  const calculationInputs: any = {
    ...inputs,
    // Ensure livingArea_m2 is a positive number
    livingArea_m2: Number(inputs.livingArea_m2) || 0,
    waterHeaterType: inputs.waterHeaterType as 'pool_spa' | 'none' | 'storage' | 'tankless' | undefined
  };
  
  // Ensure projectId is a valid integer (not a timestamp)
  // Backend expects INTEGER (max 2147483647), not BIGINT
  const projectToUseForCalc = currentProject.value || projectToUse;
  const projectIdStr = String(projectToUseForCalc?.id || '0');
  let projectId = parseInt(projectIdStr, 10);
  
  // Validate project ID is within INTEGER range
  if (isNaN(projectId) || projectId <= 0 || projectId > 2147483647) {
    $q.notify({
      type: 'negative',
      message: translate('calculator.errors.invalidProjectId') || 'Invalid project ID. Please select a valid project.',
      position: 'top',
      timeout: 5000,
      icon: 'error'
    });
    return;
  }
  
  try {
    const calculation = await executeCalculation(calculationInputs, projectId, codeType.value, necMethod.value);
    
    if (calculation) {
      // Calculation executed successfully
      // Bundle is already updated in the composable
      
      // Save to history
      if (officialBundle.value) {
        calculationsStore.addCalculation(officialBundle.value as any);
      }
      
      $q.notify({
        type: 'positive',
        message: translate('calculator.messages.officialCalculationComplete'),
        position: 'top',
        icon: 'verified',
        timeout: 3000
      });
      
      console.log('✅ Official calculation executed and saved. ID:', calculation.id);
    } else if (officialError.value) {
      // Handle API errors with user-friendly messages
      // Ensure errorMessage is a string
      let errorMessage = typeof officialError.value === 'string' 
        ? officialError.value 
        : String(officialError.value || 'Unknown error');
      
      // Check if error is a network or 404 error
      const errorLower = errorMessage.toLowerCase();
      if (errorLower.includes('not found') || 
          errorLower.includes('404') ||
          errorLower.includes('network')) {
        errorMessage = translate('calculator.errors.notFound');
      } else if (errorLower.includes('failed')) {
        errorMessage = translate('calculator.errors.calculationFailed');
      } else if (errorLower.includes('422') || errorLower.includes('unprocessable')) {
        errorMessage = translate('calculator.errors.validationFailed') || 'Invalid calculation inputs. Please check your inputs and try again.';
      } else if (errorLower.includes('403') || errorLower.includes('forbidden')) {
        errorMessage = translate('calculator.errors.authenticationRequired');
      } else if (errorLower.includes('401') || errorLower.includes('unauthorized')) {
        errorMessage = translate('calculator.errors.authenticationRequired');
      }
      
      $q.notify({
        type: 'negative',
        message: errorMessage,
        position: 'top',
        timeout: 5000,
        icon: 'error'
      });
    }
  } catch (err: any) {
    console.error('❌ Execute official calculation error:', err);
    $q.notify({
      type: 'negative',
      message: translate('calculator.errors.notFound'),
      position: 'top',
      timeout: 5000,
      icon: 'error'
    });
  }
}

// V4.1 Architecture: Sign calculation bundle after user approval
async function handleSignBundle() {
  if (!officialBundle.value || !officialBundle.value.id) {
    $q.notify({
      type: 'warning',
      message: translate('calculator.errors.noCalculationToSign'),
      position: 'top'
    });
    return;
  }

  // Confirm signing
  $q.dialog({
    title: translate('calculator.signBundle'),
    message: translate('calculator.signBundleConfirm'),
    cancel: true,
    persistent: true,
    ok: {
      label: translate('calculator.sign'),
      color: 'positive'
    }
  }).onOk(async () => {
    const calcId = officialBundle.value?.id;
    if (!calcId) {
      $q.notify({
        type: 'negative',
        message: translate('calculator.errors.noCalculationToSign'),
        position: 'top'
      });
      return;
    }
    const signedCalculation = await signCalculation(calcId);
    
    if (signedCalculation) {
      // Bundle is already updated in the composable
      
      // Save to history
      if (officialBundle.value) {
        calculationsStore.addCalculation(officialBundle.value as any);
      }
      
      $q.notify({
        type: 'positive',
        message: translate('calculator.messages.bundleSigned'),
        position: 'top',
        icon: 'verified',
        timeout: 3000
      });
      
      console.log('✅ Bundle signed successfully. ID:', signedCalculation.id);
    } else if (officialError.value) {
      $q.notify({
        type: 'negative',
        message: officialError.value,
        position: 'top',
        timeout: 5000
      });
    }
  });
}

// Calculation History Functions
function loadCalculation(calc: any) {
  // Load calculation data into form
  Object.assign(inputs, calc.inputs);
  // Update bundle via composable (cannot directly assign to computed ref)
  if (calc.isPreview || calc.meta?.isPreview) {
    previewBundle.value = calc;
  } else {
    officialBundle.value = calc;
  }
  showHistoryDrawer.value = false;
  
  $q.notify({
    type: 'info',
    message: translate('calculator.calculationLoaded'),
    position: 'top'
  });
}

function deleteCalculation(calcId: string) {
  $q.dialog({
    title: translate('calculator.deleteCalculation'),
    message: translate('calculator.deleteCalculationConfirm'),
    cancel: true,
    persistent: true
  }).onOk(() => {
    const deleted = calculationsStore.deleteCalculation(calcId);
    if (deleted) {
      $q.notify({
        type: 'positive',
        message: translate('calculator.calculationDeleted'),
        position: 'top'
      });
    }
  });
}

function exportHistory() {
  calculationsStore.exportAllCalculationsAsJSON();
  $q.notify({
    type: 'positive',
    message: translate('calculator.historyExported'),
    position: 'top'
  });
}

function confirmClearHistory() {
  $q.dialog({
    title: translate('calculator.clearHistory'),
    message: translate('calculator.clearHistoryConfirm'),
    cancel: true,
    persistent: true,
    ok: {
      label: translate('calculator.clearAll'),
      color: 'negative'
    }
  }).onOk(() => {
    calculationsStore.clearHistory();
    $q.notify({
      type: 'positive',
      message: translate('calculator.historyCleared'),
      position: 'top'
    });
  });
}

// Water heater hints - dynamic based on code type
function getWaterHeaterHint() {
  const isNec = codeType.value === 'nec';
  const keyPrefix = isNec ? 'calculator.waterHeaterHintNec' : 'calculator.waterHeaterHint';
  
  if (inputs.waterHeaterType === 'tankless' || inputs.waterHeaterType === 'pool_spa') {
    const key = isNec 
      ? `${keyPrefix}TanklessPoolSpa` 
      : 'calculator.waterHeaterHintTanklessPoolSpa';
    return translate(key) || translate('calculator.waterHeaterHintTanklessPoolSpa');
  }
  const key = isNec ? `${keyPrefix}Storage` : 'calculator.waterHeaterHintStorage';
  return translate(key) || translate('calculator.waterHeaterHintStorage');
}

function getWaterHeaterTooltip() {
  const isNec = codeType.value === 'nec';
  const codeRef = codeReference.value;
  
  if (inputs.waterHeaterType === 'tankless') {
    const baseText = translate('calculator.waterHeaterTooltipTankless') || 
                     'Tankless Water Heater: 100% demand factor';
    return isNec ? baseText.replace('CEC', 'NEC').replace('8-200', '220') : baseText;
  } else if (inputs.waterHeaterType === 'pool_spa') {
    const baseText = translate('calculator.waterHeaterTooltipPoolSpa') || 
                     'Pool/Spa Water Heater: 100% demand factor';
    return isNec ? baseText.replace('CEC', 'NEC').replace('8-200', '220') : baseText;
  } else if (inputs.waterHeaterType === 'storage') {
    const baseText = translate('calculator.waterHeaterTooltipStorage') || 
                     'Storage Water Heater: Refer to demand factor calculation';
    return isNec ? baseText.replace('CEC', 'NEC').replace('Section 63', 'Article 220') : baseText;
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
  // Reset both preview and official calculations
  resetPreview();
  resetOfficial();
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
    await generateLoadCalculationPDF(bundle.value, locale.value, translate);
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