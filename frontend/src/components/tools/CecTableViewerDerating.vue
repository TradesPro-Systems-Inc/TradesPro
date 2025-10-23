<template>
  <div class="cec-table-viewer q-pa-md">
    <q-card class="table-card">
      <q-card-section>
        <!-- Header -->
        <div class="text-center q-mb-md">
          <h4 class="text-h4 q-mb-sm">{{ tableData.name }}</h4>
          <h5 class="text-h6 q-mb-xs">{{ tableData.description }}</h5>
          <p class="text-caption text-grey-7">
            Apply these factors to Tables 2 and 4 when there are more than three conductors
          </p>
        </div>

        <!-- Selected Value Display -->
        <q-card 
          v-if="selectedValue" 
          class="bg-blue-1 q-pa-md q-mb-md"
          bordered
        >
          <div class="row items-center q-gutter-sm">
            <q-icon name="info" color="blue" size="md" />
            <span class="text-weight-bold text-blue-9">{{ $t('cecTables.selectedValue') }}:</span>
          </div>
          <div class="text-h5 q-mt-sm">
            <span class="text-weight-bold text-blue-7">
              {{ selectedValue.conductorRange }} conductors
            </span>
            <span class="q-mx-sm">→</span>
            <span class="text-h4 text-weight-bold text-green-7">
              {{ selectedValue.factor }}x
            </span>
            <span class="text-caption text-grey-7 q-ml-sm">
              ({{ selectedValue.description }})
            </span>
          </div>
        </q-card>

        <!-- Instructions -->
        <q-banner v-if="!selectedValue" class="bg-blue-1 q-mb-md" dense>
          <template v-slot:avatar>
            <q-icon name="lightbulb" color="blue" />
          </template>
          Click any conductor range to see the correction factor and description
        </q-banner>

        <!-- Table -->
        <div class="table-container">
          <q-markup-table dense bordered flat class="cec-table">
            <thead>
              <tr class="bg-grey-9 text-white">
                <th class="text-center" style="min-width: 150px;">
                  <div class="text-weight-bold">Number of Conductors</div>
                  <div class="text-caption">in raceway or cable</div>
                </th>
                <th class="text-center" style="min-width: 120px;">
                  <div class="text-weight-bold">Correction Factor</div>
                  <div class="text-caption">multiply by</div>
                </th>
                <th class="text-center" style="min-width: 200px;">
                  <div class="text-weight-bold">Description</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(row, index) in transformedData" 
                :key="index"
                :class="getRowClass(index)"
                class="ampacity-row cursor-pointer"
                @click="handleRowClick(index)"
              >
                <td class="text-center text-weight-bold">
                  {{ row.numConductorsRange }}
                </td>
                <td class="text-center text-weight-bold">
                  {{ row.correctionFactor.toFixed(2) }}x
                </td>
                <td class="text-center">
                  {{ row.description }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>

        <!-- Example Calculation -->
        <q-card v-if="selectedValue" class="bg-green-1 q-mt-md" flat bordered>
          <q-card-section>
            <div class="text-h6 text-green-8 q-mb-sm">
              <q-icon name="calculate" class="q-mr-sm" />
              Example Calculation
            </div>
            <div class="text-body2 text-green-7">
              <p class="q-mb-sm">
                <strong>Scenario:</strong> 8 conductors in a raceway, original ampacity from Table 2 is 100A
              </p>
              <p class="q-mb-xs">
                <strong>Step 1:</strong> Original ampacity = 100A (from Table 2)
              </p>
              <p class="q-mb-xs">
                <strong>Step 2:</strong> Correction factor = {{ selectedValue.factor }}x (for {{ selectedValue.conductorRange }} conductors)
              </p>
              <p class="q-mb-xs">
                <strong>Step 3:</strong> Corrected ampacity = 100A × {{ selectedValue.factor }} = {{ (100 * parseFloat(selectedValue.factor)).toFixed(0) }}A
              </p>
            </div>
          </q-card-section>
        </q-card>

        <!-- Footer Notes -->
        <div class="q-mt-md text-caption text-grey-7">
          <p class="q-mb-xs">
            <q-icon name="info_outline" size="xs" class="q-mr-xs" />
            These correction factors apply when there are more than 3 insulated conductors in a raceway or cable.
          </p>
          <p class="q-mb-xs">
            <q-icon name="info_outline" size="xs" class="q-mr-xs" />
            Multiply the ampacity from Tables 2 or 4 by the appropriate correction factor.
          </p>
          
          <div class="q-mt-sm">
            <span class="text-weight-bold">{{ $t('cecTables.references') }}: </span>
            <span>{{ tableData.source }} {{ tableData.version }}</span>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Props
const props = defineProps({
  tableData: {
    type: Object,
    required: true
  }
});

// State
const selectedRow = ref(null);

// Computed
const transformedData = computed(() => {
  return props.tableData.entries;
});

const selectedValue = computed(() => {
  if (selectedRow.value !== null) {
    const row = transformedData.value[selectedRow.value];
    return {
      conductorRange: row.numConductorsRange,
      factor: row.correctionFactor.toFixed(2),
      description: row.description
    };
  }
  return null;
});

// Methods
function handleRowClick(rowIndex) {
  selectedRow.value = rowIndex;
}

function getRowClass(rowIndex) {
  if (selectedRow.value === rowIndex) {
    return 'selected-row bg-blue-1';
  }
  return rowIndex % 2 === 0 ? 'bg-grey-1' : 'bg-white';
}
</script>

<style scoped lang="scss">
.cec-table-viewer {
  max-width: 1200px;
  margin: 0 auto;
}

.table-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-x: auto;
}

.cec-table {
  font-size: 0.9rem;
  
  th, td {
    padding: 12px 16px;
  }
  
  .ampacity-row {
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(33, 150, 243, 0.1) !important;
    }
    
    &.selected-row {
      background-color: rgba(33, 150, 243, 0.2) !important;
    }
  }
}
</style>
