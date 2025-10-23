<template>
  <div class="cec-table-viewer q-pa-md">
    <q-card class="table-card">
      <q-card-section>
        <!-- Header -->
        <div class="text-center q-mb-md">
          <h4 class="text-h4 q-mb-sm">{{ tableData.name }}</h4>
          <h5 class="text-h6 q-mb-xs">{{ tableData.description }}</h5>
          <p class="text-caption text-grey-7">
            ({{ $t('cecTables.baseTemp', { temp: baseTemp }) }})
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
              {{ $t('cecTables.wireSize') }} {{ selectedValue.size }}
            </span>
            <span class="q-mx-sm">@</span>
            <span class="text-weight-bold text-blue-7">{{ selectedValue.temp }}</span>
            <span class="q-mx-sm">=</span>
            <span class="text-h4 text-weight-bold text-green-7">
              {{ selectedValue.ampacity }} A
            </span>
          </div>
        </q-card>

        <!-- Instructions -->
        <q-banner v-if="!selectedValue" class="bg-blue-1 q-mb-md" dense>
          <template v-slot:avatar>
            <q-icon name="lightbulb" color="blue" />
          </template>
          {{ $t('cecTables.instructions') }}
        </q-banner>

        <!-- Table -->
        <div class="table-container">
          <q-markup-table dense bordered flat class="cec-table">
            <thead>
              <tr class="bg-grey-9 text-white">
                <th 
                  class="text-center"
                  style="min-width: 120px;"
                >
                  <div>{{ $t('cecTables.size') }}</div>
                  <div class="text-caption">AWG / kcmil</div>
                </th>
                <th 
                  v-for="col in ampacityColumns" 
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
                  {{ row.displaySize }}
                </td>
                <td 
                  v-for="col in ampacityColumns" 
                  :key="col.key"
                  class="text-center cursor-pointer ampacity-cell"
                  :class="getCellClass(index, col.key, row[col.key])"
                  @click="handleCellClick(index, col.key)"
                >
                  {{ row[col.key] !== null ? row[col.key] : '—' }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>

        <!-- Footer Notes -->
        <div class="q-mt-md text-caption text-grey-7">
          <p class="q-mb-xs">
            <q-icon name="info_outline" size="xs" class="q-mr-xs" />
            See Table 5A for the correction factors to be applied to the values in Columns 2 to 7 for ambient temperatures over 30 °C.
          </p>
          <p class="q-mb-xs">
            <q-icon name="info_outline" size="xs" class="q-mr-xs" />
            The ampacity of aluminum-sheathed cable is based on the type of insulation used in the copper conductor.
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
  },
  baseTemp: {
    type: String,
    default: '30°C'
  }
});

// State
const selectedRow = ref(null);
const selectedCol = ref(null);

// Temperature columns configuration
const columns = [
  { key: 'ampacity60C', label: '60 °C‡', temp: 60, type: 'ampacity' },
  { key: 'ampacity75C', label: '75 °C‡', temp: 75, type: 'ampacity' },
  { key: 'ampacity90C', label: '90 °C‡**', temp: 90, type: 'ampacity' },
  { key: 'ampacity110C', label: '110 °C‡', note: 'See Note', temp: 110, type: 'ampacity' },
  { key: 'ampacity125C', label: '125 °C‡', note: 'See Note', temp: 125, type: 'ampacity' },
  { key: 'ampacity200C', label: '200 °C‡', note: 'See Note', temp: 200, type: 'ampacity' }
];

// Computed
const ampacityColumns = computed(() => {
  return columns;
});

const transformedData = computed(() => {
  return props.tableData.entries.map(entry => ({
    ...entry,
    displaySize: `${entry.size}${entry.unit === 'AWG' ? '' : ' kcmil'}`,
    ampacity60C: entry.ampacity60C,
    ampacity75C: entry.ampacity75C,
    ampacity90C: entry.ampacity90C,
    ampacity110C: entry.ampacity110C || null,
    ampacity125C: entry.ampacity125C || null,
    ampacity200C: entry.ampacity200C || null
  }));
});

const selectedValue = computed(() => {
  if (selectedRow.value !== null && selectedCol.value !== null) {
    const row = transformedData.value[selectedRow.value];
    const col = ampacityColumns.value.find(c => c.key === selectedCol.value);
    const ampacity = row[selectedCol.value];
    
    if (ampacity === null) return null;
    
    return {
      size: row.displaySize,
      temp: col.label,
      ampacity: ampacity
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
    selectedCol.value = 'ampacity75C'; // Default to 75°C
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
  return rowIndex % 2 === 0 ? 'bg-grey-1' : 'bg-white';
}

function getCellClass(rowIndex, colKey, value) {
  if (value === null) return 'na-cell';
  
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
      color: #9e9e9e;
      font-style: italic;
    }
  }
}
</style>
