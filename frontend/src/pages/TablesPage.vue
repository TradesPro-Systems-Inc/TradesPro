<template>
  <q-page class="tables-page">
    <div class="q-pa-md">
      <div class="row justify-center q-mb-md">
        <div class="col-12 col-md-10">
          <h3 class="text-h3 text-center q-mb-md">
            {{ $t('nav.tables') || 'CEC Tables' }}
          </h3>
          
          <!-- Table Selection Tabs -->
          <q-tabs
            v-model="selectedTable"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="table2" label="Table 2 - Copper Conductors" />
            <q-tab name="table4" label="Table 4 - Aluminum Conductors" />
            <q-tab name="table5a" label="Table 5A - Temperature Correction" />
            <q-tab name="table5c" label="Table 5C - Multiple Conductor Derating" />
          </q-tabs>

          <q-separator />

          <!-- Table Content -->
          <q-tab-panels v-model="selectedTable" animated>
            <q-tab-panel name="table2">
              <CecTableViewerGeneric 
                :table-data="table2Data"
                base-temp="30°C"
              />
            </q-tab-panel>

            <q-tab-panel name="table4">
              <CecTableViewerGeneric 
                :table-data="table4Data"
                base-temp="30°C"
              />
            </q-tab-panel>

            <q-tab-panel name="table5a">
              <CecTableViewerTemperature 
                :table-data="table5AData"
              />
            </q-tab-panel>

            <q-tab-panel name="table5c">
              <CecTableViewerDerating 
                :table-data="table5CData"
              />
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import CecTableViewerGeneric from '../components/tools/CecTableViewerGeneric.vue';
import CecTableViewerTemperature from '../components/tools/CecTableViewerTemperature.vue';
import CecTableViewerDerating from '../components/tools/CecTableViewerDerating.vue';
import table2Data from '../../../services/calculation-service/dist/data/tables/2024/table2.json';
import table4Data from '../../../services/calculation-service/dist/data/tables/2024/table4.json';
import table5AData from '../../../services/calculation-service/dist/data/tables/2024/table5A.json';
import table5CData from '../../../services/calculation-service/dist/data/tables/2024/table5C.json';

const selectedTable = ref('table2');
</script>

<style scoped lang="scss">
.tables-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>

