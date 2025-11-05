<template>
  <div class="cec-table-viewer q-pa-md">
    <q-card class="table-card">
      <q-card-section>
        <!-- Header -->
        <div class="text-center q-mb-md">
          <h4 class="text-h4 q-mb-sm">{{ tableData.name }}</h4>
          <h5 class="text-h6 q-mb-xs">{{ tableData.description }}</h5>
          <p class="text-caption text-grey-7">
            Apply these factors to Tables 1, 2, 3, 4, and 60 for ambient temperatures above 30°C
          </p>
        </div>

        <!-- Selected Value Display -->
        <q-card 
          v-if="selectedValue" 
          class="bg-info q-pa-md q-mb-md text-white"
          bordered
        >
          <div class="row items-center q-gutter-sm">
            <q-icon name="info" color="white" size="md" />
            <span class="text-weight-bold text-white">{{ $t('cecTables.selectedValue') }}:</span>
          </div>
          <div class="text-h5 q-mt-sm text-white">
            <span class="text-weight-bold">
              {{ selectedValue.ambientTemp }}°C ambient
            </span>
            <span class="q-mx-sm">→</span>
            <span class="text-weight-bold">{{ selectedValue.insulationTemp }}</span>
            <span class="q-mx-sm">=</span>
            <span class="text-h4 text-weight-bold text-yellow">
              {{ selectedValue.factor }}
            </span>
          </div>
        </q-card>

        <!-- Instructions -->
        <q-banner v-if="!selectedValue" class="bg-info q-mb-md text-white" dense>
          <template v-slot:avatar>
            <q-icon name="lightbulb" color="white" />
          </template>
          Click any ambient temperature row and insulation temperature column to find the correction factor
        </q-banner>

        <!-- Table -->
        <div class="table-container">
          <q-markup-table dense bordered flat class="cec-table">
            <thead>
              <tr class="bg-primary text-white">
                <th 
                  class="text-center"
                  style="min-width: 120px;"
                >
                  <div>Ambient Temperature</div>
                  <div class="text-caption">°C</div>
                </th>
                <th 
                  v-for="col in temperatureColumns" 
                  :key="col.key"
                  class="text-center cursor-pointer ampacity-header"
                  :class="{ 'selected-col': selectedCol === col.key }"
                  @click="handleColumnClick(col.key)"
                  style="min-width: 100px;"
                >
                  <div class="text-weight-bold">{{ col.label }}</div>
                  <div v-if="col.note" class="text-caption font-normal">{{ col.note }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(row, index) in transformedData" 
                :key="index"
                :class="getRowClass(index)"
                class="ampacity-row"
              >
                <td 
                  class="text-center text-weight-bold cursor-pointer size-cell"
                  @click="handleRowClick(index)"
                >
                  {{ row.ambientTempC }}°C
                </td>
                <td 
                  v-for="col in temperatureColumns" 
                  :key="col.key"
                  class="text-center cursor-pointer ampacity-cell"
                  :class="getCellClass(index, col.key, row[col.key])"
                  @click="handleCellClick(index, col.key)"
                >
                  {{ row[col.key] ? row[col.key].toFixed(2) : '—' }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>

        <!-- Footer Notes -->
        <div class="q-mt-md text-caption text-grey-7">
          <p class="q-mb-xs">
            <q-icon name="info_outline" size="xs" class="q-mr-xs" />
            These correction factors are applied to the ampacity values from Tables 1, 2, 3, 4, and 60.
          </p>
          <p class="q-mb-xs">
            <q-icon name="info_outline" size="xs" class="q-mr-xs" />
            Multiply the table ampacity by the correction factor to get the corrected ampacity.
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
const selectedCol = ref(null);

// Temperature columns configuration
const temperatureColumns = [
  { key: 'factor60C', label: '60°C', temp: 60, type: 'factor' },
  { key: 'factor75C', label: '75°C', temp: 75, type: 'factor' },
  { key: 'factor90C', label: '90°C', temp: 90, type: 'factor' },
  { key: 'factor105C', label: '105°C', temp: 105, type: 'factor' },
  { key: 'factor110C', label: '110°C', temp: 110, type: 'factor' },
  { key: 'factor125C', label: '125°C', temp: 125, type: 'factor' },
  { key: 'factor150C', label: '150°C', temp: 150, type: 'factor' },
  { key: 'factor200C', label: '200°C', temp: 200, type: 'factor' },
  { key: 'factor250C', label: '250°C', temp: 250, type: 'factor' }
];

// Computed
const transformedData = computed(() => {
  return props.tableData.entries;
});

const selectedValue = computed(() => {
  if (selectedRow.value !== null && selectedCol.value !== null) {
    const row = transformedData.value[selectedRow.value];
    const col = temperatureColumns.find(c => c.key === selectedCol.value);
    const factor = row[selectedCol.value];
    
    if (factor === null || factor === undefined) return null;
    
    return {
      ambientTemp: row.ambientTempC,
      insulationTemp: col.label,
      factor: factor.toFixed(2)
    };
  }
  return null;
});

// Methods
function handleCellClick(rowIndex, colKey) {
  selectedRow.value = rowIndex;
  selectedCol.value = colKey;
}

function handleRowClick(rowIndex) {
  selectedRow.value = rowIndex;
  if (selectedCol.value === null) {
    selectedCol.value = 'factor75C'; // Default to 75°C
  }
}

function handleColumnClick(colKey) {
  selectedCol.value = colKey;
  if (selectedRow.value === null) {
    selectedRow.value = 0; // Default to first row
  }
}

function getRowClass(rowIndex) {
  if (selectedRow.value === rowIndex) {
    return 'selected-row';
  }
  // Use Quasar theme-aware classes
  return rowIndex % 2 === 0 ? 'bg-grey-2' : '';
}

function getCellClass(rowIndex, colKey, value) {
  if (value === null || value === undefined) return 'na-cell';
  
  if (selectedRow.value === rowIndex && selectedCol.value === colKey) {
    return 'selected-cell';
  }
  
  return 'hover-cell';
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
    padding: 8px 12px;
  }
  
  .ampacity-header {
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    &.selected-col {
      background-color: rgba(33, 150, 243, 0.3) !important;
    }
  }
  
  .ampacity-row {
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(33, 150, 243, 0.05);
    }
    
    &.selected-row {
      background-color: rgba(33, 150, 243, 0.1);
    }
  }
  
  .size-cell {
    transition: background-color 0.2s;
    
    &:hover {
      background-color: rgba(33, 150, 243, 0.15);
    }
  }
  
  .ampacity-cell {
    transition: all 0.2s;
    
    &.hover-cell:hover {
      background-color: rgba(255, 235, 59, 0.2);
    }
    
    &.selected-cell {
      background-color: rgba(76, 175, 80, 0.3) !important;
      font-weight: bold;
      color: #1b5e20;
      font-size: 1.1rem;
    }
    
    &.na-cell {
      opacity: 0.5;
      font-style: italic;
    }
  }
}

// Dark mode adjustments
.body--dark,
.dark {
  .cec-table {
    .ampacity-row {
      &:hover {
        background-color: rgba(33, 150, 243, 0.2);
      }
      
      &.selected-row {
        background-color: rgba(33, 150, 243, 0.3);
      }
    }
    
    .size-cell:hover {
      background-color: rgba(33, 150, 243, 0.25);
    }
    
    .ampacity-cell {
      &.selected-cell {
        background-color: rgba(76, 175, 80, 0.5) !important;
        color: #c8e6c9 !important;
      }
    }
  }
}
</style>
