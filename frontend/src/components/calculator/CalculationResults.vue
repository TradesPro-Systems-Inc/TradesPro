<template>
  <q-card v-if="bundle" class="calculation-results">
    <q-card-section>
      <div class="row items-center">
        <div class="text-h6">{{ $t('calculator.results.title') }}</div>
        <q-space />
        <q-chip 
          :color="props.isPreview ? 'warning' : 'positive'" 
          text-color="white" 
          :icon="props.isPreview ? 'visibility' : 'check_circle'"
        >
          {{ props.isPreview 
            ? $t('calculator.results.previewMode') 
            : $t('calculator.results.completedIn', { time: calculationTimeMs.toFixed(0) })
          }}
        </q-chip>
      </div>
      
      <!-- V4.1 Architecture: Preview Mode Warning -->
      <q-banner 
        v-if="props.isPreview" 
        rounded 
        class="bg-warning-2 text-warning-9 q-mt-md"
        icon="info"
      >
        <template v-slot:avatar>
          <q-icon name="warning" color="warning" />
        </template>
        <div class="text-body2">
          <strong>{{ $t('calculator.results.previewWarning') }}</strong>
          <div class="q-mt-xs">
            {{ $t('calculator.results.previewWarningDetail') }}
          </div>
        </div>
        <template v-slot:action>
          <div class="row items-center justify-center q-gutter-sm">
            <q-btn 
              unelevated
              :label="$t('calculator.results.executeOfficial')" 
              color="primary"
              text-color="white"
              @click="$emit('execute-official')"
              icon="verified"
              size="md"
              class="q-px-xl"
            />
          </div>
        </template>
      </q-banner>

      <!-- V4.1 Architecture: Unsigned Bundle - Sign Request -->
      <q-banner 
        v-if="!props.isPreview && !isSigned" 
        rounded 
        class="bg-info-2 text-info-9 q-mt-md"
        icon="info"
      >
        <template v-slot:avatar>
          <q-icon name="info" color="info" />
        </template>
        <div class="text-body2">
          <strong>{{ $t('calculator.results.unsignedWarning') }}</strong>
          <div class="q-mt-xs">
            {{ $t('calculator.results.unsignedWarningDetail') }}
          </div>
        </div>
        <template v-slot:action>
          <q-btn 
            flat 
            :label="$t('calculator.results.signBundle')" 
            color="positive"
            @click="$emit('sign-bundle')"
            icon="lock"
            :loading="signing"
          />
        </template>
      </q-banner>

      <!-- V4.1 Architecture: Signed Bundle - Success -->
      <q-banner 
        v-if="!props.isPreview && isSigned" 
        rounded 
        class="bg-positive-2 text-positive-9 q-mt-md"
        icon="check_circle"
      >
        <template v-slot:avatar>
          <q-icon name="verified" color="positive" />
        </template>
        <div class="text-body2">
          <strong>{{ $t('calculator.results.signedSuccess') }}</strong>
          <div class="q-mt-xs">
            {{ $t('calculator.results.signedSuccessDetail') }}
          </div>
        </div>
      </q-banner>
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
      <!-- 查看计算步骤 - tier1及以上可用 -->
      <q-btn
        v-if="canViewSteps"
        flat
        color="primary"
        :label="$t('calculator.results.viewSteps')"
        icon="list"
        @click="$emit('show-steps')"
      />
      <!-- 非注册用户提示 -->
      <q-btn
        v-else
        flat
        color="grey"
        :label="$t('calculator.results.viewSteps')"
        icon="lock"
        :disable="true"
      >
        <q-tooltip>
          {{ $t('calculator.results.requiresRegistration') }}
        </q-tooltip>
      </q-btn>

      <!-- 下载JSON - tier2及以上可用 -->
      <q-btn
        v-if="canDownloadJSON"
        flat
        color="primary"
        :label="$t('calculator.results.downloadJSON')"
        icon="download"
        @click="$emit('download-json')"
      />
      <!-- tier1用户提示 -->
      <q-btn
        v-else-if="isTier1"
        flat
        color="grey"
        :label="$t('calculator.results.downloadJSON')"
        icon="lock"
        :disable="true"
      >
        <q-tooltip>
          {{ $t('calculator.results.upgradeRequired') }}
        </q-tooltip>
      </q-btn>

      <!-- 下载PDF - tier2及以上可用 -->
      <q-btn
        v-if="canDownloadPDF"
        flat
        color="primary"
        :label="$t('calculator.results.generatePDF')"
        icon="picture_as_pdf"
        @click="$emit('generate-pdf')"
      />
      <!-- tier1用户提示 -->
      <q-btn
        v-else-if="isTier1"
        flat
        color="grey"
        :label="$t('calculator.results.generatePDF')"
        icon="lock"
        :disable="true"
      >
        <q-tooltip>
          {{ $t('calculator.results.upgradeRequired') }}
        </q-tooltip>
      </q-btn>

      <q-space />
      
      <!-- 保存到项目 - tier3可用 -->
      <q-btn
        v-if="canManageProjects"
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
import { usePermissions } from '../../composables/usePermissions';

// Access i18n in legacy mode
const instance = getCurrentInstance();
const t = instance?.proxy?.$t || ((key: string) => key);

// 权限检查
const { can, isTier } = usePermissions();
const canViewSteps = computed(() => can('canViewSteps'));
const canDownloadJSON = computed(() => can('canDownloadJSON'));
const canDownloadPDF = computed(() => can('canDownloadPDF'));
const canManageProjects = computed(() => can('canManageProjects'));
const isTier1 = computed(() => isTier('tier1'));

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
  isPreview?: boolean;
  isSigned?: boolean;
  signing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isPreview: true,
  isSigned: false,
  signing: false
});

defineEmits<{
  'show-steps': [];
  'sign-bundle': [];
  'download-json': [];
  'generate-pdf': [];
  'save-to-project': [];
  'execute-official': [];
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
