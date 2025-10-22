<template>
  <q-card v-if="bundle" class="calculation-results">
    <q-card-section>
      <div class="row items-center">
        <div class="text-h6">{{ $t('calculator.results.title') }}</div>
        <q-space />
        <q-chip color="positive" text-color="white" icon="check_circle">
          {{ $t('calculator.results.completedIn', { time: calculationTimeMs.toFixed(0) }) }}
        </q-chip>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <!-- Main results -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-card flat bordered class="result-card">
            <q-card-section>
              <div class="text-subtitle2 text-grey-7">{{ $t('calculator.results.calculatedLoad') }}</div>
              <div class="text-h4 text-primary">
                {{ bundle.results?.chosenCalculatedLoad_W }} W
              </div>
              <div class="text-caption text-grey-6">
                {{ (parseFloat(bundle.results?.chosenCalculatedLoad_W || '0') / 1000).toFixed(2) }} kW
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6">
          <q-card flat bordered class="result-card">
            <q-card-section>
              <div class="text-subtitle2 text-grey-7">{{ $t('calculator.results.serviceCurrent') }}</div>
              <div class="text-h4 text-positive">
                {{ bundle.results?.serviceCurrentA }} A
              </div>
              <div class="text-caption text-grey-6">
                {{ bundle.inputs?.systemVoltage }}V {{ bundle.inputs?.phase }}-{{ $t('calculator.phase') }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Conductor and protection devices -->
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-12 col-md-4">
          <q-card flat bordered class="result-card">
            <q-card-section>
              <div class="text-subtitle2 text-grey-7">{{ $t('calculator.results.conductorSize') }}</div>
              <div class="text-h5 text-positive">
                {{ bundle.results?.conductorSize }}
              </div>
              <div class="text-caption text-grey-6">
                {{ bundle.results?.conductorMaterial || 'Cu' }} {{ $t('calculator.results.conductor') }} @ {{ bundle.results?.conductorAmpacity }}A
              </div>
              <div class="text-caption text-grey-8 q-mt-xs">
                <q-icon name="info_outline" size="xs" />
                {{ $t('calculator.results.baseAmpacity') }}: {{ bundle.results?.baseAmpacity }}A × {{ bundle.results?.tempCorrectionFactor }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card flat bordered class="result-card">
            <q-card-section>
              <div class="text-subtitle2 text-grey-7">{{ $t('calculator.results.panelRating') }}</div>
              <div class="text-h5 text-positive">
                {{ bundle.results?.panelRatingA }} A
              </div>
              <div class="text-caption text-grey-6">
                {{ $t('calculator.results.mainPanel') }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card flat bordered class="result-card">
            <q-card-section>
              <div class="text-subtitle2 text-grey-7">{{ $t('calculator.results.breakerSize') }}</div>
              <div class="text-h5 text-positive">
                {{ bundle.results?.breakerSizeA }} A
              </div>
              <div class="text-caption text-grey-6">
                {{ $t('calculator.results.mainBreaker') }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Load breakdown -->
      <q-expansion-item 
        :label="$t('calculator.results.loadBreakdown')" 
        icon="analytics"
        class="q-mt-md"
        header-class="text-subtitle1"
      >
        <q-card flat>
          <q-card-section>
            <q-list bordered separator>
              <q-item>
                <q-item-section>
                  <q-item-label>{{ $t('calculator.results.basicLoad') }}</q-item-label>
                  <q-item-label caption>{{ $t('calculator.results.livingAreaLoad') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="primary" text-color="white">
                    {{ bundle.results?.basicVA || bundle.results?.basicLoadA || 0 }} VA
                  </q-chip>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section>
                  <q-item-label>{{ $t('calculator.results.hvacLoad') }}</q-item-label>
                  <q-item-label caption>{{ $t('calculator.results.heatingCoolingSystems') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="secondary" text-color="white">
                    {{ bundle.results?.hvacLoad || 0 }} W
                  </q-chip>
                </q-item-section>
              </q-item>

              <q-item v-if="bundle.results?.rangeLoad">
                <q-item-section>
                  <q-item-label>{{ $t('calculator.results.rangeLoad') }}</q-item-label>
                  <q-item-label caption>{{ $t('calculator.range') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="deep-orange" text-color="white">
                    {{ bundle.results?.rangeLoad || 0 }} W
                  </q-chip>
                </q-item-section>
              </q-item>

              <q-item v-if="bundle.results?.waterHeaterLoad">
                <q-item-section>
                  <q-item-label>{{ $t('calculator.results.waterHeaterLoad') }}</q-item-label>
                  <q-item-label caption>{{ $t('calculator.waterHeater') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="blue" text-color="white">
                    {{ bundle.results?.waterHeaterLoad || 0 }} W
                  </q-chip>
                </q-item-section>
              </q-item>

              <q-item v-if="bundle.results?.evseLoad">
                <q-item-section>
                  <q-item-label>{{ $t('calculator.results.evseLoad') }}</q-item-label>
                  <q-item-label caption>{{ $t('calculator.evse') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="green" text-color="white">
                    {{ bundle.results?.evseLoad || 0 }} W
                  </q-chip>
                </q-item-section>
              </q-item>

              <q-item v-if="bundle.results?.otherLargeLoadsTotal">
                <q-item-section>
                  <q-item-label>{{ $t('calculator.results.otherLargeLoads') }}</q-item-label>
                  <q-item-label caption>{{ $t('calculator.appliances') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="purple" text-color="white">
                    {{ bundle.results?.otherLargeLoadsTotal || 0 }} W
                  </q-chip>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ $t('calculator.results.calculatedLoad') }}</q-item-label>
                  <q-item-label caption>{{ $t('calculator.results.finalResult') }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="positive" text-color="white" class="text-weight-bold">
                    {{ bundle.results?.chosenCalculatedLoad_W }} W
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <!-- Warnings -->
      <q-banner v-if="hasWarnings" class="bg-warning text-white q-mt-md">
        <template v-slot:avatar>
          <q-icon name="warning" />
        </template>
        <div class="text-subtitle2">{{ $t('calculator.results.warning') }}</div>
        <ul class="q-my-sm">
          <li v-for="(warning, idx) in bundle.warnings" :key="idx">
            {{ formatWarning(warning) }}
          </li>
        </ul>
      </q-banner>

      <!-- Error -->
      <q-banner v-if="bundle.results?.error" class="bg-negative text-white q-mt-md">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <div class="text-subtitle2">{{ $t('common.error') }}</div>
        <div class="q-my-sm">{{ bundle.results.error }}</div>
      </q-banner>
    </q-card-section>

    <q-separator />

    <!-- Action Buttons -->
    <q-card-actions>
      <q-btn
        flat
        color="primary"
        :label="$t('calculator.results.viewSteps')"
        icon="list"
        @click="$emit('show-steps')"
      />
      <q-btn
        flat
        color="primary"
        :label="$t('calculator.results.downloadJSON')"
        icon="download"
        @click="$emit('download-json')"
      />
      <q-btn
        flat
        color="primary"
        :label="$t('calculator.results.generatePDF')"
        icon="picture_as_pdf"
        @click="$emit('generate-pdf')"
      />
      <q-space />
      <q-btn
        flat
        color="grey"
        :label="$t('calculator.results.saveToProject')"
        icon="save"
        @click="$emit('save-to-project')"
        :disable="!isOnline"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';

// Access i18n in legacy mode
const instance = getCurrentInstance();
const t = instance?.proxy?.$t || ((key: string) => key);

// Temporary type definitions
interface UnsignedBundle {
  id?: string;
  createdAt: string;
  inputs: any;
  results: any;
  steps: any[];
  warnings?: any[];
  [key: string]: any;
}

interface Props {
  bundle: UnsignedBundle | null;
  calculationTimeMs: number;
  isOnline: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  'show-steps': [];
  'download-json': [];
  'generate-pdf': [];
  'save-to-project': [];
}>();

const hasWarnings = computed(() => 
  props.bundle?.warnings && props.bundle.warnings.length > 0
);

function formatWarning(warning: any): string {
  // If warning is a string, return it directly
  if (typeof warning === 'string') {
    return warning;
  }
  
  // If warning is an object with type and data, translate it
  if (warning.type) {
    const key = `calculator.warnings.${warning.type}`;
    return t(key, warning);
  }
  
  return String(warning);
}
</script>

<style scoped>
.calculation-results {
  margin-top: 16px;
}

.result-card {
  transition: all 0.3s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
