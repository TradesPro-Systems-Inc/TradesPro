<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Residential Load Calculator</div>

    <q-form @submit.prevent="handleSubmit">
      <q-card class="q-pa-md q-mb-md">
        <q-card-section>
          <div class="text-subtitle1">输入参数</div>
        </q-card-section>

        <q-card-section>
          <q-select v-model="form.dwellingType" label="Dwelling Type" :options="dwellingOptions" />
          <q-input v-model.number="form.area" label="Area (m²)" type="number" />
          <q-input v-model.number="form.rangeKw" label="Range Power (kW)" type="number" />
          <q-toggle v-model="form.hasEV" label="Includes EV Charger" />
          <q-input v-if="form.hasEV" v-model.number="form.evLoad" label="EV Load (W)" type="number" />
          <q-toggle v-model="form.hasAC" label="Includes Air Conditioner" />
          <q-input v-if="form.hasAC" v-model.number="form.acLoad" label="AC Load (W)" type="number" />
          <q-toggle v-model="form.hasHeating" label="Includes Electric Heating" />
          <q-input v-if="form.hasHeating" v-model.number="form.heatingLoad" label="Heating Load (W)" type="number" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn label="Calculate" color="primary" type="submit" :loading="isLoading" />
        </q-card-actions>
      </q-card>
    </q-form>

    <ReportPreview v-if="auditStore.audit" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuditStore } from '@/stores/auditStore';
import { useLoadCalculator } from '@/domains/calculation/composables/useLoadCalculator';
import type { DwellingParams } from '@/types/power';
import ReportPreview from '@/components/ReportPreview.vue';

const auditStore = useAuditStore();

const dwellingOptions = [
  { label: 'Single Dwelling', value: 'single' },
  { label: 'Row House', value: 'row' },
  { label: 'Apartment', value: 'apartment' }
];

const { isLoading, runCalculation } = useLoadCalculator();

const form = ref<DwellingParams>({
  dwellingType: 'single',
  area: 120,
  rangeKw: 12, // User input in kW, converted to W before calculation
  appliances: [],
  hasEV: true,
  evLoad: 7200,
  hasAC: true,
  acLoad: 3500,
  hasHeating: false,
  heatingLoad: 0
});

// When a toggle is turned off, reset the corresponding input value
watch(() => form.value.hasEV, (newValue) => { if (!newValue) form.value.evLoad = 0; });
watch(() => form.value.hasAC, (newValue) => { if (!newValue) form.value.acLoad = 0; });
watch(() => form.value.hasHeating, (newValue) => { if (!newValue) form.value.heatingLoad = 0; });

/**
 * Handles the form submission.
 */
function handleSubmit(): void {
  // Calls the refactored composable function
  void runCalculation(form.value);
}
</script>
